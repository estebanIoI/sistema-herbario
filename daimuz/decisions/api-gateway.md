# ADR: API Gateway único con POST /api/service

**Fecha**: Al inicio del proyecto
**Estado**: Implementado y en uso

## Decisión

Toda la comunicación cliente-servidor usa un único endpoint:
`POST /api/service` con payload `{ service: "modulo.accion", data: {}, token: "" }`

## Contexto

Se necesitaba una API para un sistema con 100+ operaciones diferentes, sin experiencia
previa de equipo con arquitecturas REST complejas, y con la prioridad de que el frontend
fuera fácil de mantener.

## Opciones consideradas

1. **REST tradicional** (múltiples endpoints): `/api/plants`, `/api/users`, etc.
2. **GraphQL**: esquema tipado, queries flexibles
3. **API Gateway JSON-RPC** (elegida): un endpoint, identificador de operación en body

## Por qué se eligió esta opción

- **Simplicidad en el cliente**: una sola URL, un solo patrón de llamada
- **Facilidad de agregar operaciones**: solo registrar en `services/index.js`
- **No requiere cliente especial**: fetch estándar con JSON
- **Curva de aprendizaje baja**: el equipo conocía Express, no GraphQL

## Trade-offs aceptados

- No es REST puro (todo es POST, no hay semántica HTTP GET/PUT/DELETE)
- No aprovecha caché HTTP (GET sería cacheable, POST no)
- La API no es auto-documentable por convención (requiere documentar services/index.js)

## Excepciones a la regla

Las excepciones están justificadas por limitaciones técnicas, no por preferencia:
- `POST /api/plantas/upload`: multipart/form-data no puede ir en el mismo body JSON
- `GET /api/media/plantas/:file`: los archivos se sirven via GET por naturaleza HTTP
- `GET /health`, `GET /info`: convención de monitoring estándar


---

## Red de conexiones

- Regla que formaliza: [[universal-constraints]] (#1)
- Backend que implementa: [[backend]]
- Por qué: [[why-decisions]]
- Índice: [[DAIMUZ]]
