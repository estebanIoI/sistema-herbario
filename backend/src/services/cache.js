// src/services/cache.js
// ─────────────────────────────────────────────────────────────────────────────
// Capa de caché unificada para el backend.
//   · Usa Redis (variable de entorno REDIS_URL) mediante un cliente RESP mínimo
//     implementado sobre el módulo `net` de Node — CERO dependencias externas
//     (no requiere tocar el lockfile ni instalar paquetes).
//   · Si Redis no está configurado o falla, cae automáticamente a caché en
//     memoria (node-cache) sin romper nada.
// API asíncrona homogénea: get / set / del / isRedis.
// ─────────────────────────────────────────────────────────────────────────────
const net = require('net');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const DEFAULT_TTL = 300; // segundos
const mem = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: 120 });

// ── Cliente Redis mínimo (protocolo RESP sobre net) ──────────────────────────
function findCRLF(buf, from) {
  for (let i = from; i < buf.length - 1; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a) return i;
  }
  return -1;
}

// Parsea UNA respuesta RESP desde `buf` en la posición `i`.
// Devuelve { val, next } o null si los datos están incompletos.
function parseReply(buf, i) {
  if (i >= buf.length) return null;
  const type = buf[i];
  const crlf = findCRLF(buf, i + 1);
  if (crlf === -1) return null;
  const line = buf.toString('utf8', i + 1, crlf);

  switch (type) {
    case 0x2b: return { val: line, next: crlf + 2 };                 // '+' simple string
    case 0x2d: return { val: new Error(line), next: crlf + 2 };      // '-' error
    case 0x3a: return { val: Number(line), next: crlf + 2 };         // ':' integer
    case 0x24: {                                                     // '$' bulk string
      const len = Number(line);
      if (len === -1) return { val: null, next: crlf + 2 };
      const start = crlf + 2;
      const end = start + len;
      if (end + 2 > buf.length) return null;
      return { val: buf.toString('utf8', start, end), next: end + 2 };
    }
    default:
      // Tipos no usados por GET/SET/DEL/AUTH/SELECT; devolver la línea cruda.
      return { val: line, next: crlf + 2 };
  }
}

class MiniRedis {
  constructor(url) {
    const u = new URL(url);
    this.host = u.hostname || '127.0.0.1';
    this.port = Number(u.port || 6379);
    // redis://:password@host  → la contraseña llega en username o password
    this.password = u.password || u.username || '';
    this.db = u.pathname && u.pathname.length > 1 ? u.pathname.slice(1) : null;
    this.ready = false;
    this.queue = [];
    this.buf = Buffer.alloc(0);
    this.closed = false;
    this._connect();
  }

  _connect() {
    this.sock = net.createConnection({ host: this.host, port: this.port });
    this.sock.setNoDelay(true);
    this.sock.on('connect', async () => {
      try {
        if (this.password) await this._cmd(['AUTH', this.password]);
        if (this.db) await this._cmd(['SELECT', this.db]);
        this.ready = true;
        logger.info('✅ Redis conectado (caché)');
      } catch (e) {
        this.ready = false;
        logger.warn(`Redis AUTH/SELECT falló: ${e.message}`);
      }
    });
    this.sock.on('data', (d) => this._onData(d));
    this.sock.on('error', (e) => { this.ready = false; this._rejectAll(e); });
    this.sock.on('close', () => {
      this.ready = false;
      if (!this.closed) setTimeout(() => this._connect(), 3000); // reintento simple
    });
  }

  _onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    while (true) {
      const r = parseReply(this.buf, 0);
      if (!r) break;
      this.buf = this.buf.slice(r.next);
      const pending = this.queue.shift();
      if (!pending) continue;
      if (r.val instanceof Error) pending.reject(r.val);
      else pending.resolve(r.val);
    }
  }

  _rejectAll(err) {
    while (this.queue.length) this.queue.shift().reject(err);
  }

  _cmd(args) {
    return new Promise((resolve, reject) => {
      if (!this.sock || this.sock.destroyed) return reject(new Error('socket cerrado'));
      const parts = [`*${args.length}\r\n`];
      for (const a of args) {
        const s = String(a);
        parts.push(`$${Buffer.byteLength(s)}\r\n${s}\r\n`);
      }
      this.queue.push({ resolve, reject });
      this.sock.write(parts.join(''));
    });
  }

  async get(key) {
    if (!this.ready) throw new Error('redis no listo');
    return this._cmd(['GET', key]);
  }
  async set(key, val, ttl) {
    if (!this.ready) throw new Error('redis no listo');
    return this._cmd(ttl ? ['SET', key, val, 'EX', String(ttl)] : ['SET', key, val]);
  }
  async del(key) {
    if (!this.ready) throw new Error('redis no listo');
    return this._cmd(['DEL', key]);
  }
}

// ── Inicialización ───────────────────────────────────────────────────────────
let client = null;
if (process.env.REDIS_URL) {
  try {
    client = new MiniRedis(process.env.REDIS_URL);
  } catch (e) {
    logger.warn(`No se pudo inicializar Redis (${e.message}); usando caché en memoria`);
    client = null;
  }
} else {
  logger.info('REDIS_URL no configurado; usando caché en memoria (node-cache)');
}

// ── API pública ──────────────────────────────────────────────────────────────
async function get(key) {
  if (client && client.ready) {
    try {
      const v = await client.get(key);
      return v == null ? undefined : JSON.parse(v);
    } catch (e) { /* fallback a memoria */ }
  }
  return mem.get(key);
}

async function set(key, value, ttl = DEFAULT_TTL) {
  if (client && client.ready) {
    try { await client.set(key, JSON.stringify(value), ttl); return; }
    catch (e) { /* fallback */ }
  }
  mem.set(key, value, ttl);
}

async function del(key) {
  if (client && client.ready) { try { await client.del(key); } catch (e) { /* noop */ } }
  mem.del(key);
}

function isRedis() { return !!(client && client.ready); }

module.exports = { get, set, del, isRedis, DEFAULT_TTL };
