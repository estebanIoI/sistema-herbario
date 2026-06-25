# Estado Actual del Sistema

*Última actualización: 2026-06-25 (RBAC de 4 roles + rediseño glass del admin)*

---

## 🛠️ Cambios sesión 2026-06-25

### Control de acceso basado en roles (RBAC) — 4 roles reales
Antes el sistema solo distinguía `admin` vs. resto. Ahora implementa la jerarquía
de la matriz: **user < collector < investigador < admin**.

- **BD**: enum `users.role` ampliado a `('admin','investigador','collector','user')`.
  Migración: `backend/migrations/002_add_investigador_role.sql` (ejecutar en prod).
- **Gateway** (`serviceController.js`): reemplazado el chequeo binario por
  `ROLE_GRANTS` + `adminServices`.
  - `plants.create` / `plants.update` → collector, investigador, admin (registrar especímenes).
  - `plants.export` → investigador, admin (búsqueda avanzada + exportación). Antes el
    export real (`plants.export`) estaba **sin gatear**; ahora exige auth. Las entradas
    muertas `export.plants/statistics/collections` se eliminaron.
  - Resto (usuarios, settings, página, sugerencias, pqrsdf, posts, backup, dashboard,
    plants.delete/import/bulkDelete) → solo admin.
- **users.create/update**: validan el set completo de roles.
- **Frontend**:
  - `lib/permissions.ts` — única fuente de verdad (jerarquía, `ROUTE_ROLES`,
    `CAPABILITIES`, `can()`, `canAccessRoute()`, `roleHome()`).
  - `ProtectedRoute` extendido con `allowedRoles` + guard por ruta.
  - Sidebar filtra secciones por rol; `/admin/plantas` gatea Exportar (investigador+),
    e Importar/Backup/Eliminar (admin). El catálogo público oculta Exportar salvo investigador/admin.
  - Login redirige según `roleHome(role)`.
  - **CRUD de usuarios** en `/admin/usuarios` (crear, editar rol/estado, activar/desactivar,
    eliminar) — antes era solo lectura. `toggleStatus` se hace vía `users.update` (el servicio
    `users.toggleStatus` sigue sin registrar en el gateway).
  - Nueva página real `/admin/estadisticas` (usa `public.getStats`) para investigador/admin.

### Soft Delete real en `plants` (Trazabilidad total)
Antes `plants.delete` hacía **hard delete** (`DELETE FROM plants` + imágenes),
violando la regla de `CLAUDE.md`. Ahora es soft delete de verdad:

- `deletePlant` → `UPDATE status='deleted', deleted_at=NOW(), deleted_by=?, deletion_reason=?`
  (conserva el registro y las imágenes). `bulkDelete` ahora es un soft delete real
  (antes era alias del hard delete). Nuevo `restorePlant` (`status='draft'`, limpia metadatos).
- Migración `003_soft_delete_metadata.sql`: añade `deleted_by` (FK users) y `deletion_reason`.
- `plants.restore` registrado en el gateway (admin). El **hard delete** real queda
  reservado a `purgeDeleted` (papelera → "Limpiar eliminados", admin).
- Lecturas públicas (getAll/advancedSearch/getForMap/featured/export) ya excluían
  `status='deleted'`; ahora cobra sentido.
- Frontend: diálogo de borrado pide **motivo (por qué)**, filtro de estado
  **"Papelera (archivados)"**, acción **Restaurar**, y wording cambiado a "Archivar".

### Caché Redis real (capa de Datos de la arquitectura)
La imagen de arquitectura promete "Redis (Caché)" y docker-compose ya levantaba un
contenedor `redis:7-alpine` con `REDIS_URL`, pero **el código nunca se conectaba**:
usaba `node-cache` en memoria. (`cacheService.js` tenía cachés de un proyecto de
restaurante — código muerto, no importado.)

- **`backend/src/services/cache.js`** — capa unificada: usa **Redis** mediante un
  **cliente RESP mínimo sobre `net`** (cero dependencias, no toca el lockfile) con
  **fallback automático a memoria** (node-cache). API async: `get/set/del/isRedis`.
  No rompe el arranque si falta Redis.
  · Nota: se intentó con `ioredis` pero rompía el deploy (`--frozen-lockfile` exige
    regenerar `pnpm-lock.yaml`); por eso se optó por el cliente sin dependencias.
- Conectada en: `countriesController` (países/estados/ciudades, TTL 24 h) y
  `getPublicStatsData` (stats públicas, TTL 2 min).
