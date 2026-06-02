# auth — compressed

- **Qué hace:** JWT: login, registro, me, refresh, logout, recuperación y cambio de contraseña. Controla acceso a los 47 servicios autenticados del sistema. 9 servicios.
- **Tablas:** `users` · `activity_logs` (registra login/logout)
- **Endpoints:** `auth.login` · `auth.register` · `auth.me` · `auth.logout` · `auth.refresh` · `auth.forgotPassword` · `auth.resetPassword` · `auth.changePassword` · `auth.verifyEmail`
- **Archivos:** `controllers/auth/login.js` · `controllers/auth/register.js` · `middleware/auth.js` (exporta `authenticateToken` para rutas directas y `authenticateTokenSync` para gateway)
- **⚠️ Regla crítica:** Token en `req.body.token` para el gateway, en header `Authorization: Bearer` para rutas directas. JWT contiene `{ id, email, role }` — expira en 24h. Solo `status='active'` puede loguear. `login_attempts` existe en tabla pero NO está implementado en código.

---

## Red de conexiones

- Flujo completo: [[auth-flow]]
- Sinapsis y dependencias: [[auth-chain]]
- Mapa de roles: [[roles-map]]
- Reglas: [[universal-constraints]] (#4 roles, #6 JWT dual, #8 env vars)
- Tablas: [[db-tables-index]] → `users`, `activity_logs`
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
