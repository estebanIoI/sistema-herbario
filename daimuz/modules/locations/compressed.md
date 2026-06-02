# locations — compressed

- **Qué hace:** Ubicaciones geográficas de colección: departamentos, municipios y sitios. Alimenta los filtros del catálogo y el mapa Leaflet. NO tiene tabla propia. 8 servicios.
- **Tablas:** `plants` (columnas DwC: `country`, `state_province`, `county`, `municipality`, `locality`, `decimal_latitude`, `decimal_longitude`) — sin tabla locations separada
- **Endpoints:** `locations.getDepartments` · `locations.getMunicipalities` · `locations.getMunicipalitiesByDepartment` · `locations.getCollectionSites` · `locations.getLocationStats` · `locations.getByCoordinates`
- **Archivos:** `controllers/plants/locationsController.js` · `controllers/locations/getDepartments.js`
- **⚠️ Regla crítica:** No tiene tabla propia — todo es DISTINCT sobre `plants`. Para el mapa Leaflet se usa `plants.getForMap` (NOT locations) que filtra por `decimal_latitude IS NOT NULL AND decimal_longitude IS NOT NULL`. Usar nombres DwC: `state_province` (≠ `department`), `locality` (≠ `specific_location`).
- **🔴 TODOS los servicios `locations.*` fallan — auditado 2026-06-01:** `locationsController.js` usa las columnas viejas en todo el archivo: `department`→`state_province`, `specific_location`→`locality`, `altitude`→`minimum_elevation_in_meters`, `latitude`→`decimal_latitude`, `longitude`→`decimal_longitude`. Requiere migración completa del archivo.

---

## Red de conexiones

- Módulo que almacena los datos: [[plants/compressed|plants]]
- Campos DwC de ubicación: [[darwin-core-fields]]
- Sirve al mapa y filtros: [[public/compressed|public]]
- Tablas: [[db-tables-index]]
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
