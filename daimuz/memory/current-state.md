# Estado Actual del Sistema

*Última actualización: 2026-06-01 (limpieza y auditoría completa)*

---

## 🛠️ Cambios sesión 2026-06-01

- **Dependencias limpias**: `prisma` (devDep) y `mysql` v2 eliminados. `models/index.js` eliminado (código muerto que referenciaba `@prisma/client`)
- **SQL limpiado**: `herbario_heaa_actualizado.sql` −64% (comentarios → DAIMUZ). Bug `get_stats_by_department()` corregido (`department`→`state_province`)
- **Logs de arranque**: opciones inválidas mysql2 eliminadas (`acquireTimeout`, `timeout`, `reconnect`→`connectTimeout: 10000`); Winston dev sin JSON metadata (`level message` limpio); credenciales removidas del log de admin; `console.log` de registro de rutas eliminado; SIGTERM/SIGINT unificados con `db.closePool()`
- **Frontend Hero 2**: `GlobePolaroids` + `dynamic` eliminados de `app/page.tsx`. Carrusel centrado en columna única
- **Bug fix `admin/configuracion`**: Página usaba `getPublicSettings()` que devuelve objeto con `_sections` anidado → crash React. Corregido a `getAllSettings()` con agrupación por categoría en cliente. Ahora editable por sección con Cloudinary (campos password + botón probar)
- **Paginación inteligente `app/plantas/page.tsx`**: ≤100 plantas → muestra todo; >100 → pagina automáticamente con `limit: 24`. Re-evalúa con cada cambio de filtro
- **Módulo suggestions refactorizado**: bug `update` duplicado corregido; servicios inexistentes eliminados del registry; `getById`, `vote`, `getStats` implementados; `approve`/`reject` ahora guardan `notes` en `attachments.admin_notes`; `getAll` sin mock fallback; `update.js` acepta estado `implemented`; frontend sin console.logs, counts incluyen `in_review` e `implemented`
- **DAIMUZ alimentado**: `frontend.md` estructura `page.tsx`; `db-tables-index.md` nombres DwC correctos; `darwin-core-migration.md` archivos pendientes; módulos `dashboard`, `locations`, `taxonomy`, `settings` con bugs DwC documentados

## ✅ Funciona hoy

- Arquitectura modular completa (backend + frontend)
- API Gateway `POST /api/service` operativo con 100+ servicios registrados
- Autenticación JWT funcional (login, registro, refresh, recuperación)
- CRUD completo de plantas con campos Darwin Core
- Búsqueda avanzada con FULLTEXT y filtros múltiples
- Dashboard con estadísticas en tiempo real
- Sistema de sugerencias con moderación (pending → approved/rejected)
- Gestión de usuarios con roles (admin/collector/user)
- Configuraciones públicas y privadas
- Health checks (`/health`, `/info`)
- Logging centralizado con Winston
- Middlewares de seguridad (Helmet, CORS, Rate Limiting)
- Docker Compose completo (MySQL + Redis + Backend + Frontend)
- Deploy via Dokploy + Traefik con SSL
- Mapa interactivo con Leaflet para plantas geolocalizadas
- Dashboard con gráficos Chart.js

## 🚧 Pendiente / En construcción

- **plant-upload-flow** — en pruebas activas (M5). Pendiente: manejo de excepciones en cargas masivas y control de concurrencia. Los logs de éxito de estas pruebas son el insumo crítico para el Capítulo 4 del informe. Ver [[active-task]] en Nexus.
- Sistema completo de subida de archivos (parcialmente implementado)
- Notificaciones avanzadas via WebSocket
- Exportación de datos (CSV/JSON/Darwin Core)
- Caché con Redis (hay Redis en Docker pero el backend usa node-cache)
- Tests unitarios e integración (carpeta `backend/tests/` existe, faltan tests)
- Documentación automática Swagger
- Módulo PQRSDF (estructura existe, implementación parcial)
- Módulo Posts/Blog ⚠️ **NO tiene tabla en `herbario_heaa_actualizado.sql`** — completamente pendiente

## ⚠️ Notas de deuda técnica (auditadas 2026-05-30)

