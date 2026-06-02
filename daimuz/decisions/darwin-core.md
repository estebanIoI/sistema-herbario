# ADR: Estándar Darwin Core para la tabla plants

**Fecha**: Al inicio del proyecto
**Estado**: Implementado

## Decisión

La tabla `plants` implementa el estándar Darwin Core para registros de biodiversidad,
usando los nombres de campo exactos del estándar internacional.

## Contexto

El HEAA es un herbario científico que podría necesitar publicar sus datos en portales
internacionales de biodiversidad como GBIF (Global Biodiversity Information Facility),
SiB Colombia, o iDigBio.

## Por qué Darwin Core

- **Interoperabilidad**: los datos pueden publicarse directamente en portales internacionales
- **Campos definidos**: `occurrence_id`, `basis_of_record`, `collector_name`, `habitat`, etc.
  ya están definidos con significado preciso por la comunidad científica
- **Evita deuda técnica**: no hay que migrar después si se quiere publicar en GBIF
- **Credibilidad científica**: los investigadores reconocen y entienden los campos

## Trade-offs

- ~60 campos en la tabla `plants` parece excesivo para un formulario simple
- Algunos campos tienen nombres largos (`infraspecific_epithet`, `georeferenced_by`)
- La curva de aprendizaje para entender todos los campos es alta

## Cómo mitigamos los trade-offs

- El formulario de creación solo muestra los campos más usados (scientific_name, family, etc.)
- Los campos avanzados están en secciones colapsables
- `daimuz/ontology/entities.md` explica qué es cada concepto biológico

## Referencia

Darwin Core Terms: https://dwc.tdwg.org/terms/


---

## Red de conexiones

- Campos DwC: [[darwin-core-fields]]
- Regla: [[universal-constraints]] (#2, #9)
- Módulo: [[plants/compressed|plants]]
- Índice: [[DAIMUZ]]
