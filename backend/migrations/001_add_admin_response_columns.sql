-- ============================================================
-- Migración 001: Soporte para respuestas administrativas
-- Sistema Herbario Digital HEAA
-- Ejecutar: mysql -u <usuario> -p herbario_heaa < migrations/001_add_admin_response_columns.sql
-- ============================================================

-- ── pqrsdf: agregar columnas de respuesta ───────────────────
ALTER TABLE pqrsdf
  ADD COLUMN IF NOT EXISTS respuesta    TEXT          NULL COMMENT 'Respuesta oficial del administrador' AFTER mensaje,
  ADD COLUMN IF NOT EXISTS responded_by INT           NULL COMMENT 'ID del admin que respondió'          AFTER respuesta,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP     NULL COMMENT 'Fecha y hora de la respuesta'        AFTER responded_by,
  ADD CONSTRAINT fk_pqrsdf_responded_by
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;

-- ── suggestions: agregar columnas de respuesta ──────────────
ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS admin_response TEXT      NULL COMMENT 'Respuesta oficial del administrador' AFTER description,
  ADD COLUMN IF NOT EXISTS responded_by   INT       NULL COMMENT 'ID del admin que respondió'          AFTER admin_response,
  ADD COLUMN IF NOT EXISTS responded_at   TIMESTAMP NULL COMMENT 'Fecha y hora de la respuesta'        AFTER responded_by,
  ADD CONSTRAINT fk_suggestions_responded_by
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;

SELECT 'Migración 001 aplicada correctamente.' AS resultado;
