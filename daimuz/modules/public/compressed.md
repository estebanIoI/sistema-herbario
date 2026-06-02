# public — compressed

- **Qué hace:** Endpoints sin autenticación para el catálogo público. Estadísticas globales, plantas destacadas, opciones de filtros y autocompletado typeahead. 6 servicios.
- **Tablas:** `plants` · `plant_images` (solo lectura) · vista `stats_summary` · vista `featured_plants`
- **Endpoints:** `public.getStats` · `public.getFeaturedPlants` · `public.getFilterOptions` · `public.getPlantTypes` · `autocomplete.search` · `autocomplete.getRecentSearches`
- **Archivos:** registrados en `services/index.js` (6 entradas sin auth) · implementados en `plantsController.js` y controladores de taxonomy/locations
- **⚠️ Regla crítica:** SIN token en ningún servicio de este módulo. Nunca incluir datos sensibles (emails, tokens, settings privadas) en respuestas. `public.getStats` ≠ `dashboard.getStats` — son servicios separados: el público tiene menos detalle y no requiere auth.

---

## Red de conexiones

- Datos que sirve: [[plants/compressed|plants]] · [[taxonomy/compressed|taxonomy]] · [[locations/compressed|locations]]
- Rutas registradas: [[api-routes]]
- Roles: [[roles-map]] → acceso público sin token
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
