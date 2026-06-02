# Índice de Tablas de Base de Datos

Base de datos: `herbario_heaa` · Motor: MySQL · Estándar: Darwin Core

## Tablas principales

| Tabla | Filas clave | Propósito |
|-------|-------------|-----------|
| `users` | id, email, password, role, status | Cuentas y autenticación |
| `plants` | id, scientific_name, catalog_number (UNIQUE), family, genus, specific_epithet | Catálogo botánico principal (53 campos DwC) |
| `plant_images` | id, plant_id, image_url, is_main, image_type | Imágenes por planta |
| `suggestions` | id, title, type, status, user_id, plant_id | Sugerencias de usuarios |
| `settings` | id, key_name, value, category, is_public | Configuración del sistema |
| `activity_logs` | id, user_id, action, entity_type, entity_id, metadata JSON | Auditoría de acciones |
| `uploads` | id, filename, file_path, file_hash, uploaded_by, expires_at | Archivos subidos |
| `pqrsdf` | id, radicado, tipo, nombre, email, mensaje, status | Peticiones ciudadanas |

> ⚠️ No existe tabla `posts` en el schema actual. El módulo posts está pendiente de implementar.

---

## Detalle: `users`
```
id · name · email (UNIQUE) · password (bcrypt)
role: ENUM('admin', 'user', 'collector')
status: ENUM('active', 'inactive', 'pending')
avatar_url · phone · institution · specialization · bio
email_verified · email_verification_token
password_reset_token · password_reset_expires
last_login · login_attempts · locked_until
created_at · updated_at · deleted_at (soft delete)
```

> 📋 Referencia completa de los 53 campos: [vault/darwin-core-fields.md](../vault/darwin-core-fields.md)

## Detalle: `plants` (Darwin Core — nombres actualizados)
```
-- Registro (cols 1-3 DwC)
id · occurrence_id · basis_of_record · record_type

-- Institución (cols 4-7)
institution_code · institution_id · collection_code · collection_id

-- Espécimen (cols 8-9)
catalog_number (UNIQUE) · record_number

-- Colección (cols 10-20)
recorded_by · organism_quantity · organism_quantity_type
life_stage · preparations · disposition · sampling_protocol
event_date · habitat · field_number · field_notes
additional_collectors · collector_user_id (FK users)

-- Ubicación (cols 21-31)
country · state_province · county · municipality · locality
minimum_elevation_in_meters
decimal_latitude · decimal_latitude_sexagesimal
decimal_longitude · decimal_longitude_sexagesimal
geodetic · coordinate_uncertainty · georeferenced_by

-- Identificación (cols 32-35)
identified_by · date_identified · updated_by · date_updated
determined_by · determination_date (campos legados equivalentes)

-- Taxonomía (cols 36-50)
scientific_name (NOT NULL) · scientific_name_authorship
common_name · vernacular_name
kingdom · phylum · class_name · order_name
family · subfamily · genus · subgenus
specific_epithet · infraspecific_epithet · taxon_rank · taxon_remarks
taxonomic_status

-- Registro digital (cols 51-52)
photo_record · project

-- Herbario / tipo
type_status

-- Ecología
substrate · associated_species · abundance · reproductive_state

-- Morfología
plant_habit · height_min · height_max · dbh · description
flower_color · fruit_color · leaf_characteristics · distinguishing_features

-- Uso y conservación
uses · care_instructions · conservation_status (IUCN ENUM)

-- Sistema
status: ENUM('draft','published','review','deleted')
featured BOOLEAN · views INT
created_by (FK) · reviewed_by · reviewed_at
observations · notes · additional_remarks · image_urls JSON
created_at · updated_at · deleted_at
```

⚠️ **Cambios de nombres v3.0 → v4.0 (DwC):**
| Anterior | Nuevo |
|----------|-------|
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

## Detalle: `plant_images`
```
id · plant_id (FK) · image_url · thumbnail_url
original_filename · caption
image_type: ENUM('habit','leaf','flower','fruit','bark','detail','habitat','herbarium_sheet','other')
is_main BOOLEAN · display_order · file_size
image_width · image_height · mime_type
photographer · photo_date · copyright_info
```

