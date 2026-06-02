# Rutas API — Referencia Completa

## Patrón único

```
POST /api/service
Content-Type: application/json
Body: { "service": "modulo.accion", "data": {...}, "token": "jwt_opcional" }
```

## Rutas directas (excepciones al gateway)

| Método | Ruta | Descripción | Auth | Notas |
|--------|------|-------------|------|-------|
| POST | `/api/plantas/upload` | Subir imagen (multipart/form-data) | JWT | Multer, max 10MB |
| GET | `/api/media/plantas/:file` | Servir imagen local | No | Solo para dev |
| GET | `/health` | Estado del sistema | No | Para monitoring |
| GET | `/info` | Info versión/entorno | No | Para monitoring |

---

## Servicios por módulo

### 🔐 auth.*

| Servicio | Descripción | Req. Auth | Req. Rol |
|----------|-------------|-----------|----------|
| `auth.login` | `{ email, password }` → `{ token, user }` | No | — |
| `auth.register` | `{ name, email, password }` → `{ token, user }` | No | — |
| `auth.logout` | Cierra sesión | Sí | — |
| `auth.me` | Devuelve usuario actual | Sí | — |
| `auth.refresh` | Refresca JWT | Sí | — |
| `auth.changePassword` | `{ currentPassword, newPassword }` | Sí | — |
| `auth.forgotPassword` | `{ email }` → envía email | No | — |
| `auth.resetPassword` | `{ token, newPassword }` | No | — |
| `auth.verifyEmail` | `{ token }` | No | — |

### 🌿 plants.*

| Servicio | Descripción | Req. Auth | Req. Rol |
|----------|-------------|-----------|----------|
| `plants.getAll` | `{ page, limit, search, family, genus, species, department, municipality, collector, catalog_number, status }` | No | — |
| `plants.getById` | `{ id }` | No | — |
| `plants.create` | Ver campos DwC en [darwin-core-fields.md](darwin-core-fields.md) | Sí | admin/collector |
| `plants.update` | `{ id, ...campos }` — VALID_COLUMNS whitelist | Sí | admin/collector |
| `plants.delete` | `{ id }` → status='deleted' | Sí | admin |
| `plants.bulkDelete` | `{ ids: [] }` | Sí | admin |
| `plants.search` | `{ query, family, state_province, municipality, recorded_by, habitat, conservation_status, plant_habit, flower_color, event_date_from, event_date_to, min_elevation, max_elevation }` | No | — |
| `plants.advancedSearch` | Alias de search con más filtros | No | — |
| `plants.getForMap` | `{ search, family, department, municipality, limit }` | No | — |
| `plants.getRecent` | `{ limit }` | No | — |
| `plants.getMostViewed` | `{ limit }` | No | — |
| `plants.getStats` | Conteos por familia, estado, etc. | No | — |
| `plants.getFeaturedPlants` | Plantas con featured=true | No | — |
| `plants.getFilterOptions` | Opciones para los filtros del catálogo | No | — |
| `plants.uploadImage` | Subir imagen a Cloudinary para planta | Sí | — |
| `plants.setMainImage` | `{ plant_id, image_id }` | Sí | — |
| `plants.deleteImage` | `{ image_id }` | Sí | admin |
| `plants.getImages` | `{ plant_id }` | No | — |
| `plants.export` | `{ format: 'csv'|'json' }` | Sí | admin |
| `plants.checkDuplicates` | `{ catalog_number }` | Sí | — |
| `plants.purgeDeleted` | Elimina físicamente plantas con deleted_at (irreversible) | Sí | admin |
| `plants.getByStatus` | `{ status: 'draft'|'published'|'review'|'deleted' }` | Sí | admin |

### 👤 users.*

