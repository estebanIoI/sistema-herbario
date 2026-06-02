# Arquitectura — Overview

## Diagrama de alto nivel

```
[Usuario/Browser]
      │
      ▼
[Traefik (SSL + Routing)]
      │
      ├── *.dominio.com/  ──────► [Frontend: Next.js :3000]
      │                               │ NEXT_PUBLIC_API_URL
      │                               ▼
      └── api.dominio.com/ ──────► [Backend: Express :5000]
                                       │
                                       ├── POST /api/service ──► serviceController ──► services/index.js
                                       ├── POST /api/plantas/upload ──► multer ──► Cloudinary
                                       ├── GET  /api/media/plantas/:file
                                       ├── GET  /health
                                       └── GET  /info
                                                │
                                       ┌────────┼────────┐
                                       ▼        ▼        ▼
                                    [MySQL]  [Redis]  [Cloudinary]
                                    :3306    :6379    (CDN externo)
```

## Capas del sistema

| Capa | Tecnología | Responsabilidad |
|------|-----------|-----------------|
| Reverse Proxy | Traefik | SSL, routing por dominio |
| Frontend | Next.js (App Router) | UI, pages, formularios |
| Backend API | Express.js | Business logic, API Gateway |
| Base de datos | MySQL | Persistencia principal |
| Cache | Redis / node-cache | Cache de consultas frecuentes |
| Storage | Cloudinary / local | Imágenes y archivos |
| Logging | Winston | Logs estructurados |
| WebSockets | Socket.io | Notificaciones en tiempo real |

## Flujo de una petición típica

```
Frontend (Next.js)
  └── fetch('POST /api/service', { service: 'plants.getAll', data: { limit: 20 } })
        └── Backend: app.js → route /api/service → serviceController
              └── services/index.js: resuelve 'plants.getAll' → plantsController.getAll
                    └── database.js: SELECT * FROM plants WHERE deleted_at IS NULL LIMIT 20
                          └── Respuesta JSON → Frontend → render
```

## Arquitectura de módulos (backend)

Cada módulo sigue el patrón: **Controlador** → **Servicio** → **DB directa (mysql2)**

No hay ORM. Las queries son SQL nativo con `mysql2/promise`.


---

## Red de conexiones

- Capas: [[backend]] · [[frontend]] · [[database]] · [[deployment]]
- Módulos: [[modules-index]]
- Identidad: [[DAIMUZ]]
