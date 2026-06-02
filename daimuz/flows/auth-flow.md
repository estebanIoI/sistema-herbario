# Flujo de Autenticación

## Login (auditado 2026-05-30)

```
1. Frontend: POST /api/service
   { service: "auth.login", data: { email, password }, token: null }

2. serviceController.js → services/index.js → login.js

3. login.js:
   a. Valida que email y password no sean vacíos
   b. SELECT id, email, password, name, role, status FROM users WHERE email = ? AND status = 'active'
   c. bcryptjs.compare(password, user.password)
   d. UPDATE users SET last_login = NOW() WHERE id = ?
   e. INSERT INTO activity_logs (action='login', entity_type='session', metadata={login_at})
   f. jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '24h' })

4. Respuesta: { token, user: { id, email, name, role } }

5. Frontend (lib/auth-context.tsx): guarda token en localStorage.setItem('token', token)
```

⚠️ `login.js` **NO incrementa** `login_attempts` ni actualiza `locked_until`.
El campo existe en la tabla `users` pero el código no lo usa actualmente.
Usuarios con `status='inactive'` o `status='pending'` no pueden hacer login.

## Petición autenticada

```
1. Frontend: POST /api/service
   { service: "plants.create", data: {...}, token: "eyJ..." }

2. serviceController.js extrae token del body

3. middleware/auth.js:
   a. jwt.verify(token, JWT_SECRET)
   b. Busca usuario en BD para verificar que sigue activo
   c. Inyecta user en la petición

4. serviceController resuelve → plants.create({ data, user })

5. El controlador verifica user.role antes de ejecutar
```

## Recuperación de contraseña

```
1. auth.forgotPassword { email }
   → genera token aleatorio (uuid/crypto)
   → guarda password_reset_token y password_reset_expires (+1h) en users
   → envía email con link (nodemailer)

2. auth.resetPassword { token, newPassword }
   → busca usuario por password_reset_token
   → verifica password_reset_expires > NOW()
   → bcrypt.hash(newPassword) → actualiza password
   → limpia password_reset_token y expires
```

## Roles y permisos

| Rol | Puede |
|-----|-------|
| `admin` | Todo |
| `collector` | Crear/editar plantas, ver dashboard limitado |
| `user` | Leer, sugerir, editar perfil propio |
| (sin auth) | Leer catálogo público, búsqueda |

---

## Red de conexiones

- Módulo que implementa este flujo: [[auth/compressed|auth · compressed]]
- Reglas que gobiernan este flujo: [[universal-constraints]] (reglas #4 roles, #6 JWT dual)
- Middleware de auth: [[backend]] → `middleware/auth.js`
- Flujo de planta relacionado: [[plant-upload-flow]] (requiere token del paso 2 de este flujo)
- Tablas involucradas: [[db-tables-index]] → `users`, `activity_logs`
- Índice general: [[modules-index]]
- Identidad del sistema: [[DAIMUZ]]
