-- ============================================================================
-- Migración 003 — Metadatos de Soft Delete para `plants`
-- Completa el principio de "Trazabilidad total": quién, cuándo y por qué.
--
-- La tabla ya tiene:  status ENUM(...,'deleted')  y  deleted_at TIMESTAMP NULL
-- Faltaban:           deleted_by (quién)  y  deletion_reason (por qué)
--
-- Ejecutar en producción:
--   mysql -u <user> -p <database> < backend/migrations/003_soft_delete_metadata.sql
-- ============================================================================

ALTER TABLE plants
  ADD COLUMN deleted_by INT NULL COMMENT 'Usuario que archivó el registro' AFTER deleted_at,
  ADD COLUMN deletion_reason VARCHAR(500) NULL COMMENT 'Motivo del archivado (por qué)' AFTER deleted_by;

-- FK opcional hacia users (se conserva el id aunque se borre el usuario)
ALTER TABLE plants
  ADD CONSTRAINT fk_plants_deleted_by
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Verificación (opcional):
-- SHOW COLUMNS FROM plants LIKE 'deleted%';
