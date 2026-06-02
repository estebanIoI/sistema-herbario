# Entorno de Desarrollo

## Puertos

| Servicio | Dev local (.env) | Docker (host) |
|----------|-----------------|---------------|
| Backend (Express) | **5001** | 5001 |
| Frontend (Next.js) | 3000 | 3000 |
| MySQL | 3306 | — (solo interno Docker) |
| Redis | 6379 | — (solo interno Docker) |

⚠️ **El backend corre en 5001 tanto local como en Docker** (PORT=5001 en .env).
En dev local: `NEXT_PUBLIC_API_URL=http://localhost:5001`
En Docker: el compose usa la misma configuración.

---

## Comandos de desarrollo

```bash
# Backend
cd backend
pnpm install
pnpm run dev      # development con nodemon (hot reload)
pnpm start        # producción
pnpm run migrate  # ejecutar migraciones SQL (scripts/migrate.js)
pnpm run seed     # poblar datos iniciales (scripts/seed.js)
pnpm run build    # migrate + seed (para CI/CD)
pnpm test         # Jest
pnpm run docs     # generar documentación (scripts/generate-docs.js)

# Frontend
cd frontend
pnpm install
pnpm run dev      # Next.js dev server (:3000)
pnpm run build && pnpm start  # producción

# Docker (deploy completo)
docker compose up -d
docker compose logs -f backend
docker compose logs -f frontend
docker compose ps   # ver estado de todos los servicios
```

---

## Variables de entorno — backend/.env completo

```env
# Entorno
NODE_ENV=development
PORT=5001

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=herbario_user
DB_PASSWORD=[tu_password]
DB_NAME=herbario_heaa

# Autenticación
JWT_SECRET=[string_largo_aleatorio]

# CORS y Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=[tu_cloud]
CLOUDINARY_API_KEY=[tu_key]
CLOUDINARY_API_SECRET=[tu_secret]
CLOUDINARY_FOLDER=herbario

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760    # 10 MB en bytes

# Rate Limiting (3 niveles)
RATE_LIMIT_WINDOW_MS=900000        # 15 min en ms
RATE_LIMIT_MAX_REQUESTS=100        # General: 100 req/15min por IP
RATE_LIMIT_STRICT_MAX=5            # Estricto: 5 req/15min (operaciones sensibles)
RATE_LIMIT_LOGIN_MAX=5             # Login: 5 intentos/15min

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/combined.log
ERROR_LOG_FILE=logs/error.log

# Seguridad
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# WebSockets
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## Variables de entorno — frontend/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[tu_cloud]
```

---

## Rate Limiting — 3 niveles

| Nivel | Límite | Ventana | Aplica a |
|---|---|---|---|
| General | 100 req | 15 min | Todo `/api/service` |
| Estricto | 5 req | 15 min | Operaciones sensibles (cambio de contraseña, etc.) |
| Login | 5 req | 15 min | `auth.login`, `auth.register` |

⚠️ El rate limiter de login NO actualiza `login_attempts` en la tabla `users` — el bloqueo es a nivel de IP via middleware, no a nivel de cuenta de usuario.

---

## Prerrequisitos

- Node.js 18+
- MySQL 8+ (local o Docker)
- pnpm (recomendado)
- Docker Desktop (para deploy completo)

---

## Stack exacto con versiones

**Backend:**
- express 4.18.2 · bcryptjs 2.4.3 · jsonwebtoken 9.0.2
- mysql2 3.14.1 · cloudinary 2.9.0 · multer 2.0.1
- sharp 0.33.5 · socket.io 4.7.4 · winston 3.11.0
- zod 3.22.4 · node-cache 5.1.2 · node-cron 3.0.3
- nodemailer 7.0.5 · helmet 7.1.0 · compression 1.7.4

**Frontend:**
- Next.js 15.2.4 · React 19 · TypeScript 5
- Tailwind CSS 3.4.17 · Radix UI (30+ componentes)
- Chart.js + Recharts 2.15.0 (ambas disponibles — Chart.js para admin, Recharts como alternativa)
- Leaflet 1.9.4 + react-leaflet 5.0.0 + react-leaflet-cluster 4.0.0

⚠️ El frontend tiene `api-backup.ts` y `api-clean.ts` en `lib/` — son archivos huérfanos. **Solo usar `lib/api.ts`.**

---

## Red de conexiones

- Deploy: [[deployment]]
- Integraciones: [[integrations]]
- Vars de entorno: [[universal-constraints]] (#8)
- Rate limiting: [[middleware]]
- Índice: [[DAIMUZ]]
