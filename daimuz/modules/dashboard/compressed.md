# dashboard — compressed

- **Qué hace:** Estadísticas y métricas del sistema para el panel admin. Solo lectura (SELECT/COUNT/SUM). Agrega datos de plantas, usuarios, actividad y salud del sistema. 8 servicios.
- **Tablas:** `plants` · `users` · `activity_logs` · `suggestions` (solo SELECT, sin escrituras) · vista `stats_summary`
- **Endpoints:** `dashboard.getStats` · `dashboard.getVisitorsChart` · `dashboard.getPlantsByFamily` · `dashboard.getPlantsByLocation` · `dashboard.getRecentActivity` · `dashboard.getTopCollectors` · `dashboard.getSystemHealth` · `dashboard.getStorageInfo`
- **Archivos:** `controllers/dashboard/dashboardController.js` · `controllers/dashboard/getStats.js` · `frontend/app/admin/page.tsx` · `frontend/app/admin/estadisticas/page.tsx`
- **⚠️ Regla crítica:** `getVisitorsChart` puede aparecer vacío si no hay registros `action='view_plant'` en `activity_logs`. No confundir con `public.getStats` — son servicios separados con distintos niveles de acceso.
- **🔴 Migración DwC pendiente — auditado 2026-06-01:**
  - `getStats.js` (`dashboard.getStats`): usa `department`→debe ser `state_province`; `collector_name`→`recorded_by`; `altitude`→`minimum_elevation_in_meters`
  - `dashboardController.js` (`dashboard.getPlantsByLocation`): usa `department`→`state_province`; (`dashboard.getTopCollectors`): usa `collector_name`→`recorded_by`
  - Mientras no se corrijan estos archivos, esas distribuciones del dashboard devuelven vacío en producción

---

## Red de conexiones

- Datos que consume: [[plants/compressed|plants]] · [[users/compressed|users]] · [[suggestions/compressed|suggestions]]
- Tablas: [[db-tables-index]]
- Roles que acceden: [[roles-map]] → admin (completo), collector (limitado)
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
