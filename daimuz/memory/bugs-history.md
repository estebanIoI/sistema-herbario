# Historial de Bugs

## Abiertos

### [2026-05-30] posts — todas las operaciones fallan en runtime
**Síntoma:** Cualquier llamada a `posts.*` devuelve error "table doesn't exist"
**Causa:** El módulo tiene controladores en `backend/src/controllers/posts/` pero NO tiene tabla en `herbario_heaa_actualizado.sql`
**Estado:** Sin resolver. No iniciar trabajo en este módulo hasta crear la migración SQL primero.
**Archivos:** `services/index.js` (5 servicios registrados), `controllers/posts/`

### [2026-05-30] suggestions.addComment — probablemente roto
**Síntoma:** `suggestions.addComment` puede fallar en runtime
**Causa:** La tabla `suggestion_comments` fue eliminada en v3.0. El servicio podría usar `attachments JSON` en la tabla principal en lugar de una tabla separada.
**Estado:** Requiere verificación. Revisar si el servicio usa la columna JSON o si está hardcodeado a una tabla que ya no existe.

### [2026-05-30] dashboard.getVisitorsChart aparece vacío
**Síntoma:** El gráfico de visitantes en el dashboard no muestra datos
**Causa:** Lee de `activity_logs` donde `action='view_plant'`. Si ningún usuario ha navegado plantas, el array viene vacío.
**Estado:** Lógico, no es un bug técnico. Verificar que se registran los eventos `view_plant`.

---

## Cerrados

### [2026-05-30] NEXT_PUBLIC_API_URL apunta a puerto incorrecto en dev local
**Síntoma:** El frontend no conecta al backend en desarrollo local
**Causa:** `NEXT_PUBLIC_API_URL` por defecto apunta a `localhost:5001`. El backend sin Docker corre en `:5000`.
**Solución:** Ajustar `.env.local` del frontend: `NEXT_PUBLIC_API_URL=http://localhost:5000`
**Nota:** En Docker, `:5001` es correcto porque el compose lo mapea así.

---
*Formato:*
```
## [YYYY-MM-DD] Título del bug
**Síntoma:** qué fallaba
**Causa:** por qué fallaba
**Solución:** qué se cambió
**Archivos:** qué archivos se tocaron
```


---

## Red de conexiones

- Fixes: [[important-fixes]]
- Estado actual: [[current-state]]
- Prompts: [[bug-fix]]
- Índice: [[DAIMUZ]]
