# Fixes Críticos Resueltos

*Fixes que NUNCA deben revertirse. Si ves algo de esta lista "arreglado de vuelta", es un regreso al error.*

---

## [2026-05-30] Migración completa a nombres Darwin Core
**Problema:** El código tenía nombres de columna inventados (`herbarium_number`, `species`, `collector_name`, `collection_date`, `department`). Violaba el estándar internacional DwC y generaba confusión con investigadores.
**Fix:** Renombradas todas las columnas de `plants` a sus equivalentes DwC oficiales. Código backend y frontend actualizado. Script SQL en [[darwin-core-migration]].
**Por qué no revertir:** La BD de producción tiene los nombres viejos aún → la migración SQL pendiente la sincronizará. Revertir el código rompería la coherencia con el script de migración preparado.
**Columnas clave:** `catalog_number`, `specific_epithet`, `scientific_name_authorship`, `recorded_by`, `record_number`, `event_date`, `state_province`, `locality`, `decimal_latitude`, `decimal_longitude`, `minimum_elevation_in_meters`, `plant_habit`, `preparations`, `geodetic`

## [2026-05-30] Eliminación de tabla suggestion_comments (v3.0)
**Problema:** La tabla `suggestion_comments` existía pero complicaba la arquitectura. Se decidió manejar comentarios/adjuntos con columna JSON dentro de `suggestions`.
**Fix:** Tabla eliminada del schema. El módulo `suggestions` usa `attachments JSON`.
**Por qué no revertir:** El schema actualizado no la tiene. Re-crearla requeriría migración y cambios en todos los controladores de sugerencias.
**Cuidado:** `suggestions.addComment` puede estar apuntando a la tabla vieja → ver [[bugs-history]].

## [2026-05-30] settings usa key_name/value (no setting_key/setting_value)
**Problema:** El nombre real de las columnas de la tabla `settings` no era obvio.
**Fix:** Confirmado que las columnas son `key_name` y `value` (no `setting_key` / `setting_value`).
**Por qué no revertir:** Cualquier query que use los nombres alternativos fallará en runtime con "Unknown column".

## [2026-05-30] Solo usar mysql2, no mysql legacy
**Problema:** Ambas librerías `mysql` (v2) y `mysql2` estaban instaladas. Mezclarlas causa comportamientos inesperados.
**Fix:** Todo el código usa `mysql2/promise`. La librería `mysql` está instalada como dependencia transitiva pero no se usa directamente.
**Por qué no revertir:** `mysql2` es la única que soporta promises nativas. Usar `mysql` requeriría callbacks o wrappers adicionales.


---

## Red de conexiones

- Bugs: [[bugs-history]]
- Reglas preventivas: [[universal-constraints]]
- Índice: [[DAIMUZ]]
