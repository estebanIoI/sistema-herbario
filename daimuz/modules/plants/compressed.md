# plants — compressed

- **Qué hace:** CRUD completo del catálogo botánico con 53 campos Darwin Core. Búsqueda FULLTEXT, visualización en mapa Leaflet, gestión de imágenes via Cloudinary. El módulo más grande del sistema: 26 servicios.
- **Tablas:** `plants` (53 campos DwC) · `plant_images` · vistas SQL: `plants_with_main_image`, `featured_plants`
- **Endpoints:** `plants.getAll` · `plants.getById` · `plants.create` · `plants.update` · `plants.delete` · `plants.search` · `plants.advancedSearch` · `plants.getForMap` · `plants.uploadImage` · `plants.setMainImage` · `plants.getImages` · `plants.deleteImage` · (+14 más)
- **Archivos:** `controllers/plants/plantsController.js` (coordinador activo) · `controllers/plants/getAll.js` · `controllers/plants/search.js` · `routes/plants.js` (upload multipart) · `frontend/app/plantas/page.tsx` (catálogo público)
- **⚠️ Regla crítica:** `scientific_name` NOT NULL. `catalog_number` ÚNICO — verificar antes de INSERT. SIEMPRE nombres DwC: `specific_epithet` (≠ `species`), `recorded_by` (≠ `collector_name`), `event_date` (≠ `collection_date`), `state_province` (≠ `department`). Ver [[darwin-core-fields]].
- **Paginación inteligente en `app/plantas/page.tsx`** (implementado 2026-06-01): si total ≤ 100 → carga todo sin paginar (`limit: 100`). Si total > 100 → activa paginación automáticamente (`limit: 24`, 4 cols × 6 filas). Threshold re-evaluado en cada cambio de filtro. Estados clave: `dynamicLimit` y `paginationEnabled`.

---

## Red de conexiones

- Flujo de creación + imagen: [[plant-upload-flow]]
- Impacto de cambios: [[plants-chain]]
- Reglas DwC: [[universal-constraints]] (#2, #3, #7, #9) · [[darwin-core-fields]]
- Roles que escriben: [[roles-map]] → admin + collector
- Tablas: [[db-tables-index]]
- Capa: [[backend]] · [[frontend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
