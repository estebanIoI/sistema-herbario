# Backlog Priorizado

## 🔴 Urgente — Migración de BD en producción

- [ ] **Ejecutar migración SQL en producción** — el código ya usa los nuevos nombres DwC pero la BD en producción todavía tiene los nombres viejos. Ver script en [decisions/darwin-core-migration.md](../decisions/darwin-core-migration.md)

## 🔴 Urgente — Migración DwC incompleta en código (auditada 2026-06-01)

- [ ] **`controllers/dashboard/getStats.js`** — `department`→`state_province`, `collector_name`→`recorded_by`, `altitude`→`minimum_elevation_in_meters`
- [ ] **`controllers/dashboard/dashboardController.js`** — `getPlantsByLocation`: `department`→`state_province`; `getTopCollectors`: `collector_name`→`recorded_by`
- [ ] **`controllers/plants/locationsController.js`** — todo el archivo: `department`→`state_province`, `specific_location`→`locality`, `altitude`→`minimum_elevation_in_meters`, `latitude`→`decimal_latitude`, `longitude`→`decimal_longitude`
- [ ] **`controllers/plants/taxonomyController.js`** — `getSpeciesByGenus`: `species`→`specific_epithet`
- [ ] **`frontend/app/admin/plantas/[id]/editar/page.tsx`** — JSX 7 campos: `herbarium_number`→`catalog_number`, `department`→`state_province`, `specific_location`→`locality`, `altitude`→`minimum_elevation_in_meters`, `latitude`→`decimal_latitude`, `longitude`→`decimal_longitude`, `collection_date`→`event_date`
- [ ] **`frontend/app/admin/plantas/page.tsx`** — `DWC_FIELD_MAP` + interface + render: todos los nombres viejos

## Alta prioridad

- [ ] Sistema completo de subida de archivos (actualmente parcial)
- [ ] Tests unitarios e integración (`backend/tests/` existe pero vacío)
- [ ] Conectar Redis como caché real (está en Docker, el backend usa node-cache)

## Media prioridad

- [ ] Exportación de datos (CSV, JSON, Darwin Core XML)
- [ ] Importación masiva de plantas (CSV)
- [ ] Documentación Swagger automática
- [ ] Notificaciones en tiempo real via Socket.io — ⚠️ `sockets/orderSocket.js` contiene código de un proyecto anterior (gestión de órdenes, no herbario). Requiere reescribir los eventos para el dominio botánico antes de usar.

## Baja prioridad

- [ ] Módulo PQRSDF completo (estructura existe)
- [ ] Módulo Posts/Blog completo (estructura existe)
- [ ] Cache con Redis (ahora usa node-cache)
- [ ] Optimización de consultas con índices adicionales

## Ideas / Futuro

- [ ] Integración con GBIF para publicar registros Darwin Core
- [ ] API pública de lectura para investigadores
- [ ] App móvil para colecta en campo (offline-first)
- [ ] Reconocimiento de plantas por imagen (ML)
- [ ] Exportación a formato DarwinCore Archive (.zip)

---
*Reordenar prioridades según contexto del sprint actual en current-sprint.md*


---

## Red de conexiones

- Estado: [[current-state]]
- Bugs: [[bugs-history]]
- Sprint: [[current-sprint]]
- Índice: [[DAIMUZ]]
