# ADR: Migración de columnas a nombres Darwin Core

**Fecha**: 2026-05-30  
**Estado**: Código migrado · BD de producción pendiente  
**Contexto**: [vault/darwin-core-fields.md](../vault/darwin-core-fields.md)

---

## Decisión

Renombrar 16 columnas de la tabla `plants` para que coincidan exactamente con los
nombres del estándar Darwin Core (en snake_case). El trigger fue la documentación del
Excel `BD_Gral_HEAA` con 53 columnas DwC que necesitaba alinearse con el sistema.

## Por qué se hizo

- El Excel `BD_Gral_HEAA` ya usa nombres DwC (catalogNumber, recordedBy, eventDate, etc.)
- `create.js` (inactivo) y `search.js` ya usaban los nombres nuevos — la BD era lo inconsistente
- Alineación facilita la futura exportación a GBIF / SiB Colombia sin transformaciones
- Los nombres viejos (`species`, `author`, `department`) son semánticamente incorrectos en DwC

## Mapeo de columnas renombradas

| Nombre viejo | Nombre nuevo (DwC) |
|---|---|
| `herbarium_number` | `catalog_number` |
| `species` | `specific_epithet` |
| `author` | `scientific_name_authorship` |
| `collector_name` | `recorded_by` |
| `collector_number` | `record_number` |
| `collection_date` | `event_date` |
| `department` | `state_province` |
| `specific_location` | `locality` |
| `altitude` | `minimum_elevation_in_meters` |
| `latitude` | `decimal_latitude` |
| `longitude` | `decimal_longitude` |
| `latitude_sexagesimal` | `decimal_latitude_sexagesimal` |
| `longitude_sexagesimal` | `decimal_longitude_sexagesimal` |
| `preparation` | `preparations` |
| `habit` | `plant_habit` |
| `geodetic_datum` | `geodetic` |

---

## Script de migración para producción

Ejecutar en la BD de producción (`herbario_heaa`) **antes de deployar el nuevo código**:

```sql
-- ============================================================
-- MIGRACIÓN: Columnas de plants a nombres Darwin Core
-- Fecha: 2026-05-30
-- Ejecutar ANTES de actualizar el código en producción
-- ============================================================

USE herbario_heaa;

-- Hacer backup primero
-- mysqldump -u root -p herbario_heaa plants > plants_backup_$(date +%Y%m%d).sql

ALTER TABLE plants
  RENAME COLUMN herbarium_number         TO catalog_number,
  RENAME COLUMN species                  TO specific_epithet,
  RENAME COLUMN author                   TO scientific_name_authorship,
  RENAME COLUMN collector_name           TO recorded_by,
  RENAME COLUMN collector_number         TO record_number,
  RENAME COLUMN collection_date          TO event_date,
  RENAME COLUMN department               TO state_province,
  RENAME COLUMN specific_location        TO locality,
  RENAME COLUMN altitude                 TO minimum_elevation_in_meters,
  RENAME COLUMN latitude                 TO decimal_latitude,
  RENAME COLUMN longitude                TO decimal_longitude,
  RENAME COLUMN latitude_sexagesimal     TO decimal_latitude_sexagesimal,
  RENAME COLUMN longitude_sexagesimal    TO decimal_longitude_sexagesimal,
  RENAME COLUMN preparation              TO preparations,
  RENAME COLUMN habit                    TO plant_habit,
  RENAME COLUMN geodetic_datum           TO geodetic;

-- Verificar el cambio
DESCRIBE plants;

-- Verificar que los índices siguen funcionando
EXPLAIN SELECT * FROM plants WHERE catalog_number = 'HEAA-001';
EXPLAIN SELECT * FROM plants WHERE state_province = 'Putumayo';
EXPLAIN SELECT * FROM plants WHERE recorded_by LIKE '%Orejuela%';
```

> **Nota:** `RENAME COLUMN` requiere MySQL 8.0+. En versiones anteriores usar `CHANGE COLUMN`.

