-- ============================================================================
-- Migración 002 — Añade el rol 'investigador' al enum de usuarios
-- Modelo de roles (jerarquía): user < collector < investigador < admin
--
-- Ejecutar en producción:
--   mysql -u <user> -p <database> < backend/migrations/002_add_investigador_role.sql
-- o desde el contenedor del backend / Dokploy.
-- ============================================================================

ALTER TABLE users
  MODIFY COLUMN role
  ENUM('admin', 'investigador', 'collector', 'user')
  NOT NULL DEFAULT 'user';

-- Verificación (opcional):
-- SHOW COLUMNS FROM users LIKE 'role';
