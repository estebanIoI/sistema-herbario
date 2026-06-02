# Arquitectura de Despliegue

## Stack de deploy
- **Orquestador**: Dokploy (self-hosted, similar a Railway)
- **Reverse Proxy**: Traefik (SSL automático via Let's Encrypt)
- **Contenedores**: Docker Compose
- **Redes**: `herbario-internal` (privada) + `dokploy-network` (Traefik)

## Servicios en docker-compose.yml

| Servicio | Puerto interno | Puerto expuesto | Imagen |
|----------|---------------|-----------------|--------|
| `herbario-db` | 3306 | — (solo interno) | mysql:8 |
| `herbario-redis` | 6379 | — (solo interno) | redis:alpine |
| `herbario-backend` | 5000 | 5001 → Dokploy | ./backend/Dockerfile |
| `herbario-frontend` | 3000 | 3000 → Dokploy | ./frontend/Dockerfile |

## Volúmenes persistentes

| Volumen | Contenido |
|---------|-----------|
| `mysql_data` | Base de datos MySQL |
| `redis_data` | Cache Redis |
| `uploads_data` | Archivos subidos localmente |
| `logs_data` | Logs de Winston |

## Dependencias de inicio

```
MySQL (healthy) ─┐
                  ├─► Backend (healthy) ─► Frontend
Redis (healthy) ─┘
```

## Variables de entorno en producción

El backend necesita en `.env` o Dokploy env vars:
```
NODE_ENV=production
PORT=5000
DB_HOST=db
REDIS_URL=redis://redis:6379
JWT_SECRET=[secreto largo y aleatorio]
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
FRONTEND_URL=[URL real del frontend]
CORS_ORIGIN=[URL real del frontend]
```

El frontend necesita:
```
NEXT_PUBLIC_API_URL=[URL real del backend]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[nombre del cloud]
```

## Inicialización de BD

El script `backend/herbario_heaa_actualizado.sql` se monta como init script de MySQL.
Solo se ejecuta cuando el volumen `mysql_data` está vacío (primera vez).

## Health checks

- Backend: `GET /health` — verifica conexión MySQL y Redis
- MySQL: `mysqladmin ping`
- Redis: `redis-cli ping`


---

## Red de conexiones

- Backend que despliega: [[backend]]
- Overview: [[overview]]
- Integraciones: [[integrations]]
- Identidad: [[DAIMUZ]]