- MySQL 8 (sin ORM), Express API Gateway, Cloudinary, Leaflet clustering
  (`react-leaflet-cluster`) y Docker+Traefik+SSL ya se cumplían.

### Exportación Darwin Core compatible con GBIF
Antes solo había export CSV con encabezados en español (no ingerible por GBIF).
Ahora el sistema cumple el flujo Darwin Core de la imagen:

- **`backend/src/utils/zip.js`** — escritor ZIP (STORE + CRC32) sin dependencias
  (validado con `unzip -t`).
- **`backend/src/controllers/plants/exportDwc.js`** — servicio `plants.exportDwc`
  con tres formatos (gateado a investigador/admin):
  - `dwca` → **Darwin Core Archive** (.zip con `occurrence.txt` TSV de términos DwC,
    `meta.xml` que mapea cada columna a su URI `http://rs.tdwg.org/dwc/terms/...`,
    y `eml.xml` con metadatos del dataset). Formato oficial GBIF.
  - `dwc-csv` → CSV con términos Darwin Core puros (occurrenceID, scientificName…).
  - `excel` → SpreadsheetML (.xls) nativo de Excel.
- Frontend `/admin/plantas`: menú "Exportar" con DwC-A, DwC-CSV, Excel, y el CSV
  español previo. Descarga vía base64 → Blob.
- El export CSV español original (`plants.export`) se conserva para uso interno.

### Rediseño visual del admin (Glassmorphism + Minimalismo Botánico)
- `globals.css`: tokens glass (claro/oscuro) scoped a `.admin-shell`, fondo botánico,
  toda `Card` de shadcn → cristal automático.
- Nuevo `admin-topbar.tsx` (búsqueda, notificaciones, perfil), sidebar glass flotante,
  KPIs y paleta de gráficas en verde botánico.

### CORS en producción (fix)
- `docker-compose.yml`: añadida label Traefik `accesscontrolallowcredentials=true`
  (faltaba con `credentials:'include'`). Recrear el contenedor del API para aplicarla.

---

## 🛠️ Cambios sesión 2026-06-04

### Documentación de la API regenerada fiel al código
- **`backend/docs/api-spec.yaml`** — regenerado en **OpenAPI 3.1** (v2.0.0) a partir de una auditoría completa del registro `services/index.js`, el despachador y los controladores. 125 operaciones (121 servicios reales + 4 rutas HTTP reales), cada una con su ruta/método HTTP real, payload, validaciones, respuestas, auth, rol y un campo `x-service-status` (ok/stub/broken/always403). Se sirve en `/api-docs`.
- **`backend/docs/GUIA-DESARROLLADORES.md`** — nueva guía: patrón Monolito Modular + Service Gateway (RPC), flujo de auth, estructura de módulos, hallazgos de seguridad y ejemplos de consumo (JS, React, React Native, Flutter).

### Auditoría de servicios — estado real (ver `bugs-history.md` 2026-06-04)
- De 126 servicios registrados, ~97 funcionales; el resto rotos/stub/mal cableados.
- 6 servicios rotos vía gateway (handlers estilo Express): `auth.refresh/changePassword/verifyEmail`, `users.changeRole/getProfile/getActivity`.
- 3 bugs "siempre 403" (`suggestions.update/updateStatus/getStats`) + `users.toggleStatus` (404, no registrado).
- 5 servicios registrados pero `undefined` → 404 (`users.uploadAvatar/getStats/deactivate/activate`, `autocomplete.collectors`).
- Brechas de auth: `plants.purgeDeleted`, `uploads.deleteFile`, métricas del dashboard y `settings.get` accesibles sin protección.
- Rate limiter estricto de login definido pero NO conectado (sólo aplica el general 500/5min).
- `auth.resetPassword` simulado; `auth.register` fuerza rol `user`.

> Nota: el índice `indexes/endpoints-index.md` y `vault/api-routes.md` listaban estos servicios como funcionales. La fuente técnica de verdad pasa a ser `backend/docs/api-spec.yaml`.

---

## 🛠️ Cambios sesión 2026-06-02

### Despliegue en producción (Dokploy + VPS 2.24.195.20)

**Dominos activos (nip.io mientras no haya dominio real):**
- Frontend: `https://herbario.2.24.195.20.nip.io`
- Backend API: `https://api.2.24.195.20.nip.io`
- Dokploy dashboard: `http://2.24.195.20:3000`

