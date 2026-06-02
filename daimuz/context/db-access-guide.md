# Guía: Acceso a la BD en Dokploy y Ejecución del SQL

*Última actualización: 2026-06-02*

---

## 1. Infraestructura actual

```
VPS: 2.24.195.20
  │
  ├─ :3000  → Dokploy Dashboard  (http://2.24.195.20:3000)
  ├─ :80    → Traefik HTTP
  ├─ :443   → Traefik HTTPS
  │
  └─ Docker Compose (proyecto herbario)
       ├─ herbario-db       (MySQL 8 · interno 3306 · SIN puerto en host)
       ├─ herbario-redis    (Redis  7 · interno 6379 · SIN puerto en host)
       ├─ herbario-backend  (Node   · interno 5001  · via Traefik → API_DOMAIN)
       └─ herbario-frontend (Next   · interno 3000  · via Traefik → APP_DOMAIN)
```

**La BD NO tiene puerto expuesto al host.** Solo se accede via `docker exec`.

---

## 2. Métodos de acceso a la BD

### Método A — Dokploy UI (sin SSH, más fácil)

1. Abrir `http://2.24.195.20:3000` → ingresar al dashboard
2. Clic en **"Docker"** en el menú lateral izquierdo
3. Buscar el contenedor `herbario-db` → clic en el ícono de **terminal** (>_)
4. Se abre una terminal dentro del contenedor MySQL
5. Ejecutar:

```bash
mysql -u root -prootheaa
```

→ ya estás dentro de MySQL como root.

---

### Método B — SSH al VPS + docker exec

```bash
# 1. Conectar al VPS
ssh root@2.24.195.20

# 2. Entrar al contenedor MySQL
docker exec -it herbario-db bash

# 3. Dentro del contenedor — abrir MySQL como root
mysql -u root -prootheaa
# ó interactivo (más seguro):
mysql -u root -p
# cuando pida password → ingresar: rootheaa
```

---

### Método C — Ejecutar SQL directo sin entrar al shell

```bash
# Desde el VPS (via SSH)

# Ejecutar el SQL principal completo:
docker exec -i herbario-db mysql -u root -prootheaa herbario_heaa \
  < /ruta/local/herbario_heaa_actualizado.sql

# Ejecutar el SQL montado dentro del contenedor:
docker exec herbario-db mysql -u root -prootheaa herbario_heaa \
  -e "SOURCE /docker-entrypoint-initdb.d/01-schema.sql;"
```

---

## 3. Comandos SQL esenciales una vez dentro

```sql
-- Ver todas las bases de datos
SHOW DATABASES;

-- Seleccionar la BD del herbario
USE herbario_heaa;

-- Ver todas las tablas
SHOW TABLES;

-- Ver estructura de plants
DESCRIBE plants;

-- Verificar si ya tiene nombres Darwin Core (migración aplicada)
SHOW COLUMNS FROM plants LIKE 'catalog_number';
-- Si devuelve 1 fila → BD ya tiene DwC ✓
-- Si devuelve 0 filas → BD tiene nombres viejos → necesita migración

-- Contar registros existentes
SELECT COUNT(*) FROM plants;
SELECT COUNT(*) FROM users;

-- Salir de MySQL
EXIT;
```

---

## 4. Diagnóstico: ¿necesita migración?

```sql
USE herbario_heaa;

-- Verificar nombres actuales de columnas en plants
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'herbario_heaa' 
  AND TABLE_NAME = 'plants'
ORDER BY ORDINAL_POSITION;
```

| Si ves... | Estado |
|-----------|--------|
| `catalog_number`, `specific_epithet`, `recorded_by`... | BD ya es DwC ✓ — no necesita migración |
| `herbarium_number`, `species`, `collector_name`... | BD tiene nombres viejos → ir a **Opción A o B** abajo |

---

## 5. Ejecutar el SQL principal — 3 opciones

### OPCIÓN 1: BD vacía / sin datos que preservar (RECOMENDADO para staging)

Esta opción reinicializa la BD desde cero con el esquema correcto.
El `herbario_heaa_actualizado.sql` ya está montado dentro del contenedor.

```bash
# Desde el VPS (via SSH)

# 1. Ver el nombre real del volumen
docker volume ls | grep mysql

# 2. Bajar los contenedores
docker compose -p <proyecto-dokploy> down
# Si no sabes el nombre del proyecto:
docker ps --format "{{.Names}}" | grep herbario
# El prefijo antes de "_" es el nombre del proyecto

# 3. Eliminar el volumen de datos de MySQL
docker volume rm <nombre-del-volumen-mysql>
# Ejemplo: docker volume rm GczxCNFZaHn-zHoLsgcE1_mysql_data

# 4. Levantar todo de nuevo
docker compose -p <proyecto-dokploy> up -d
# O desde Dokploy UI → Deploy
```

MySQL inicializa automáticamente con `/docker-entrypoint-initdb.d/01-schema.sql`
(que es `herbario_heaa_actualizado.sql` con los nombres Darwin Core correctos).

---

### OPCIÓN 2: BD con datos a preservar — migración ALTER TABLE

Ejecutar desde dentro de MySQL (`mysql -u root -p`):

