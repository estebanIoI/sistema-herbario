-- ===============================================
-- BASE DE DATOS MYSQL - HERBARIO DIGITAL HEAA
-- Instituto Tecnológico del Putumayo
-- Versión: 3.0 - Esquema Optimizado y Actualizado
-- Fecha: 2024-11-24
-- ===============================================
-- 
-- CAMBIOS REALIZADOS EN ESTA VERSIÓN:
-- =====================================
-- 
-- 1. TABLA PLANTS - Nuevos campos agregados:
--    - kingdom, phylum, class_name, order_name, subfamily, subgenus (taxonomía extendida)
--    - occurrence_id, basis_of_record, record_type (Darwin Core)
--    - identified_by, date_identified (determinación)
--    - county, locality (ubicación detallada)
--    - organism_quantity, organism_quantity_type, life_stage, preparation, disposition (colección)
--    - flower_color, fruit_color, leaf_characteristics (características morfológicas)
--    - image_urls (JSON para URLs de imágenes)
--    - institution_code, institution_id, collection_code, collection_id (información institucional)
--
-- 2. TABLAS ELIMINADAS (no usadas en código):
--    - taxonomy (familias/géneros se consultan directamente desde plants)
--    - locations (departamentos/municipios se consultan directamente desde plants)
--    - suggestion_comments (no implementado)
--    - sessions (se usa JWT; la duración de sesión se calcula desde activity_logs)
--    - page_views (reemplazado por activity_logs con action='view_plant')
--    - search_logs (no implementado)
--
-- 3. TABLAS MANTENIDAS Y OPTIMIZADAS:
--    - users (autenticación y perfil; last_login se actualiza en cada login)
--    - plants (Darwin Core + views INT para contador de vistas por planta)
--    - plant_images (gestión de imágenes con file_size)
--    - suggestions (sistema de sugerencias)
--    - settings (configuraciones del sistema)
--    - activity_logs (login, logout, view_plant → métricas reales del dashboard)
--    - uploads (gestión de archivos con file_size real)
--
-- 4. ÍNDICES OPTIMIZADOS:
--    - Índices compuestos para búsquedas frecuentes
--    - FULLTEXT para búsqueda de texto
--    - Índices en campos de filtrado del frontend
--
-- ===============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS herbario_heaa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE herbario_heaa;

SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas que ya no se usan (si existen)
DROP TABLE IF EXISTS taxonomy;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS suggestion_comments;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS page_views;
DROP TABLE IF EXISTS search_logs;

