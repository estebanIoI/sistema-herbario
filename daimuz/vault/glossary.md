# Glosario del Dominio

## Términos botánicos / científicos

**Darwin Core**: Estándar internacional para registros de biodiversidad, mantenido por TDWG.
Define ~200 términos para describir especímenes biológicos. URL: https://dwc.tdwg.org/terms/

**Espécimen**: Un individuo de planta recolectado, prensado y preservado en el herbario.
Cada espécimen tiene un `herbarium_number` único.

**Herbario**: Colección científica de plantas preservadas (secas, prensadas). El HEAA es el
herbario del Instituto Tecnológico del Putumayo.

**Taxonomía**: Clasificación jerárquica de organismos. Jerarquía:
Reino → Filo → Clase → Orden → Familia → Subfamilia → Género → Especie

**Nombre científico** (`scientific_name`): Nombre binomial en latín, e.g. "Heliconia stricta Huber".
Sigue la nomenclatura binomial de Linneo.

**Occurrence ID**: Identificador único global de un registro de ocurrencia en Darwin Core.

**Basis of Record**: Cómo se originó el registro. Valores comunes:
- `PreservedSpecimen`: espécimen físico preservado (lo más común en herbarios)
- `HumanObservation`: observación en campo sin colecta
- `LivingSpecimen`: organismo vivo

**Determination / Identification**: El proceso de identificar la especie de un espécimen.
`determined_by` es quien lo identificó, `determination_date` es cuándo.

**Type Status**: Si el espécimen es un tipo nomenclatural (holotype, paratype, etc.) —
muy importante para la taxonomía formal.

**Colecta**: El acto de recolectar un espécimen en campo.

## Términos del sistema

**API Gateway**: Patrón donde un único endpoint (`POST /api/service`) despacha a múltiples
servicios internos según el campo `service` del payload.

**Soft Delete**: Marcar como eliminado (`deleted_at = NOW()`) en lugar de borrar el registro.

**HEAA**: Herbario del Instituto Tecnológico del Putumayo (nombre del herbario).

**GBIF**: Global Biodiversity Information Facility — portal internacional de datos de biodiversidad.
Los datos en Darwin Core pueden publicarse allí.

**SiB Colombia**: Sistema de Información sobre Biodiversidad de Colombia — portal nacional.

**Dokploy**: Plataforma self-hosted para desplegar aplicaciones con Docker, similar a Heroku/Railway.

**Traefik**: Reverse proxy y load balancer que gestiona SSL automático con Let's Encrypt.


---

## Red de conexiones

- Ontología: [[entities]]
- Campos DwC: [[darwin-core-fields]]
- Índice: [[DAIMUZ]]
