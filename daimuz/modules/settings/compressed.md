# settings — compressed

- **Qué hace:** Configuración clave-valor del sistema. Públicas (nombre del herbario, descripción, colores) y privadas (credenciales Cloudinary). 8 servicios.
- **Tablas:** `settings` — columnas: `key_name` VARCHAR UNIQUE · `value` TEXT · `category` · `is_public` BOOLEAN ⚠️ NO son `setting_key`/`setting_value`
- **Endpoints:** `settings.getPublic` (sin auth) · `settings.getAll` · `settings.get` · `settings.update` · `settings.updateMultiple` · `settings.backup` · `settings.restore` · `settings.testCloudinary` · `settings.getSystemInfo`
- **Archivos:** `controllers/settings/settingsController.js` · `controllers/settings/getPublic.js` · `frontend/app/admin/configuracion/page.tsx`
- **⚠️ Regla crítica:** `settings.getPublic` es el ÚNICO servicio de settings sin token. Nunca exponer settings con `is_public=false` sin auth admin. Categorías de settings: general, uploads, auth, display, search, pagina, cloudinary, contact.
- **⚠️ Formato de `getPublic`:** Devuelve `{ ...flat_camelCase, _sections: {contact:{}, features:{}, general:{}, pagina:{}} }`. Las keys planas son strings/booleans/numbers camelCase. `_sections` es un objeto anidado — **NUNCA intentar renderizar `_sections` directamente en React** → crash "Objects are not valid as a React child". Para el frontend admin usar `settings.getAll` que devuelve array plano `[{id, key_name, value, type, category, description, is_public}]`.
- **`admin/configuracion/page.tsx`** usa `getAllSettings()` (no `getPublicSettings()`), agrupa por `category` en cliente, renderiza como cards por categoría. Fix aplicado 2026-06-01.

---

## Red de conexiones

- Cloudinary: [[integrations]] · [[universal-constraints]] (#5, #8)
- Mapa de roles: [[roles-map]] → solo admin puede modificar
- Tablas: [[db-tables-index]]
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