```sql
USE herbario_heaa;

-- PASO 1: Backup de la tabla (por si acaso)
CREATE TABLE plants_backup_20260602 AS SELECT * FROM plants;

-- PASO 2: Renombrar columnas a Darwin Core
ALTER TABLE plants
  RENAME COLUMN herbarium_number         TO catalog_number,
  RENAME COLUMN species                  TO specific_epithet,
  RENAME COLUMN author                   TO scientific_name_authorship,
  RENAME COLUMN collector_name           TO recorded_by,
  RENAME COLUMN collector_number         TO record_number,
  RENAME COLUMN collection_date          TO event_date,
  RENAME COLUMN department               TO state_province,
  RENAME COLUMN specific_location        TO locality,
  RENAME COLUMN altitude                 TO minimum_elevation_in_meters,
  RENAME COLUMN latitude                 TO decimal_latitude,
  RENAME COLUMN longitude                TO decimal_longitude,
  RENAME COLUMN latitude_sexagesimal     TO decimal_latitude_sexagesimal,
  RENAME COLUMN longitude_sexagesimal    TO decimal_longitude_sexagesimal,
  RENAME COLUMN preparation              TO preparations,
  RENAME COLUMN habit                    TO plant_habit,
  RENAME COLUMN geodetic_datum           TO geodetic;

-- PASO 3: Verificar
DESCRIBE plants;
-- Confirmar que aparecen catalog_number, specific_epithet, etc.

-- PASO 4: Recrear las vistas (referencian columnas renombradas)
DROP VIEW IF EXISTS plants_with_main_image;
DROP VIEW IF EXISTS featured_plants;
DROP VIEW IF EXISTS recent_activity;
DROP VIEW IF EXISTS stats_summary;

-- Luego ejecutar solo la sección de CREATE VIEW del archivo SQL
-- o usar Opción 3 abajo para aplicar el archivo completo
```

---

### OPCIÓN 3: Ejecutar el SQL completo sobre BD existente

El archivo `herbario_heaa_actualizado.sql` usa `DROP TABLE IF EXISTS` antes de cada `CREATE TABLE`.
**Esto borra todos los datos existentes.** Solo usar si no hay datos que preservar.

```bash
# Desde dentro del contenedor MySQL:
mysql -u root -prootheaa

# Dentro de MySQL:
SOURCE /docker-entrypoint-initdb.d/01-schema.sql;
```

```bash
# O desde el VPS directamente:
docker exec herbario-db sh -c \
  'mysql -u root -prootheaa herbario_heaa < /docker-entrypoint-initdb.d/01-schema.sql'
```

---

## 6. Verificación post-migración

```sql
USE herbario_heaa;

-- Tablas que deben existir
SHOW TABLES;
-- Debe incluir: plants, users, plant_images, families, genera, species_names,
--              departments, municipalities, collection_sites, suggestions,
--              activity_logs, settings, pqrsdf, uploads

-- Columnas DwC en plants
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA='herbario_heaa' AND TABLE_NAME='plants'
ORDER BY ORDINAL_POSITION;
-- Debe tener: catalog_number, recorded_by, event_date, state_province...

-- Vistas
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';
-- Debe incluir: plants_with_main_image, featured_plants, recent_activity, stats_summary

-- Test rápido del backend
-- Hacer GET http://2.24.195.20:5001/health (si el puerto está expuesto)
-- O via dominio configurado
```

---

## 7. Problemas conocidos del entorno actual

### ⚠️ Variables de entorno incompletas

| Variable | Estado | Impacto |
|----------|--------|---------|
| `APP_DOMAIN=herbario.tudominio.com` | Placeholder — sin DNS real | Traefik no puede enrutar por dominio |
| `API_DOMAIN=api.herbario.tudominio.com` | Placeholder — sin DNS real | Ídem |
| `CLOUDINARY_API_KEY=` | Vacía | Subida de imágenes deshabilitada |
| `CLOUDINARY_API_SECRET=` | Vacía | Ídem |

### Consecuencias actuales:
- Los contenedores ESTÁN corriendo (backend:5001, frontend:3000 internamente) ✓
- La app NO es accesible via HTTPS con dominio hasta configurar DNS real
- La subida de imágenes a Cloudinary fallará hasta agregar las credenciales

### Para acceder a la app sin dominio (modo desarrollo):
```
# Si el backend expone el puerto directamente (verificar docker ps):
http://2.24.195.20:5001/health

# El frontend necesita dominio o un proxy configurado
```

---

## 8. Flujo recomendado para dejar producción funcional

```
1. [ ] Configurar dominio real en APP_DOMAIN y API_DOMAIN
2. [ ] Apuntar DNS del dominio a 2.24.195.20
3. [ ] Agregar CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en Dokploy Environment
4. [ ] Ejecutar migración BD (Opción 1 si no hay datos, Opción 2 si hay datos)
5. [ ] Verificar /health del backend
6. [ ] Crear primer usuario admin desde la BD:
       INSERT INTO users (name, email, password_hash, role)
       VALUES ('Admin', 'admin@itp.edu.co', '<bcrypt_hash>', 'admin');
```

---

## Red de conexiones

- Arquitectura: [[deployment]]
- Migración DwC: [[darwin-core-migration]]
- Estado actual: [[current-state]]
- Índice: [[DAIMUZ]]
