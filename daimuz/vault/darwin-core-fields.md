# Darwin Core — 53 Campos del BD_Gral_HEAA

Estándar: Darwin Core (DwC) — formato internacional para biodiversidad  
Referencia oficial: https://dwc.tdwg.org/terms/  
Filas de datos: empiezan en fila 3 del Excel (fila 1 = nombre técnico inglés, fila 2 = etiqueta español)

---

## Mapeo: Excel → Columna SQL → Nombre DwC

| Col | Nombre Excel (inglés) | Columna SQL | Etiqueta española |
|-----|----------------------|-------------|-------------------|
| 1 | occurrenceID | `occurrence_id` | ID del registro biológico |
| 2 | basisOfRecord | `basis_of_record` | Base del registro (siempre: PreservedSpecimen) |
| 3 | type | `record_type` | Tipo (siempre: PhysicalObject) |
| 4 | institutionCode | `institution_code` | Código de la institución |
| 5 | institutionID | `institution_id` | ID de la institución (NIT) |
| 6 | collectionCode | `collection_code` | Código de la colección (HEAA) |
| 7 | collectionID | `collection_id` | ID de la colección en GRSciColl |
| 8 | catalogNumber | `catalog_number` | **Número de catálogo** ⚠️ Campo crítico único |
| 9 | recordNumber | `record_number` | Número de registro del colector |
| 10 | recordedBy | `recorded_by` | Registrado por (colector, separados por \|) |
| 11 | organismQuantity | `organism_quantity` | Cantidad del organismo |
| 12 | organismQuantityType | `organism_quantity_type` | Tipo de cantidad |
| 13 | lifeStage | `life_stage` | Etapa de vida (Floración, Fructificación, Estéril) |
| 14 | preparations | `preparations` | Preparaciones (Excicado botánico, Alcohol, Silica gel) |
| 15 | disposition | `disposition` | Disposición (En colección, Prestado, Destruido) |
| 16 | samplingProtocol | `sampling_protocol` | Protocolo de muestreo |
| 17 | eventDate | `event_date` | **Fecha del evento** (ISO 8601: YYYY-MM-DD) |
| 18 | habitat | `habitat` | Hábitat |
| 19 | fieldNumber | `field_number` | Número de campo (libreta) |
| 20 | fieldNotes | `field_notes` | Notas de campo (descripción morfológica en vivo) |
| 21 | country | `country` | País (siempre: Colombia) |
| 22 | stateProvince | `state_province` | **Departamento** |
| 23 | county | `county` | **Municipio** ⚠️ No "condado" — adaptación colombiana |
| 24 | municipality | `municipality` | **Vereda/Centro poblado** ⚠️ No el municipio |
| 25 | locality | `locality` | Localidad detallada del sitio de colecta |
| 26 | minimumElevationInMeters | `minimum_elevation_in_meters` | Elevación mínima en metros (msnm) |
| 27 | decimalLatitude (decimal) | `decimal_latitude` | Latitud decimal (neg=Sur) |
| 28 | decimalLatitude (sexagecimal) | `decimal_latitude_sexagesimal` | Latitud DD°MM'SS'' |
| 29 | decimalLongitude (decimal) | `decimal_longitude` | Longitud decimal (neg=Oeste) |
| 30 | decimalLongitude (sexagecimal) | `decimal_longitude_sexagesimal` | Longitud DD°MM'SS'' |
| 31 | geodeticDatum | `geodetic` | Datum geodésico (siempre: WGS84) |
| 32 | identifiedBy | `identified_by` | Identificado por (especialista que determina) |
| 33 | dateIdentified | `date_identified` | Fecha de identificación (ISO 8601) |
| 34 | updatedBy | `updated_by` | Actualizado/Confirmado por |
| 35 | dateUpdated | `date_updated` | Fecha de actualización/Confirmación |
| 36 | scientificName | `scientific_name` | **Nombre científico** (binomial sin autoría) ⚠️ NOT NULL |
| 37 | scientificNameAuthorship | `scientific_name_authorship` | Autoría del nombre científico |
| 38 | kingdom | `kingdom` | Reino (siempre: Plantae) |
| 39 | phylum | `phylum` | Filo (Magnoliophyta para angiospermas) |
| 40 | class | `class_name` | Clase (SQL usa class_name, `class` es reservado) |
| 41 | order | `order_name` | Orden (SQL usa order_name, `order` es reservado) |
| 42 | family | `family` | **Familia botánica** (APG IV) |
| 43 | subfamily | `subfamily` | Subfamilia |
| 44 | genus | `genus` | **Género taxonómico** |
| 45 | subgenus | `subgenus` | Subgénero |
| 46 | specificEpithet | `specific_epithet` | **Epíteto específico** (segunda parte del binomial) |
| 47 | infraspecificEpithet | `infraspecific_epithet` | Epíteto infraespecífico (subespecie, variedad) |
| 48 | taxonRank | `taxon_rank` | Categoría del taxón (species, genus, family...) |
| 49 | vernacularName | `vernacular_name` | Nombre común regional |
| 50 | taxonRemarks | `taxon_remarks` | Notas taxonómicas, sinonimias, incertidumbre |
| 51 | photoRecord | `photo_record` | Fotografía del montaje (campo local HEAA) |
| 52 | (Proyecto) | `project` | Nombre del proyecto de investigación (campo local) |
| 53 | (vacía) | — | Columna vacía, no usar |

