# Lecciones Aprendidas

## Arquitectura

**API Gateway único simplifica el frontend**
Un solo `POST /api/service` elimina la necesidad de gestionar múltiples endpoints en el cliente.
El frontend solo necesita conocer el formato `{ service, data, token }` y una sola URL.

**Darwin Core vale la pena desde el inicio**
El estándar biológico Darwin Core impone ~60 campos en la tabla `plants`, pero garantiza
interoperabilidad con sistemas internacionales de biodiversidad (GBIF, etc.) sin migración posterior.

**Token en body, no en header**
Poner el JWT en `req.body.token` en lugar del header `Authorization: Bearer` simplifica el cliente
JavaScript pero rompe convenciones REST estándar. Documentar bien para que futuros devs no se confundan.

## Base de datos

**Soft delete en tablas principales es obligatorio**
`deleted_at` en `users` y `plants` permite recuperar datos borrados accidentalmente y mantiene
integridad referencial con `activity_logs`.

**FULLTEXT en MySQL**
El índice FULLTEXT en `scientific_name, common_name, vernacular_name, description` permite
búsquedas eficientes sin necesidad de Elasticsearch para este volumen de datos.

## Deploy

**Dokploy + Traefik**
El stack de deploy (Dokploy como orquestador + Traefik como reverse proxy) gestiona certificados
SSL automáticamente. La red `dokploy-network` es externa y debe existir antes de `docker compose up`.

## Auditoría de codebase (2026-05-30)

**El cerebro y el código se desincronizaron rápidamente — incluso en la misma sesión.**
En 24h de trabajo el brain tenía 8 errores concretos: puerto equivocado, conteo de servicios
incorrecto, módulo completo sin documentar (`public.*`), y una regla de seguridad invertida
(JWT en body vs header).

**Lección:** Un audit activo leyendo el código real es la única fuente de verdad.
La documentación inicial siempre tiene errores. Un audit periódico (cada 2-3 semanas
de trabajo activo) es más eficiente que intentar mantener el brain perfecto en tiempo real.

**Patrón de audit útil:** Leer `services/index.js`, `app.js`, `package.json`, y un controller
activo por módulo en paralelo. En 20 min se detectan el 80% de las discrepancias.

## Migración DwC (2026-05-30)

**El código y la BD pueden desincronizarse gradualmente sin que nadie lo note.**
`search.js` y `getById.js` ya usaban nombres DwC nuevos mientras `plantsController.js`
y `getAll.js` usaban nombres viejos — el sistema "funcionaba" porque algunos hacían SELECT *
o usaban aliases. La inconsistencia solo se detectó al documentar los 53 campos del Excel.

**Lección:** Al migrar nombres de columnas, actualizar TODOS los archivos en la misma sesión.
No dejar algunos con alias y otros con el nombre directo — es deuda que se acumula.

**Orden seguro para migrar columnas:**
1. Hacer backup de la BD
2. Ejecutar ALTER TABLE en dev
3. Actualizar código (crear, actualizar, buscar) en un solo commit
4. Probar localmente
5. Ejecutar ALTER TABLE en producción
6. Deployar el código

---
*Agregar lecciones con: contexto, aprendizaje, cómo aplicarlo.*


---

## Red de conexiones

- Decisiones: [[why-decisions]]
- Reglas formalizadas: [[universal-constraints]]
- Índice: [[DAIMUZ]]
