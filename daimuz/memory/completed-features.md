# Features 100% Completadas

## Core del sistema
- [x] API Gateway unificado (`POST /api/service`)
- [x] Registro de 100+ servicios en `services/index.js`
- [x] Middleware de autenticación JWT (`middleware/auth.js`)
- [x] Middleware de rate limiting (express-rate-limit)
- [x] Middleware de seguridad (Helmet, CORS)
- [x] Logging centralizado (Winston)
- [x] Health checks (`/health`, `/info`)
- [x] Manejo centralizado de errores

## Módulo auth
- [x] Login con JWT
- [x] Registro de usuario
- [x] Logout
- [x] Me (usuario actual)
- [x] Refresh token
- [x] Cambio de contraseña
- [x] Recuperación de contraseña (email)
- [x] Reset de contraseña con token

## Módulo plants
- [x] CRUD completo (create, read, update, delete)
- [x] Soft delete con `deleted_at`
- [x] Búsqueda por texto (FULLTEXT)
- [x] Búsqueda avanzada con múltiples filtros
- [x] Filtros: familia, género, ubicación, colector
- [x] Paginación y ordenamiento
- [x] Plantas para mapa (`getForMap`)
- [x] Gestión de imágenes por planta
- [x] Imágenes en Cloudinary
- [x] Imagen principal (`is_main`)
- [x] Estadísticas de plantas

## Módulo users
- [x] CRUD completo de usuarios
- [x] Sistema de roles (admin/collector/user)
- [x] Gestión de perfil propio
- [x] Cambio de rol (solo admin)
- [x] Activar/desactivar cuenta
- [x] Historial de actividad

## Módulo dashboard
- [x] Estadísticas globales
- [x] Distribución por familia (Chart.js)
- [x] Distribución geográfica
- [x] Actividad reciente
- [x] Top colectores
- [x] Estadísticas mensuales
- [x] Estado del sistema (health)

## Módulo suggestions
- [x] Crear sugerencia
- [x] Flujo de moderación (pending → approved/rejected)
- [x] Asignación a admin
- [x] Comentarios en sugerencias
- [x] Conteo de no leídas

## Frontend
- [x] Catálogo público de plantas
- [x] Detalle de planta
- [x] Formulario de sugerencia
- [x] Login
- [x] Perfil de usuario
- [x] Panel admin completo (dashboard, plantas, usuarios, sugerencias, configuración, estadísticas)
- [x] Mapa interactivo Leaflet
- [x] Tema oscuro/claro
- [x] Diseño responsivo

## Infraestructura
- [x] Docker Compose (MySQL + Redis + Backend + Frontend)
- [x] Dockerfiles (backend y frontend)
- [x] Deploy en Dokploy
- [x] Traefik con SSL automático
- [x] Volúmenes persistentes (MySQL, Redis, uploads, logs)


---

## Red de conexiones

- Estado: [[current-state]]
- Módulos: [[modules-index]]
- Changelog: [[changelog]]
- Índice: [[DAIMUZ]]
