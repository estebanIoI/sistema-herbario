# Índice de Módulos

**Total registrados en `services/index.js`: 91 servicios**

| Módulo | Servicios | Qué hace (1 línea) |
|--------|:---------:|-------------------|
| **auth** | 9 | JWT: login, registro, logout, me, refresh, forgotPassword, resetPassword, changePassword, verifyEmail |
| **plants** | 26 | CRUD catálogo botánico Darwin Core, búsqueda FULLTEXT, imágenes, exportación, estadísticas, mapa |
| **users** | 12 | CRUD cuentas, roles (admin/collector/user), perfiles, avatares, historial actividad |
| **dashboard** | 8 | getStats · visitorsChart · plantsByFamily · plantsByLocation · recentActivity · topCollectors · monthlyStats · systemHealth |
| **suggestions** | 12 | Sugerencias con moderación (pending→approved/rejected), votos, comentarios, countUnread |
| **taxonomy** | 11 | Catálogo taxonómico: familias, géneros, especies, árbol jerárquico, validación de nombres |
| **locations** | 8 | Ubicaciones: departamentos, municipios, sitios de colección, estadísticas por zona |
| **settings** | 8 | Configuración clave-valor: getPublic (sin auth), getAll, update, backup, restore, testCloudinary |
| **uploads** | 8 | Archivos: upload, delete, validate, resize (sharp), getStorageStats |
| **public** | 6 | **Sin auth** — getStats, getFeaturedPlants, getFilterOptions, autocompletado. Usado por el frontend sin token |
| **validation** | 4 | Validación de datos de entrada antes de operaciones críticas |
| **validation** | 4 | Validación de entrada: datos de planta, taxonomía, catalog_number único, DwC | [→](../modules/validation/compressed.md) |
| **posts** | 5 | ⚠️ **SIN TABLA** — controladores existen pero TODAS las operaciones fallan en runtime | [→](../modules/posts/compressed.md) |
| **pqrsdf** | 2 | Peticiones ciudadanas con radicado (PQRSDF-YYYYMMDD-XXXXX), estados en español | [→](../modules/pqrsdf/compressed.md) |

---

## Red de conexiones — Módulos individuales

[[auth/compressed|auth]] · [[plants/compressed|plants]] · [[users/compressed|users]] · [[dashboard/compressed|dashboard]] · [[suggestions/compressed|suggestions]] · [[taxonomy/compressed|taxonomy]] · [[locations/compressed|locations]] · [[settings/compressed|settings]] · [[uploads/compressed|uploads]] · [[public/compressed|public]]

## Índices complementarios

[[endpoints-index]] · [[db-tables-index]] · [[files-index]]

## Arquitectura y gobernanza

[[backend]] · [[frontend]] · [[database]] · [[universal-constraints]] · [[DAIMUZ]]
