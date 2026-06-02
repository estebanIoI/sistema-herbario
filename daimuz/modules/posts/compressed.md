# posts — compressed

- **Qué hace:** ⚠️ MÓDULO ROTO — Blog/publicaciones del herbario. Los controladores EXISTEN en el código pero la tabla NO existe en la BD. Todas las operaciones fallan en runtime con "table 'herbario_heaa.posts' doesn't exist". 5 servicios registrados.
- **Tablas:** `posts` ❌ NO EXISTE en `herbario_heaa_actualizado.sql`
- **Endpoints:** `posts.getAll` · `posts.getById` · `posts.create` · `posts.update` · `posts.delete` (registrados en services/index.js pero todos fallan)
- **Archivos:** `controllers/posts/postsController.js` (existe) · `services/index.js` (5 entradas)
- **⚠️ Regla crítica:** NO usar en producción. Para activar este módulo: (1) Crear tabla `posts` en SQL con campos: id, title, content, author_id FK, status, featured, published_at, created_at, updated_at, deleted_at. (2) Ejecutar migración. (3) Verificar servicios. Ver [[bugs-history]] y [[universal-constraints]] (#10).

---

## Red de conexiones

- Bug activo: [[bugs-history]]
- Regla #10 (verificar tabla): [[universal-constraints]]
- Sprint pendiente: [[current-sprint]]
- Índice: [[modules-index]] · [[DAIMUZ]]