**Variables de entorno actuales en Dokploy:**
```
APP_DOMAIN=herbario.2.24.195.20.nip.io
API_DOMAIN=api.2.24.195.20.nip.io
DB_ROOT_PASSWORD=root123
DB_NAME=herbario_heaa
DB_USER=herbario_user
DB_PASSWORD=admin123
CLOUDINARY_CLOUD_NAME=djhhtzcwu
CLOUDINARY_API_KEY=(vacío - pendiente)
CLOUDINARY_API_SECRET=(vacío - pendiente)
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_WINDOW_MS=300000
```

### Bugs corregidos en esta sesión

**Backend:**
- `.gitignore` `uploads/` → `/uploads/` (la regla genérica ignoraba `src/controllers/uploads/`)
- `uploadsController.js` y controllers de suggestions no estaban en git → añadidos
- `app.set('trust proxy', 1)` faltaba → `express-rate-limit` lanzaba ValidationError con Traefik
- `getPublicStats/getPublicStatsData` usaba `department` (viejo) → `state_province` (DwC)
- `posts` table no existía → agregada a `herbario_heaa_actualizado.sql`
- `upload /api/plantas/upload`: DB insert no-crítico (try-catch), ya no crashea si falla
- Rate limiter: 100 req/15min → 500 req/5min (demasiado estricto para panel admin)
- Dockerfile: Node corre como `nodejs` (UID 1001) pero volumen `uploads_data` se montaba con permisos root → `su-exec` + entrypoint que hace `chown` antes de iniciar

**Frontend:**
- `editar/page.tsx`: 7 campos JSX usaban nombres viejos (species, author, herbarium_number, department, specific_location, latitude/longitude/altitude, collection_date, habit) → corregidos a DwC
- `editar/page.tsx`: Tab "Ubicación" vacío — `TabsContent` tenía `value="coleccion"` → `value="ubicacion"`
- `editar/page.tsx`: Imágenes no se guardaban en `plant_images` — frontend enviaba `image_urls` (string JSON) pero backend esperaba `images` (array `{url, thumbnailUrl}`) → corregido
- `page.tsx` hero_stats_enabled: condición usaba snake_case + string → `String(cfg.heroStatsEnabled) !== 'false'` (robusto para boolean y string)
- `page.tsx` hero2 descripciones: `whitespace-pre-line` para preservar saltos de línea

**Nuevas features:**
- Toggle `hero_stats_enabled` en Admin > Página > Hero 1 para mostrar/ocultar contadores
- `migrate-all.sql`: script de migración seguro para BD existente (DwC + posts + settings)
- `daimuz/context/db-access-guide.md`: guía completa de acceso a BD en Dokploy

---

## ✅ Funciona hoy (2026-06-02)

- Deploy completo en Dokploy con Traefik y nip.io ✓
- Backend arriba en puerto 5001, healthcheck pasando ✓
- Frontend arriba en puerto 3000, healthcheck pasando ✓
- MySQL inicializado con esquema DwC completo + tabla posts ✓
- API Gateway `/api/service` operativo ✓
- Autenticación JWT funcional (admin@heaa.edu.co / admin123) ✓
- CRUD de plantas con Darwin Core ✓
- Formulario editar planta — todos los campos funcionales ✓
- Subida de imágenes a Cloudinary (cuando API key configurada) ✓
- Imágenes se guardan en `plant_images` al actualizar planta ✓
- Dashboard admin operativo ✓
- Sistema de sugerencias operativo ✓
- Módulo de publicaciones (posts) — tabla creada, operacional ✓
- Página de inicio con contadores reales (plantas/familias/géneros) ✓
- Toggle de contadores en admin panel ✓
- Rate limiting razonable (500 req/5min) ✓

## ✅ Nuevas features (post sesión 2026-06-02)

- **Exportación CSV** del catálogo filtrado → `plants.export` service. Archivo: `backend/src/controllers/plants/exportData.js`. Botón visible en `/plantas` cuando hay filtros activos + resultados. 34 columnas DwC. Límite: 5000 filas por exportación. BOM UTF-8 para compatibilidad Excel. ✓
- **Filtros avanzados mejorados** → opciones dinámicas desde `filters.getFilterOptions` (antes hardcodeadas). `getFilterOptions` corregida de `(req,res)` a `(data,user)`. ✓
- **Mapa vacío por defecto** → no carga datos hasta que hay al menos un filtro activo. ✓
- **Bugs DwC mapa** → `map-constants.ts`, `PlantMap.tsx`, `MapContainerInternal.tsx` corregidos con nombres correctos (`state_province`, `minimum_elevation_in_meters`, `plant_habit`, `scientific_name_authorship`, `record_number`). ✓
- **Ficha de espécimen** → `data.author` corregido a `data.scientific_name_authorship`; `data.collector_number` a `data.record_number`; fechas "Invalid Date" protegidas con `fmtDate()`. ✓