### Para MySQL < 8.0 (MariaDB 10.5+):
```sql
-- Usar CHANGE COLUMN en su lugar (especificar tipo completo)
ALTER TABLE plants
  CHANGE COLUMN herbarium_number    catalog_number           VARCHAR(50) UNIQUE,
  CHANGE COLUMN species             specific_epithet         VARCHAR(100),
  CHANGE COLUMN author              scientific_name_authorship VARCHAR(200),
  CHANGE COLUMN collector_name      recorded_by              VARCHAR(200),
  CHANGE COLUMN collector_number    record_number            VARCHAR(50),
  CHANGE COLUMN collection_date     event_date               DATE,
  CHANGE COLUMN department          state_province           VARCHAR(100),
  CHANGE COLUMN specific_location   locality                 TEXT,
  CHANGE COLUMN altitude            minimum_elevation_in_meters INT,
  CHANGE COLUMN latitude            decimal_latitude         DECIMAL(10,8),
  CHANGE COLUMN longitude           decimal_longitude        DECIMAL(11,8),
  CHANGE COLUMN latitude_sexagesimal  decimal_latitude_sexagesimal  VARCHAR(50),
  CHANGE COLUMN longitude_sexagesimal decimal_longitude_sexagesimal VARCHAR(50),
  CHANGE COLUMN preparation         preparations             VARCHAR(100),
  CHANGE COLUMN habit               plant_habit              VARCHAR(100),
  CHANGE COLUMN geodetic_datum      geodetic                 VARCHAR(20);
```

### Actualizar vistas después de la migración

```sql
-- Recrear vistas que referencian columnas renombradas
DROP VIEW IF EXISTS plants_with_main_image;
DROP VIEW IF EXISTS featured_plants;
DROP VIEW IF EXISTS recent_activity;
DROP VIEW IF EXISTS stats_summary;

-- Luego reimportar las vistas del archivo herbario_heaa_actualizado.sql
-- (ya están actualizadas en el archivo)
```

---

## Archivos de código actualizados (no requieren más cambios)

| Archivo | Qué cambió |
|---------|-----------|
| `backend/herbario_heaa_actualizado.sql` | CREATE TABLE con nuevos nombres |
| `backend/src/controllers/plants/plantsController.js` | INSERT, destructuring, VALID_COLUMNS, respuestas |
| `backend/src/controllers/plants/getAll.js` | SELECT y WHERE |
| `backend/src/controllers/plants/getForMap.js` | SELECT y WHERE |
| `frontend/app/admin/plantas/nueva/page.tsx` | `prepareCommonData()` |

## Archivos que YA usaban los nuevos nombres (estaban adelantados)

- `backend/src/controllers/plants/search.js`
- `backend/src/controllers/plants/getById.js` (usa `SELECT *` — OK automáticamente)
- `backend/src/controllers/plants/create.js` (inactivo, pero correcto)

## ⚠️ Archivos PENDIENTES de migrar (auditados 2026-05-31)

| Archivo | Columnas viejas que usa | Servicios afectados |
|---------|------------------------|---------------------|
| `controllers/dashboard/getStats.js` | `department`, `collector_name`, `altitude` | `dashboard.getStats` |
| `controllers/dashboard/dashboardController.js` | `department` (getPlantsByLocation), `collector_name` (getTopCollectors) | `dashboard.getPlantsByLocation`, `dashboard.getTopCollectors` |
| `controllers/plants/locationsController.js` | `department`, `specific_location`, `altitude`, `latitude`, `longitude` | todos los `locations.*` |
| `controllers/plants/taxonomyController.js` | `species` | `taxonomy.getSpeciesByGenus` |
| `frontend/app/admin/plantas/[id]/editar/page.tsx` | JSX usa nombres viejos; estado DwC ya es correcto | formulario de edición (7 campos vacíos) |
| `frontend/app/admin/plantas/page.tsx` | DWC_FIELD_MAP + interface + render con nombres viejos | lista de plantas admin (columnas vacías) |


---

## Red de conexiones

- Campos: [[darwin-core-fields]]
- Módulo afectado: [[plants/compressed|plants]]
- Estado: [[current-state]]
- Índice: [[DAIMUZ]]
