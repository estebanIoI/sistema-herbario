# Módulo Plants — Documentación Completa

## Qué hace

Gestiona el catálogo botánico del Herbario HEAA: CRUD completo de especímenes con
taxonomía Darwin Core, búsqueda avanzada (FULLTEXT + filtros), visualización en mapa
Leaflet, gestión de imágenes via Cloudinary y exportación de datos.

## Archivos del módulo

| Archivo | Estado | Propósito |
|---------|--------|-----------|
| `backend/src/controllers/plants/plantsController.js` | **ACTIVO** | Coordinador principal — create, update, delete, getAll (Express), getById (Express) |
| `backend/src/controllers/plants/getAll.js` | Activo | Listado paginado con filtros (service gateway) |
| `backend/src/controllers/plants/getById.js` | Activo | Detalle completo + imágenes (service gateway) |
| `backend/src/controllers/plants/search.js` | Activo | Búsqueda FULLTEXT + filtros avanzados |
| `backend/src/controllers/plants/getForMap.js` | Activo | Plantas con coordenadas para mapa Leaflet |
| `backend/src/controllers/plants/create.js` | **INACTIVO** | Versión alternativa (marcada con comentario al inicio) |
| `backend/src/routes/plants.js` | Activo | Ruta directa `POST /api/plantas/upload` |
| `backend/src/routes/media.js` | Activo | Ruta directa `GET /api/media/plantas/:file` |
| `frontend/app/plantas/page.tsx` | Activo | Catálogo público |
| `frontend/app/plantas/[id]/page.tsx` | Activo | Detalle de planta pública |
| `frontend/app/admin/plantas/page.tsx` | Activo | Listado admin con CRUD |
| `frontend/app/admin/plantas/nueva/page.tsx` | Activo | Formulario creación (53 campos DwC) |
| `frontend/app/admin/plantas/[id]/editar/page.tsx` | Activo | Formulario edición |

## Tablas involucradas

- `plants` — espécimen principal con 70+ campos Darwin Core
- `plant_images` — imágenes por planta (FK `plant_id`)

## Campos clave (nombres DwC)

```
Obligatorio: scientific_name · catalog_number · family · genus
             specific_epithet · recorded_by · event_date · state_province · county
             basis_of_record

Búsqueda FULLTEXT: scientific_name · common_name · vernacular_name
                   description · habitat · uses

Filtros frecuentes: family · genus · state_province · municipality
                    recorded_by · conservation_status · plant_habit
                    decimal_latitude · decimal_longitude (mapa)
```

Ver todos los 53 campos: [vault/darwin-core-fields.md](../../vault/darwin-core-fields.md)

## Flujo create (activo)

```
Frontend nueva/page.tsx
  └── prepareCommonData() → { catalog_number, recorded_by, specific_epithet, ... }
        └── apiService.createPlant() / updatePlant()
              └── POST /api/service { service: "plants.create", data, token }
                    └── serviceController → services/index.js → plantsController.js#create
                          ├── Verifica catalog_number único
                          ├── INSERT INTO plants (columnas DwC)
                          └── INSERT INTO plant_images (si hay imágenes)
```

## Flujo update (activo)

```
Frontend editar/page.tsx
  └── handleSubmit() → { specific_epithet, recorded_by, state_province, ... }
        └── apiService.updatePlant(id, data)
              └── plantsController.js#update
                    ├── VALID_COLUMNS whitelist (filtra columnas inválidas)
                    ├── ENUM_ALLOWED (convierte valores inválidos a null)
                    └── UPDATE plants SET campo = ? WHERE id = ?
```

## Reglas críticas

1. **`catalog_number` es UNIQUE** — verificar antes de INSERT, manejar 409 en frontend
2. **`scientific_name` es NOT NULL** — si está vacío al guardar draft, usar 'Espécimen sin clasificar'
3. **Soft delete via status** — `status='deleted'`, no DELETE real
4. **Nombres DwC siempre** — no usar nombres viejos en ningún query SQL nuevo
5. **`create.js` está INACTIVO** — el activo es `plantsController.js#create`

## Estado ENUM de plantas

```
draft     → borrador, no visible en catálogo público
review    → en revisión, visible solo para admin/collector
published → público, aparece en /plantas
deleted   → soft delete, no aparece en ninguna lista
```

## Imágenes

- Upload: `POST /api/plantas/upload` (multipart, máx 10MB)
- Tipos: image/jpeg, image/png, image/webp
- Storage: Cloudinary en prod, local `/uploads/` en dev
- Una imagen puede ser `is_main=true` por planta
- Las imágenes se guardan en `plant_images` con FK a `plants.id`

## Búsqueda avanzada (`plants.search` en search.js)

Filtros disponibles:
```javascript
{
  query,              // FULLTEXT en 6 campos
  family,
  genus,
  specific_epithet,   // DwC
  state_province,     // DwC (departamento)
  municipality,
  recorded_by,        // DwC (colector)
  habitat,
  conservation_status, // LC, NT, VU, EN, CR, EW, EX, DD, NE
  plant_habit,        // DwC
  flower_color,
  event_date_from,    // DwC
  event_date_to,
  min_elevation,      // minimum_elevation_in_meters
  max_elevation,
  lat_min, lat_max, lng_min, lng_max  // bounding box para mapa
}
```

## Vistas SQL relacionadas

| Vista | Uso |
|-------|-----|
| `plants_with_main_image` | Listado optimizado con imagen principal (JOIN) |
| `featured_plants` | Página de inicio — plantas con featured=true |
| `stats_summary` | Dashboard — conteos globales |


---

## Red de conexiones

- Módulo compressed: [[plants/compressed|plants · compressed]]
- Flujo: [[plant-upload-flow]]
- Sinapsis: [[plants-chain]]
- Campos DwC: [[darwin-core-fields]]
- Tablas: [[db-tables-index]]
- Índice: [[modules-index]] · [[DAIMUZ]]
