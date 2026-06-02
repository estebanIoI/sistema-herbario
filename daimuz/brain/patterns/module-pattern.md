# Patrón Estándar de Módulo

## Estructura de archivos

```
backend/src/controllers/[modulo]/
├── [modulo]Controller.js    ← coordinador: importa y re-exporta acciones
├── getAll.js                ← listado con paginación
├── getById.js               ← uno por ID
├── create.js                ← crear nuevo
├── update.js                ← actualizar existente
└── delete.js                ← soft delete
```

## Template: getAll.js

```javascript
const { query } = require('../../config/database');
const logger = require('../../utils/logger');

async function getAll({ data = {}, user }) {
  const { limit = 20, offset = 0, status } = data;
  
  let sql = 'SELECT * FROM [tabla] WHERE deleted_at IS NULL';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  
  const rows = await query(sql, params);
  return { success: true, data: rows };
}

module.exports = getAll;
```

## Template: create.js

```javascript
const { query } = require('../../config/database');
const logger = require('../../utils/logger');

async function create({ data, user }) {
  const { campo1, campo2 } = data;
  
  // Validar requeridos
  if (!campo1) {
    return { success: false, error: 'campo1 es requerido' };
  }
  
  const result = await query(
    'INSERT INTO [tabla] (campo1, campo2, created_by) VALUES (?, ?, ?)',
    [campo1, campo2, user.id]
  );
  
  logger.info(`[modulo] creado id=${result.insertId} by user=${user.id}`);
  return { success: true, data: { id: result.insertId } };
}

module.exports = create;
```

## Registro en services/index.js

```javascript
// En services/index.js
const [modulo]Controller = require('../controllers/[modulo]/[modulo]Controller');

const services = {
  // ... otros servicios
  '[modulo].getAll': [modulo]Controller.getAll,
  '[modulo].getById': [modulo]Controller.getById,
  '[modulo].create': [modulo]Controller.create,
  '[modulo].update': [modulo]Controller.update,
  '[modulo].delete': [modulo]Controller.delete,
};
```

## Después de agregar un módulo nuevo

1. Crear `daimuz/modules/[modulo]/compressed.md`
2. Actualizar `daimuz/indexes/modules-index.md`
3. Actualizar `daimuz/indexes/endpoints-index.md`
4. Actualizar `daimuz/DAIMUZ.md` tabla de módulos


---

## Red de conexiones

- Estándares: [[coding-standards]] · [[naming-conventions]]
- Reglas: [[universal-constraints]]
- Ejemplos: [[auth/compressed|auth]] · [[plants/compressed|plants]]
- Índice: [[DAIMUZ]]
