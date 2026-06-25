-- ============================================================================
-- Migración 004 — Índices de la jerarquía taxonómica completa
-- La tabla `plants` ya tiene las columnas kingdom, phylum, class_name, order_name
-- (reino → filo → clase → orden → familia → género → especie), pero solo family,
-- genus y scientific_name estaban indexados. Esto completa "jerarquía indexada".
--
-- Ejecutar en producción:
--   mysql -u <user> -p <database> < backend/migrations/004_taxonomy_hierarchy_indexes.sql
-- ============================================================================

ALTER TABLE plants
  ADD INDEX idx_kingdom (kingdom),
  ADD INDEX idx_phylum (phylum),
  ADD INDEX idx_class_name (class_name),
  ADD INDEX idx_order_name (order_name),
  ADD INDEX idx_taxon_hierarchy (kingdom, phylum, class_name, order_name, family, genus);

-- Verificación (opcional):
-- SHOW INDEX FROM plants WHERE Key_name LIKE 'idx_%';
