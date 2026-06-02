# Por qué existen estas reglas

## Por qué un solo endpoint (`/api/service`)

**Problema que resuelve:** Múltiples endpoints REST requieren routing complejo en el cliente,
gestión de URLs por ambiente, y hacen crecer la superficie de API con cada nueva operación.

**La solución:** Un único endpoint actúa como dispatcher. El `serviceController.js` recibe
el nombre del servicio, lo busca en el registro de `services/index.js`, y delega.
Resultado: el frontend solo conoce una URL y el formato `{ service, data, token }`.

**Trade-off aceptado:** No es REST puro (todo es POST). Se pierde cacheabilidad HTTP por GET.
Pero para un sistema de backoffice de herbario con datos botánicos, esto es aceptable.

## Por qué Darwin Core

**Problema que resuelve:** Los sistemas de biodiversidad globales (GBIF, iDigBio, BOLD) usan
Darwin Core como estándar de intercambio. Sin él, exportar datos requiere transformación manual.

**La solución:** Usar los nombres de campo exactos del estándar desde el inicio.
`occurrence_id`, `basis_of_record`, `collector_name`, `habitat`, etc.

**Beneficio:** Los datos del HEAA pueden publicarse en portales internacionales de biodiversidad
sin transformaciones complejas.

## Por qué JWT en body y no en header

**Contexto histórico:** El API Gateway procesa todo en el body JSON. Mover el token al header
`Authorization` habría requerido lógica especial para extraerlo en el gateway sin romper
el patrón `{ service, data, token }`.

**Consecuencia:** Es no-estándar. Cualquier nuevo developer debe leer la documentación para
entenderlo. Por eso está documentado como regla en `universal-constraints.md`.

## Por qué Dokploy + Traefik

**Contexto:** Deploy en servidor VPS propio. Se necesitaba SSL automático, routing por dominio,
y orquestación de contenedores Docker sin la complejidad de Kubernetes.

**La solución:** Dokploy gestiona el ciclo de vida de los servicios (similar a Railway/Render
pero self-hosted). Traefik maneja el routing y los certificados Let's Encrypt automáticamente.

## Por qué soft delete (`deleted_at`) y no DELETE

**Problema que resuelve:** Un DELETE físico es irreversible. En un herbario, un espécimen
"eliminado por error" puede representar años de trabajo de campo perdido permanentemente.

**La solución:** `UPDATE SET deleted_at = NOW()`. El registro sigue existiendo en la BD.
Toda consulta de listado agrega `WHERE deleted_at IS NULL`. La papelera se puede vaciar
con un proceso controlado si la BD crece demasiado.

**Regla de implementación:** Nunca `DELETE FROM plants` ni `DELETE FROM users`.
Las tablas de logs y referencias intermedias pueden usar DELETE físico.

---

## Por qué Cloudinary para imágenes y no almacenamiento local

**Problema que resuelve:** El almacenamiento local en VPS no escala, no tiene CDN,
y se pierde en caso de migración del servidor. Un herbario puede tener miles de imágenes
de alta resolución de especímenes.

**La solución:** Cloudinary gestiona el almacenamiento, optimización y entrega via CDN.
En desarrollo se usa local (`/uploads/`) para no consumir el plan gratuito.

**Consecuencia:** En producción, `NODE_ENV=production` activa la ruta a Cloudinary.
`NODE_ENV=development` usa almacenamiento local. No mezclar en producción.

---

## Por qué MySQL y no PostgreSQL

**Contexto del proyecto:** El Instituto Tecnológico del Putumayo tiene infraestructura y
conocimiento previo en MySQL. La familiaridad del equipo con MySQL fue determinante.
Darwin Core no impone motor de BD específico.


---

## Red de conexiones

- Reglas explicadas: [[universal-constraints]]
- Decisiones formales: [[api-gateway]] · [[decisions/darwin-core|darwin-core]]
- Protocolo: [[update-protocol]]
- Índice: [[DAIMUZ]]
