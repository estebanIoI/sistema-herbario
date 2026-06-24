/**
 * migrate.js — Ejecutar con: node migrate.js
 * No requiere módulos adicionales fuera de los ya instalados.
 * Lee el .env del mismo directorio automáticamente.
 */
const fs   = require('fs');
const path = require('path');

// ── Leer .env manualmente (sin depender de dotenv) ───────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
}

const mysql = require('./node_modules/mysql2/promise');

const cfg = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME     || 'herbario_heaa',
  port:     parseInt(process.env.DB_PORT || '3306'),
};

async function colExists(conn, table, col) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [cfg.database, table, col]
  );
  return rows[0].cnt > 0;
}

async function run() {
  const conn = await mysql.createConnection(cfg);
  console.log(`\n✅ Conectado a ${cfg.database}@${cfg.host}:${cfg.port}\n`);

  const tasks = [
    { table: 'pqrsdf',      col: 'respuesta',      sql: `ALTER TABLE pqrsdf ADD COLUMN respuesta TEXT NULL COMMENT 'Respuesta oficial' AFTER mensaje` },
    { table: 'pqrsdf',      col: 'responded_by',   sql: `ALTER TABLE pqrsdf ADD COLUMN responded_by INT NULL AFTER respuesta` },
    { table: 'pqrsdf',      col: 'responded_at',   sql: `ALTER TABLE pqrsdf ADD COLUMN responded_at TIMESTAMP NULL AFTER responded_by` },
    { table: 'suggestions', col: 'admin_response', sql: `ALTER TABLE suggestions ADD COLUMN admin_response TEXT NULL COMMENT 'Respuesta del administrador' AFTER description` },
    { table: 'suggestions', col: 'responded_by',   sql: `ALTER TABLE suggestions ADD COLUMN responded_by INT NULL AFTER admin_response` },
    { table: 'suggestions', col: 'responded_at',   sql: `ALTER TABLE suggestions ADD COLUMN responded_at TIMESTAMP NULL AFTER responded_by` },
  ];

  for (const t of tasks) {
    if (await colExists(conn, t.table, t.col)) {
      console.log(`  ⏭  ${t.table}.${t.col} — ya existe`);
    } else {
      await conn.query(t.sql);
      console.log(`  ✅  ${t.table}.${t.col} — columna creada`);
    }
  }

  for (const fk of [
    `ALTER TABLE pqrsdf ADD CONSTRAINT fk_pqrsdf_responded_by FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL`,
    `ALTER TABLE suggestions ADD CONSTRAINT fk_suggestions_responded_by FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL`,
  ]) {
    try { await conn.query(fk); } catch { /* ya existe */ }
  }

  console.log('\n🎉 Migración completada. Reinicia el servidor backend.\n');
  await conn.end();
}

run().catch(err => {
  console.error('\n❌ Error:', err.message, '\n');
  process.exit(1);
});