## Detalle: `suggestions`
```
id · title · description
type: ENUM('feature','bug','improvement','data_correction','new_plant')
status: ENUM('pending','in_review','approved','rejected','implemented')
priority: ENUM('low','medium','high','critical')
user_id (FK) · assigned_to (FK) · plant_id (FK)
attachments JSON · votes_up · votes_down
created_at · updated_at · resolved_at
```

## Detalle: `settings`
```
id · key_name VARCHAR(100) UNIQUE · value TEXT
type: ENUM('string','number','boolean','json','text')
category VARCHAR(50) — grupos: general, uploads, auth, display, search, pagina, cloudinary, contact
description TEXT · is_public BOOLEAN
created_at · updated_at
```
⚠️ Los campos son `key_name` y `value` (NO `setting_key` / `setting_value`).

## Detalle: `activity_logs`
```
id · user_id (FK) · action · entity_type · entity_id
description TEXT
ip_address · user_agent
metadata JSON  ← datos adicionales: login_at, session_duration_seconds, etc.
created_at
```
Acciones registradas: `login`, `logout`, `view_plant`, `plant_created`, `plant_status_changed`, `suggestion_created`
⚠️ No tiene `old_values`/`new_values` — usa `metadata JSON` y `description TEXT`.

## Detalle: `uploads`
```
id · filename · original_name · file_path · file_size · mime_type
file_hash VARCHAR(64)  ← MD5 para detectar duplicados
entity_type · entity_id
uploaded_by (FK)
is_temporary BOOLEAN
expires_at TIMESTAMP  ← para uploads temporales
created_at
```
⚠️ No tiene `deleted_at`. Los archivos temporales se limpian con `CALL cleanup_expired_uploads()`.

## Detalle: `pqrsdf`
```
id · radicado VARCHAR(30) UNIQUE  ← formato: PQRSDF-YYYYMMDD-XXXXX
tipo: ENUM('peticion','queja','reclamo','sugerencia','denuncia','felicitacion')
anonimo BOOLEAN
nombre · tipo_identificacion · numero_documento
direccion_correspondencia · medio_respuesta · telefono
pais · departamento · ciudad · email · fax
mensaje TEXT NOT NULL
archivo_url VARCHAR(500)
status: ENUM('pendiente','en_revision','respondido')
created_at · updated_at · responded_at
```
⚠️ Estructura completamente en español. No tiene `assigned_to` FK a users.

## Índices importantes (plants)
```
scientific_name, family, genus, specific_epithet, common_name, vernacular_name
status, state_province, municipality, recorded_by
event_date, created_at, catalog_number, featured, views
Compuestos: (status, featured), (family, status), (state_province, municipality), (created_at, status)
FULLTEXT: scientific_name, common_name, vernacular_name, description, habitat, uses
```

## Vistas SQL (views)
| Vista | Qué devuelve |
|-------|-------------|
| `stats_summary` | Conteos globales: total_plants, total_families, total_genera, total_users, total_images, total_views |
| `plants_with_main_image` | Plantas publicadas con imagen principal (JOIN optimizado para listados) |
| `featured_plants` | Plantas destacadas para la página de inicio |
| `recent_activity` | Últimas plantas y sugerencias creadas (últimos 30 días) |

## Triggers
| Trigger | Cuándo | Qué hace |
|---------|--------|----------|
| `plants_activity_insert` | INSERT en plants | Inserta en activity_logs con action='plant_created' |
| `plants_activity_update` | UPDATE en plants (si cambia status) | Inserta en activity_logs con action='plant_status_changed' |
| `suggestions_activity_insert` | INSERT en suggestions | Inserta en activity_logs con action='suggestion_created' |

## Stored Procedures
- `CALL cleanup_expired_uploads()` — elimina uploads temporales expirados
- `CALL get_stats_by_department()` — estadísticas de plantas agrupadas por departamento


---

## Red de conexiones

- Módulos: [[modules-index]]
- Reglas de BD: [[universal-constraints]] (#3, #2)
- Arquitectura: [[database]]
- Campos DwC: [[darwin-core-fields]]
- Índice: [[DAIMUZ]]
