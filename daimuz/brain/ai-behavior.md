# Cómo trabajar con Claude en este proyecto

## El principio de Context Engineering

**Menos contexto irrelevante = Mejores respuestas.**

No darle todo el proyecto. Darle solo lo necesario:

```
1. CLAUDE.md (root) — se carga automáticamente
2. daimuz/DAIMUZ.md — mapa del cerebro
3. daimuz/memory/current-state.md — estado actual
4. daimuz/modules/[modulo]/compressed.md — módulo relevante
5. El archivo real de código — solo el que se va a tocar
6. El flujo, si aplica — daimuz/flows/[flujo].md
```

**El costo de dar contexto innecesario:** Claude comienza a hacer suposiciones sobre partes del sistema que no son relevantes para la tarea actual.

---

## Orden de lectura obligatorio

Antes de cualquier tarea, Claude debe leer en este orden:
1. `CLAUDE.md` (root) — reglas y stack
2. `daimuz/DAIMUZ.md` — índice del cerebro
3. `daimuz/memory/current-state.md` — qué funciona hoy
4. `daimuz/modules/[modulo]/compressed.md` — módulo específico
5. El archivo real del código
6. El flujo si aplica → `daimuz/flows/`

---

## Templates de prompts por tipo de tarea

### Feature nuevo
```
Lee: [[modules/[modulo]/compressed]], [[universal-constraints]]

Quiero agregar [descripción del feature].

Servicio nuevo: [modulo].[accionVerbo]
Tabla afectada: [tabla]
Rol que puede ejecutarlo: [admin / collector / user]

Restricciones:
- Seguir el patrón API Gateway (POST /api/service)
- Soft delete si hay eliminación
- Verificar rol en el controlador
- Logger en cada paso crítico
- SQL con placeholders, nunca interpolación
```

### Bug fix
```
Lee: [[modules/[modulo]/compressed]], [[bugs-history]]

Hay un bug en [descripción].

Síntoma: [qué falla exactamente]
Cuándo ocurre: [pasos para reproducir]
Servicio afectado: [modulo.accion]
Archivo sospechoso: [ruta/exacta.js]

Comportamiento esperado: [resultado correcto]
Comportamiento actual: [resultado incorrecto / error]
```

### Nuevo módulo
```
Lee: [[brain/module-pattern]], [[naming-conventions]], [[universal-constraints]]

Crear el módulo [nombre] con estos servicios:
- [modulo].getAll — todos los registros paginados
- [modulo].getById — uno por id
- [modulo].create — crear (rol: [admin/collector])
- [modulo].update — actualizar (rol: [admin/collector])
- [modulo].delete — soft delete (rol: admin)

Tabla: [nombre_tabla] con campos: [campo1, campo2...]
```

### Code review
→ Ver [[code-review]] para el prompt completo

---

## Qué Claude NO debe hacer sin confirmación explícita

- ❌ Cambiar el schema de la BD (ALTER TABLE, DROP COLUMN)
- ❌ Modificar `middleware/auth.js` o `serviceController.js`
- ❌ Crear nuevas rutas Express (solo POST /api/service, salvo upload y media)
- ❌ Cambiar nombres de columnas DwC existentes
- ❌ Eliminar registros con DELETE (siempre soft delete)
- ❌ Tocar el módulo `posts` sin verificar que la tabla existe primero

---

## Qué esperar de Claude

- **No inventar endpoints**: todos los servicios están en `services/index.js`
- **No crear nuevas rutas Express** salvo que sea estrictamente necesario
- **Respetar el patrón API Gateway**: nueva funcionalidad = nuevo controlador + registro en services/index.js
- **Soft delete siempre**: `UPDATE SET deleted_at = NOW()`, nunca DELETE
- **Validar roles**: antes de escritura, verificar `req.user.role`
- **Logger en lugar de console.log**: `logger.info()`, `logger.warn()`, `logger.error()`

---

## Al terminar una sesión significativa

Pedir explícitamente:
> "Actualiza [[current-state]] y [[changelog]] con lo que hicimos hoy."

---

## Red de conexiones

- Identidad: [[identity]] · [[coding-standards]]
- Nomenclatura: [[naming-conventions]]
- Prompts detallados: [[new-feature]] · [[bug-fix]] · [[new-module]] · [[code-review]]
- Roles: [[roles-map]]
- Índice: [[DAIMUZ]]
