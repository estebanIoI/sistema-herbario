# Changelog

## 2026-05-30 — Auditoría completa del codebase
- Auditados: services/index.js, app.js, auth.js, login.js, dashboardController.js, docker-compose.yml, package.json (backend y frontend), lib/api.ts, auth-context.tsx, next.config.mjs
- Corregidos 8 errores en el cerebro: JWT extracción, 91 servicios (no 100+), puerto 5001 (no 5000), posts SIN tabla, login_attempts no implementado, módulo public no documentado, avgSessionTime simulado, prisma instalado pero no usado
- Creado módulo public/compressed.md
- Actualizados: governance, architecture/backend, architecture/frontend, indexes/modules-index, indexes/files-index, flows/auth-flow, vault/business-rules, context/environment, memory/current-state

## 2026-05-30 — Migración DwC completa
- Documentados los 53 campos Darwin Core del BD_Gral_HEAA en `daimuz/vault/darwin-core-fields.md`
- SQL `herbario_heaa_actualizado.sql`: renombradas 16 columnas de la tabla `plants` a nombres DwC estándar
- Backend `plantsController.js`: actualizado INSERT, destructuring, VALID_COLUMNS whitelist y respuestas
- Backend `getAll.js`: WHERE conditions y SELECT actualizados a DwC
- Backend `getForMap.js`: SELECT y WHERE actualizados a DwC
- Frontend `nueva/page.tsx`: `prepareCommonData()` actualizado a DwC
- Frontend `editar/page.tsx`: form state, loadPlantData y handleSubmit actualizados a DwC
- DAIMUZ brain: db-tables-index.md y modules/plants/compressed.md actualizados

## 2026-05-30 — DAIMUZ implementado
- Implementado cerebro DAIMUZ completo con toda la documentación del proyecto
- Creado CLAUDE.md en root con instrucciones de lectura

## [sesiones anteriores]
- Arquitectura modular completa implementada
- API Gateway unificado con 100+ servicios
- Docker Compose con MySQL + Redis + Backend + Frontend
- Sistema de despliegue via Dokploy + Traefik
- Autenticación JWT completa
- CRUD de plantas con Darwin Core
- Dashboard con estadísticas y gráficos
- Sistema de sugerencias con moderación
- Gestión de usuarios con roles
- Integración Cloudinary para imágenes
- Health checks y logging con Winston
- Mapa Leaflet con plantas geolocalizadas

---
*Agregar entradas al inicio de este archivo después de cada sesión significativa.*


---

## Red de conexiones

- Estado: [[current-state]]
- Features: [[completed-features]]
- Índice: [[DAIMUZ]]
