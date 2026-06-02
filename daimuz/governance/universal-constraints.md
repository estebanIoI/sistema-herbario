# Restricciones Universales — Reglas que nunca se rompen

## 1. Un solo endpoint API

**Toda** llamada al backend usa `POST /api/service` con `{ service, data, token }`.
No crear nuevos endpoints REST tradicionales. Las únicas excepciones permitidas son:
- `POST /api/plantas/upload` (multipart no puede ir en JSON)
- `GET /api/media/plantas/:file` (sirve archivos)
- `GET /health` y `GET /info` (monitoring)

## 2. Darwin Core es la ley para plantas

La tabla `plants` sigue el estándar biológico Darwin Core. No renombrar ni eliminar campos
existentes del estándar. Nuevos campos descriptivos van al final, no sustituyen los existentes.
Referencia: https://dwc.tdwg.org/terms/

## 3. Soft delete obligatorio

Nunca `DELETE FROM plants WHERE id=?` ni `DELETE FROM users WHERE id=?`.
Siempre `UPDATE SET deleted_at = NOW()`. Las consultas de listado deben incluir `WHERE deleted_at IS NULL`.

## 4. Verificar rol antes de toda operación de escritura

- `admin`: todo
- `collector`: crear/editar plantas propias, sugerir
- `user`: leer, sugerir

Las operaciones de escritura en `plants`, `users`, `settings` verifican rol en el middleware.

## 5. Imágenes siempre en Cloudinary en producción

`NODE_ENV=production` → las imágenes van a Cloudinary (carpeta `herbario`).
`NODE_ENV=development` → puede usar almacenamiento local `/uploads/`.
No mezclar ambos en producción.

## 6. JWT — dos mecanismos según el contexto

`auth.js` exporta **dos funciones distintas**:

| Función | Dónde lee el token | Cuándo se usa |
|---------|-------------------|---------------|
| `authenticateToken` | `Authorization: Bearer <token>` (header HTTP) | Rutas directas Express (upload, media) |
| `authenticateTokenSync` | `req.body.token` (body JSON) | `serviceController.js` (API Gateway) |

El API Gateway (`POST /api/service`) lee `req.body.token` y llama `authenticateTokenSync`.
Las rutas directas usan `authenticateToken` middleware con el header estándar Bearer.

No mezclar: el frontend siempre debe enviar el token en `body.token` para llamadas al gateway,
y en el header `Authorization: Bearer` para rutas directas de archivos.

## 7. `catalog_number` debe ser único (Darwin Core: catalogNumber)

Antes de crear una planta, verificar que `catalog_number` no existe. Es el identificador físico
del espécimen en el herbario real — coincide con la etiqueta pegada en el exicado.
Los duplicados causan confusión en investigación y violan Darwin Core.

`plantsController.js` ya hace esta verificación antes de cada INSERT.

## 8. Variables de entorno sensibles nunca en el código

`JWT_SECRET`, `DB_PASSWORD`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_API_KEY` van SOLO en `.env`.
El archivo `.env` nunca se commitea al repositorio git.

## 9. Usar nombres de columna Darwin Core en todo el código

La tabla `plants` usa nombres DwC estándar en snake_case. Nunca usar los nombres viejos.
Ver el mapeo completo en [vault/darwin-core-fields.md](../vault/darwin-core-fields.md).

Columnas críticas donde el cambio rompe si se usa el nombre viejo:
- `catalog_number` (no `herbarium_number`)
- `specific_epithet` (no `species`)
- `scientific_name_authorship` (no `author`)
- `recorded_by` (no `collector_name`)
- `record_number` (no `collector_number`)
- `event_date` (no `collection_date`)
- `state_province` (no `department`)
- `locality` (no `specific_location`)
- `decimal_latitude` / `decimal_longitude` (no `latitude` / `longitude`)
- `minimum_elevation_in_meters` (no `altitude`)
- `plant_habit` (no `habit`)
- `preparations` (no `preparation`)
- `geodetic` (no `geodetic_datum`)

## 10. Verificar que la tabla existe antes de implementar un módulo

El módulo `posts` tiene controladores en el backend pero **no tiene tabla en el schema SQL**.
Antes de implementar un módulo nuevo o continuar uno incompleto, confirmar que la tabla
existe en `herbario_heaa_actualizado.sql`. Si no existe, crear la migración primero.

---

## Red de conexiones — Módulos que gobiernan estas reglas

| Regla | Módulos afectados |
|---|---|
| #1 Un solo endpoint | [[auth/compressed\|auth]], [[plants/compressed\|plants]], todos los módulos |
| #2 Darwin Core | [[plants/compressed\|plants]] · [[darwin-core-fields]] |
| #3 Soft delete | [[plants/compressed\|plants]] · [[users/compressed\|users]] · [[db-tables-index]] |
| #4 Roles | [[auth/compressed\|auth]] · [[auth-flow]] · todos los controladores |
| #5 Cloudinary | [[plant-upload-flow]] · [[integrations]] |
| #6 JWT dual | [[auth/compressed\|auth]] · [[auth-flow]] · [[backend]] |
| #7 catalog_number único | [[plants/compressed\|plants]] |
| #9 Nombres DwC | [[plants/compressed\|plants]] · [[darwin-core-fields]] |
| #10 Verificar tabla | [[modules-index]] → módulo `posts` ⚠️ |

- Decisiones explicadas: [[why-decisions]]
- Protocolo de actualización: [[update-protocol]]
- Identidad del sistema: [[DAIMUZ]]
