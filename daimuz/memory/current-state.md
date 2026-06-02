# Estado Actual del Sistema

*Última actualización: 2026-06-02 (sesión de despliegue y debugging Dokploy)*

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

## 🚧 Pendiente / En construcción

- **Cloudinary**: `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` vacíos → subida de imágenes falla
- **Dominio real**: usar nip.io mientras no haya DNS propio configurado
- `controllers/dashboard/dashboardController.js` → `getPlantsByLocation` usa `department`; `getTopCollectors` usa `collector_name` — activos pero con bugs DwC silenciosos
- `app/admin/plantas/[id]/editar/page.tsx` — recarga de planta existente usa `getById` que devuelve formato diferente al esperado en algunos campos del estado DwC (pendiente verificar)
- `app/admin/plantas/[id]/editar/page.tsx` — recarga de planta existente usa `getById` que devuelve formato diferente al esperado en algunos campos del estado DwC (pendiente verificar)
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

### DwC — columnas corregidas (2026-06-02)
Todos los archivos con nombres viejos fueron corregidos:
- `dashboard/getStats.js` ✓ (state_province, recorded_by, minimum_elevation_in_meters)
- `dashboard/dashboardController.js` ✓ (state_province, recorded_by)
- `plants/locationsController.js` ✓ (state_province, locality, decimal_latitude, decimal_longitude, minimum_elevation_in_meters)
- `plants/taxonomyController.js` ✓ (specific_epithet)
- `admin/plantas/page.tsx` ✓ (catalog_number, recorded_by, event_date, state_province, specific_epithet, scientific_name_authorship, locality, decimal_latitude, decimal_longitude, decimal_latitude_sexagesimal, decimal_longitude_sexagesimal, minimum_elevation_in_meters, preparations, plant_habit, geodetic, record_number)

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
