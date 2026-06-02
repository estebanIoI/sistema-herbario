# Prompt: Nuevo Módulo

```
Necesito crear el módulo [NOMBRE] para gestionar [QUÉ GESTIONA].

Entidades:
- Tabla nueva: [nombre_tabla] con campos: [campo1, campo2, ...]
- Relaciones: [tabla_nueva].user_id → users.id

Operaciones CRUD necesarias:
- getAll: lista paginada con filtros por [campo1, campo2]
- getById: uno por ID
- create: campos requeridos [campo1], opcionales [campo2]
- update: puede cambiar [campos]
- delete: soft delete

Roles:
- Leer: [público/user/collector/admin]
- Escribir: [collector/admin]
- Eliminar: [admin]

Páginas frontend necesarias:
- /[ruta]: [descripción]
- /admin/[ruta]: [descripción]

Después de implementar, actualizar:
- daimuz/indexes/modules-index.md
- daimuz/indexes/endpoints-index.md
- daimuz/modules/[nombre]/compressed.md (crear)
- daimuz/DAIMUZ.md (agregar a la tabla de módulos)
```


---

## Red de conexiones

- Patrón: [[module-pattern]]
- Nomenclatura: [[naming-conventions]]
- Estándares: [[coding-standards]]
- Reglas: [[universal-constraints]]
- Índice: [[DAIMUZ]]
