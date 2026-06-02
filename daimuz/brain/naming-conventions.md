# Convenciones de Nombres

## Servicios API (el patrón más importante)

Formato: `modulo.accionVerbo`

| Verbo | Cuándo |
|-------|--------|
| `get` | Leer uno o varios |
| `create` | Crear nuevo |
| `update` | Actualizar existente |
| `delete` | Eliminar (soft) |
| `upload` | Subir archivo |
| `export` | Exportar datos |
| `import` | Importar datos |
| `approve` | Aprobar (moderación) |
| `reject` | Rechazar (moderación) |
| `activate` | Activar cuenta/registro |
| `deactivate` | Desactivar cuenta/registro |

Ejemplos: `plants.getAll`, `plants.create`, `users.changeRole`, `suggestions.approve`

## Base de datos

- **Tablas**: `snake_case` plural (`plants`, `plant_images`, `activity_logs`)
- **Columnas de `plants`**: siguen Darwin Core en `snake_case` — ver [vault/darwin-core-fields.md](../vault/darwin-core-fields.md)
- **Columnas generales**: `snake_case` (`scientific_name`, `collector_user_id`, `created_at`)
- **FKs**: `[tabla_referenciada_singular]_id` (`plant_id`, `user_id`)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (soft delete en tablas sin `status`)
- **Booleans**: `is_[algo]` (`is_main`, `is_public`, `is_temporary`)
- **Enums**: valores en inglés, `snake_case` para multi-palabra (`'in_review'`, `'data_correction'`)
- **Palabras reservadas SQL** que son campos DwC: usar sufijo `_name` o prefijo descriptivo
  - `class` → `class_name`
  - `order` → `order_name`
  - `type` → `record_type`

## Archivos de código

- **Controladores**: `[accion].js` dentro de `controllers/[modulo]/`
- **Servicios**: kebab-case → `cacheService.js`, `notificationService.js`
- **Rutas**: `[nombre].js` en `routes/`
- **Middlewares**: `camelCase.js` (`errorHandler.js`, `rateLimiter.js`)

## Frontend

- **Páginas**: `page.tsx` (Next.js App Router)
- **Componentes**: PascalCase (`PlantCard.tsx`, `SearchForm.tsx`)
- **Hooks**: `use[Nombre].ts` (`usePlants.ts`, `useAuth.ts`)
- **Utils**: camelCase (`formatDate.ts`, `apiClient.ts`)

## Rutas web

- Inglés o español consistente con el proyecto: `/plantas`, `/admin/usuarios`, `/publicaciones`
- Slugs: kebab-case (`/plantas/[id]/sugerencia`)


---

## Red de conexiones

- Estándares: [[coding-standards]]
- Campos DwC (snake_case): [[darwin-core-fields]]
- Regla #9: [[universal-constraints]]
- Índice: [[DAIMUZ]]
