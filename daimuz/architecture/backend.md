# Arquitectura Backend

## Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **BD**: MySQL 8+ con mysql2/promise (queries SQL nativas, sin ORM — prisma y mysql v2 eliminados 2026-06-01)
- **Auth**: jsonwebtoken (24h exp) + bcryptjs
- **Files**: Multer + sharp (resize/compress) + Cloudinary
- **Logs**: Winston
- **WebSockets**: Socket.io
- **Validación**: zod + express-validator
- **Cache**: node-cache (dev) / Redis (prod)
- **Scheduler**: node-cron (tareas programadas)
- **Email**: nodemailer

## Estructura de `src/`

```
src/
├── app.js                    ← configuración Express, monta middlewares y rutas
├── config/
│   ├── database.js           ← pool MySQL (createPool), exporta query()
│   ├── cloudinary.js         ← configuración v2 de Cloudinary
│   └── socket.js             ← init Socket.io
├── controllers/              ← lógica de negocio por módulo
│   ├── serviceController.js  ← DESPACHADOR CENTRAL: resuelve service → función
│   ├── auth/
│   ├── plants/
│   ├── users/
│   ├── dashboard/
│   ├── suggestions/
│   └── settings/
├── routes/
│   ├── service.js            ← POST /api/service (usa serviceController)
│   ├── plants.js             ← POST /api/plantas/upload
│   └── media.js              ← GET /api/media/plantas/:file
├── middleware/
│   ├── auth.js               ← extrae y valida JWT de req.body.token
│   ├── errorHandler.js       ← catch-all de errores con formato estándar
│   ├── rateLimiter.js        ← 100 req / 15min por IP
│   └── upload.js             ← Multer: max 10MB, validar MIME
├── services/
│   └── index.js              ← REGISTRO: { 'modulo.accion': fn } (100+ entradas)
├── utils/
│   └── logger.js             ← Winston: dev→ `level message` (sin JSON metadata); prod→ JSON a archivo
└── sockets/
    └── orderSocket.js        ← ⚠️ código de OTRO proyecto (órdenes de restaurante) — no importado, no usar
```

## Patrón de respuesta estándar

```json
// Éxito
{ "success": true, "data": {...}, "message": "..." }

// Error
{ "success": false, "error": "Mensaje de error", "code": "ERROR_CODE" }
```

## Rate limiting (3 niveles)

| Limiter | Máx peticiones | Ventana | Aplica a |
|---------|---------------|---------|----------|
| General | 100 req | 15 min | Todo `/api/service` |
| Estricto | 20 req | — | Operaciones sensibles |
| Login | 5 req | — | `auth.login`, `auth.register` |

## Pool de BD

```javascript
connectionLimit: 10     // máx conexiones simultáneas
queueLimit: 0           // sin límite de espera en cola
connectTimeout: 10000   // 10s timeout (⚠️ NO acquireTimeout/timeout/reconnect — son inválidos en mysql2)
charset: 'utf8mb4'
timezone: '+00:00'      // UTC
```

`config/database.js` exporta: `query(sql, params)`, `transaction(callback)`, `testConnection()`, `getStats()`, `closePool()`

⚠️ `server.js` llama `db.closePool()` en SIGTERM/SIGINT para cerrar el pool limpiamente.

## serviceController — permisos

- **47 servicios** requieren autenticación (token JWT)
- **26 servicios** requieren `role='admin'`
- Respuesta siempre incluye: `{ success, data, service, timestamp, executionTime }`

## Servicios registrados: 91 total

| Módulo | Cantidad |
|--------|---------|
| plants | 26 |
| users | 12 |
| suggestions | 12 |
| taxonomy | 11 |
| settings | 8 |
| uploads | 8 |
| locations | 8 |
| dashboard | 8 |
| auth | 9 |
| public | 6 |
| posts | 5 |
| validation | 4 |
| pqrsdf | 2 |

## Cómo agregar un nuevo servicio

1. Crear `controllers/[modulo]/[accion].js` con la lógica
2. Registrar en `services/index.js`: `'modulo.accion': require('./controllers/...')`
3. Si requiere auth, el serviceController ya pasa el usuario al handler
4. Si requiere admin, agregarlo a la lista de admin-only en serviceController

No crear nuevas rutas Express salvo que sea absolutamente necesario (upload, media, health).

---

## Red de conexiones

### Módulos que viven en este backend
[[auth/compressed|auth]] · [[plants/compressed|plants]] · [[users/compressed|users]] · [[dashboard/compressed|dashboard]] · [[suggestions/compressed|suggestions]] · [[taxonomy/compressed|taxonomy]] · [[locations/compressed|locations]] · [[settings/compressed|settings]] · [[uploads/compressed|uploads]] · [[public/compressed|public]]

### Flujos que pasan por este backend
[[auth-flow]] · [[plant-upload-flow]]

### Middlewares
[[middleware]] — chain completo de intercepción

### Gobernanza y reglas
[[universal-constraints]] · [[why-decisions]] · [[update-protocol]]

### Arquitectura complementaria
[[frontend]] · [[database]] · [[deployment]]

### Referencia de rutas y servicios
[[api-routes]] · [[modules-index]] · [[endpoints-index]]

- Identidad del sistema: [[DAIMUZ]]