| Servicio | Descripción | Req. Auth | Req. Rol |
|----------|-------------|-----------|----------|
| `users.getAll` | `{ page, limit, search, role, status }` | Sí | admin |
| `users.getById` | `{ id }` | Sí | admin |
| `users.create` | `{ name, email, password, role }` | Sí | admin |
| `users.update` | `{ id, ...campos }` | Sí | admin |
| `users.delete` | `{ id }` → soft delete | Sí | admin |
| `users.updateProfile` | `{ name, phone, bio, ... }` (propio) | Sí | — |
| `users.changeRole` | `{ id, role }` | Sí | admin |
| `users.uploadAvatar` | Ver ruta directa | Sí | — |
| `users.getActivity` | `{ id, limit }` | Sí | — |
| `users.getStats` | Estadísticas del usuario | Sí | — |
| `users.activate` | `{ id }` | Sí | admin |
| `users.deactivate` | `{ id }` | Sí | admin |

### 📊 dashboard.*

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `dashboard.getStats` | Conteos globales + últimas actividades | Sí |
| `dashboard.getPlantsByFamily` | Distribución por familia (para Chart.js) | Sí |
| `dashboard.getPlantsByLocation` | Distribución por departamento | Sí |
| `dashboard.getRecentActivity` | Últimas acciones (activity_logs) | Sí |
| `dashboard.getTopCollectors` | Ranking de colectores | Sí |
| `dashboard.getMonthlyStats` | Plantas creadas por mes | Sí |
| `dashboard.getVisitorsChart` | Vistas de plantas por período | Sí |
| `dashboard.getSystemHealth` | Estado de servicios (DB, Cloudinary) | Sí |
| `dashboard.getStorageInfo` | Espacio usado en uploads | Sí |

### 💡 suggestions.*

| Servicio | Descripción | Auth | Rol |
|----------|-------------|------|-----|
| `suggestions.create` | `{ title, description, type, priority, plant_id? }` | Sí | — |
| `suggestions.getAll` | `{ page, limit, status, type }` | Sí | admin |
| `suggestions.getById` | `{ id }` | Sí | — |
| `suggestions.update` | `{ id, ...campos }` | Sí | admin |
| `suggestions.approve` | `{ id }` → status='approved' | Sí | admin |
| `suggestions.reject` | `{ id }` → status='rejected' | Sí | admin |
| `suggestions.getByStatus` | `{ status }` | Sí | — |
| `suggestions.getByUser` | `{ user_id }` | Sí | — |
| `suggestions.addComment` | ⚠️ Estado incierto (ver current-state.md) | Sí | — |
| `suggestions.countUnread` | Cuenta status='pending' para badge admin | Sí | admin |
| `suggestions.updateStatus` | `{ id, status }` | Sí | admin |

### 🌳 taxonomy.*

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `taxonomy.getFamilies` | Familias DISTINCT de plants | No |
| `taxonomy.getGenera` | Géneros DISTINCT | No |
| `taxonomy.getGeneraByFamily` | `{ family }` | No |
| `taxonomy.getSpecies` | Especies DISTINCT | No |
| `taxonomy.getSpeciesByGenus` | `{ genus }` | No |
| `taxonomy.getTaxonomyTree` | Árbol jerárquico completo | No |
| `taxonomy.validateTaxonomy` | `{ scientific_name }` | No |
| `taxonomy.createFamily` | `{ family }` — inserta en plants | Sí | admin |
| `taxonomy.createGenus` | `{ genus, family }` | Sí | admin |

### 📍 locations.*

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `locations.getDepartments` | state_province DISTINCT de plants | No |
| `locations.getMunicipalities` | municipality DISTINCT | No |
| `locations.getMunicipalitiesByDepartment` | `{ state_province }` | No |
| `locations.getCollectionSites` | locality DISTINCT | No |
| `locations.createLocation` | Agrega una ubicación | Sí | admin |
| `locations.getLocationStats` | Plantas por departamento | No |

### ⚙️ settings.*

