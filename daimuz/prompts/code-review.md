# Prompt: Code Review

> Usar cuando necesitas que Claude revise código antes de mergear, deployar o considerar completo un feature.

---

## Prompt estándar

```
Lee: [[modules/[modulo]/compressed]], [[governance/universal-constraints]]

Por favor revisa el siguiente código de [descripción]:

[pegar código aquí]

Verificar específicamente:
1. ¿Cumple el patrón API Gateway? (todo por POST /api/service, no rutas nuevas)
2. ¿Usa nombres Darwin Core correctos en las queries? (ver [[darwin-core-fields]])
3. ¿El soft delete está aplicado? (deleted_at, no DELETE)
4. ¿Verifica rol antes de operaciones de escritura? (ver [[roles-map]])
5. ¿Usa placeholders en SQL? (nunca interpolación de strings)
6. ¿Usa logger en lugar de console.log?
7. ¿El async/await tiene try/catch?
```

---

## Prompt para revisar un módulo completo

```
Lee: [[modules/[modulo]/compressed]], [[modules/[modulo]/[modulo]]], 
     [[universal-constraints]], [[coding-standards]]

Revisa el módulo [nombre] en su totalidad.

Archivos a revisar:
- backend/src/controllers/[modulo]/[archivo].js
- [otros archivos del módulo]

Buscar:
- Inconsistencias con el patrón del sistema
- Endpoints o servicios que no están registrados en services/index.js
- Queries que usen nombres de columnas viejos (pre-DwC)
- Lógica de permisos incompleta
- Casos edge no manejados
```

---

## Prompt para revisar antes de deploy a producción

```
Lee: [[current-state]], [[governance/universal-constraints]], [[decisions/darwin-core-migration]]

Revisa estos archivos antes del deploy:
[listar archivos modificados en este release]

Checklist crítico:
- [ ] ¿Algún archivo usa nombres de columna pre-DwC? 
      (herbarium_number, species, collector_name, collection_date, department)
- [ ] ¿Se ejecutó el script de migración DwC en producción?
- [ ] ¿Hay queries sin placeholder (SQL injection)?
- [ ] ¿Hay console.log que deberían ser logger?
- [ ] ¿El módulo posts tiene tabla en BD? (si se tocó posts)
```

---

## Qué NO pedir en un code review sin contexto

- No pedir revisar el proyecto entero (demasiado contexto)
- No pedir revisar sin especificar qué verificar
- No pedir código nuevo durante el review (son tareas separadas)

---

## Red de conexiones

- Estándares: [[coding-standards]] · [[naming-conventions]]
- Reglas: [[universal-constraints]]
- Bugs frecuentes: [[bugs-history]] · [[important-fixes]]
- Índice: [[DAIMUZ]]
