# Índice de Archivos Críticos

## Backend — Entrada y configuración

| Archivo | Propósito |
|---------|-----------|
| `backend/server.js` | Punto de entrada, levanta Express en PORT (default 5000) |
| `backend/src/app.js` | Configuración de Express: middlewares, rutas, CORS, Helmet |
| `backend/src/config/database.js` | Pool de conexiones MySQL (mysql2) |
| `backend/src/config/cloudinary.js` | Configuración Cloudinary |
| `backend/src/config/socket.js` | Configuración Socket.io |
| `backend/.env` | Variables de entorno (NO commitear) |
| `backend/herbario_heaa_actualizado.sql` | Schema completo de BD |

## Backend — API Gateway (el corazón)

| Archivo | Propósito |
|---------|-----------|
| `backend/src/routes/service.js` | Define ruta `POST /api/service` |
| `backend/src/controllers/serviceController.js` | Recibe petición, resuelve servicio, despacha |
| `backend/src/services/index.js` | **REGISTRO DE TODOS LOS SERVICIOS** — mapa `"modulo.accion"` → función |

## Backend — Controladores por módulo

| Archivo | Módulo |
|---------|--------|
| `backend/src/controllers/auth/authController.js` | auth — coordinador |
| `backend/src/controllers/auth/login.js` | auth.login |
| `backend/src/controllers/auth/register.js` | auth.register |
| `backend/src/controllers/auth/me.js` | auth.me |
| `backend/src/controllers/plants/plantsController.js` | plants — coordinador |
| `backend/src/controllers/plants/getAll.js` | plants.getAll |
| `backend/src/controllers/plants/getById.js` | plants.getById |
| `backend/src/controllers/plants/search.js` | plants.search / advancedSearch |
| `backend/src/controllers/plants/getForMap.js` | plants.getForMap |
| `backend/src/controllers/plants/taxonomyController.js` | taxonomy.* |
| `backend/src/controllers/plants/locationsController.js` | locations.* |
| `backend/src/controllers/users/usersController.js` | users — coordinador |
| `backend/src/controllers/dashboard/dashboardController.js` | dashboard.* |
| `backend/src/controllers/suggestions/suggestionsController.js` | suggestions.* |
| `backend/src/controllers/settings/settingsController.js` | settings.* |

## Backend — Middlewares

| Archivo | Propósito |
|---------|-----------|
| `backend/src/middleware/auth.js` | Validar JWT del campo `token` en el payload |
| `backend/src/middleware/errorHandler.js` | Manejo centralizado de errores |
| `backend/src/middleware/rateLimiter.js` | Rate limiting por IP |
| `backend/src/middleware/upload.js` | Multer para subida de archivos |

## Backend — Rutas directas

| Archivo | Ruta |
|---------|------|
| `backend/src/routes/plants.js` | `POST /api/plantas/upload` |
| `backend/src/routes/media.js` | `GET /api/media/plantas/:file` |

## Frontend — Páginas principales

| Archivo | Ruta web |
|---------|----------|
| `frontend/app/page.tsx` | `/` — Inicio |
| `frontend/app/plantas/page.tsx` | `/plantas` — Catálogo público |
| `frontend/app/plantas/[id]/page.tsx` | `/plantas/:id` — Detalle planta |
| `frontend/app/login/page.tsx` | `/login` |
| `frontend/app/usuario/page.tsx` | `/usuario` — Perfil |
| `frontend/app/admin/page.tsx` | `/admin` — Dashboard |
| `frontend/app/admin/plantas/page.tsx` | `/admin/plantas` |
| `frontend/app/admin/plantas/nueva/page.tsx` | `/admin/plantas/nueva` |
| `frontend/app/admin/plantas/[id]/editar/page.tsx` | `/admin/plantas/:id/editar` |
| `frontend/app/admin/usuarios/page.tsx` | `/admin/usuarios` |
| `frontend/app/admin/sugerencias/page.tsx` | `/admin/sugerencias` |
| `frontend/app/admin/configuracion/page.tsx` | `/admin/configuracion` |
| `frontend/app/admin/estadisticas/page.tsx` | `/admin/estadisticas` |
| `frontend/app/publicaciones/page.tsx` | `/publicaciones` |

## Frontend — Lib (cliente y contextos)

| Archivo | Propósito |
|---------|-----------|
| `frontend/lib/api.ts` | **Cliente API principal** (898 líneas) — usar siempre este |
| `frontend/lib/api-backup.ts` | ⚠️ Versión anterior — NO usar |
| `frontend/lib/api-clean.ts` | ⚠️ Versión alternativa — NO usar |
| `frontend/lib/auth-context.tsx` | `AuthProvider` + hook `useAuth()` · token en localStorage |
| `frontend/lib/cloudinary.ts` | Config y utils de Cloudinary |
| `frontend/lib/use-public-settings.ts` | Hook para `settings.getPublic` |
| `frontend/lib/utils.ts` | Función `cn()` (clsx + tailwind-merge) |

## Frontend — Componentes clave

| Archivo | Propósito |
|---------|-----------|
| `frontend/components/plant-card.tsx` | Tarjeta de planta en el catálogo |
| `frontend/components/plant-data-sheet.tsx` | Ficha completa de datos |
| `frontend/components/map/PlantMap.tsx` | Mapa Leaflet con clustering |
| `frontend/components/advanced-filters.tsx` | Panel de filtros avanzados |
| `frontend/components/suggestion-form.tsx` | Formulario de sugerencias |
| `frontend/components/cloudinary-image.tsx` | Imagen optimizada Cloudinary |
| `frontend/components/admin-sidebar.tsx` | Sidebar del panel admin |
| `frontend/components/navbar.tsx` | Barra de navegación |
| `frontend/components/footer.tsx` | Pie de página |
| `frontend/components/visitors-chart.tsx` | Gráfico de visitantes |
| `frontend/components/globe-polaroids.tsx` | Globo 3D decorativo (cobe) |

## Frontend — Hooks

| Archivo | Propósito |
|---------|-----------|
| `frontend/hooks/use-plants.ts` | Operaciones con plantas |
| `frontend/hooks/use-search.ts` | Lógica de búsqueda |
| `frontend/hooks/use-filters.ts` | Estado de filtros del catálogo |
| `frontend/hooks/use-dashboard.ts` | Datos del dashboard admin |

## Frontend — Config

| Archivo | Propósito |
|---------|-----------|
| `frontend/next.config.mjs` | `output: 'standalone'` · build errors ignored · images unoptimized |
| `frontend/.env.local` | NEXT_PUBLIC_API_URL (default: localhost:5001) · NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME |
| `frontend/app/layout.tsx` | ThemeProvider → AuthProvider → Navbar/Footer/Toaster |

## Backend — Scripts

| Archivo | Propósito |
|---------|-----------|
| `backend/scripts/migrate.js` | Ejecutar migraciones de BD |
| `backend/scripts/seed.js` | Poblar datos iniciales |
| `backend/scripts/generate-docs.js` | Generar documentación API |

## Deploy

| Archivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Orquestación: MySQL, Redis, Backend, Frontend |
| `backend/Dockerfile` | Imagen del backend |
| `frontend/Dockerfile` | Imagen del frontend |


---

## Red de conexiones

- Módulos: [[modules-index]]
- Arquitectura: [[backend]] · [[frontend]]
- Índice: [[DAIMUZ]]
