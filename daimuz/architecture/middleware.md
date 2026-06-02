# Middlewares — Capa de Intercepción del Backend

> Todo request HTTP pasa por esta cadena antes de llegar a un controlador.
> Orden de ejecución en `app.js`: compression → helmet → cors → rateLimiter → auth → errorHandler

---

## 1. compression (`middleware/compression.js`)

Comprime respuestas HTTP con gzip cuando el cliente lo soporta.
- **Activo si:** `COMPRESSION_ENABLED=true` en .env
- **Beneficio:** Reduce tamaño de respuestas JSON grandes (catálogos de plantas)
- **Config:** threshold 1KB (no comprime respuestas pequeñas)

---

## 2. helmet (`helmet`)

Configura headers de seguridad HTTP automáticamente.
- **Activo si:** `HELMET_ENABLED=true` en .env
- **Headers que agrega:** CSP, X-Frame-Options, HSTS, X-XSS-Protection, etc.
- **Nota:** En desarrollo puede interferir con herramientas de debug — desactivar con `HELMET_ENABLED=false`

---

## 3. cors (`cors`)

Controla qué origins pueden hacer requests al backend.
- **Config:** `CORS_ORIGIN` del .env · `CORS_CREDENTIALS=true` para cookies
- **Origins permitidos:** Solo el frontend declarado en .env
- **Rutas abiertas:** `/health`, `/info`, `public.*` servicios no necesitan CORS especial

---

## 4. rateLimiter (`middleware/rateLimiter.js`) — 3 instancias

**Instancia General** — aplica a todo `/api/service`:
```
Límite: 100 requests / 15 min por IP
Variable: RATE_LIMIT_MAX_REQUESTS=100, RATE_LIMIT_WINDOW_MS=900000
```

**Instancia Estricta** — aplica a operaciones sensibles:
```
Límite: 5 requests / 15 min por IP
Variable: RATE_LIMIT_STRICT_MAX=5
Servicios: cambio de contraseña, delete de usuarios, etc.
```

**Instancia Login** — aplica a autenticación:
```
Límite: 5 requests / 15 min por IP
Variable: RATE_LIMIT_LOGIN_MAX=5
Servicios: auth.login, auth.register
```

⚠️ El rate limiter es por **IP**, no por cuenta de usuario. `login_attempts` en la tabla `users` existe pero NO se actualiza en código — el bloqueo real es el rate limiter de middleware.

---

## 5. auth (`middleware/auth.js`) — 2 funciones

**`authenticateToken`** — para rutas directas (header):
```javascript
// Lee: Authorization: Bearer <token>
// Usa: jwt.verify(token, JWT_SECRET)
// Inyecta: req.user = { id, email, role }
// Usado en: POST /api/plantas/upload · GET /api/media/plantas/:file
```

**`authenticateTokenSync`** — para el API Gateway (body):
```javascript
// Lee: req.body.token
// Usa: jwt.verify(token, JWT_SECRET) síncrono
// Inyecta: req.user = { id, email, role }
// Usado en: serviceController.js (todos los servicios autenticados)
```

⚠️ No confundir las dos funciones. Usar `authenticateTokenSync` para el gateway y `authenticateToken` para rutas Express directas.

---

## 6. errorHandler (`middleware/errorHandler.js`)

Middleware de último recurso — captura todos los errores no manejados.
- **Posición:** Último en la cadena de `app.use()`
- **Formato de respuesta:**
```json
{ "success": false, "error": "mensaje", "code": "CÓDIGO", "message": "detalle" }
```
- **Logging:** Todos los errores se registran con `logger.error()` antes de responder

---

## 7. connectionTracker

Monitorea conexiones WebSocket activas.
- **Función:** Registra cuántos clientes Socket.io están conectados
- **Logging:** `logger.info('Conexión activa')` / `logger.info('Conexión cerrada')`

---

## Cadena completa de un request a `/api/service`

```
Request
    ↓ compression (gzip si aplica)
    ↓ helmet (headers seguridad)
    ↓ cors (validar origin)
    ↓ rateLimiter.general (100 req/15min)
    ↓ express.json() (parse body)
    ↓ serviceRouter
        ↓ serviceController.js
            ↓ ¿Requiere auth? → authenticateTokenSync → req.user
            ↓ ¿Requiere admin? → verificar req.user.role
            ↓ Ejecutar controlador específico
            ↓ Respuesta { success, data }
    ↓ errorHandler (si algo falló)
```

---

## Red de conexiones

- Auth en detalle: [[auth-flow]] · [[auth-chain]]
- Entorno: [[environment]] (variables de rate limiting)
- Backend: [[backend]]
- Reglas de seguridad: [[universal-constraints]] (#6 JWT, #8 env vars)
- Índice: [[DAIMUZ]]