| Servicio | Descripción | Auth | Rol |
|----------|-------------|------|-----|
| `settings.getPublic` | Solo `is_public=true` | No | — |
| `settings.getAll` | Todos los settings | Sí | admin |
| `settings.get` | `{ key: 'site_name' }` | Sí | admin |
| `settings.update` | `{ key, value }` | Sí | admin |
| `settings.updateMultiple` | `{ settings: [{key, value}] }` | Sí | admin |
| `settings.reset` | Resetear a defaults | Sí | admin |
| `settings.backup` | Exportar todas las settings como JSON | Sí | admin |
| `settings.restore` | Importar settings desde JSON backup | Sí | admin |
| `settings.testCloudinary` | Prueba conexión con Cloudinary | Sí | admin |
| `settings.getSystemInfo` | Info del servidor (Node, MySQL, versión app) | Sí | admin |

### 📁 uploads.*

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `uploads.uploadFile` | Subir un archivo | Sí |
| `uploads.uploadMultiple` | Subir varios archivos | Sí |
| `uploads.deleteFile` | `{ id }` | Sí |
| `uploads.getFile` | `{ id }` | Sí |
| `uploads.validateFile` | Validar sin subir | Sí |
| `uploads.resizeImage` | `{ id, width, height }` | Sí |
| `uploads.getStorageStats` | Espacio total usado | Sí | admin |

---

### 🌐 public.* (sin autenticación)

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `public.getStats` | Totales globales para página de inicio (plants, families, genera, locations) | No |
| `public.getFeaturedPlants` | Plantas con featured=true para la home | No |
| `public.getFilterOptions` | Opciones para filtros del catálogo (familias, departamentos, etc.) | No |
| `public.getRandomPlants` | Plantas aleatorias para widget de descubrimiento | No |
| `public.getSystemInfo` | Nombre herbario, descripción, contacto (desde settings públicas) | No |

### 🔍 autocomplete.* (sin autenticación)

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `autocomplete.search` | Búsqueda typeahead general | No |
| `autocomplete.families` | Familias para typeahead del buscador | No |
| `autocomplete.genera` | Géneros para typeahead | No |
| `autocomplete.species` | Especies para typeahead | No |
| `autocomplete.collectors` | Nombres de colectores para typeahead | No |
| `autocomplete.locations` | Municipios/departamentos para typeahead | No |

### 🎛️ filters.* (sin autenticación)

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `filters.getFilterOptions` | Opciones disponibles para todos los filtros del catálogo | No |
| `filters.getFieldValues` | `{ field }` — valores únicos de un campo específico | No |

### ✅ validation.*

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `validation.validatePlantData` | Valida datos antes de plants.create | Sí |
| `validation.validateTaxonomy` | Valida nombre científico vs catálogo | No |
| `validation.checkDuplicateCatalogNumber` | Verifica unicidad de catalog_number | Sí |
| `validation.validateDarwinCore` | Valida cumplimiento del estándar DwC | No |

### 📋 pqrsdf.* (peticiones ciudadanas)

| Servicio | Descripción | Auth |
|----------|-------------|------|
| `pqrsdf.create` | `{ tipo, nombre, email, mensaje, anonimo }` → genera radicado PQRSDF-YYYYMMDD-XXXXX | No |
| `pqrsdf.getAll` | Lista todas las peticiones | Sí | admin |

### 📝 posts.* (⚠️ MÓDULO ROTO — sin tabla en BD)

| Servicio | Descripción | Estado |
|----------|-------------|--------|
| `posts.getAll` | — | ❌ Falla en runtime |
| `posts.getById` | — | ❌ Falla en runtime |
| `posts.create` | — | ❌ Falla en runtime |
| `posts.update` | — | ❌ Falla en runtime |
| `posts.delete` | — | ❌ Falla en runtime |

Ver [[posts/compressed|posts · compressed]] para plan de activación.

---

## Formato de respuesta estándar

```json
// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "mensaje", "code": "CÓDIGO", "message": "detalle" }
```

## Formato del payload

```json
{
  "service": "plants.getAll",
  "data": {
    "page": 1,
    "limit": 12,
    "family": "Solanaceae"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```


---

## Red de conexiones

- Gateway: [[backend]]
- Endpoints: [[endpoints-index]]
- Módulos: [[modules-index]]
- Regla #1: [[universal-constraints]]
- Índice: [[DAIMUZ]]
