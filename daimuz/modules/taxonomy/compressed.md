# taxonomy — compressed

- **Qué hace:** Catálogo taxonómico jerárquico del herbario (kingdom → phylum → class → order → family → genus → species). NO tiene tabla propia — se deriva de DISTINCT sobre `plants`. 11 servicios.
- **Tablas:** `plants` (columnas: `kingdom`, `phylum`, `class_name`, `order_name`, `family`, `subfamily`, `genus`, `subgenus`, `specific_epithet`) — sin tabla taxonomy separada
- **Endpoints:** `taxonomy.getFamilies` · `taxonomy.getGenera` · `taxonomy.getSpecies` · `taxonomy.getGeneraByFamily` · `taxonomy.getSpeciesByGenus` · `taxonomy.getTaxonomyTree` · `taxonomy.validateTaxonomy` · `taxonomy.createFamily` · `taxonomy.createGenus` · `taxonomy.getStats`
- **Archivos:** `controllers/plants/taxonomyController.js` · `controllers/taxonomy/getFamilies.js`
- **⚠️ Regla crítica:** DISTINCT sobre `plants` — no es una tabla independiente. `getTaxonomyTree` agrupa por niveles sobre la misma tabla. Solo `admin` puede crear/modificar categorías taxonómicas. Los nombres taxonómicos siguen Darwin Core: `class_name` (no `class`), `order_name` (no `order`) — son palabras reservadas SQL.
- **🔴 `taxonomy.getSpeciesByGenus` falla — auditado 2026-06-01:** `taxonomyController.js` usa `species` (columna vieja) en vez de `specific_epithet` (DwC). Solo este servicio está roto; el resto del módulo usa columnas correctas.

---

## Red de conexiones

- Campos DwC de taxonomía: [[darwin-core-fields]]
- Módulo que almacena los datos: [[plants/compressed|plants]]
- Tablas: [[db-tables-index]]
- Sirve al público: [[public/compressed|public]]
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
