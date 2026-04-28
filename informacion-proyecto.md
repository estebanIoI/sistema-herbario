# Información del Proyecto - Sistema Herbario Digital HEAA

## Descripción General

El **Sistema Herbario Digital HEAA** es una aplicación web completa desarrollada para el Instituto Tecnológico del Putumayo. El sistema permite la gestión digital de colecciones de plantas, incluyendo catalogación, búsqueda avanzada, visualización de datos y administración de usuarios. Está compuesto por un backend robusto en Node.js y un frontend moderno en Next.js.

## Arquitectura del Sistema

### Backend
- **Framework**: Node.js con Express.js
- **Base de Datos**: MySQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Arquitectura**: Modular con controladores, servicios, middlewares y rutas separadas
- **API Gateway**: Ruta única `/api/service` para todas las operaciones
- **Características Adicionales**:
  - Sistema de logging centralizado con Winston
  - Middlewares de seguridad (CORS, Helmet, Rate Limiting)
  - WebSockets con Socket.io para comunicación en tiempo real
  - Gestión de archivos con Multer y Cloudinary
  - Cache básico con node-cache
  - Health checks para monitoreo

### Frontend
- **Framework**: Next.js con TypeScript
- **UI/UX**: Tailwind CSS con componentes Radix UI
- **Mapas**: Leaflet para visualización geográfica
- **Gráficos**: Chart.js para estadísticas
- **Gestión de Estado**: Context API para autenticación
- **Características**:
  - Diseño responsivo
  - Tema oscuro/claro
  - Formularios avanzados con validación
  - Búsqueda y filtros dinámicos
  - Dashboard administrativo

## Tecnologías Utilizadas

### Backend
- **Lenguaje**: JavaScript (Node.js)
- **Framework Web**: Express.js
- **Base de Datos**: MySQL con mysql2
- **Autenticación**: jsonwebtoken, bcryptjs
- **Validación**: express-validator, zod
- **Seguridad**: helmet, cors, express-rate-limit
- **Archivos**: multer, sharp, cloudinary
- **Comunicación**: socket.io
- **Utilidades**: moment, uuid, winston, node-cron, nodemailer
- **Cache**: node-cache
- **Compresión**: compression

### Frontend
- **Lenguaje**: TypeScript
- **Framework**: Next.js (App Router)
- **Estilos**: Tailwind CSS, PostCSS
- **Componentes UI**: Radix UI (accordion, dialog, dropdown, etc.)
- **Formularios**: React Hook Form con resolvers
- **Mapas**: Leaflet
- **Gráficos**: Chart.js
- **Utilidades**: date-fns, clsx, class-variance-authority
- **Imágenes**: Cloudinary

## Base de Datos

La base de datos está diseñada siguiendo estándares de Darwin Core para colecciones biológicas:

- **Tablas Principales**:
  - `users`: Gestión de usuarios y autenticación
  - `plants`: Catálogo de plantas con taxonomía completa
  - `plant_images`: Gestión de imágenes asociadas
  - `suggestions`: Sistema de sugerencias de usuarios
  - `settings`: Configuraciones del sistema
  - `activity_logs`: Registro de actividades
  - `uploads`: Gestión de archivos subidos

- **Características**:
  - Campos extendidos para taxonomía (kingdom, phylum, class, order, etc.)
  - Información de colección (occurrence_id, basis_of_record, etc.)
  - Ubicación detallada (county, locality)
  - Características morfológicas (flower_color, fruit_color, etc.)
  - Índices optimizados para búsquedas y filtros

## Características Implementadas

### ✅ Completadas
- Arquitectura modular completa
- API Gateway unificada
- Autenticación JWT funcional
- CRUD completo de plantas
- Búsqueda avanzada con filtros
- Dashboard con estadísticas
- Sistema de sugerencias
- Gestión de usuarios
- Configuraciones públicas
- Health checks
- Logging centralizado
- Middlewares de seguridad

### 🚧 Pendientes
- Sistema completo de subida de archivos
- Notificaciones avanzadas
- Exportación de datos
- Cache con Redis
- Tests unitarios e integración
- Documentación automática con Swagger

## Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18+)
- MySQL
- pnpm (recomendado) o npm

### Backend
```bash
cd backend
pnpm install
cp .env.example .env  # Configurar variables de entorno
pnpm run dev  # Desarrollo
pnpm start  # Producción
```

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev  # Desarrollo
pnpm run build && pnpm start  # Producción
```

### Docker
El proyecto incluye configuración Docker para despliegue:
```bash
cd backend/docker
docker-compose up
```

## Estructura del Proyecto

```
sistema-herbario/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/      # Middlewares de seguridad
│   │   ├── models/          # Modelos de datos
│   │   ├── routes/          # Definición de rutas
│   │   ├── services/        # Servicios auxiliares
│   │   ├── sockets/         # WebSockets
│   │   └── utils/           # Utilidades
│   ├── tests/               # Tests de integración
│   ├── docs/                # Documentación API
│   └── Dockerfile           # Configuración Docker
├── frontend/
│   ├── app/                 # Páginas Next.js
│   ├── components/          # Componentes reutilizables
│   ├── hooks/               # Hooks personalizados
│   ├── lib/                 # Utilidades y configuración
│   └── public/              # Archivos estáticos
└── README.md
```

## Equipo de Desarrollo

- **Institución**: Instituto Tecnológico del Putumayo
- **Proyecto**: Herbario Digital HEAA
- **Desarrollador**: [Nombre del desarrollador/pasante]

## Conclusión

Este proyecto representa una solución completa para la digitalización y gestión de colecciones de herbario, facilitando la investigación científica y la educación en botánica. La arquitectura modular y las tecnologías modernas utilizadas aseguran escalabilidad, mantenibilidad y una experiencia de usuario óptima.</content>
<parameter name="filePath">c:\Users\esteb\OneDrive\Documents\proyectos\herbario\sistema herbario\informacion-proyecto.md