-- ===============================================
-- TABLA DE USUARIOS
-- Campos usados en: login.js, register.js, me.js, usersController.js
-- ===============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Información básica (usada en login, register, me)
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'collector') DEFAULT 'user',
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    
    -- Perfil (usados en usersController.js)
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    institution VARCHAR(200),
    specialization VARCHAR(200),
    bio TEXT,
    
    -- Verificación de email (mencionado pero no implementado completamente)
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(100),
    
    -- Recuperación de contraseña (forgotPassword.js, resetPassword.js)
    password_reset_token VARCHAR(100),
    password_reset_expires DATETIME,
    
    -- Tracking de login (usados en login.js)
    last_login DATETIME,
    login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Índices
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLA PRINCIPAL DE PLANTAS
-- Campos usados en: plantsController.js, getAll.js, getById.js, create.js
-- Campos del formulario: /admin/plantas/nueva/page.tsx
-- ===============================================
DROP TABLE IF EXISTS plants;
CREATE TABLE plants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- ==============================
    -- INFORMACIÓN DE REGISTRO (Darwin Core)
    -- Usados en formulario de nueva planta
    -- ==============================
    occurrence_id VARCHAR(50) COMMENT 'ID del registro biológico (occurrenceID)',
    basis_of_record VARCHAR(50) COMMENT 'Base del registro: PreservedSpecimen, LivingSpecimen, etc.',
    record_type VARCHAR(50) COMMENT 'Tipo: PhysicalObject, Event, etc.',
    
    -- ==============================
    -- INFORMACIÓN TAXONÓMICA COMPLETA
    -- Usados en getById.js, formulario frontend
    -- ==============================
    scientific_name VARCHAR(200) NOT NULL COMMENT 'Nombre científico completo',
    common_name VARCHAR(200) COMMENT 'Nombre común',
    vernacular_name VARCHAR(200) COMMENT 'Nombre vernáculo/local',
    
    -- Jerarquía taxonómica extendida (Darwin Core)
    kingdom VARCHAR(50) DEFAULT 'Plantae',
    phylum VARCHAR(50) DEFAULT 'Magnoliophyta',
    class_name VARCHAR(50) DEFAULT 'Equisetopsida' COMMENT 'Clase taxonómica (class es palabra reservada)',
    order_name VARCHAR(100) COMMENT 'Orden taxonómico',
    family VARCHAR(100) COMMENT 'Familia',
    subfamily VARCHAR(100) COMMENT 'Subfamilia',
    genus VARCHAR(100) COMMENT 'Género',
    subgenus VARCHAR(100) COMMENT 'Subgénero',
    species VARCHAR(100) COMMENT 'Epíteto específico',
    infraspecific_epithet VARCHAR(100) COMMENT 'Epíteto infraespecífico',
    
    author VARCHAR(200) COMMENT 'Autor del nombre científico',
    taxon_rank VARCHAR(50) DEFAULT 'species' COMMENT 'Categoría del taxón',
    taxon_remarks TEXT COMMENT 'Comentarios taxonómicos',
    taxonomic_status ENUM('accepted', 'synonym', 'unresolved') DEFAULT 'accepted',
    
    -- ==============================
    -- INFORMACIÓN DEL HERBARIO
    -- Usados en plantsController.js
    -- ==============================
    herbarium_number VARCHAR(50) UNIQUE COMMENT 'Número de catálogo',
    determination_date DATE COMMENT 'Fecha de determinación',
    determined_by VARCHAR(200) COMMENT 'Determinado por',
    identified_by VARCHAR(200) COMMENT 'Identificado por (separado de determinado)',
    date_identified DATE COMMENT 'Fecha de identificación',
    type_status ENUM('holotype', 'isotype', 'paratype', 'lectotype', 'neotype', 'epitype', 'none') DEFAULT 'none',
    
    -- Información institucional
    institution_code VARCHAR(200) DEFAULT 'Instituto Tecnológico del Putumayo (ITP)' COMMENT 'Código de la institución',
    institution_id VARCHAR(50) DEFAULT '800.247.940' COMMENT 'ID de la institución',
    collection_code VARCHAR(50) DEFAULT 'HEAA' COMMENT 'Código de la colección',
    collection_id VARCHAR(50) COMMENT 'ID de la colección',
    geodetic_datum VARCHAR(20) DEFAULT 'WGS84' COMMENT 'Datum geodésico',

    -- Actualización/Confirmación (Darwin Core)
    updated_by VARCHAR(200) COMMENT 'Actualizado/Confirmado por',
    date_updated DATE COMMENT 'Fecha de actualización/Confirmación',

    -- Proyecto y fotografía
    project VARCHAR(300) COMMENT 'Nombre del proyecto de investigación',
    photo_record VARCHAR(500) COMMENT 'Fotografía en Montaje (URL o referencia)',
    
    -- ==============================
    -- INFORMACIÓN DE COLECCIÓN
    -- Usados en plantsController.js, formulario
    -- ==============================
    collector_name VARCHAR(200) COMMENT 'Nombre del colector (recordedBy)',
    collector_number VARCHAR(50) COMMENT 'Número del colector (recordNumber)',
    additional_collectors TEXT COMMENT 'Colectores adicionales',
    collection_date DATE COMMENT 'Fecha de colección (eventDate)',
    collector_user_id INT COMMENT 'ID del usuario colector (si está registrado)',
    field_number VARCHAR(50) COMMENT 'Número de campo',
    field_notes TEXT COMMENT 'Notas de campo',
    
    -- Datos de muestreo
    organism_quantity VARCHAR(50) COMMENT 'Cantidad del organismo',
    organism_quantity_type VARCHAR(100) COMMENT 'Tipo de cantidad',
    life_stage VARCHAR(100) COMMENT 'Etapa de vida: Floración, Fructificación, etc.',
    preparation VARCHAR(100) COMMENT 'Tipo de preparación: Exsicado botánico, etc.',
    disposition VARCHAR(100) COMMENT 'Disposición: En colección, En préstamo, etc.',
    sampling_protocol VARCHAR(200) COMMENT 'Protocolo de muestreo',
    
    -- ==============================
    -- INFORMACIÓN GEOGRÁFICA
    -- Usados en plantsController.js, locationsController.js
    -- ==============================
    country VARCHAR(100) DEFAULT 'Colombia',
    department VARCHAR(100) COMMENT 'Departamento (stateProvince)',
    county VARCHAR(100) COMMENT 'Municipio del formulario (county)',
    municipality VARCHAR(100) COMMENT 'Centro poblado / Cabecera municipal',
    specific_location TEXT COMMENT 'Localidad específica',
    
    -- Coordenadas
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    latitude_sexagesimal VARCHAR(50) COMMENT 'Latitud en formato sexagesimal',
    longitude_sexagesimal VARCHAR(50) COMMENT 'Longitud en formato sexagesimal',
    altitude INT COMMENT 'Elevación en metros',
    coordinate_uncertainty INT COMMENT 'Incertidumbre de coordenadas en metros',
    georeferenced_by VARCHAR(200),
    
    -- ==============================
    -- INFORMACIÓN ECOLÓGICA Y HÁBITAT
    -- Usados en plantsController.js
    -- ==============================
    habitat TEXT COMMENT 'Descripción del hábitat',
    substrate VARCHAR(200) COMMENT 'Sustrato donde crece',
    associated_species TEXT COMMENT 'Especies asociadas',
    abundance ENUM('rare', 'occasional', 'frequent', 'abundant') COMMENT 'Abundancia',
    reproductive_state VARCHAR(100) COMMENT 'Estado reproductivo',
    
    -- ==============================
    -- DESCRIPCIÓN MORFOLÓGICA
    -- Usados en getById.js, formulario de características
    -- ==============================
    habit VARCHAR(100) COMMENT 'Hábito: Árbol, Arbusto, Hierba, etc.',
    height_min DECIMAL(5,2) COMMENT 'Altura mínima en metros',
    height_max DECIMAL(5,2) COMMENT 'Altura máxima en metros',
    dbh DECIMAL(5,2) COMMENT 'Diámetro a la altura del pecho (DAP)',
    description TEXT COMMENT 'Descripción general',
    distinguishing_features TEXT COMMENT 'Características distintivas',
    
    -- Características morfológicas detalladas (formulario frontend)
    flower_color VARCHAR(200) COMMENT 'Color de la flor',
    fruit_color VARCHAR(200) COMMENT 'Color del fruto',
    leaf_characteristics TEXT COMMENT 'Características de las hojas',
    
    -- ==============================
    -- INFORMACIÓN DE USO Y CONSERVACIÓN
    -- Usados en getById.js
    -- ==============================
    uses TEXT COMMENT 'Usos conocidos',
    care_instructions TEXT COMMENT 'Instrucciones de cuidado',
    conservation_status ENUM('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE') DEFAULT 'NE' COMMENT 'Estado IUCN',
    
    -- ==============================
    -- INFORMACIÓN DEL SISTEMA
    -- Usados en plantsController.js, getAll.js
    -- ==============================
    status ENUM('draft', 'published', 'review', 'deleted') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE COMMENT 'Planta destacada',
    views INT DEFAULT 0 COMMENT 'Contador de vistas',
    
    -- Referencias a usuarios
    created_by INT COMMENT 'Usuario que creó el registro',
    reviewed_by INT COMMENT 'Usuario que revisó',
    reviewed_at TIMESTAMP NULL,
    
    -- Notas y observaciones
    observations TEXT COMMENT 'Observaciones generales',
    notes TEXT COMMENT 'Notas adicionales',
    additional_remarks TEXT COMMENT 'Observaciones adicionales del formulario',
    
    -- Campo JSON para URLs de imágenes (usado en getById.js)
    image_urls JSON COMMENT 'URLs de imágenes en formato JSON',
    
    -- ==============================
    -- TIMESTAMPS
    -- ==============================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- ==============================
    -- CLAVES FORÁNEAS
    -- ==============================
    FOREIGN KEY (collector_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- ==============================
    -- ÍNDICES PARA BÚSQUEDAS DEL FRONTEND
    -- Optimizados según consultas en plantsController.js, getAll.js
    -- ==============================
    INDEX idx_scientific_name (scientific_name),
    INDEX idx_family (family),
    INDEX idx_genus (genus),
    INDEX idx_species (species),
    INDEX idx_common_name (common_name),
    INDEX idx_vernacular_name (vernacular_name),
    INDEX idx_status (status),
    INDEX idx_department (department),
    INDEX idx_municipality (municipality),
    INDEX idx_collector (collector_name),
    INDEX idx_collection_date (collection_date),
    INDEX idx_created_at (created_at),
    INDEX idx_herbarium_number (herbarium_number),
    INDEX idx_featured (featured),
    INDEX idx_views (views),
    
    -- Índices compuestos para consultas frecuentes
    INDEX idx_status_featured (status, featured),
    INDEX idx_family_status (family, status),
    INDEX idx_department_municipality (department, municipality),
    INDEX idx_created_status (created_at, status),
    INDEX idx_status_created (status, created_at),
    
    -- Búsqueda de texto completo
    FULLTEXT idx_fulltext_search (scientific_name, common_name, vernacular_name, description, habitat, uses)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLA DE IMÁGENES DE PLANTAS
-- Usada en: plantsController.js (getById, create)
-- ===============================================
DROP TABLE IF EXISTS plant_images;
CREATE TABLE plant_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plant_id INT NOT NULL,
    
    -- Información de la imagen
    image_url VARCHAR(500) NOT NULL COMMENT 'URL de la imagen',
    thumbnail_url VARCHAR(500) COMMENT 'URL del thumbnail',
    original_filename VARCHAR(200) COMMENT 'Nombre original del archivo',
    
    -- Metadatos
    caption TEXT COMMENT 'Descripción/leyenda',
    image_type ENUM('habit', 'leaf', 'flower', 'fruit', 'bark', 'detail', 'habitat', 'herbarium_sheet', 'other') DEFAULT 'habit',
    is_main BOOLEAN DEFAULT FALSE COMMENT 'Es la imagen principal',
    display_order INT DEFAULT 0 COMMENT 'Orden de visualización',
    
    -- Información técnica
    file_size INT COMMENT 'Tamaño en bytes',
    image_width INT,
    image_height INT,
    mime_type VARCHAR(100),
    
    -- Créditos
    photographer VARCHAR(200),
    photo_date DATE,
    copyright_info VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- FK y índices
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id),
    INDEX idx_is_main (is_main),
    INDEX idx_display_order (display_order),
    INDEX idx_image_type (image_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLA DE SUGERENCIAS
-- Usada en: suggestionsController.js, create.js, getAll.js, approve.js, reject.js
-- ===============================================
DROP TABLE IF EXISTS suggestions;
CREATE TABLE suggestions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Información de la sugerencia (usada en create.js)
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('feature', 'bug', 'improvement', 'data_correction', 'new_plant') DEFAULT 'feature',
    
    -- Estado y prioridad (usada en getAll.js, approve.js, reject.js)
    status ENUM('pending', 'in_review', 'approved', 'rejected', 'implemented') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Referencias
    user_id INT COMMENT 'Usuario registrado que envía',
    assigned_to INT COMMENT 'Admin asignado',
    plant_id INT COMMENT 'Planta relacionada si aplica',
    
    -- Datos de contacto para sugerencias anónimas (guardados en attachments)
    attachments JSON COMMENT 'Datos adicionales: contact_name, contact_email, archivos',
    
    -- Votos
    votes_up INT DEFAULT 0,
    votes_down INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    -- FKs
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
    
    -- Índices (usados en getAll.js para filtrado)
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_plant_id (plant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLA DE CONFIGURACIONES DEL SISTEMA
-- Usada en: settingsController.js, getPublic.js
-- ===============================================
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type ENUM('string', 'number', 'boolean', 'json', 'text') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Visible para usuarios no autenticados',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key_name (key_name),
    INDEX idx_category (category),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLA DE ACTIVIDAD/LOGS
-- Usada en: login.js, logout.js, getById.js, dashboardController.js
-- Acciones registradas:
--   'login'      → metadata: { login_at }
--   'logout'     → metadata: { session_duration_seconds }
--   'view_plant' → entidad: plant (para gráfico de visitantes)
-- ===============================================
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) COMMENT 'plant, suggestion, user, session',
    entity_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON COMMENT 'Datos adicionales: login_at, session_duration_seconds, etc.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at),
    -- Índice compuesto para el gráfico de visitantes (acción + fecha)
    INDEX idx_action_date (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLA DE ARCHIVOS/UPLOADS
-- Usada en: uploadsController.js, plants.js (route)
-- ===============================================
DROP TABLE IF EXISTS uploads;
CREATE TABLE uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Información del archivo
    filename VARCHAR(255) NOT NULL COMMENT 'Nombre generado del archivo',
    original_name VARCHAR(255) NOT NULL COMMENT 'Nombre original',
    file_path VARCHAR(500) NOT NULL COMMENT 'Ruta en el servidor',
    file_size INT NOT NULL COMMENT 'Tamaño en bytes',
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) COMMENT 'Hash MD5 para detectar duplicados',
    
    -- Asociación con entidades
    entity_type VARCHAR(50) COMMENT 'plant, user, suggestion',
    entity_id INT,
    
    -- Metadatos
    uploaded_by INT,
    is_temporary BOOLEAN DEFAULT TRUE COMMENT 'Archivo temporal hasta asociar',
    expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración para temporales',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_file_hash (file_hash),
    INDEX idx_is_temporary (is_temporary),
    INDEX idx_expires_at (expires_at),
    INDEX idx_filename (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TABLA PQRSDF
-- Peticiones, Quejas, Reclamos, Sugerencias,
-- Denuncias y Felicitaciones de ciudadanos
-- Usada en: pqrsdfController.js
-- ===============================================
DROP TABLE IF EXISTS pqrsdf;
CREATE TABLE pqrsdf (
    id INT PRIMARY KEY AUTO_INCREMENT,
    radicado VARCHAR(30) UNIQUE COMMENT 'Número de radicado: PQRSDF-YYYYMMDD-XXXXX',

    -- Tipo de comunicación
    tipo ENUM('peticion','queja','reclamo','sugerencia','denuncia','felicitacion') NOT NULL,

    -- Datos del solicitante (NULL si anónimo)
    anonimo BOOLEAN DEFAULT FALSE,
    nombre VARCHAR(200),
    tipo_identificacion ENUM('CC','CE','PA','NIT','TI','RC','PEP') DEFAULT 'CC',
    numero_documento VARCHAR(50),
    direccion_correspondencia VARCHAR(500),
    medio_respuesta ENUM('correo_fisico','email') DEFAULT 'email',
    telefono VARCHAR(30),
    pais VARCHAR(100) DEFAULT 'Colombia',
    departamento VARCHAR(100),
    ciudad VARCHAR(100),
    email VARCHAR(200),
    fax VARCHAR(30),

    -- Contenido
    mensaje TEXT NOT NULL,
    archivo_url VARCHAR(500) COMMENT 'URL de archivo adjunto (opcional)',

    -- Gestión
    status ENUM('pendiente','en_revision','respondido') DEFAULT 'pendiente',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,

    INDEX idx_tipo (tipo),
    INDEX idx_status (status),
    INDEX idx_radicado (radicado),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ===============================================
-- INSERTAR DATOS INICIALES
-- ===============================================

-- Usuario administrador por defecto
-- Password: admin123  |  Hash generado con bcrypt rounds=12
INSERT INTO users (name, email, password, role, status, email_verified) VALUES
('Administrador HEAA', 'admin@heaa.edu.co', '$2a$12$l27ohWqCHsNVxyOzHsuhhuH3RYamJqMSIse5uvbdai7w5P2qlEgga', 'admin', 'active', TRUE)
ON DUPLICATE KEY UPDATE
  password       = VALUES(password),
  role           = 'admin',
  status         = 'active',
  email_verified = TRUE;

-- Configuraciones iniciales del sistema (usadas en settingsController.js)
INSERT INTO settings (key_name, value, type, category, description, is_public) VALUES 
('site_name', 'Herbario Digital HEAA', 'string', 'general', 'Nombre del sitio web', TRUE),
('site_description', 'Herbario Digital del Instituto Tecnológico del Putumayo', 'string', 'general', 'Descripción del sitio', TRUE),
('institution_name', 'Instituto Tecnológico del Putumayo', 'string', 'general', 'Nombre de la institución', TRUE),
('contact_email', 'herbario@itp.edu.co', 'string', 'contact', 'Email de contacto', TRUE),
('max_file_size', '10485760', 'number', 'uploads', 'Tamaño máximo de archivo en bytes (10MB)', FALSE),
('allowed_image_types', '["jpg", "jpeg", "png", "gif", "webp"]', 'json', 'uploads', 'Tipos de imagen permitidos', FALSE),
('plants_per_page', '12', 'number', 'display', 'Plantas por página en listados', FALSE),
('enable_registration', 'true', 'boolean', 'auth', 'Permitir registro de usuarios', FALSE),
('require_email_verification', 'true', 'boolean', 'auth', 'Requerir verificación de email', FALSE),
('featured_plants_count', '6', 'number', 'pagina', 'Número de plantas destacadas en la página principal', TRUE),
('herbarium_code', 'HEAA', 'string', 'general', 'Código del herbario', TRUE),
('institution_address', 'Mocoa, Putumayo, Colombia', 'string', 'general', 'Dirección de la institución', TRUE),
('institution_phone', '+57 8 429 9406', 'string', 'general', 'Teléfono de la institución', TRUE),
('enable_suggestions', 'true', 'boolean', 'features', 'Permitir sugerencias de usuarios', TRUE),
('enable_public_catalog', 'true', 'boolean', 'features', 'Habilitar catálogo público', TRUE),
('search_results_per_page', '12', 'number', 'search', 'Resultados por página en búsquedas', FALSE)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- ─────────────────────────────────────────────────────────────────────────────
-- Configuraciones de la Página de Inicio (editables desde /admin/pagina)
-- Categoría: 'pagina'  |  Todas públicas para el frontend
-- ─────────────────────────────────────────────────────────────────────────────

-- Banner global
INSERT INTO settings (key_name, value, type, category, description, is_public) VALUES
('banner_enabled',  'false',                                              'boolean', 'pagina', 'Mostrar banner en la página de inicio',     TRUE),
('banner_text',     '',                                                   'string',  'pagina', 'Texto del banner',                          TRUE),
('banner_type',     'info',                                               'string',  'pagina', 'Tipo: info | success | warning | error',    TRUE),
('banner_link',     '',                                                   'string',  'pagina', 'URL enlazada del banner (opcional)',         TRUE),

-- Hero
('hero_title',      'Bienvenido a nuestro Herbario Digital',             'string',  'pagina', 'Título principal del hero',                 TRUE),
('hero_subtitle',   'Descubre la diversidad botánica y aprende sobre la flora de nuestra región.', 'string', 'pagina', 'Subtítulo del hero', TRUE),
('hero_cta1_text',  'Explorar plantas',                                   'string',  'pagina', 'Texto del botón principal del hero',        TRUE),
('hero_cta1_url',   '/plantas',                                           'string',  'pagina', 'URL del botón principal del hero',          TRUE),
('hero_cta2_text',  'Conoce más',                                         'string',  'pagina', 'Texto del botón secundario del hero',       TRUE),
('hero_cta2_url',   '/acerca',                                            'string',  'pagina', 'URL del botón secundario del hero',         TRUE),
('hero_bg_image',   '',    'string',  'pagina', 'URL de imagen de fondo del hero (legacy)',               TRUE),

-- Hero 1 — Carrusel de imágenes
('hero_slide1_image',   '',    'string',  'pagina', 'Imagen slide 1 del carrusel hero',                      TRUE),
('hero_slide1_url',     '',    'string',  'pagina', 'URL de redirección al hacer clic en slide 1',           TRUE),
('hero_slide2_image',   '',    'string',  'pagina', 'Imagen slide 2 del carrusel hero',                      TRUE),
('hero_slide2_url',     '',    'string',  'pagina', 'URL de redirección al hacer clic en slide 2',           TRUE),
('hero_slide3_image',   '',    'string',  'pagina', 'Imagen slide 3 del carrusel hero',                      TRUE),
('hero_slide3_url',     '',    'string',  'pagina', 'URL de redirección al hacer clic en slide 3',           TRUE),
('hero_slide_interval', '5',   'number',  'pagina', 'Intervalo del carrusel hero 1 en segundos (mínimo 2)', TRUE),

-- Hero 2 — Publicaciones y Servicios
('hero2_enabled',       'true',                      'boolean', 'pagina', 'Mostrar sección Publicaciones y Servicios',      TRUE),
('hero2_title',         'Publicaciones y Servicios', 'string',  'pagina', 'Título de la sección hero 2',                   TRUE),
('hero2_subtitle',      '',                          'string',  'pagina', 'Subtítulo de la sección hero 2',                TRUE),
('hero2_interval',      '4',                         'number',  'pagina', 'Intervalo del carrusel hero 2 en segundos',     TRUE),
('hero2_item1_badge',   '',    'string',  'pagina', 'Etiqueta ítem 1 (ej: Publicación, Servicio)',            TRUE),
('hero2_item1_title',   '',    'string',  'pagina', 'Título del ítem 1',                                     TRUE),
('hero2_item1_desc',    '',    'string',  'pagina', 'Descripción del ítem 1',                                TRUE),
('hero2_item1_image',   '',    'string',  'pagina', 'Imagen del ítem 1',                                     TRUE),
('hero2_item1_url',     '',    'string',  'pagina', 'URL del ítem 1',                                        TRUE),
('hero2_item2_badge',   '',    'string',  'pagina', 'Etiqueta ítem 2',                                       TRUE),
('hero2_item2_title',   '',    'string',  'pagina', 'Título del ítem 2',                                     TRUE),
('hero2_item2_desc',    '',    'string',  'pagina', 'Descripción del ítem 2',                                TRUE),
('hero2_item2_image',   '',    'string',  'pagina', 'Imagen del ítem 2',                                     TRUE),
('hero2_item2_url',     '',    'string',  'pagina', 'URL del ítem 2',                                        TRUE),
('hero2_item3_badge',   '',    'string',  'pagina', 'Etiqueta ítem 3',                                       TRUE),
('hero2_item3_title',   '',    'string',  'pagina', 'Título del ítem 3',                                     TRUE),
('hero2_item3_desc',    '',    'string',  'pagina', 'Descripción del ítem 3',                                TRUE),
('hero2_item3_image',   '',    'string',  'pagina', 'Imagen del ítem 3',                                     TRUE),
('hero2_item3_url',     '',    'string',  'pagina', 'URL del ítem 3',                                        TRUE),
('hero2_item4_badge',   '',    'string',  'pagina', 'Etiqueta ítem 4',                                       TRUE),
('hero2_item4_title',   '',    'string',  'pagina', 'Título del ítem 4',                                     TRUE),
('hero2_item4_desc',    '',    'string',  'pagina', 'Descripción del ítem 4',                                TRUE),
('hero2_item4_image',   '',    'string',  'pagina', 'Imagen del ítem 4',                                     TRUE),
('hero2_item4_url',     '',    'string',  'pagina', 'URL del ítem 4',                                        TRUE),

-- Sección Características (Hero 3 — antes Hero 2)
('features_enabled',    'true',                                           'boolean', 'pagina', 'Mostrar sección de características',        TRUE),
('features_title',      'Características de nuestro herbario',           'string',  'pagina', 'Título de la sección de características',   TRUE),
('features_subtitle',   'Nuestro herbario digital ofrece una experiencia completa para explorar y aprender sobre plantas.', 'string', 'pagina', 'Subtítulo de la sección de características', TRUE),
('features_bg_image',   '',                                               'string',  'pagina', 'URL de imagen de fondo de la sección de características', TRUE),
('feature1_icon',       'Leaf',                                           'string',  'pagina', 'Icono de la característica 1 (Lucide)',     TRUE),
('feature1_title',      'Catálogo Extenso',                              'string',  'pagina', 'Título de la característica 1',             TRUE),
('feature1_description','Explora nuestra amplia colección de especies vegetales catalogadas con detalle.', 'string', 'pagina', 'Descripción de la característica 1', TRUE),
('feature1_url',        '/plantas',                                       'string',  'pagina', 'URL de redirección de la tarjeta 1',        TRUE),
('feature2_icon',       'Search',                                         'string',  'pagina', 'Icono de la característica 2 (Lucide)',     TRUE),
('feature2_title',      'Búsqueda Avanzada',                             'string',  'pagina', 'Título de la característica 2',             TRUE),
('feature2_description','Encuentra fácilmente las plantas por nombre, familia, hábitat o características.', 'string', 'pagina', 'Descripción de la característica 2', TRUE),
('feature2_url',        '/plantas',                                       'string',  'pagina', 'URL de redirección de la tarjeta 2',        TRUE),
('feature3_icon',       'Database',                                       'string',  'pagina', 'Icono de la característica 3 (Lucide)',     TRUE),
('feature3_title',      'Información Detallada',                         'string',  'pagina', 'Título de la característica 3',             TRUE),
('feature3_description','Accede a información científica precisa sobre cada especie en nuestra colección.', 'string', 'pagina', 'Descripción de la característica 3', TRUE),
('feature3_url',        '/plantas',                                       'string',  'pagina', 'URL de redirección de la tarjeta 3',        TRUE),

-- Sección Plantas Destacadas
('featured_enabled',       'true',              'boolean', 'pagina', 'Mostrar sección de plantas destacadas',      TRUE),
('featured_section_title', 'Plantas destacadas', 'string', 'pagina', 'Título de la sección de plantas destacadas', TRUE),
('featured_plants_count',  '6',                 'number',  'pagina', 'Número de plantas destacadas en inicio',     TRUE),

-- Logo y marca
('logo_text',       'Herbario Digital',                                   'string',  'pagina', 'Nombre o texto del logo del sitio',         TRUE),
('logo_image_url',  '',                                                   'string',  'pagina', 'URL de imagen de logo (vacío = icono hoja)', TRUE),

-- Pie de página — texto general
('footer_description', 'Explorando y preservando la diversidad botánica para las generaciones futuras.', 'string', 'pagina', 'Descripción en el pie de página', TRUE),
('footer_copyright',   'Herbario Digital. Todos los derechos reservados.', 'string', 'pagina', 'Texto de copyright del pie de página',     TRUE),

-- Pie de página — columna 1
('footer_col1_title',       'Explorar',               'string', 'pagina', 'Título columna 1 del footer',            TRUE),
('footer_col1_link1_text',  'Catálogo de Plantas',    'string', 'pagina', 'Texto enlace 1, columna 1 del footer',   TRUE),
('footer_col1_link1_url',   '/plantas',               'string', 'pagina', 'URL enlace 1, columna 1 del footer',     TRUE),
('footer_col1_link2_text',  'Familias Botánicas',     'string', 'pagina', 'Texto enlace 2, columna 1 del footer',   TRUE),
('footer_col1_link2_url',   '/familias',              'string', 'pagina', 'URL enlace 2, columna 1 del footer',     TRUE),
('footer_col1_link3_text',  'Hábitats',               'string', 'pagina', 'Texto enlace 3, columna 1 del footer',   TRUE),
('footer_col1_link3_url',   '/habitats',              'string', 'pagina', 'URL enlace 3, columna 1 del footer',     TRUE),

-- Pie de página — columna 2
('footer_col2_title',       'Recursos',                    'string', 'pagina', 'Título columna 2 del footer',          TRUE),
('footer_col2_link1_text',  'Guías de Identificación',     'string', 'pagina', 'Texto enlace 1, columna 2 del footer', TRUE),
('footer_col2_link1_url',   '/guias',                      'string', 'pagina', 'URL enlace 1, columna 2 del footer',   TRUE),
('footer_col2_link2_text',  'Publicaciones',               'string', 'pagina', 'Texto enlace 2, columna 2 del footer', TRUE),
('footer_col2_link2_url',   '/publicaciones',              'string', 'pagina', 'URL enlace 2, columna 2 del footer',   TRUE),
('footer_col2_link3_text',  'Glosario Botánico',           'string', 'pagina', 'Texto enlace 3, columna 2 del footer', TRUE),
('footer_col2_link3_url',   '/glosario',                   'string', 'pagina', 'URL enlace 3, columna 2 del footer',   TRUE),

-- Pie de página — columna 3
('footer_col3_title',       'Contacto',                    'string', 'pagina', 'Título columna 3 del footer',          TRUE),
('footer_col3_link1_text',  'Formulario de Contacto',      'string', 'pagina', 'Texto enlace 1, columna 3 del footer', TRUE),
('footer_col3_link1_url',   '/contacto',                   'string', 'pagina', 'URL enlace 1, columna 3 del footer',   TRUE),
('footer_col3_link2_text',  'info@herbariodigital.com',    'string', 'pagina', 'Texto enlace 2, columna 3 del footer', TRUE),
('footer_col3_link2_url',   '',                            'string', 'pagina', 'URL enlace 2, columna 3 (vacío=texto)', TRUE),
('footer_col3_link3_text',  '+123 456 7890',               'string', 'pagina', 'Texto enlace 3, columna 3 del footer', TRUE),
('footer_col3_link3_url',   '',                            'string', 'pagina', 'URL enlace 3, columna 3 (vacío=texto)', TRUE)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- ─────────────────────────────────────────────────────────────────────────────
-- Configuraciones de la página "Acerca de" (editables desde /admin/pagina)
-- Categoría: 'pagina'  |  Todas públicas para el frontend
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO settings (key_name, value, type, category, description, is_public) VALUES
-- Encabezado
('about_title',            'Herbario HEAA',                                                      'string', 'pagina', 'Título principal de la página Acerca de', TRUE),
('about_subtitle',         'Instituto Tecnológico del Putumayo (ITP) - Mocoa',                   'string', 'pagina', 'Subtítulo de la página Acerca de', TRUE),
-- Historia
('about_history_image',    '',                                                                    'string', 'pagina', 'URL imagen sección Historia (Acerca de)', TRUE),
('about_history_title',    'Nuestra Historia',                                                   'string', 'pagina', 'Título sección Historia', TRUE),
('about_history_p1',       'El Herbario HEAA del Instituto Tecnológico del Putumayo fue fundado en 2005 con el objetivo de documentar, preservar y estudiar la rica diversidad florística de la región amazónica colombiana, con especial énfasis en el departamento del Putumayo.', 'string', 'pagina', 'Párrafo 1 de Historia', TRUE),
('about_history_p2',       'Nombrado en honor al botánico Hernando Ernesto Arias Arias, pionero en el estudio de la flora putumayense, nuestro herbario alberga una colección creciente de especímenes que representan la biodiversidad única de esta región biogeográfica.', 'string', 'pagina', 'Párrafo 2 de Historia', TRUE),
('about_history_p3',       'A lo largo de los años, el Herbario HEAA se ha consolidado como un centro de referencia para la investigación botánica en el sur de Colombia, contribuyendo significativamente al conocimiento científico y a la conservación de los ecosistemas amazónicos.', 'string', 'pagina', 'Párrafo 3 de Historia', TRUE),
-- Misión y Visión
('about_mission_text',     'Documentar, preservar y estudiar la diversidad florística del Putumayo y la región amazónica colombiana, contribuyendo al conocimiento científico, la educación ambiental y la conservación de los ecosistemas a través de la investigación botánica, la formación académica y la divulgación del patrimonio natural.', 'string', 'pagina', 'Texto de la Misión', TRUE),
('about_vision_text',      'Para 2030, el Herbario HEAA será reconocido como un centro de referencia nacional en la investigación botánica amazónica, con una colección representativa de la flora regional, infraestructura moderna, personal altamente calificado y una red de colaboración científica consolidada, contribuyendo activamente a la conservación de la biodiversidad y al desarrollo sostenible del territorio.', 'string', 'pagina', 'Texto de la Visión', TRUE),
-- Estadísticas
('about_stats_title',      'Nuestra Colección',                     'string', 'pagina', 'Título sección Estadísticas', TRUE),
('about_stat1_value',      '5.200+',                                'string', 'pagina', 'Valor estadística 1', TRUE),
('about_stat1_label',      'Especímenes catalogados',               'string', 'pagina', 'Etiqueta estadística 1', TRUE),
('about_stat2_value',      '120+',                                  'string', 'pagina', 'Valor estadística 2', TRUE),
('about_stat2_label',      'Familias botánicas',                    'string', 'pagina', 'Etiqueta estadística 2', TRUE),
('about_stat3_value',      '850+',                                  'string', 'pagina', 'Valor estadística 3', TRUE),
('about_stat3_label',      'Géneros representados',                 'string', 'pagina', 'Etiqueta estadística 3', TRUE),
('about_stat4_value',      '1.800+',                                'string', 'pagina', 'Valor estadística 4', TRUE),
('about_stat4_label',      'Especies documentadas',                 'string', 'pagina', 'Etiqueta estadística 4', TRUE),
-- Pestaña Colecciones
('about_col1_title',       'Colección General',                     'string', 'pagina', 'Título colección 1', TRUE),
('about_col1_text',        'Nuestra colección principal contiene especímenes representativos de la flora del Putumayo y la Amazonía colombiana, organizados según el sistema de clasificación APG IV. Incluye ejemplares de bosques de niebla, bosques andino-amazónicos y ecosistemas de piedemonte.', 'string', 'pagina', 'Texto colección 1', TRUE),
('about_col2_title',       'Colección Etnobotánica',                'string', 'pagina', 'Título colección 2', TRUE),
('about_col2_text',        'Documentamos plantas de importancia cultural para las comunidades indígenas y campesinas de la región, incluyendo especies medicinales, alimenticias, artesanales y de uso ritual, junto con información sobre sus usos tradicionales y conocimientos asociados.', 'string', 'pagina', 'Texto colección 2', TRUE),
('about_col3_title',       'Colección de Plantas Endémicas',        'string', 'pagina', 'Título colección 3', TRUE),
('about_col3_text',        'Sección especializada en la preservación y estudio de especies endémicas del Putumayo y zonas adyacentes, muchas de ellas en categorías de amenaza según la UICN, contribuyendo a su conservación y conocimiento.', 'string', 'pagina', 'Texto colección 3', TRUE),
('about_col4_title',       'Carpoteca y Xiloteca',                  'string', 'pagina', 'Título colección 4', TRUE),
('about_col4_text',        'Colecciones complementarias de frutos, semillas y muestras de madera que apoyan la investigación botánica, forestal y ecológica, facilitando la identificación y caracterización de especies leñosas de la región.', 'string', 'pagina', 'Texto colección 4', TRUE),
-- Pestaña Investigación
('about_res1_title',       'Taxonomía y Sistemática',               'string', 'pagina', 'Título línea de investigación 1', TRUE),
('about_res1_text',        'Estudios sobre la clasificación, identificación y relaciones evolutivas de las plantas amazónicas, con énfasis en familias de alta diversidad en la región como Rubiaceae, Melastomataceae y Araceae.', 'string', 'pagina', 'Texto línea de investigación 1', TRUE),
('about_res2_title',       'Etnobotánica y Conocimiento Tradicional', 'string', 'pagina', 'Título línea de investigación 2', TRUE),
('about_res2_text',        'Investigación sobre los usos, manejos y significados culturales de las plantas para las comunidades indígenas y campesinas del Putumayo, documentando saberes ancestrales y prácticas sostenibles.', 'string', 'pagina', 'Texto línea de investigación 2', TRUE),
('about_res3_title',       'Ecología y Conservación',               'string', 'pagina', 'Título línea de investigación 3', TRUE),
('about_res3_text',        'Estudios sobre la estructura, composición y dinámica de los ecosistemas forestales del piedemonte amazónico, evaluando impactos del cambio climático y actividades humanas en la biodiversidad vegetal.', 'string', 'pagina', 'Texto línea de investigación 3', TRUE),
('about_res4_title',       'Botánica Económica',                    'string', 'pagina', 'Título línea de investigación 4', TRUE),
('about_res4_text',        'Investigación sobre especies vegetales con potencial económico para el desarrollo sostenible de la región, incluyendo plantas medicinales, frutales nativos, ornamentales y especies con aplicaciones industriales.', 'string', 'pagina', 'Texto línea de investigación 4', TRUE),
-- Equipo
('about_member1_image',    '',                                       'string', 'pagina', 'URL foto miembro 1', TRUE),
('about_member1_name',     'Dr. Andrés Orejuela',                   'string', 'pagina', 'Nombre miembro 1', TRUE),
('about_member1_role',     'Director del Herbario',                  'string', 'pagina', 'Cargo miembro 1', TRUE),
('about_member1_bio',      'Doctor en Botánica con especialización en taxonomía de plantas neotropicales. Coordina las actividades científicas y administrativas del herbario.', 'string', 'pagina', 'Bio miembro 1', TRUE),
('about_member2_image',    '',                                       'string', 'pagina', 'URL foto miembro 2', TRUE),
('about_member2_name',     'Dra. Guerly León',                      'string', 'pagina', 'Nombre miembro 2', TRUE),
('about_member2_role',     'Curadora Principal',                     'string', 'pagina', 'Cargo miembro 2', TRUE),
('about_member2_bio',      'Especialista en conservación de colecciones biológicas. Responsable del mantenimiento, organización y preservación de los especímenes.', 'string', 'pagina', 'Bio miembro 2', TRUE),
('about_member3_image',    '',                                       'string', 'pagina', 'URL foto miembro 3', TRUE),
('about_member3_name',     'MSc. Carlos Gómez',                    'string', 'pagina', 'Nombre miembro 3', TRUE),
('about_member3_role',     'Investigador Asociado',                  'string', 'pagina', 'Cargo miembro 3', TRUE),
('about_member3_bio',      'Etnobotánico especializado en conocimientos tradicionales de comunidades indígenas del Putumayo. Lidera proyectos de investigación participativa.', 'string', 'pagina', 'Bio miembro 3', TRUE),
-- Ubicación
('about_location_title',    'Visítanos',                             'string', 'pagina', 'Título sección Ubicación', TRUE),
('about_location_address',  'Instituto Tecnológico del Putumayo\nSede Mocoa - Barrio Luis Carlos Galán\nMocoa, Putumayo, Colombia', 'string', 'pagina', 'Dirección física', TRUE),
('about_location_schedule', 'El Herbario HEAA está abierto para visitas académicas y de investigación de lunes a viernes, de 8:00 am a 12:00 m y de 2:00 pm a 6:00 pm. Para grupos grandes o visitas especializadas, recomendamos agendar con anticipación.', 'string', 'pagina', 'Horario de atención', TRUE),
('about_location_image',    '',                                      'string', 'pagina', 'URL imagen/mapa de ubicación', TRUE),
-- Colaboraciones
('about_partners_title',   'Colaboraciones y Alianzas',              'string', 'pagina', 'Título sección Colaboraciones', TRUE),
('about_partner1_name',    'Institución 1',                          'string', 'pagina', 'Nombre institución colaboradora 1', TRUE),
('about_partner1_image',   '',                                       'string', 'pagina', 'URL logo institución colaboradora 1', TRUE),
('about_partner1_url',     '',                                       'string', 'pagina', 'URL enlace institución colaboradora 1', TRUE),
('about_partner2_name',    'Institución 2',                          'string', 'pagina', 'Nombre institución colaboradora 2', TRUE),
('about_partner2_image',   '',                                       'string', 'pagina', 'URL logo institución colaboradora 2', TRUE),
('about_partner2_url',     '',                                       'string', 'pagina', 'URL enlace institución colaboradora 2', TRUE),
('about_partner3_name',    'Institución 3',                          'string', 'pagina', 'Nombre institución colaboradora 3', TRUE),
('about_partner3_image',   '',                                       'string', 'pagina', 'URL logo institución colaboradora 3', TRUE),
('about_partner3_url',     '',                                       'string', 'pagina', 'URL enlace institución colaboradora 3', TRUE),
('about_partner4_name',    'Institución 4',                          'string', 'pagina', 'Nombre institución colaboradora 4', TRUE),
('about_partner4_image',   '',                                       'string', 'pagina', 'URL logo institución colaboradora 4', TRUE),
('about_partner4_url',     '',                                       'string', 'pagina', 'URL enlace institución colaboradora 4', TRUE),
-- CTA
('about_cta_title',        'Contribuye a nuestra colección',         'string', 'pagina', 'Título del CTA (Acerca de)', TRUE),
('about_cta_text',         'Si eres investigador, estudiante o entusiasta de la botánica, puedes contribuir a nuestro herbario con especímenes, fotografías o información sobre la flora del Putumayo y la Amazonía colombiana.', 'string', 'pagina', 'Texto del CTA', TRUE),
('about_cta_button_text',  'Conoce cómo colaborar',                  'string', 'pagina', 'Texto botón CTA', TRUE),
('about_cta_button_url',   '/contacto',                              'string', 'pagina', 'URL botón CTA', TRUE)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Credenciales de Cloudinary (privadas — is_public = FALSE)
INSERT INTO settings (key_name, value, type, category, description, is_public) VALUES
('cloudinary_cloud_name', '', 'string', 'cloudinary', 'Nombre del cloud en Cloudinary',              FALSE),
('cloudinary_api_key',    '', 'string', 'cloudinary', 'API Key de Cloudinary',                       FALSE),
('cloudinary_api_secret', '', 'string', 'cloudinary', 'API Secret de Cloudinary',                    FALSE),
('cloudinary_folder',     'herbario', 'string', 'cloudinary', 'Carpeta base para imágenes en Cloudinary', FALSE)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Plantas de ejemplo con campos extendidos
INSERT INTO plants (
    scientific_name, common_name, vernacular_name, family, genus, species, author,
    kingdom, phylum, class_name, order_name,
    department, municipality, country, specific_location,
    collector_name, collector_number, collection_date, 
    institution_code, collection_code, herbarium_number,
    status, featured, created_by, description, habitat, uses
) VALUES 
(
    'Lavandula angustifolia', 'Lavanda', 'Lavanda común', 'Lamiaceae', 'Lavandula', 'angustifolia', 'L.',
    'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales',
    'Cundinamarca', 'Bogotá', 'Colombia', 'Jardín Botánico de Bogotá',
    'María Rodríguez', 'MR-123', '2023-05-15',
    'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-001',
    'published', TRUE, 1,
    'Arbusto aromático perenne de hojas estrechas y flores moradas en espigas.',
    'Zonas templadas, suelos bien drenados.',
    'Aromaterapia, cosmética, medicina tradicional, ornamental.'
),
(
    'Rosmarinus officinalis', 'Romero', 'Romero común', 'Lamiaceae', 'Rosmarinus', 'officinalis', 'L.',
    'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales',
    'Cundinamarca', 'Bogotá', 'Colombia', 'Finca La Esperanza',
    'Carlos Gómez', 'CG-456', '2023-06-20',
    'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-002',
    'published', TRUE, 1,
    'Arbusto aromático de hojas lineares y flores azuladas.',
    'Clima mediterráneo, suelos calcáreos.',
    'Culinario, medicinal, ornamental, cosmética.'
),
(
    'Aloe vera', 'Sábila', 'Sábila', 'Asphodelaceae', 'Aloe', 'vera', '(L.) Burm.f.',
    'Plantae', 'Magnoliophyta', 'Liliopsida', 'Asparagales',
    'Valle del Cauca', 'Cali', 'Colombia', 'Huerto familiar urbano',
    'Ana López', 'AL-789', '2023-07-10',
    'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-003',
    'published', TRUE, 1,
    'Planta suculenta con hojas gruesas que contienen gel medicinal.',
    'Zonas tropicales y subtropicales secas.',
    'Medicina tradicional, cosmética, quemaduras, cicatrización.'
),
(
    'Mentha spicata', 'Menta', 'Hierbabuena', 'Lamiaceae', 'Mentha', 'spicata', 'L.',
    'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales',
    'Antioquia', 'Medellín', 'Colombia', 'Huerta comunitaria El Poblado',
    'Pedro Sánchez', 'PS-101', '2023-08-05',
    'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-004',
    'published', FALSE, 1,
    'Hierba perenne aromática con hojas dentadas y flores en espigas.',
    'Suelos húmedos, climas templados a cálidos.',
    'Culinario, medicinal para digestión, aromatizante.'
),
(
    'Ocimum basilicum', 'Albahaca', 'Albahaca', 'Lamiaceae', 'Ocimum', 'basilicum', 'L.',
    'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales',
    'Putumayo', 'Mocoa', 'Colombia', 'Finca agroecológica Valle de Sibundoy',
    'Laura Torres', 'LT-112', '2023-09-12',
    'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-005',
    'published', TRUE, 1,
    'Hierba anual aromática con hojas ovaladas y flores blancas o rosadas.',
    'Climas cálidos, suelos bien drenados.',
    'Culinario italiano, medicina tradicional, repelente de insectos.'
),
(
    'Coffea arabica', 'Café', 'Café arábica', 'Rubiaceae', 'Coffea', 'arabica', 'L.',
    'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Gentianales',
    'Putumayo', 'Villa Garzón', 'Colombia', 'Finca cafetera La Primavera',
    'Miguel Díaz', 'MD-131', '2023-10-03',
    'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-006',
    'published', TRUE, 1,
    'Arbusto de hojas brillantes, flores blancas y frutos rojos con semillas de café.',
    'Bosque tropical húmedo de montaña, entre 1200-1800 msnm.',
    'Bebida estimulante, industria alimentaria, cosmética.'
),
(
    'Solanum lycopersicum', 'Tomate', 'Tomate', 'Solanaceae', 'Solanum', 'lycopersicum', 'L.',
    'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Solanales',
    'Huila', 'Neiva', 'Colombia', 'Cultivo bajo invernadero',
    'Sandra Ruiz', 'SR-141', '2023-11-15',
    'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-007',
    'published', FALSE, 1,
    'Planta herbácea con frutos rojos comestibles ricos en licopeno.',
    'Climas templados a cálidos, suelos fértiles.',
    'Alimentación humana, industria alimentaria, cosmética.'
)
ON DUPLICATE KEY UPDATE scientific_name = VALUES(scientific_name);

-- Sugerencias de ejemplo
INSERT INTO suggestions (
    title, description, type, status, priority, attachments, created_at
) VALUES 
('Mejorar descripción de Lavanda', 'La descripción de la lavanda podría incluir más información sobre sus propiedades medicinales y usos en aromaterapia.', 'improvement', 'pending', 'medium', '{"contact_name":"Juan Usuario","contact_email":"juan@email.com"}', '2024-01-15 10:30:00'),
('Agregar imagen de flores de Romero', 'Sería útil tener una imagen específica de las flores del romero para identificación.', 'improvement', 'in_review', 'low', NULL, '2024-01-20 14:15:00'),
('Corrección en nombre científico', 'Verificar la ortografía del nombre científico de algunas especies de la familia Solanaceae.', 'data_correction', 'pending', 'high', NULL, '2024-02-01 09:45:00'),
('Nueva funcionalidad de mapa', 'Implementar un mapa interactivo para mostrar las ubicaciones de colección de cada espécimen.', 'feature', 'pending', 'medium', '{"contact_name":"Dr. Carlos Botánico","contact_email":"carlos@universidad.edu"}', '2024-02-10 16:20:00'),
('Problema en filtro de búsqueda', 'El filtro por familia no muestra resultados cuando se selecciona Rubiaceae.', 'bug', 'pending', 'high', NULL, '2024-02-15 11:00:00')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ===============================================
-- TRIGGERS PARA LOGS DE ACTIVIDAD
-- ===============================================

DELIMITER //

-- Trigger para nuevas plantas
DROP TRIGGER IF EXISTS plants_activity_insert//
CREATE TRIGGER plants_activity_insert 
AFTER INSERT ON plants
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (NEW.created_by, 'plant_created', 'plant', NEW.id, CONCAT('Planta creada: ', NEW.scientific_name));
END//

-- Trigger para actualización de plantas (cambio de estado)
DROP TRIGGER IF EXISTS plants_activity_update//
CREATE TRIGGER plants_activity_update 
AFTER UPDATE ON plants
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
        VALUES (NEW.created_by, 'plant_status_changed', 'plant', NEW.id, 
                CONCAT('Estado de planta cambiado de ', OLD.status, ' a ', NEW.status, ': ', NEW.scientific_name));
    END IF;
END//

-- Trigger para nuevas sugerencias
DROP TRIGGER IF EXISTS suggestions_activity_insert//
CREATE TRIGGER suggestions_activity_insert 
AFTER INSERT ON suggestions
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (NEW.user_id, 'suggestion_created', 'suggestion', NEW.id, CONCAT('Nueva sugerencia: ', NEW.title));
END//

DELIMITER ;

-- ===============================================
-- VISTAS ÚTILES PARA EL FRONTEND
-- Usadas en dashboardController.js
-- ===============================================

-- Vista para estadísticas rápidas del dashboard
DROP VIEW IF EXISTS stats_summary;
CREATE VIEW stats_summary AS
SELECT 
    (SELECT COUNT(*) FROM plants WHERE status = 'published') as total_plants,
    (SELECT COUNT(DISTINCT family) FROM plants WHERE status = 'published' AND family IS NOT NULL) as total_families,
    (SELECT COUNT(DISTINCT genus) FROM plants WHERE status = 'published' AND genus IS NOT NULL) as total_genera,
    (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
    (SELECT COUNT(*) FROM plant_images) as total_images,
    (SELECT COALESCE(SUM(views), 0) FROM plants WHERE status = 'published') as total_views;

-- Vista para plantas con imagen principal (optimizada para listados)
DROP VIEW IF EXISTS plants_with_main_image;
CREATE VIEW plants_with_main_image AS
SELECT 
    p.id,
    p.scientific_name as nombre,
    p.common_name as nombreComun,
    p.vernacular_name as nombreVernaculo,
    p.family as familia,
    p.genus as genero,
    p.species as especie,
    p.department as departamento,
    p.municipality as municipio,
    p.collector_name as colector,
    p.collector_number as numeroColector,
    COALESCE(pi.image_url, '/placeholder.svg') as imagen,
    pi.thumbnail_url,
    p.views,
    p.featured,
    p.created_at,
    p.status
FROM plants p
LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
WHERE p.status = 'published' AND p.deleted_at IS NULL;

-- Vista para plantas destacadas (página principal)
DROP VIEW IF EXISTS featured_plants;
CREATE VIEW featured_plants AS
SELECT 
    p.id,
    p.scientific_name as nombre,
    p.common_name as nombreComun,
    p.family as familia,
    COALESCE(pi.image_url, '/placeholder.svg') as imagen,
    p.views
FROM plants p
LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
WHERE p.status = 'published' AND p.featured = TRUE AND p.deleted_at IS NULL
ORDER BY p.views DESC, p.created_at DESC;

-- Vista para actividad reciente del dashboard
DROP VIEW IF EXISTS recent_activity;
CREATE VIEW recent_activity AS
SELECT 
    'plant' as activity_type,
    p.scientific_name as title,
    CONCAT('Nueva planta agregada: ', p.scientific_name) as description,
    p.created_at as activity_date,
    u.name as user_name
FROM plants p
LEFT JOIN users u ON p.created_by = u.id
WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
UNION ALL
SELECT 
    'suggestion' as activity_type,
    s.title,
    CONCAT('Nueva sugerencia: ', s.title) as description,
    s.created_at as activity_date,
    u.name as user_name
FROM suggestions s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY activity_date DESC;

-- ===============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ===============================================

DELIMITER //

-- Procedimiento para limpiar archivos temporales expirados
DROP PROCEDURE IF EXISTS cleanup_expired_uploads//
CREATE PROCEDURE cleanup_expired_uploads()
BEGIN
    DELETE FROM uploads 
    WHERE is_temporary = TRUE 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END//

-- Procedimiento para obtener estadísticas por departamento
DROP PROCEDURE IF EXISTS get_stats_by_department//
CREATE PROCEDURE get_stats_by_department()
BEGIN
    SELECT 
        department,
        COUNT(*) as total_plants,
        COUNT(DISTINCT family) as total_families,
        COUNT(DISTINCT genus) as total_genera
    FROM plants 
    WHERE status = 'published' AND department IS NOT NULL
    GROUP BY department
    ORDER BY total_plants DESC;
END//

DELIMITER ;

-- ===============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===============================================

/*
ESQUEMA ACTUALIZADO - HERBARIO DIGITAL HEAA v3.0
==================================================

Este esquema ha sido generado analizando el código real del frontend y backend
del proyecto Herbario HEAA para garantizar compatibilidad total.

TABLAS PRINCIPALES:
------------------
1. users - Usuarios del sistema (autenticación y perfiles)
2. plants - Especímenes del herbario (Darwin Core compatible)
3. plant_images - Imágenes de plantas
4. suggestions - Sistema de sugerencias de usuarios
5. settings - Configuraciones del sistema
6. activity_logs - Logs de actividad
7. uploads - Gestión de archivos subidos

CAMPOS NUEVOS EN PLANTS:
-----------------------
- Taxonomía extendida: kingdom, phylum, class_name, order_name, subfamily, subgenus
- Darwin Core: occurrence_id, basis_of_record, record_type
- Identificación: identified_by, date_identified
- Colección: organism_quantity, organism_quantity_type, life_stage, preparation, disposition
- Morfología: flower_color, fruit_color, leaf_characteristics
- Institucional: institution_code, institution_id, collection_code, collection_id
- JSON: image_urls para almacenar URLs de imágenes

TABLAS ELIMINADAS (no usadas en código):
---------------------------------------
- taxonomy (familias/géneros se consultan desde plants)
- locations (departamentos/municipios se consultan desde plants)
- suggestion_comments (no implementado)
- sessions (se usa JWT)
- page_views (no implementado)
- search_logs (no implementado)

COMANDOS ÚTILES:
---------------
-- Ver estadísticas del dashboard
SELECT * FROM stats_summary;

-- Ver plantas destacadas
SELECT * FROM featured_plants LIMIT 6;

-- Limpiar uploads temporales
CALL cleanup_expired_uploads();

-- Estadísticas por departamento
CALL get_stats_by_department();

NOTAS DE IMPORTACIÓN:
--------------------
- Este archivo puede importarse directamente en MySQL 5.7+ o MariaDB 10.2+
- Se usa SET FOREIGN_KEY_CHECKS = 0 al inicio para evitar errores de orden
- Los INSERTs usan ON DUPLICATE KEY UPDATE para evitar duplicados

COMPATIBILIDAD:
--------------
- Backend: Node.js con mysql2
- Frontend: Next.js 14+ con React 18+
- Base de datos: MySQL 5.7+ / MariaDB 10.2+
*/

COMMIT;
