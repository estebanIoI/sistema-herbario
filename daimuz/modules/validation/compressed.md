# validation — compressed

- **Qué hace:** Validación de datos de entrada antes de operaciones críticas. Se llama desde el frontend para feedback inmediato antes de `plants.create` o `plants.update`. 4 servicios.
- **Tablas:** Sin tabla propia — hace SELECT sobre `plants` y catálogos de taxonomy
- **Endpoints:** `validation.validatePlantData` · `validation.validateTaxonomy` · `validation.checkDuplicateCatalogNumber` · `validation.validateDarwinCore`
- **Archivos:** `controllers/validation/validationController.js`
- **⚠️ Regla crítica:** Esta validación es COMPLEMENTARIA, no reemplaza la validación del backend. El backend valida independientemente aunque el frontend llame a validation primero. `checkDuplicateCatalogNumber` es especialmente crítico — `catalog_number` debe ser único (Darwin Core: catalogNumber, es el ID físico del espécimen en el exicado).

---

## Red de conexiones

- Módulo que valida: [[plants/compressed|plants]]
- Regla DwC del catalog_number: [[universal-constraints]] (#7)
- Campos que valida: [[darwin-core-fields]]
- Tablas de referencia: [[db-tables-index]]
- Índice: [[modules-index]] · [[DAIMUZ]]
