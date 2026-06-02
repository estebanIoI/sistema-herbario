# Arquitectura de Base de Datos

## Motor y conexión
- **Motor**: MySQL 8+
- **Driver**: mysql2/promise (pool de conexiones)
- **Sin ORM**: queries SQL nativas en los controladores
- **Schema inicial**: `backend/herbario_heaa_actualizado.sql`

## Principios de diseño

1. **Darwin Core**: La tabla `plants` implementa el estándar biológico internacional
2. **Soft delete**: Tablas principales usan `deleted_at` (nunca DELETE)
3. **Auditoría**: `activity_logs` registra todas las acciones importantes
4. **Índices**: FULLTEXT para búsqueda de texto, índices simples para filtros frecuentes

## Relaciones principales

```
users
  │
  ├── plants.created_by → users.id
  ├── plants.collector_user_id → users.id
  ├── plant_images (via plants)
  ├── suggestions.user_id → users.id
  ├── suggestions.assigned_to → users.id
  ├── activity_logs.user_id → users.id
  └── uploads.uploaded_by → users.id

plants
  └── plant_images.plant_id → plants.id (CASCADE DELETE)
```

> ⚠️ No hay tabla `posts`. El módulo blog está pendiente de implementar con su migración SQL.

## Convenciones de queries (nombres DwC actualizados)

```sql
-- Listado estándar (filtrar status, nunca deleted_at en plants pues usa status='deleted')
SELECT id, catalog_number, scientific_name, specific_epithet,
       state_province, municipality, recorded_by, event_date,
       decimal_latitude, decimal_longitude, plant_habit
FROM plants
WHERE status = 'published'
ORDER BY created_at DESC LIMIT ? OFFSET ?

-- Búsqueda FULLTEXT (índice incluye: scientific_name, common_name, vernacular_name, description, habitat, uses)
SELECT * FROM plants
WHERE status != 'deleted'
  AND MATCH(scientific_name, common_name, vernacular_name, description, habitat, uses)
      AGAINST(? IN BOOLEAN MODE)

-- Soft delete (plants usa status='deleted', no deleted_at)
UPDATE plants SET status = 'deleted' WHERE id = ?

-- Joins con imagen principal
SELECT p.id, p.catalog_number, p.scientific_name, p.specific_epithet,
       p.state_province, p.recorded_by, p.event_date,
       COALESCE(pi.image_url, '/placeholder.svg') AS main_image
FROM plants p
LEFT JOIN plant_images pi ON pi.plant_id = p.id AND pi.is_main = 1
WHERE p.status = 'published'

-- Verificar unicidad de catalog_number antes de INSERT
SELECT id, status FROM plants WHERE catalog_number = ?
```

## Configuración de conexión

Variables de entorno:
```
DB_HOST=localhost (dev) | db (docker)
DB_PORT=3306
DB_USER=herbario_user
DB_PASSWORD=***
DB_NAME=herbario_heaa
```


---

## Red de conexiones

- Campos DwC: [[darwin-core-fields]] · [[universal-constraints]] (#2, #9)
- Módulo principal: [[plants/compressed|plants]]
- Índice de tablas: [[db-tables-index]]
- Complementaria: [[backend]] · [[deployment]]
- Identidad: [[DAIMUZ]]
