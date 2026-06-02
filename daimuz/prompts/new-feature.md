# Prompt: Nueva Feature

```
Quiero agregar [DESCRIPCIÓN DE LA FEATURE].

Contexto:
- Módulo afectado: [modulo]
- Tablas involucradas: [tabla1, tabla2]
- Archivos que probablemente hay que tocar: [archivos]
- Rol mínimo requerido: [admin/collector/user/público]

La feature debe:
1. [requisito 1]
2. [requisito 2]
3. [requisito 3]

Respuesta esperada: { success: true, data: { ... } }

Recuerda:
- Seguir el patrón API Gateway: crear servicio en services/index.js
- Soft delete si elimina datos
- Validar rol antes de escritura
- SQL nativo con placeholders ? (no ORM)
```


---

## Red de conexiones

- Patrón: [[module-pattern]]
- Estándares: [[coding-standards]]
- Módulos: [[modules-index]]
- Índice: [[DAIMUZ]]
