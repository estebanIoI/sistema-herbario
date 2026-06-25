// src/utils/zip.js
// Escritor ZIP mínimo (método STORE, sin compresión) — cero dependencias.
// Suficiente y 100% válido para empaquetar un Darwin Core Archive (archivos
// de texto pequeños). Implementa CRC-32 + local file headers + central directory.

// Tabla CRC-32 (precalculada una vez)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Fecha/hora DOS (campo de tiempo del ZIP)
function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f);
  return { time: time & 0xffff, date: date & 0xffff };
}

/**
 * Crea un Buffer ZIP a partir de una lista de archivos.
 * @param {{name:string, content:string|Buffer}[]} files
 * @returns {Buffer}
 */
function createZip(files) {
  const { time, date } = dosDateTime();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, 'utf8');
    const crc = crc32(data);
    const size = data.length;

    // Local file header (firma 0x04034b50)
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // versión necesaria
    local.writeUInt16LE(0x0800, 6);      // flags: bit 11 = nombres UTF-8
    local.writeUInt16LE(0, 8);           // método 0 = STORE
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);       // tamaño comprimido (= original en STORE)
    local.writeUInt32LE(size, 22);       // tamaño original
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);          // extra field length

    localParts.push(local, nameBuf, data);

    // Central directory header (firma 0x02014b50)
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);        // versión creadora
    central.writeUInt16LE(20, 6);        // versión necesaria
    central.writeUInt16LE(0x0800, 8);    // flags UTF-8
    central.writeUInt16LE(0, 10);        // método STORE
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);        // extra
    central.writeUInt16LE(0, 32);        // comentario
    central.writeUInt16LE(0, 34);        // disco
    central.writeUInt16LE(0, 36);        // atributos internos
    central.writeUInt32LE(0, 38);        // atributos externos
    central.writeUInt32LE(offset, 42);   // offset del local header

    centralParts.push(central, nameBuf);
    offset += local.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const localBuf = Buffer.concat(localParts);

  // End of central directory record (firma 0x06054b50)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);                       // disco
  eocd.writeUInt16LE(0, 6);                       // disco con inicio del directorio
  eocd.writeUInt16LE(files.length, 8);            // entradas en este disco
  eocd.writeUInt16LE(files.length, 10);           // total entradas
  eocd.writeUInt32LE(centralBuf.length, 12);      // tamaño del directorio central
  eocd.writeUInt32LE(localBuf.length, 16);        // offset del directorio central
  eocd.writeUInt16LE(0, 20);                      // comentario

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

module.exports = { createZip, crc32 };
