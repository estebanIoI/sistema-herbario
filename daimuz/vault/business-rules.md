# Reglas de Negocio por Módulo

## Plantas

- Una planta en `status='draft'` NO aparece en el catálogo público (`/plantas`)
- Una planta en `status='review'` es visible solo para admin y collectors
- Solo `status='published'` es público
- `catalog_number` (DwC: catalogNumber) es el identificador físico único — corresponde a la etiqueta del exicado. Se valida antes de cada INSERT en `plantsController.js`
- `scientific_name` es NOT NULL en BD — único campo realmente obligatorio para guardar
- Una planta "borrada" tiene `status='deleted'` (soft delete via status, no via `deleted_at`)
- El contador `views` se incrementa en cada `getById` para plantas publicadas
- Campos obligatorios para **publicar** (no solo guardar como draft): `catalog_number`, `scientific_name`, `family`, `genus`, `specific_epithet`, `recorded_by`, `event_date`, `state_province`, `county`

## Usuarios

- Un usuario con `status='pending'` no puede hacer login (debe ser activado por admin)
- Un usuario con `status='inactive'` no puede hacer login
- ⚠️ El bloqueo por `login_attempts >= 5` **NO está implementado** en `login.js` — el campo existe en la tabla pero el código actual no lo actualiza
- Un usuario no puede cambiar su propio rol
- Solo `admin` puede eliminar usuarios (soft delete via `deleted_at`)
- La contraseña siempre se guarda con bcrypt rounds=12 (nunca en texto plano)
- JWT payload: `{ id, email, role }` — no incluye `name` ni otros campos

## Sugerencias

- Toda sugerencia nueva inicia en `status='pending'`
- Solo `admin` puede cambiar status a `approved` o `rejected`
- Una sugerencia aprobada no se borra, cambia a `status='approved'`
- `countUnread` cuenta las que están en `status='pending'`

## Imágenes de plantas

- Solo una imagen puede ser `is_main=true` por planta
- Al establecer una imagen como principal (`setMainImage`), las demás se ponen en `is_main=false`
- El tamaño máximo de archivo es 10MB
- Tipos MIME permitidos: image/jpeg, image/png, image/webp

## Settings

- Settings con `is_public=false` solo son accesibles con rol `admin`
- `settings.getPublic` no requiere autenticación y solo devuelve `is_public=true`

## Roles y jerarquía

```
admin > collector > user > (sin autenticación)
```

| Operación | Sin auth | user | collector | admin |
|-----------|----------|------|-----------|-------|
| Ver catálogo public | ✅ | ✅ | ✅ | ✅ |
| Ver detalle planta | ✅ | ✅ | ✅ | ✅ |
| Crear planta | ❌ | ❌ | ✅ | ✅ |
| Editar planta | ❌ | ❌ | ✅ (propia) | ✅ |
| Eliminar planta | ❌ | ❌ | ❌ | ✅ |
| Crear sugerencia | ❌ | ✅ | ✅ | ✅ |
| Aprobar sugerencia | ❌ | ❌ | ❌ | ✅ |
| Ver todos los usuarios | ❌ | ❌ | ❌ | ✅ |
| Cambiar roles | ❌ | ❌ | ❌ | ✅ |
| Ver dashboard completo | ❌ | ❌ | ❌ | ✅ |
| Modificar settings | ❌ | ❌ | ❌ | ✅ |


---

## Red de conexiones

- Formalizadas en: [[universal-constraints]]
- Por qué: [[why-decisions]]
- Módulos: [[modules-index]]
- Índice: [[DAIMUZ]]
