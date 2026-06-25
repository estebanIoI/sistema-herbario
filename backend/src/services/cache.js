// src/services/cache.js
// ─────────────────────────────────────────────────────────────────────────────
// Capa de caché unificada para el backend.
//   · Usa Redis (variable de entorno REDIS_URL) cuando está disponible.
//   · Si Redis no está configurado o falla la conexión, cae automáticamente a
//     caché en memoria (node-cache) sin romper nada.
// API asíncrona homogénea: get / set / del / isRedis.
// ─────────────────────────────────────────────────────────────────────────────
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const DEFAULT_TTL = 300; // segundos
const mem = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: 120 });

let redis = null;
let redisReady = false;

if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    redis.on('ready', () => { redisReady = true; logger.info('✅ Redis conectado (caché)'); });
    redis.on('error', (e) => {
      if (redisReady) logger.warn(`Redis error, usando memoria temporalmente: ${e.message}`);
      redisReady = false;
    });
    redis.on('end', () => { redisReady = false; });
  } catch (e) {
    logger.warn(`ioredis no disponible (${e.message}); usando caché en memoria`);
    redis = null;
  }
} else {
  logger.info('REDIS_URL no configurado; usando caché en memoria (node-cache)');
}

/** Obtiene un valor del caché (deserializado). Devuelve undefined si no existe. */
async function get(key) {
  if (redisReady && redis) {
    try {
      const v = await redis.get(key);
      return v == null ? undefined : JSON.parse(v);
    } catch (e) {
      logger.warn(`Redis GET falló (${key}), uso memoria: ${e.message}`);
    }
  }
  return mem.get(key);
}

/** Guarda un valor en el caché con TTL en segundos. */
async function set(key, value, ttl = DEFAULT_TTL) {
  if (redisReady && redis) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
      return;
    } catch (e) {
      logger.warn(`Redis SET falló (${key}), uso memoria: ${e.message}`);
    }
  }
  mem.set(key, value, ttl);
}

/** Elimina una clave del caché. */
async function del(key) {
  if (redisReady && redis) {
    try { await redis.del(key); } catch (e) { /* noop */ }
  }
  mem.del(key);
}

/** ¿Está activo el backend Redis ahora mismo? */
function isRedis() { return redisReady; }

module.exports = { get, set, del, isRedis, DEFAULT_TTL };