**BD y esquema:**
- `posts`: sin tabla en BD → todas las operaciones del módulo fallan en runtime con "table doesn't exist"
- `settings`: columnas son `key_name`/`value` (no `setting_key`/`setting_value`)
- `activity_logs`: usa `metadata JSON` y `description TEXT` (no `old_values`/`new_values`)
- `suggestion_comments`: tabla eliminada v3.0. `suggestions.addComment` puede estar roto
- Vistas `stats_summary`, `plants_with_main_image`, `featured_plants`, `recent_activity` existen en BD y se pueden usar directamente

**Backend:**
- `login.js` NO implementa bloqueo por `login_attempts` — el campo existe en la tabla `users` pero no se actualiza en el código actual
- `lib/api-backup.ts` y `lib/api-clean.ts` en frontend son archivos huérfanos — no eliminar sin revisar si alguien los referencia
- ~~`prisma` está instalado como devDependency~~ — **eliminado 2026-05-31**
- ~~`mysql` (v2 legacy) y `mysql2` ambos instalados~~ — **eliminado 2026-05-31, solo mysql2**
- `avgSessionTime` en `dashboard.getStats` era simulado ("4:32") — **ya corregido: ahora lee de `activity_logs`**
- Dashboard `getVisitorsChart` lee de `activity_logs` donde `action='view_plant'` — si no hay visitas registradas, el gráfico aparece vacío

**🔴 Migración DwC INCOMPLETA en código — auditada 2026-05-31:**
Los siguientes archivos NO fueron migrados y usan columnas viejas que ya no existen en la BD:
- `controllers/dashboard/getStats.js` → usa `department`, `collector_name`, `altitude` (activo: `dashboard.getStats`)
- `controllers/dashboard/dashboardController.js` → `getPlantsByLocation` usa `department`; `getTopCollectors` usa `collector_name` (activos: múltiples `dashboard.*`)
- `controllers/plants/locationsController.js` → usa `department`, `specific_location`, `altitude`, `latitude`, `longitude` en todos sus métodos (activos: `locations.*`)
- `controllers/plants/taxonomyController.js` → `getSpeciesByGenus` usa `species` (activo: `taxonomy.getSpeciesByGenus`)

**🔴 Migración DwC INCOMPLETA en frontend — auditada 2026-05-31:**
- `app/admin/plantas/[id]/editar/page.tsx` — estado DwC correcto PERO JSX usa nombres viejos en 7 campos: `herbarium_number`→`catalog_number`, `department`→`state_province`, `specific_location`→`locality`, `altitude`→`minimum_elevation_in_meters`, `latitude`→`decimal_latitude`, `longitude`→`decimal_longitude`, `collection_date`→`event_date`
- `app/admin/plantas/page.tsx` — DWC_FIELD_MAP, interface y render usan nombres viejos: `herbarium_number`, `collector_name`, `collection_date`, `department`, `specific_location`, `altitude` → datos aparecen vacíos en la tabla

**Frontend:**
- `NEXT_PUBLIC_API_URL` por defecto apunta a **localhost:5001** (no 5000). En dev local ajustar a :5000 si el backend corre sin Docker
- `typescript.ignoreBuildErrors: true` en next.config.mjs — los errores TypeScript no bloquean el build de producción
- `eslint.ignoreDuringBuilds: true` — misma situación con ESLint

**Las vistas SQL ya actualizadas con nombres DwC están en `herbario_heaa_actualizado.sql`.**

## 🔴 CRÍTICO — Migración de BD pendiente en producción

El código (backend + frontend) ya usa los **nuevos nombres DwC** de columnas.
La BD en producción todavía tiene los **nombres viejos** (`herbarium_number`, `species`, `collector_name`, etc.).

**El sistema NO funcionará en producción hasta que se ejecute la migración SQL.**

Ver script completo de migración: [decisions/darwin-core-migration.md](../decisions/darwin-core-migration.md)

## 🐛 Problemas conocidos abiertos

- `suggestions.addComment` — la tabla `suggestion_comments` fue eliminada en v3.0. Revisar si el servicio usa `attachments JSON` o está roto.

## 📦 Última versión deployada

- Deploy en Dokploy con dominio propio
- Rama: `main`
- Último commit: ajustes de despliegue
- ⚠️ Código adelantado respecto a la BD de producción (migración DwC pendiente)


---

## Red de conexiones

- Tarea Nexus: [[active-task]]
- Sprint: [[current-sprint]]
- Módulos: [[modules-index]]
- Pendientes: [[pending]]
- Índice: [[DAIMUZ]]
