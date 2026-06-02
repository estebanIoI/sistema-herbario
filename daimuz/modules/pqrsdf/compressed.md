# pqrsdf — compressed

- **Qué hace:** Peticiones ciudadanas con radicado único autogenerado. Permite a ciudadanos enviar peticiones, quejas, reclamos, sugerencias, denuncias o felicitaciones al herbario. 2 servicios.
- **Tablas:** `pqrsdf` — radicado único formato `PQRSDF-YYYYMMDD-XXXXX` · tipo ENUM(peticion, queja, reclamo, sugerencia, denuncia, felicitacion) · status ENUM(pendiente, en_revision, respondido)
- **Endpoints:** `pqrsdf.create` · `pqrsdf.getAll`
- **Archivos:** `controllers/pqrsdf/pqrsdfController.js`
- **⚠️ Regla crítica:** El radicado se genera automáticamente al crear (no lo envía el usuario). La estructura es completamente en español (a diferencia del resto del sistema en inglés/DwC). No tiene `assigned_to` FK a users — es atención ciudadana básica. `anonimo BOOLEAN` permite envíos sin identificación.

---

## Red de conexiones

- Tabla: [[db-tables-index]] → `pqrsdf`
- Roles: [[roles-map]] → `pqrsdf.create` público · `pqrsdf.getAll` solo admin
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
