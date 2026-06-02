# 🌿 Backend - Herbario Digital HEAA

Backend del sistema del Herbario Digital del Instituto Tecnológico del Putumayo.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

## 📋 Características

### ✅ Implementado
- ✅ Arquitectura modular completa
- ✅ API Gateway con ruta única `/api/service`
- ✅ Autenticación JWT funcional
- ✅ Sistema CRUD completo de plantas
- ✅ Búsqueda avanzada de plantas
- ✅ Dashboard con estadísticas
- ✅ Sistema de sugerencias
- ✅ Gestión de usuarios
- ✅ Configuraciones públicas
- ✅ Health checks
- ✅ Logging centralizado
- ✅ Middlewares de seguridad

### 🚧 Por Implementar
- 🚧 Sistema de subida de archivos con Multer
- 🚧 Sistema de notificaciones completo
- 🚧 Exportación de datos
- 🚧 Sistema de cache con Redis
- 🚧 Tests unitarios e integración
- 🚧 Documentación automática con Swagger

## 🔒 Seguridad

### Middlewares Implementados
- **CORS**: Configurado para el frontend
- **Helmet**: Headers de seguridad
- **Rate Limiting**: Prevención de ataques de fuerza bruta
- **Validación**: Validación de entrada en cada endpoint

### Autenticación JWT
- Tokens con expiración de 24 horas
- Rutas protegidas para operaciones administrativas
- Middleware de autenticación completo

## 📡 API Endpoints

### Ruta Principal
Todas las peticiones del frontend van a: `POST /api/service`

```javascript
{
  "service": "plants.getAll",
  "data": { "page": 1, "limit": 12 },
  "token": "jwt_token_here" // Solo para servicios protegidos
}
```

### Servicios Disponibles

#### 🔐 Autenticación
- `auth.login` - Iniciar sesión
- `auth.register` - Registrar usuario
- `auth.me` - Información del usuario actual
- `auth.logout` - Cerrar sesión
- `auth.forgotPassword` - Recuperar contraseña
- `auth.resetPassword` - Restablecer contraseña

#### 🌱 Plantas
- `plants.getAll` - Listar plantas con paginación
- `plants.getById` - Obtener planta por ID
- `plants.search` - Búsqueda avanzada
- `plants.create` - Crear nueva planta (admin)
- `plants.update` - Actualizar planta (admin)
- `plants.delete` - Eliminar planta (admin)
- `plants.getStats` - Estadísticas de plantas

#### 🏷️ Taxonomía
- `taxonomy.getFamilies` - Obtener familias
- `taxonomy.getGenera` - Obtener géneros
- `taxonomy.getSpecies` - Obtener especies

#### 📍 Ubicaciones
- `locations.getDepartments` - Obtener departamentos
- `locations.getMunicipalities` - Obtener municipios

#### 👥 Usuarios (Admin)
- `users.getAll` - Listar usuarios
- `users.getById` - Obtener usuario por ID
- `users.create` - Crear usuario
- `users.update` - Actualizar usuario
- `users.delete` - Eliminar usuario
- `users.toggleStatus` - Activar/desactivar usuario

#### 📊 Dashboard (Admin)
- `dashboard.getStats` - Estadísticas del dashboard
- `dashboard.getRecentActivity` - Actividad reciente

#### 💡 Sugerencias
- `suggestions.getAll` - Listar sugerencias (admin)
- `suggestions.create` - Crear sugerencia
- `suggestions.approve` - Aprobar sugerencia (admin)
- `suggestions.reject` - Rechazar sugerencia (admin)

#### ⚙️ Configuraciones
- `settings.getPublic` - Configuraciones públicas
- `settings.update` - Actualizar configuraciones (admin)

## 🏗️ Arquitectura

```
src/
├── app.js                 # Configuración principal de Express
├── server.js             # Servidor HTTP
├── config/               # Configuraciones
│   ├── database.js       # Conexión MySQL
│   └── socket.js         # WebSockets
├── controllers/          # Controladores por módulo
│   ├── auth/            # Autenticación
│   ├── plants/          # Plantas
│   ├── users/           # Usuarios
│   ├── dashboard/       # Dashboard
│   ├── suggestions/     # Sugerencias
│   ├── taxonomy/        # Taxonomía
│   ├── locations/       # Ubicaciones
│   └── settings/        # Configuraciones
├── middleware/          # Middlewares
│   ├── auth.js         # Autenticación JWT
│   ├── rateLimiter.js  # Rate limiting
│   └── errorHandler.js # Manejo de errores
├── routes/             # Rutas
│   └── service.js      # Ruta principal del API
├── services/           # Registro de servicios
│   └── index.js        # Mapeo de servicios
└── utils/              # Utilidades
    └── logger.js       # Sistema de logging
```

## 🎯 Beneficios de la Arquitectura Modular

1. **Una sola ruta**: El frontend solo necesita conocer `/api/service`
2. **Organización clara**: Cada funcionalidad en su módulo
3. **Mantenibilidad**: Fácil de mantener y expandir
4. **Escalabilidad**: Cada módulo puede crecer independientemente
5. **Reutilización**: Lógica compartida entre módulos
6. **Desarrollo en equipo**: Módulos independientes para cada desarrollador

## 🐛 Debugging

### Logs del Servidor
El servidor muestra logs detallados:

```
🚀 Servidor del Herbario Digital HEAA iniciado
📡 Escuchando en: http://localhost:5000
🏥 Health check: http://localhost:5000/health
📋 API endpoints: http://localhost:5000/api
🌿 Sistema: Herbario Digital HEAA - Instituto Tecnológico del Putumayo
```

### Health Check
Verificar estado del sistema:
```bash
curl http://localhost:5000/health
```

### Información del Sistema
```bash
curl http://localhost:5000/info
```

## 🌍 Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=herbario_heaa

# JWT
JWT_SECRET=tu_clave_secreta_aqui

# Puerto del servidor
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Entorno
NODE_ENV=development
```

## 📄 Licencia

© 2024 Instituto Tecnológico del Putumayo - Herbario Digital HEAA


---

## Red de conexiones

- Arquitectura del backend: [[backend]]
- Deploy: [[deployment]]
- Identidad: [[DAIMUZ]]