---

## ⚠️ Campos OBLIGATORIOS

```
catalog_number    Col 8  · unique per specimen
scientific_name   Col 36 · NOT NULL
family            Col 42
genus             Col 44
specific_epithet  Col 46
country           Col 21 · always "Colombia"
state_province    Col 22 · department
county            Col 23 · municipio
event_date        Col 17 · date format ISO 8601
recorded_by       Col 10 · collector name(s)
basis_of_record   Col 2  · always "PreservedSpecimen"
```

## ⚠️ Valores FIJOS para este herbario

```
basis_of_record    = "PreservedSpecimen"
record_type        = "PhysicalObject"
institution_code   = "Instituto Tecnológico del Putumayo (ITP)"
institution_id     = "800247940"
collection_code    = "HEAA"
country            = "Colombia"
geodetic           = "WGS84"
kingdom            = "Plantae"
```

## ⚠️ Inversión county / municipality (¡importante!)

El estándar DwC usa `county` para condados (divisiones sub-provinciales).
En Colombia, se adaptó así:
- `county` (Col 23) = **MUNICIPIO**
- `municipality` (Col 24) = **VEREDA / CENTRO POBLADO**

Esto invierte el significado estándar. NO cambiar — es así en el Excel BD_Gral_HEAA.

## Separador de múltiples personas

`" | "` (espacio + barra + espacio)  
Aplica a: `recorded_by` (Col 10), `identified_by` (Col 32)

Ejemplo: `Andrés Orejuela | Guerly León`

## Formato de fechas

`eventDate` (Col 17) → ISO 8601:
- Completa: `2024-03-15`
- Mes-año: `2024-03`
- Solo año: `2024`

En Excel se almacena como número serial → convertir al importar.

## Campos locales HEAA (no estándar DwC)

| Campo SQL | Descripción |
|-----------|-------------|
| `photo_record` | URL de fotografía del montaje (Col 51) |
| `project` | Nombre del proyecto de investigación (Col 52) |
| `decimal_latitude_sexagesimal` | Latitud en DD°MM'SS'' (Col 28) |
| `decimal_longitude_sexagesimal` | Longitud en DD°MM'SS'' (Col 30) |
| `record_type` | Nombre alternativo para `type` (reservado en SQL) |
| `class_name` | Nombre alternativo para `class` (reservado en SQL) |
| `order_name` | Nombre alternativo para `order` (reservado en SQL) |
| `collector_user_id` | FK al usuario registrado que colectó |


---

## Red de conexiones

- Módulos que usan DwC: [[plants/compressed|plants]] · [[taxonomy/compressed|taxonomy]] · [[locations/compressed|locations]]
- Regla: [[universal-constraints]] (#2, #9)
- Decisión: [[decisions/darwin-core|darwin-core]]
- Migración: [[darwin-core-migration]]
- Índice: [[DAIMUZ]]
