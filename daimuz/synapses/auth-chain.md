# Sinapsis: Cadena de Autenticación y Permisos

> Si cambias algo en auth, roles, o middleware → esto es lo que se afecta en cascada.

---

## Flujo de autorización

```
Request HTTP
    ↓
POST /api/service { service, data, token }
    ↓
serviceController.js
    ├── ¿El servicio requiere auth?
    │   └── SÍ → middleware/auth.js
    │           ├── jwt.verify(token, JWT_SECRET)
    │           ├── SELECT user FROM users WHERE id = ? AND status = 'active'
    │           └── req.user = { id, email, role }
    │
    ├── ¿El servicio requiere admin?
    │   └── SÍ → verificar req.user.role === 'admin'
    │
    └── Ejecutar controlador → devuelve resultado
```

---

## Impacto por cambio

### Si cambias el payload del JWT `{ id, email, role }`

| Qué cambiarías | Impacto inmediato | Archivos a tocar |
|---|---|---|
| Agregar campo (ej. `name`) | Disponible en todos los controladores via `req.user` | `auth/login.js`, `auth/register.js`, `auth/me.js` |
| Quitar `role` del JWT | ❌ CRÍTICO — todos los controladores que leen `req.user.role` rompen | Todos los módulos con verificación de rol |
| Cambiar `id` a `userId` | Todos los `req.user.id` rompen | ~20 controladores |
| Cambiar duración (24h → 48h) | Solo `auth/login.js` y `auth/refresh.js` | `login.js`, `refresh.js` |

### Si cambias el middleware `auth.js`

Hay **dos funciones distintas** — no confundir:

| Función | Usada en | Si la rompes |
|---|---|---|
| `authenticateToken` | Rutas directas: upload, media | `POST /api/plantas/upload` deja de validar token |
| `authenticateTokenSync` | API Gateway: `serviceController.js` | TODOS los 47 servicios autenticados dejan de funcionar |

### Si cambias el sistema de roles

El rol actual es un ENUM de 3 valores: `admin`, `collector`, `user`.

Si agregas un rol nuevo (ej. `researcher`):
- [ ] Agregar al ENUM en la tabla `users`
- [ ] Actualizar todos los `if (role !== 'admin')` que deberían incluir el nuevo rol
- [ ] Actualizar [[roles-map]] con los permisos del nuevo rol
- [ ] Actualizar [[identity-manifesto]] si cambia la audiencia del sistema
- [ ] Actualizar el frontend: `admin/layout.tsx` que verifica acceso admin

### Si cambias `status` del usuario

`status` puede ser: `active`, `inactive`, `pending`

- Solo usuarios con `status='active'` pueden hacer login → `auth/login.js`
- Los campos `login_attempts` y `locked_until` existen en la tabla pero **no están implementados** → ver [[bugs-history]]

---

## Módulos que dependen de auth para funcionar

| Módulo | Qué usa de auth |
|---|---|
| `plants` | `req.user.id` (creator), `req.user.role` (permisos de escritura) |
| `users` | `req.user.id` (operaciones propias), `req.user.role` (admin operations) |
| `dashboard` | `req.user.role` (admin/collector) |
| `suggestions` | `req.user.id` (quién sugiere), `req.user.role` (moderación) |
| `settings` | `req.user.role` (solo admin) |
| `taxonomy` | `req.user.role` (solo admin para escritura) |
| `locations` | `req.user.role` (solo admin para escritura) |
| `uploads` | `req.user.id` (ownership) |
| `activity_logs` | `req.user.id` (quién ejecutó la acción) |

---

## Verificación rápida cuando algo de auth está roto

```bash
# 1. ¿El token tiene el formato correcto?
# Decodificar en jwt.io y verificar: { id, email, role, iat, exp }

# 2. ¿El usuario existe y está activo?
SELECT id, email, role, status FROM users WHERE email = 'test@test.com';

# 3. ¿El middleware está leyendo del lugar correcto?
# Para /api/service → debe leer req.body.token
# Para /api/plantas/upload → debe leer header Authorization: Bearer

# 4. ¿JWT_SECRET es el mismo en login y en verify?
echo $JWT_SECRET
```

---

## Red de conexiones

- Módulo central: [[auth/compressed|auth · compressed]]
- Flujo detallado: [[auth-flow]]
- Mapa de roles: [[roles-map]]
- Reglas universales: [[universal-constraints]] (#4 roles, #6 JWT dual)
- Módulo más afectado: [[plants/compressed|plants · compressed]]
- Índice: [[DAIMUZ]]
