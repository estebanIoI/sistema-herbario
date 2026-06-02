# suggestions — compressed

- **Qué hace:** Sistema de sugerencias de usuarios con flujo de moderación: `pending` → `in_review` → `approved` / `rejected` / `implemented`. 10 servicios activos.
- **Tablas:** `suggestions` — sin tabla `suggestion_comments` (eliminada v3.0). Los comentarios y notas del admin se guardan en `attachments JSON` bajo la clave `admin_notes`.
- **Endpoints activos (10):** `suggestions.getAll` · `suggestions.getById` · `suggestions.create` · `suggestions.update` · `suggestions.updateStatus` · `suggestions.approve` · `suggestions.reject` · `suggestions.countUnread` · `suggestions.vote` · `suggestions.getStats`
- **Archivos:** `controllers/suggestions/suggestionsController.js` (solo re-exporta) · `getAll.js` · `create.js` · `approve.js` · `reject.js` · `update.js` · `countUnread.js` · `getById.js` · `vote.js` · `getStats.js` · `frontend/app/admin/sugerencias/page.tsx` · `frontend/app/plantas/[id]/sugerencia/page.tsx`
- **⚠️ Regla crítica:** Solo `admin` puede aprobar/rechazar/updateStatus. Nuevas sugerencias SIEMPRE inician en `status='pending'`. `addComment` y `getComments` eliminados — tabla `suggestion_comments` no existe. Notas del admin van en `attachments.admin_notes`.
- **Formato `attachments JSON`:** `{ contact_name, contact_email, contact_phone, admin_notes }` — los primeros tres los envía el público al crear; `admin_notes` lo añade el admin al aprobar/rechazar.
- **`suggestions.vote`:** incrementa `votes_up` o `votes_down` según `data.type = 'up'|'down'`. No tiene anti-duplicado (cualquier usuario puede votar múltiples veces).
- **Estados válidos:** `pending`, `in_review`, `approved`, `rejected`, `implemented` (los 5 están en el ENUM de la tabla y en `update.js`).

---

## Red de conexiones

- Mapa de roles: [[roles-map]] → moderación solo admin
- Reglas: [[universal-constraints]] (#4)
- Tablas: [[db-tables-index]]
- Bugs conocidos: [[bugs-history]]
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
