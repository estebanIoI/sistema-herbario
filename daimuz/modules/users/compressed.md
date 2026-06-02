# users — compressed

- **Qué hace:** CRUD de cuentas de usuario, gestión de roles (admin/collector/user), perfiles, avatares e historial de actividad. 12 servicios.
- **Tablas:** `users` · `activity_logs`
- **Endpoints:** `users.getAll` · `users.getById` · `users.create` · `users.update` · `users.delete` · `users.changeRole` · `users.uploadAvatar` · `users.activate` · `users.deactivate` · `users.getActivity` · `users.getStats`
- **Archivos:** `controllers/users/usersController.js` · `controllers/users/create.js` · `controllers/users/delete.js` · `frontend/app/admin/usuarios/page.tsx` · `frontend/app/usuario/page.tsx`
- **⚠️ Regla crítica:** Solo `admin` puede cambiar roles, activar/desactivar o eliminar. Un usuario puede editar su propio perfil pero NO su propio rol. La contraseña SIEMPRE se hashea con bcryptjs antes de guardar — nunca en texto plano.

---

## Red de conexiones

- Flujo de auth: [[auth-flow]] · [[auth-chain]]
- Mapa de roles: [[roles-map]]
- Reglas: [[universal-constraints]] (#3 soft delete, #4 roles)
- Tablas: [[db-tables-index]] → `users`, `activity_logs`
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
