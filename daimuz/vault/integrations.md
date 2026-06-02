# Integraciones Externas

## Cloudinary (imágenes)

**Propósito**: Almacenamiento y CDN de imágenes en producción.

**Configuración** (`backend/src/config/cloudinary.js`):
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=herbario
```

**Carpeta de destino**: `herbario/plantas/[plant_id]/`

**Transformaciones usadas**:
- Thumbnail: `w_300,h_300,c_fill,q_auto`
- Vista completa: `w_1200,q_auto`

**Paquete**: `cloudinary` npm

---

## MySQL (base de datos principal)

**Driver**: `mysql2/promise`
**Conexión**: pool via `config/database.js`
**Puerto**: 3306 (local) | `db:3306` (Docker)

---

## Redis (caché)

**Estado actual**: Incluido en Docker Compose pero el backend usa `node-cache` principalmente.
**Puerto**: 6379 (local) | `redis:6379` (Docker)
**Configuración**: 256MB max, política `allkeys-lru`
**Pendiente**: migrar caché de node-cache a Redis

---

## Socket.io (WebSockets)

**Propósito**: Notificaciones en tiempo real (implementación pendiente).
**Configuración**: `backend/src/config/socket.js`
**Eventos implementados**: ver `backend/src/sockets/orderSocket.js`

---

## Nodemailer (email)

**Propósito**: Envío de emails para recuperación de contraseña.
**Estado**: Implementado en `auth.forgotPassword`.
**Configuración**: Variables de entorno `SMTP_*` (verificar `.env.example`).

---

## Multer (upload de archivos)

**Propósito**: Manejo de archivos multipart en Node.js.
**Configuración**: `backend/src/middleware/upload.js`
**Límite**: 10MB (`MAX_FILE_SIZE=10485760`)
**Tipos permitidos**: image/jpeg, image/png, image/webp

---

## Traefik (reverse proxy)

**Propósito**: SSL automático, routing por dominio.
**Configuración**: Labels en `docker-compose.yml` por servicio.
**Red**: `dokploy-network` (externa, gestionada por Dokploy).

---

## GBIF / Darwin Core (futuro)

**Propósito**: Publicar datos del herbario en el portal internacional de biodiversidad.
**Estado**: No implementado. La BD ya usa Darwin Core, falta el módulo de exportación.
**Formato de export**: Darwin Core Archive (.zip con meta.xml + occurrences.csv)


---

## Red de conexiones

- Uploads: [[uploads/compressed|uploads]]
- Settings: [[settings/compressed|settings]]
- Deploy: [[deployment]]
- Regla #5: [[universal-constraints]]
- Índice: [[DAIMUZ]]
