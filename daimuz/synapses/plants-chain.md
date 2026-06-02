# Cadena de impacto — Cambios en Plants

> Documento de sinapsis: describe qué módulos y archivos se afectan cuando cambia algo en `plants`.
> Para cambios en `auth` → ver [[auth/compressed|auth · compressed]] sección de ⚠️ Reglas críticas.

> Si modifico algo en el módulo `plants`, ¿qué más se afecta?

## Si cambio la estructura de la tabla `plants`

| Cambio | Impacto | Archivos a tocar |
|--------|---------|-----------------|
| Agregar columna DwC | INSERT en `plantsController.js`, `prepareCommonData` en `nueva/page.tsx`, form state en `editar/page.tsx`, `VALID_COLUMNS` en update | 4+ archivos |
| Renombrar columna | WHERE/SELECT en `getAll.js`, `getForMap.js`, `search.js`, `getById.js`, INSERT/values en `plantsController.js`, `VALID_COLUMNS`, `nueva/page.tsx`, `editar/page.tsx` + migración SQL | 8+ archivos |
| Eliminar columna | Verificar que no está en `VALID_COLUMNS`, ni en formularios frontend. Migración SQL DROP COLUMN. | — |
| Cambiar ENUM | Actualizar `ENUM_ALLOWED` en update, actualizar Select en formularios | 3+ archivos |

> ⚠️ El activo es `plantsController.js#create`, **no** `create.js` (que está marcado como inactivo).

## Si cambio `plants.getAll`

- Afecta: `frontend/app/plantas/page.tsx` (catálogo público)
- Afecta: `frontend/app/admin/plantas/page.tsx` (listado admin)
- Verifica: que la paginación sigue funcionando (`limit`, `offset`)
- Verifica: que los filtros de búsqueda siguen funcionando

## Si cambio el sistema de imágenes

- Afecta: `plant_images` (tabla)
- Afecta: `plants.getById` (incluye imágenes en la respuesta)
- Afecta: `frontend/app/plantas/[id]/page.tsx` (galería de imágenes)
- Afecta: `POST /api/plantas/upload` (ruta directa)
- Afecta: `Cloudinary` (si cambias la estructura de carpetas)

## Si cambio el sistema de roles (auth)

- Afecta: TODOS los controladores que verifican `user.role`
- Afecta: `frontend/app/admin/layout.tsx` (verificación de acceso admin)
- Afecta: `middleware/auth.js`

## Si cambio `catalog_number` de UNIQUE a no-UNIQUE

- **No hacerlo.** Es el identificador físico del espécimen (Darwin Core: catalogNumber).
- Si se necesita un segundo identificador, agregar un campo alternativo.
- `plantsController.js` verifica unicidad antes de cada INSERT — ese check también debe actualizarse.

## Si cambio el status de plants (ENUM)

- Afecta: `getAll.js` (filtro por status)
- Afecta: `frontend/app/plantas/page.tsx` (solo muestra 'published')
- Afecta: `dashboard.getStats` (cuenta por status)
- Afecta: formularios de edición en admin

---

## Red de conexiones

- Módulo fuente de esta sinapsis: [[plants/compressed|plants · compressed]]
- Flujo de creación con imagen: [[plant-upload-flow]]
- Módulo auth (roles): [[auth/compressed|auth · compressed]]
- Frontend afectado: [[frontend]]
- Reglas de base de datos: [[universal-constraints]] (reglas #2, #3, #7, #9)
- Referencia de campos: [[darwin-core-fields]]
- Dashboard afectado: [[modules-index]] → módulo `dashboard`
- Identidad del sistema: [[DAIMUZ]]