## 🚧 Pendiente / En construcción

- **Cloudinary**: `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` vacíos → subida de imágenes falla
- **Dominio real**: usar nip.io mientras no haya DNS propio configurado
- `app/admin/plantas/[id]/editar/page.tsx` — recarga de planta existente puede tener campos DwC pendientes de verificar en el estado del formulario
- Sistema completo de subida de archivos — funciona con Cloudinary configurado
- Redis cache activo en Docker pero backend usa node-cache
- Tests unitarios e integración — carpeta existe, sin tests
- Módulo PQRSDF — estructura existe, implementación parcial
- Posts/Blog — tabla creada, frontend de listado tiene 500 si hay error de DB

## ⚠️ Notas técnicas importantes

### Docker y permisos
- **Dockerfile usa su-exec**: Node corre como `nodejs` (UID 1001). El entrypoint hace `chown -R nodejs:nodejs /app/uploads` antes de iniciar.
- **Volumen uploads_data**: Si se recrea, el entrypoint ya lo maneja correctamente.
- **Volumen nombre real en VPS**: `heaa-herbario-yjg61n_mysql_data`

### Settings system — pitfalls críticos
- `settingsController.updateMultiple` crea nuevos settings con `type='string'` hardcodeado.
- `getPublic.js` castea según el `type` en BD: si type='string', `'false'` sigue siendo string.
- Siempre usar `String(cfg.heroStatsEnabled) !== 'false'` para checks de booleans de settings, NO `cfg.heroStatsEnabled !== false`.
- `getPublic.js` convierte snake_case → camelCase: `hero_stats_enabled` → `heroStatsEnabled`.
- `PAGINA_SETTINGS` en `settingsController.js` corre al startup — si un setting nuevo NO está en esa lista, no se auto-crea. Hay que agregarlo manualmente o via migrate-all.sql.

### DwC — auditoría completa 2026-06-02 (CERRADA)
Todos los archivos del codebase usan nombres DwC correctos. Auditados y corregidos:
- `dashboard/getStats.js` ✓
- `dashboard/dashboardController.js` ✓ (state_province, recorded_by)
- `plants/locationsController.js` ✓ (state_province, locality, decimal_latitude/longitude, minimum_elevation_in_meters)
- `plants/taxonomyController.js` ✓ (specific_epithet, getSimilarNames guard corregido)
- `plants/plantsController.js` ✓ (getFilterOptions, advancedSearch, importData)
- `plants/getAll.js` ✓ (ya estaba correcto)
- `plants/search.js` ✓ (ya estaba correcto)
- `taxonomy/getFamilies.js` ✓ (event_date)
- `admin/plantas/page.tsx` ✓ (Plant interface, COL_MAP, tabla, modal detalle)
- `admin/pagina/page.tsx` ✓ (hero carousel upload via Cloudinary)

### Acceso BD en producción
```bash
# Desde VPS
docker exec -it herbario-db mysql -u root -proot123
# Dentro del contenedor
mysql -u root -p"$MYSQL_ROOT_PASSWORD"
```

### migrate-all.sql
Ejecutar cuando la BD existente necesita actualizarse sin borrar datos:
```bash
docker exec -it herbario-db bash
mysql -u root -proot123 herbario_heaa
SOURCE /ruta/al/migrate-all.sql;
```

---

## 🔴 CRÍTICO — Pendiente en BD de producción

Si la BD fue inicializada antes de la migración DwC (antes de 2026-05-31), ejecutar:
```sql
UPDATE settings SET type='boolean', category='pagina', is_public=1
WHERE key_name='hero_stats_enabled';
```

Ver script completo: `backend/migrate-all.sql`

---

## 📦 Última versión deployada

- Deploy en Dokploy con nip.io
- Rama: `main` — commit `f1c3d84`
- BD: MySQL 8.0 con esquema DwC completo + tabla posts
- ✅ Sistema funcional para uso y pruebas

---

## Red de conexiones

- Tarea Nexus: [[active-task]]
- Guía BD: [[db-access-guide]]
- Migración DwC: [[darwin-core-migration]]
- Módulos: [[modules-index]]
- Índice: [[DAIMUZ]]
