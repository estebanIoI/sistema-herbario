# Ontología — Qué ES cada entidad

## Planta (Plant)

Un **espécimen** físico de planta recolectado en campo, prensado, secado y depositado
en el herbario físico del HEAA. Tiene:
- Un **número de herbario** único (`herbarium_number`) que corresponde a la etiqueta física
- Una **identificación taxonómica** siguiendo Darwin Core
- **Datos de colección**: quién la recolectó, dónde, cuándo
- **Imágenes** digitales del espécimen o de la planta en campo
- Un **estado** (`draft` mientras se está catalogando, `published` cuando es público)

Una planta NO es una especie (puede haber múltiples especímenes de la misma especie).

## Usuario (User)

Una persona con acceso al sistema. Tiene un **rol** que determina qué puede hacer:
- **admin**: gestión completa del sistema
- **collector**: puede registrar nuevos especímenes (personas que colectan plantas)
- **user**: acceso de lectura + sugerencias

## Sugerencia (Suggestion)

Una propuesta enviada por un usuario registrado. Puede ser:
- Corrección de datos de una planta (`data_correction`)
- Nueva planta a agregar (`new_plant`)
- Mejora de funcionalidad (`improvement`, `feature`)
- Reporte de error (`bug`)

Sigue un flujo: `pending` → `in_review` → `approved` o `rejected`.

## Colector (Collector)

Una persona (puede o no tener cuenta en el sistema) que recolectó especímenes en campo.
En `plants`: `collector_name` (texto libre) + opcionalmente `collector_user_id` (FK a users).

## Familia / Género / Especie

No son entidades propias con tabla — son **valores únicos derivados** de los registros
de `plants` mediante consultas DISTINCT. El módulo `taxonomy` los expone como si fueran
catálogos, pero viven en las columnas de `plants`.

## Publicación (Post)

Un artículo del blog del herbario. No es científico — es contenido divulgativo sobre
botánica, noticias del herbario, guías de campo, etc.

## PQRSDF

Peticiones, Quejas, Reclamaciones, Denuncias y Felicitaciones de ciudadanos.
Canal formal de comunicación, independiente del sistema de sugerencias de plantas.

## Settings

Configuraciones clave-valor del sistema. Las `is_public=true` se cargan sin autenticación
(nombre del herbario, descripción, links redes sociales). Las privadas requieren admin.


---

## Red de conexiones

- Campos DwC: [[darwin-core-fields]]
- Tablas: [[db-tables-index]]
- Módulo principal: [[plants/compressed|plants]]
- Índice: [[modules-index]] · [[DAIMUZ]]
