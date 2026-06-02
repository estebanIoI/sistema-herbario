-- Herbario Digital HEAA · Instituto Tecnológico del Putumayo
-- v3.0 · MySQL 8.0+ · Esquema Darwin Core
-- Documentación completa: daimuz/indexes/db-tables-index.md

CREATE DATABASE IF NOT EXISTS herbario_heaa
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE herbario_heaa;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS taxonomy;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS suggestion_comments;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS page_views;
DROP TABLE IF EXISTS search_logs;

-- ── users ────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'collector') DEFAULT 'user',
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    institution VARCHAR(200),
    specialization VARCHAR(200),
    bio TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(100),
    password_reset_token VARCHAR(100),
    password_reset_expires DATETIME,
    last_login DATETIME,
    login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── plants ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS plants;
CREATE TABLE plants (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Darwin Core cols 1-3: identificación del registro
    occurrence_id VARCHAR(50) COMMENT 'occurrenceID · ID único global',
    basis_of_record VARCHAR(50) DEFAULT 'PreservedSpecimen' COMMENT 'basisOfRecord',
    record_type VARCHAR(50) DEFAULT 'PhysicalObject' COMMENT 'type · (reservada SQL → record_type)',

    -- Darwin Core cols 4-9: institución y espécimen
    institution_code VARCHAR(200) DEFAULT 'Instituto Tecnológico del Putumayo (ITP)' COMMENT 'institutionCode',
    institution_id VARCHAR(50) DEFAULT '800247940' COMMENT 'institutionID · NIT del ITP',
    collection_code VARCHAR(50) DEFAULT 'HEAA' COMMENT 'collectionCode',
    collection_id VARCHAR(50) COMMENT 'collectionID · URI GRSciColl',
    catalog_number VARCHAR(50) UNIQUE COMMENT 'catalogNumber · número único del espécimen',
    record_number VARCHAR(50) COMMENT 'recordNumber · número de colector en campo',

    -- Darwin Core cols 10-20: evento de colecta
    recorded_by VARCHAR(200) COMMENT 'recordedBy · colectores separados por |',
    organism_quantity VARCHAR(50) COMMENT 'organismQuantity',
    organism_quantity_type VARCHAR(100) COMMENT 'organismQuantityType',
    life_stage VARCHAR(100) COMMENT 'lifeStage',
    preparations VARCHAR(100) COMMENT 'preparations',
    disposition VARCHAR(100) COMMENT 'disposition',
    sampling_protocol VARCHAR(200) COMMENT 'samplingProtocol',
    event_date DATE COMMENT 'eventDate · ISO 8601',
    habitat TEXT COMMENT 'habitat',
    field_number VARCHAR(50) COMMENT 'fieldNumber',
    field_notes TEXT COMMENT 'fieldNotes',
    additional_collectors TEXT,
    collector_user_id INT COMMENT 'FK al usuario colector del sistema',

    -- Darwin Core cols 21-31: localización geográfica
    country VARCHAR(100) DEFAULT 'Colombia' COMMENT 'country',
    state_province VARCHAR(100) COMMENT 'stateProvince · departamento',
    county VARCHAR(100) COMMENT 'county · municipio',
    municipality VARCHAR(100) COMMENT 'municipality · vereda o centro poblado',
    locality TEXT COMMENT 'locality · descripción detallada del sitio',
    minimum_elevation_in_meters INT COMMENT 'minimumElevationInMeters · msnm',
    decimal_latitude DECIMAL(10, 8) COMMENT 'decimalLatitude · negativo=Sur',
    decimal_latitude_sexagesimal VARCHAR(50) COMMENT 'latitud sexagesimal (campo local)',
    decimal_longitude DECIMAL(11, 8) COMMENT 'decimalLongitude · negativo=Oeste',
    decimal_longitude_sexagesimal VARCHAR(50) COMMENT 'longitud sexagesimal (campo local)',
    geodetic VARCHAR(20) DEFAULT 'WGS84' COMMENT 'geodeticDatum',
    coordinate_uncertainty INT COMMENT 'coordinateUncertaintyInMeters',
    georeferenced_by VARCHAR(200) COMMENT 'georeferencedBy',

    -- Darwin Core cols 32-35: identificación taxonómica
    identified_by VARCHAR(200) COMMENT 'identifiedBy',
    date_identified DATE COMMENT 'dateIdentified · ISO 8601',
    updated_by VARCHAR(200) COMMENT 'updatedBy',
    date_updated DATE COMMENT 'dateUpdated',
    determined_by VARCHAR(200) COMMENT 'legado · equivalente a identified_by',
    determination_date DATE COMMENT 'legado · equivalente a date_identified',

    -- Darwin Core cols 36-50: taxonomía
    scientific_name VARCHAR(200) NOT NULL COMMENT 'scientificName · binomial sin autoría',
    scientific_name_authorship VARCHAR(200) COMMENT 'scientificNameAuthorship',
    kingdom VARCHAR(50) DEFAULT 'Plantae' COMMENT 'kingdom',
    phylum VARCHAR(50) DEFAULT 'Magnoliophyta' COMMENT 'phylum',
    class_name VARCHAR(50) DEFAULT 'Equisetopsida' COMMENT 'class · (reservada SQL → class_name)',
    order_name VARCHAR(100) COMMENT 'order · (reservada SQL → order_name)',
    family VARCHAR(100) COMMENT 'family · APG IV',
    subfamily VARCHAR(100) COMMENT 'subfamily',
    genus VARCHAR(100) COMMENT 'genus',
    subgenus VARCHAR(100) COMMENT 'subgenus',
    specific_epithet VARCHAR(100) COMMENT 'specificEpithet',
    infraspecific_epithet VARCHAR(100) COMMENT 'infraspecificEpithet',
    taxon_rank VARCHAR(50) DEFAULT 'species' COMMENT 'taxonRank',
    vernacular_name VARCHAR(200) COMMENT 'vernacularName · nombre común regional',
    taxon_remarks TEXT COMMENT 'taxonRemarks',
    common_name VARCHAR(200) COMMENT 'alias de vernacular_name (compatibilidad)',
    taxonomic_status ENUM('accepted', 'synonym', 'unresolved') DEFAULT 'accepted',

    -- Darwin Core cols 51-52: registro digital y proyecto
    photo_record VARCHAR(500) COMMENT 'photoRecord · URL fotografía del montaje (campo local HEAA)',
    project VARCHAR(300) COMMENT 'proyecto de investigación (campo local HEAA)',

    -- Herbario
    type_status ENUM('holotype', 'isotype', 'paratype', 'lectotype', 'neotype', 'epitype', 'none') DEFAULT 'none' COMMENT 'typeStatus',

    -- Ecología
    substrate VARCHAR(200),
    associated_species TEXT,
    abundance ENUM('rare', 'occasional', 'frequent', 'abundant'),
    reproductive_state VARCHAR(100),

    -- Morfología
    plant_habit VARCHAR(100),
    height_min DECIMAL(5,2),
    height_max DECIMAL(5,2),
    dbh DECIMAL(5,2) COMMENT 'diámetro a la altura del pecho (DAP)',
    description TEXT,
    distinguishing_features TEXT,
    flower_color VARCHAR(200),
    fruit_color VARCHAR(200),
    leaf_characteristics TEXT,

    -- Uso y conservación
    uses TEXT,
    care_instructions TEXT,
    conservation_status ENUM('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE') DEFAULT 'NE' COMMENT 'IUCN Red List',

    -- Sistema
    status ENUM('draft', 'published', 'review', 'deleted') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    views INT DEFAULT 0,
    created_by INT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    observations TEXT,
    notes TEXT,
    additional_remarks TEXT,
    image_urls JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    FOREIGN KEY (collector_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_scientific_name (scientific_name),
    INDEX idx_family (family),
    INDEX idx_genus (genus),
    INDEX idx_specific_epithet (specific_epithet),
    INDEX idx_common_name (common_name),
    INDEX idx_vernacular_name (vernacular_name),
    INDEX idx_status (status),
    INDEX idx_state_province (state_province),
    INDEX idx_municipality (municipality),
    INDEX idx_recorded_by (recorded_by),
    INDEX idx_event_date (event_date),
    INDEX idx_created_at (created_at),
    INDEX idx_catalog_number (catalog_number),
    INDEX idx_featured (featured),
    INDEX idx_views (views),
    INDEX idx_status_featured (status, featured),
    INDEX idx_family_status (family, status),
    INDEX idx_state_municipality (state_province, municipality),
    INDEX idx_created_status (created_at, status),
    INDEX idx_status_created (status, created_at),
    FULLTEXT idx_fulltext_search (scientific_name, common_name, vernacular_name, description, habitat, uses)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── plant_images ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS plant_images;
CREATE TABLE plant_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plant_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    original_filename VARCHAR(200),
    caption TEXT,
    image_type ENUM('habit', 'leaf', 'flower', 'fruit', 'bark', 'detail', 'habitat', 'herbarium_sheet', 'other') DEFAULT 'habit',
    is_main BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    file_size INT,
    image_width INT,
    image_height INT,
    mime_type VARCHAR(100),
    photographer VARCHAR(200),
    photo_date DATE,
    copyright_info VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id),
    INDEX idx_is_main (is_main),
    INDEX idx_display_order (display_order),
    INDEX idx_image_type (image_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── suggestions ──────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS suggestions;
CREATE TABLE suggestions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('feature', 'bug', 'improvement', 'data_correction', 'new_plant') DEFAULT 'feature',
    status ENUM('pending', 'in_review', 'approved', 'rejected', 'implemented') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    user_id INT,
    assigned_to INT,
    plant_id INT,
    attachments JSON COMMENT 'contact_name, contact_email, archivos adjuntos',
    votes_up INT DEFAULT 0,
    votes_down INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_plant_id (plant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── settings ─────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type ENUM('string', 'number', 'boolean', 'json', 'text') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key_name (key_name),
    INDEX idx_category (category),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── activity_logs ────────────────────────────────────────────────────────────
-- acciones: login · logout · view_plant · plant_created · plant_status_changed · suggestion_created
-- metadata: login → {login_at} · logout → {session_duration_seconds} · view_plant → entidad plant
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action_date (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── uploads ──────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS uploads;
CREATE TABLE uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) COMMENT 'MD5 para detectar duplicados',
    entity_type VARCHAR(50),
    entity_id INT,
    uploaded_by INT,
    is_temporary BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_file_hash (file_hash),
    INDEX idx_is_temporary (is_temporary),
    INDEX idx_expires_at (expires_at),
    INDEX idx_filename (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── pqrsdf ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS pqrsdf;
CREATE TABLE pqrsdf (
    id INT PRIMARY KEY AUTO_INCREMENT,
    radicado VARCHAR(30) UNIQUE COMMENT 'formato: PQRSDF-YYYYMMDD-XXXXX',
    tipo ENUM('peticion','queja','reclamo','sugerencia','denuncia','felicitacion') NOT NULL,
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
    mensaje TEXT NOT NULL,
    archivo_url VARCHAR(500),
    status ENUM('pendiente','en_revision','respondido') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    INDEX idx_tipo (tipo),
    INDEX idx_status (status),
    INDEX idx_radicado (radicado),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── posts ────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    excerpt TEXT,
    image_url VARCHAR(500),
    category VARCHAR(50) DEFAULT 'publicacion',
    tags VARCHAR(500),
    status ENUM('draft','published','archived') DEFAULT 'draft',
    views INT DEFAULT 0,
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_author (author_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Datos iniciales ───────────────────────────────────────────────────────────

-- Password: admin123 · bcrypt rounds=12
INSERT INTO users (name, email, password, role, status, email_verified) VALUES
('Administrador HEAA', 'admin@heaa.edu.co', '$2a$12$l27ohWqCHsNVxyOzHsuhhuH3RYamJqMSIse5uvbdai7w5P2qlEgga', 'admin', 'active', TRUE)
ON DUPLICATE KEY UPDATE
  password       = VALUES(password),
  role           = 'admin',
  status         = 'active',
  email_verified = TRUE;

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

-- Configuraciones de la Página de Inicio (categoría: 'pagina')
INSERT INTO settings (key_name, value, type, category, description, is_public) VALUES
('banner_enabled',  'false', 'boolean', 'pagina', 'Mostrar banner en la página de inicio', TRUE),
('banner_text',     '', 'string', 'pagina', 'Texto del banner', TRUE),
('banner_type',     'info', 'string', 'pagina', 'Tipo: info | success | warning | error', TRUE),
('banner_link',     '', 'string', 'pagina', 'URL enlazada del banner (opcional)', TRUE),
('hero_title',      'Bienvenido a nuestro Herbario Digital', 'string', 'pagina', 'Título principal del hero', TRUE),
('hero_subtitle',   'Descubre la diversidad botánica y aprende sobre la flora de nuestra región.', 'string', 'pagina', 'Subtítulo del hero', TRUE),
('hero_cta1_text',  'Explorar plantas', 'string', 'pagina', 'Texto del botón principal del hero', TRUE),
('hero_cta1_url',   '/plantas', 'string', 'pagina', 'URL del botón principal del hero', TRUE),
('hero_cta2_text',  'Conoce más', 'string', 'pagina', 'Texto del botón secundario del hero', TRUE),
('hero_cta2_url',   '/acerca', 'string', 'pagina', 'URL del botón secundario del hero', TRUE),
('hero_bg_image',   '', 'string', 'pagina', 'URL de imagen de fondo del hero (legacy)', TRUE),
('hero_slide1_image', '', 'string', 'pagina', 'Imagen slide 1 del carrusel hero', TRUE),
('hero_slide1_url',   '', 'string', 'pagina', 'URL de redirección slide 1', TRUE),
('hero_slide2_image', '', 'string', 'pagina', 'Imagen slide 2 del carrusel hero', TRUE),
('hero_slide2_url',   '', 'string', 'pagina', 'URL de redirección slide 2', TRUE),
('hero_slide3_image', '', 'string', 'pagina', 'Imagen slide 3 del carrusel hero', TRUE),
('hero_slide3_url',   '', 'string', 'pagina', 'URL de redirección slide 3', TRUE),
('hero_slide_interval', '5', 'number', 'pagina', 'Intervalo del carrusel hero en segundos (mínimo 2)', TRUE),
('hero_stats_enabled', 'true', 'boolean', 'pagina', 'Mostrar contadores de Plantas, Familias y Géneros en el hero', TRUE),
('hero_image_fit',     'cover', 'string', 'pagina', 'Presentación de imagen hero: cover (expandida) o contain (enmarcada)', TRUE),
('hero2_enabled',   'true', 'boolean', 'pagina', 'Mostrar sección Publicaciones y Servicios', TRUE),
('hero2_title',     'Publicaciones y Servicios', 'string', 'pagina', 'Título de la sección hero 2', TRUE),
('hero2_subtitle',  '', 'string', 'pagina', 'Subtítulo de la sección hero 2', TRUE),
('hero2_interval',  '4', 'number', 'pagina', 'Intervalo del carrusel hero 2 en segundos', TRUE),
('hero2_item1_badge', '', 'string', 'pagina', 'Etiqueta ítem 1', TRUE),
('hero2_item1_title', '', 'string', 'pagina', 'Título del ítem 1', TRUE),
('hero2_item1_desc',  '', 'string', 'pagina', 'Descripción del ítem 1', TRUE),
('hero2_item1_image', '', 'string', 'pagina', 'Imagen del ítem 1', TRUE),
('hero2_item1_url',   '', 'string', 'pagina', 'URL del ítem 1', TRUE),
('hero2_item2_badge', '', 'string', 'pagina', 'Etiqueta ítem 2', TRUE),
('hero2_item2_title', '', 'string', 'pagina', 'Título del ítem 2', TRUE),
('hero2_item2_desc',  '', 'string', 'pagina', 'Descripción del ítem 2', TRUE),
('hero2_item2_image', '', 'string', 'pagina', 'Imagen del ítem 2', TRUE),
('hero2_item2_url',   '', 'string', 'pagina', 'URL del ítem 2', TRUE),
('hero2_item3_badge', '', 'string', 'pagina', 'Etiqueta ítem 3', TRUE),
('hero2_item3_title', '', 'string', 'pagina', 'Título del ítem 3', TRUE),
('hero2_item3_desc',  '', 'string', 'pagina', 'Descripción del ítem 3', TRUE),
('hero2_item3_image', '', 'string', 'pagina', 'Imagen del ítem 3', TRUE),
('hero2_item3_url',   '', 'string', 'pagina', 'URL del ítem 3', TRUE),
('hero2_item4_badge', '', 'string', 'pagina', 'Etiqueta ítem 4', TRUE),
('hero2_item4_title', '', 'string', 'pagina', 'Título del ítem 4', TRUE),
('hero2_item4_desc',  '', 'string', 'pagina', 'Descripción del ítem 4', TRUE),
('hero2_item4_image', '', 'string', 'pagina', 'Imagen del ítem 4', TRUE),
('hero2_item4_url',   '', 'string', 'pagina', 'URL del ítem 4', TRUE),
('features_enabled',  'true', 'boolean', 'pagina', 'Mostrar sección de características', TRUE),
('features_title',    'Características de nuestro herbario', 'string', 'pagina', 'Título de la sección de características', TRUE),
('features_subtitle', 'Nuestro herbario digital ofrece una experiencia completa para explorar y aprender sobre plantas.', 'string', 'pagina', 'Subtítulo de la sección de características', TRUE),
('features_bg_image', '', 'string', 'pagina', 'URL de imagen de fondo de características', TRUE),
('feature1_icon',     'Leaf', 'string', 'pagina', 'Icono característica 1 (Lucide)', TRUE),
('feature1_title',    'Catálogo Extenso', 'string', 'pagina', 'Título característica 1', TRUE),
('feature1_description', 'Explora nuestra amplia colección de especies vegetales catalogadas con detalle.', 'string', 'pagina', 'Descripción característica 1', TRUE),
('feature1_url',      '/plantas', 'string', 'pagina', 'URL tarjeta 1', TRUE),
('feature2_icon',     'Search', 'string', 'pagina', 'Icono característica 2 (Lucide)', TRUE),
('feature2_title',    'Búsqueda Avanzada', 'string', 'pagina', 'Título característica 2', TRUE),
('feature2_description', 'Encuentra fácilmente las plantas por nombre, familia, hábitat o características.', 'string', 'pagina', 'Descripción característica 2', TRUE),
('feature2_url',      '/plantas', 'string', 'pagina', 'URL tarjeta 2', TRUE),
('feature3_icon',     'Database', 'string', 'pagina', 'Icono característica 3 (Lucide)', TRUE),
('feature3_title',    'Información Detallada', 'string', 'pagina', 'Título característica 3', TRUE),
('feature3_description', 'Accede a información científica precisa sobre cada especie en nuestra colección.', 'string', 'pagina', 'Descripción característica 3', TRUE),
('feature3_url',      '/plantas', 'string', 'pagina', 'URL tarjeta 3', TRUE),
('featured_enabled',       'true', 'boolean', 'pagina', 'Mostrar sección de plantas destacadas', TRUE),
('featured_section_title', 'Plantas destacadas', 'string', 'pagina', 'Título de la sección de plantas destacadas', TRUE),
('featured_plants_count',  '6', 'number', 'pagina', 'Número de plantas destacadas en inicio', TRUE),
('logo_text',      'Herbario Digital', 'string', 'pagina', 'Texto del logo del sitio', TRUE),
('logo_image_url', '', 'string', 'pagina', 'URL de imagen de logo (vacío = icono hoja)', TRUE),
('footer_description', 'Explorando y preservando la diversidad botánica para las generaciones futuras.', 'string', 'pagina', 'Descripción en el pie de página', TRUE),
('footer_copyright',   'Herbario Digital. Todos los derechos reservados.', 'string', 'pagina', 'Texto de copyright', TRUE),
('footer_col1_title',      'Explorar', 'string', 'pagina', 'Título columna 1 del footer', TRUE),
('footer_col1_link1_text', 'Catálogo de Plantas', 'string', 'pagina', 'Texto enlace 1, col 1 footer', TRUE),
('footer_col1_link1_url',  '/plantas', 'string', 'pagina', 'URL enlace 1, col 1 footer', TRUE),
('footer_col1_link2_text', 'Familias Botánicas', 'string', 'pagina', 'Texto enlace 2, col 1 footer', TRUE),
('footer_col1_link2_url',  '/familias', 'string', 'pagina', 'URL enlace 2, col 1 footer', TRUE),
('footer_col1_link3_text', 'Hábitats', 'string', 'pagina', 'Texto enlace 3, col 1 footer', TRUE),
('footer_col1_link3_url',  '/habitats', 'string', 'pagina', 'URL enlace 3, col 1 footer', TRUE),
('footer_col2_title',      'Recursos', 'string', 'pagina', 'Título columna 2 del footer', TRUE),
('footer_col2_link1_text', 'Guías de Identificación', 'string', 'pagina', 'Texto enlace 1, col 2 footer', TRUE),
('footer_col2_link1_url',  '/guias', 'string', 'pagina', 'URL enlace 1, col 2 footer', TRUE),
('footer_col2_link2_text', 'Publicaciones', 'string', 'pagina', 'Texto enlace 2, col 2 footer', TRUE),
('footer_col2_link2_url',  '/publicaciones', 'string', 'pagina', 'URL enlace 2, col 2 footer', TRUE),
('footer_col2_link3_text', 'Glosario Botánico', 'string', 'pagina', 'Texto enlace 3, col 2 footer', TRUE),
('footer_col2_link3_url',  '/glosario', 'string', 'pagina', 'URL enlace 3, col 2 footer', TRUE),
('footer_col3_title',      'Contacto', 'string', 'pagina', 'Título columna 3 del footer', TRUE),
('footer_col3_link1_text', 'Formulario de Contacto', 'string', 'pagina', 'Texto enlace 1, col 3 footer', TRUE),
('footer_col3_link1_url',  '/contacto', 'string', 'pagina', 'URL enlace 1, col 3 footer', TRUE),
('footer_col3_link2_text', 'info@herbariodigital.com', 'string', 'pagina', 'Texto enlace 2, col 3 footer', TRUE),
('footer_col3_link2_url',  '', 'string', 'pagina', 'URL enlace 2, col 3 (vacío=texto)', TRUE),
('footer_col3_link3_text', '+123 456 7890', 'string', 'pagina', 'Texto enlace 3, col 3 footer', TRUE),
('footer_col3_link3_url',  '', 'string', 'pagina', 'URL enlace 3, col 3 (vacío=texto)', TRUE)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Configuraciones de la página "Acerca de" (categoría: 'pagina')
INSERT INTO settings (key_name, value, type, category, description, is_public) VALUES
('about_title',            'Herbario HEAA', 'string', 'pagina', 'Título principal de la página Acerca de', TRUE),
('about_subtitle',         'Instituto Tecnológico del Putumayo (ITP) - Mocoa', 'string', 'pagina', 'Subtítulo de la página Acerca de', TRUE),
('about_history_image',    '', 'string', 'pagina', 'URL imagen sección Historia', TRUE),
('about_history_title',    'Nuestra Historia', 'string', 'pagina', 'Título sección Historia', TRUE),
('about_history_p1',       'El Herbario HEAA del Instituto Tecnológico del Putumayo fue fundado en 2005 con el objetivo de documentar, preservar y estudiar la rica diversidad florística de la región amazónica colombiana, con especial énfasis en el departamento del Putumayo.', 'string', 'pagina', 'Párrafo 1 de Historia', TRUE),
('about_history_p2',       'Nombrado en honor al botánico Hernando Ernesto Arias Arias, pionero en el estudio de la flora putumayense, nuestro herbario alberga una colección creciente de especímenes que representan la biodiversidad única de esta región biogeográfica.', 'string', 'pagina', 'Párrafo 2 de Historia', TRUE),
('about_history_p3',       'A lo largo de los años, el Herbario HEAA se ha consolidado como un centro de referencia para la investigación botánica en el sur de Colombia, contribuyendo significativamente al conocimiento científico y a la conservación de los ecosistemas amazónicos.', 'string', 'pagina', 'Párrafo 3 de Historia', TRUE),
('about_mission_text',     'Documentar, preservar y estudiar la diversidad florística del Putumayo y la región amazónica colombiana, contribuyendo al conocimiento científico, la educación ambiental y la conservación de los ecosistemas a través de la investigación botánica, la formación académica y la divulgación del patrimonio natural.', 'string', 'pagina', 'Texto de la Misión', TRUE),
('about_vision_text',      'Para 2030, el Herbario HEAA será reconocido como un centro de referencia nacional en la investigación botánica amazónica, con una colección representativa de la flora regional, infraestructura moderna, personal altamente calificado y una red de colaboración científica consolidada, contribuyendo activamente a la conservación de la biodiversidad y al desarrollo sostenible del territorio.', 'string', 'pagina', 'Texto de la Visión', TRUE),
('about_stats_title',      'Nuestra Colección', 'string', 'pagina', 'Título sección Estadísticas', TRUE),
('about_stat1_value',      '5.200+', 'string', 'pagina', 'Valor estadística 1', TRUE),
('about_stat1_label',      'Especímenes catalogados', 'string', 'pagina', 'Etiqueta estadística 1', TRUE),
('about_stat2_value',      '120+', 'string', 'pagina', 'Valor estadística 2', TRUE),
('about_stat2_label',      'Familias botánicas', 'string', 'pagina', 'Etiqueta estadística 2', TRUE),
('about_stat3_value',      '850+', 'string', 'pagina', 'Valor estadística 3', TRUE),
('about_stat3_label',      'Géneros representados', 'string', 'pagina', 'Etiqueta estadística 3', TRUE),
('about_stat4_value',      '1.800+', 'string', 'pagina', 'Valor estadística 4', TRUE),
('about_stat4_label',      'Especies documentadas', 'string', 'pagina', 'Etiqueta estadística 4', TRUE),
('about_col1_title',       'Colección General', 'string', 'pagina', 'Título colección 1', TRUE),
('about_col1_text',        'Nuestra colección principal contiene especímenes representativos de la flora del Putumayo y la Amazonía colombiana, organizados según el sistema de clasificación APG IV. Incluye ejemplares de bosques de niebla, bosques andino-amazónicos y ecosistemas de piedemonte.', 'string', 'pagina', 'Texto colección 1', TRUE),
('about_col2_title',       'Colección Etnobotánica', 'string', 'pagina', 'Título colección 2', TRUE),
('about_col2_text',        'Documentamos plantas de importancia cultural para las comunidades indígenas y campesinas de la región, incluyendo especies medicinales, alimenticias, artesanales y de uso ritual, junto con información sobre sus usos tradicionales y conocimientos asociados.', 'string', 'pagina', 'Texto colección 2', TRUE),
('about_col3_title',       'Colección de Plantas Endémicas', 'string', 'pagina', 'Título colección 3', TRUE),
('about_col3_text',        'Sección especializada en la preservación y estudio de especies endémicas del Putumayo y zonas adyacentes, muchas de ellas en categorías de amenaza según la UICN, contribuyendo a su conservación y conocimiento.', 'string', 'pagina', 'Texto colección 3', TRUE),
('about_col4_title',       'Carpoteca y Xiloteca', 'string', 'pagina', 'Título colección 4', TRUE),
('about_col4_text',        'Colecciones complementarias de frutos, semillas y muestras de madera que apoyan la investigación botánica, forestal y ecológica, facilitando la identificación y caracterización de especies leñosas de la región.', 'string', 'pagina', 'Texto colección 4', TRUE),
('about_res1_title',       'Taxonomía y Sistemática', 'string', 'pagina', 'Título línea investigación 1', TRUE),
('about_res1_text',        'Estudios sobre la clasificación, identificación y relaciones evolutivas de las plantas amazónicas, con énfasis en familias de alta diversidad en la región como Rubiaceae, Melastomataceae y Araceae.', 'string', 'pagina', 'Texto línea investigación 1', TRUE),
('about_res2_title',       'Etnobotánica y Conocimiento Tradicional', 'string', 'pagina', 'Título línea investigación 2', TRUE),
('about_res2_text',        'Investigación sobre los usos, manejos y significados culturales de las plantas para las comunidades indígenas y campesinas del Putumayo, documentando saberes ancestrales y prácticas sostenibles.', 'string', 'pagina', 'Texto línea investigación 2', TRUE),
('about_res3_title',       'Ecología y Conservación', 'string', 'pagina', 'Título línea investigación 3', TRUE),
('about_res3_text',        'Estudios sobre la estructura, composición y dinámica de los ecosistemas forestales del piedemonte amazónico, evaluando impactos del cambio climático y actividades humanas en la biodiversidad vegetal.', 'string', 'pagina', 'Texto línea investigación 3', TRUE),
('about_res4_title',       'Botánica Económica', 'string', 'pagina', 'Título línea investigación 4', TRUE),
('about_res4_text',        'Investigación sobre especies vegetales con potencial económico para el desarrollo sostenible de la región, incluyendo plantas medicinales, frutales nativos, ornamentales y especies con aplicaciones industriales.', 'string', 'pagina', 'Texto línea investigación 4', TRUE),
('about_member1_image',    '', 'string', 'pagina', 'URL foto miembro 1', TRUE),
('about_member1_name',     'Dr. Andrés Orejuela', 'string', 'pagina', 'Nombre miembro 1', TRUE),
('about_member1_role',     'Director del Herbario', 'string', 'pagina', 'Cargo miembro 1', TRUE),
('about_member1_bio',      'Doctor en Botánica con especialización en taxonomía de plantas neotropicales. Coordina las actividades científicas y administrativas del herbario.', 'string', 'pagina', 'Bio miembro 1', TRUE),
('about_member2_image',    '', 'string', 'pagina', 'URL foto miembro 2', TRUE),
('about_member2_name',     'Dra. Guerly León', 'string', 'pagina', 'Nombre miembro 2', TRUE),
('about_member2_role',     'Curadora Principal', 'string', 'pagina', 'Cargo miembro 2', TRUE),
('about_member2_bio',      'Especialista en conservación de colecciones biológicas. Responsable del mantenimiento, organización y preservación de los especímenes.', 'string', 'pagina', 'Bio miembro 2', TRUE),
('about_member3_image',    '', 'string', 'pagina', 'URL foto miembro 3', TRUE),
('about_member3_name',     'MSc. Carlos Gómez', 'string', 'pagina', 'Nombre miembro 3', TRUE),
('about_member3_role',     'Investigador Asociado', 'string', 'pagina', 'Cargo miembro 3', TRUE),
('about_member3_bio',      'Etnobotánico especializado en conocimientos tradicionales de comunidades indígenas del Putumayo. Lidera proyectos de investigación participativa.', 'string', 'pagina', 'Bio miembro 3', TRUE),
('about_location_title',    'Visítanos', 'string', 'pagina', 'Título sección Ubicación', TRUE),
('about_location_address',  'Instituto Tecnológico del Putumayo\nSede Mocoa - Barrio Luis Carlos Galán\nMocoa, Putumayo, Colombia', 'string', 'pagina', 'Dirección física', TRUE),
('about_location_schedule', 'El Herbario HEAA está abierto para visitas académicas y de investigación de lunes a viernes, de 8:00 am a 12:00 m y de 2:00 pm a 6:00 pm. Para grupos grandes o visitas especializadas, recomendamos agendar con anticipación.', 'string', 'pagina', 'Horario de atención', TRUE),
('about_location_image',    '', 'string', 'pagina', 'URL imagen/mapa de ubicación', TRUE),
('about_partners_title',   'Colaboraciones y Alianzas', 'string', 'pagina', 'Título sección Colaboraciones', TRUE),
('about_partner1_name',    'Institución 1', 'string', 'pagina', 'Nombre institución colaboradora 1', TRUE),
('about_partner1_image',   '', 'string', 'pagina', 'URL logo institución colaboradora 1', TRUE),
('about_partner1_url',     '', 'string', 'pagina', 'URL enlace institución colaboradora 1', TRUE),
('about_partner2_name',    'Institución 2', 'string', 'pagina', 'Nombre institución colaboradora 2', TRUE),
('about_partner2_image',   '', 'string', 'pagina', 'URL logo institución colaboradora 2', TRUE),
('about_partner2_url',     '', 'string', 'pagina', 'URL enlace institución colaboradora 2', TRUE),
('about_partner3_name',    'Institución 3', 'string', 'pagina', 'Nombre institución colaboradora 3', TRUE),
('about_partner3_image',   '', 'string', 'pagina', 'URL logo institución colaboradora 3', TRUE),
('about_partner3_url',     '', 'string', 'pagina', 'URL enlace institución colaboradora 3', TRUE),
('about_partner4_name',    'Institución 4', 'string', 'pagina', 'Nombre institución colaboradora 4', TRUE),
('about_partner4_image',   '', 'string', 'pagina', 'URL logo institución colaboradora 4', TRUE),
('about_partner4_url',     '', 'string', 'pagina', 'URL enlace institución colaboradora 4', TRUE),
('about_cta_title',        'Contribuye a nuestra colección', 'string', 'pagina', 'Título del CTA (Acerca de)', TRUE),
('about_cta_text',         'Si eres investigador, estudiante o entusiasta de la botánica, puedes contribuir a nuestro herbario con especímenes, fotografías o información sobre la flora del Putumayo y la Amazonía colombiana.', 'string', 'pagina', 'Texto del CTA', TRUE),
('about_cta_button_text',  'Conoce cómo colaborar', 'string', 'pagina', 'Texto botón CTA', TRUE),
('about_cta_button_url',   '/contacto', 'string', 'pagina', 'URL botón CTA', TRUE)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Credenciales Cloudinary (is_public = FALSE)
INSERT INTO settings (key_name, value, type, category, description, is_public) VALUES
('cloudinary_cloud_name', '', 'string', 'cloudinary', 'Nombre del cloud en Cloudinary', FALSE),
('cloudinary_api_key',    '', 'string', 'cloudinary', 'API Key de Cloudinary', FALSE),
('cloudinary_api_secret', '', 'string', 'cloudinary', 'API Secret de Cloudinary', FALSE),
('cloudinary_folder',     'herbario', 'string', 'cloudinary', 'Carpeta base para imágenes en Cloudinary', FALSE)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Plantas de ejemplo (Darwin Core)
INSERT INTO plants (
    scientific_name, common_name, vernacular_name, family, genus, specific_epithet, scientific_name_authorship,
    kingdom, phylum, class_name, order_name,
    state_province, municipality, country, locality,
    recorded_by, record_number, event_date,
    institution_code, collection_code, catalog_number,
    status, featured, created_by, description, habitat, uses
) VALUES
('Lavandula angustifolia', 'Lavanda', 'Lavanda común', 'Lamiaceae', 'Lavandula', 'angustifolia', 'Mill.', 'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales', 'Cundinamarca', 'Bogotá', 'Colombia', 'Jardín Botánico de Bogotá', 'María Rodríguez', 'MR-123', '2023-05-15', 'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-001', 'published', TRUE, 1, 'Arbusto aromático perenne de hojas estrechas y flores moradas en espigas.', 'Zonas templadas, suelos bien drenados.', 'Aromaterapia, cosmética, medicina tradicional, ornamental.'),
('Salvia rosmarinus', 'Romero', 'Romero común', 'Lamiaceae', 'Salvia', 'rosmarinus', 'Spenn.', 'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales', 'Cundinamarca', 'Bogotá', 'Colombia', 'Finca La Esperanza', 'Carlos Gómez', 'CG-456', '2023-06-20', 'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-002', 'published', TRUE, 1, 'Arbusto aromático de hojas lineares y flores azuladas.', 'Clima mediterráneo, suelos calcáreos.', 'Culinario, medicinal, ornamental, cosmética.'),
('Aloe vera', 'Sábila', 'Sábila', 'Asphodelaceae', 'Aloe', 'vera', '(L.) Burm.f.', 'Plantae', 'Magnoliophyta', 'Liliopsida', 'Asparagales', 'Valle del Cauca', 'Cali', 'Colombia', 'Huerto familiar urbano', 'Ana López', 'AL-789', '2023-07-10', 'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-003', 'published', TRUE, 1, 'Planta suculenta con hojas gruesas que contienen gel medicinal.', 'Zonas tropicales y subtropicales secas.', 'Medicina tradicional, cosmética, quemaduras, cicatrización.'),
('Mentha spicata', 'Menta', 'Hierbabuena', 'Lamiaceae', 'Mentha', 'spicata', 'L.', 'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales', 'Antioquia', 'Medellín', 'Colombia', 'Huerta comunitaria El Poblado', 'Pedro Sánchez', 'PS-101', '2023-08-05', 'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-004', 'published', FALSE, 1, 'Hierba perenne aromática con hojas dentadas y flores en espigas.', 'Suelos húmedos, climas templados a cálidos.', 'Culinario, medicinal para digestión, aromatizante.'),
('Ocimum basilicum', 'Albahaca', 'Albahaca', 'Lamiaceae', 'Ocimum', 'basilicum', 'L.', 'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Lamiales', 'Putumayo', 'Mocoa', 'Colombia', 'Finca agroecológica Valle de Sibundoy', 'Laura Torres', 'LT-112', '2023-09-12', 'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-005', 'published', TRUE, 1, 'Hierba anual aromática con hojas ovaladas y flores blancas o rosadas.', 'Climas cálidos, suelos bien drenados.', 'Culinario italiano, medicina tradicional, repelente de insectos.'),
('Coffea arabica', 'Café', 'Café arábica', 'Rubiaceae', 'Coffea', 'arabica', 'L.', 'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Gentianales', 'Putumayo', 'Villa Garzón', 'Colombia', 'Finca cafetera La Primavera', 'Miguel Díaz', 'MD-131', '2023-10-03', 'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-006', 'published', TRUE, 1, 'Arbusto de hojas brillantes, flores blancas y frutos rojos con semillas de café.', 'Bosque tropical húmedo de montaña, entre 1200-1800 msnm.', 'Bebida estimulante, industria alimentaria, cosmética.'),
('Solanum lycopersicum', 'Tomate', 'Tomate', 'Solanaceae', 'Solanum', 'lycopersicum', 'L.', 'Plantae', 'Magnoliophyta', 'Equisetopsida', 'Solanales', 'Huila', 'Neiva', 'Colombia', 'Cultivo bajo invernadero', 'Sandra Ruiz', 'SR-141', '2023-11-15', 'Instituto Tecnológico del Putumayo (ITP)', 'HEAA', 'HEAA-007', 'published', FALSE, 1, 'Planta herbácea con frutos rojos comestibles ricos en licopeno.', 'Climas templados a cálidos, suelos fértiles.', 'Alimentación humana, industria alimentaria, cosmética.')
ON DUPLICATE KEY UPDATE scientific_name = VALUES(scientific_name);

INSERT INTO suggestions (title, description, type, status, priority, attachments, created_at) VALUES
('Mejorar descripción de Lavanda', 'La descripción de la lavanda podría incluir más información sobre sus propiedades medicinales y usos en aromaterapia.', 'improvement', 'pending', 'medium', '{"contact_name":"Juan Usuario","contact_email":"juan@email.com"}', '2024-01-15 10:30:00'),
('Agregar imagen de flores de Romero', 'Sería útil tener una imagen específica de las flores del romero para identificación.', 'improvement', 'in_review', 'low', NULL, '2024-01-20 14:15:00'),
('Corrección en nombre científico', 'Verificar la ortografía del nombre científico de algunas especies de la familia Solanaceae.', 'data_correction', 'pending', 'high', NULL, '2024-02-01 09:45:00'),
('Nueva funcionalidad de mapa', 'Implementar un mapa interactivo para mostrar las ubicaciones de colección de cada espécimen.', 'feature', 'pending', 'medium', '{"contact_name":"Dr. Carlos Botánico","contact_email":"carlos@universidad.edu"}', '2024-02-10 16:20:00'),
('Problema en filtro de búsqueda', 'El filtro por familia no muestra resultados cuando se selecciona Rubiaceae.', 'bug', 'pending', 'high', NULL, '2024-02-15 11:00:00')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ── Triggers ─────────────────────────────────────────────────────────────────
DELIMITER //

DROP TRIGGER IF EXISTS plants_activity_insert//
CREATE TRIGGER plants_activity_insert
AFTER INSERT ON plants
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, metadata)
    VALUES (NEW.created_by, 'plant_created', 'plant', NEW.id,
            CONCAT('Planta creada: ', NEW.scientific_name),
            JSON_OBJECT('catalog_number', NEW.catalog_number, 'family', NEW.family));
END//

DROP TRIGGER IF EXISTS plants_activity_update//
CREATE TRIGGER plants_activity_update
AFTER UPDATE ON plants
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, metadata)
        VALUES (NEW.created_by, 'plant_status_changed', 'plant', NEW.id,
                CONCAT('Estado cambiado: ', OLD.status, ' → ', NEW.status, ' · ', NEW.scientific_name),
                JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
END//

DROP TRIGGER IF EXISTS suggestions_activity_insert//
CREATE TRIGGER suggestions_activity_insert
AFTER INSERT ON suggestions
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (NEW.user_id, 'suggestion_created', 'suggestion', NEW.id, CONCAT('Nueva sugerencia: ', NEW.title));
END//

DELIMITER ;

-- ── Vistas ────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS stats_summary;
CREATE VIEW stats_summary AS
SELECT
    (SELECT COUNT(*) FROM plants WHERE status = 'published') as total_plants,
    (SELECT COUNT(DISTINCT family) FROM plants WHERE status = 'published' AND family IS NOT NULL) as total_families,
    (SELECT COUNT(DISTINCT genus) FROM plants WHERE status = 'published' AND genus IS NOT NULL) as total_genera,
    (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
    (SELECT COUNT(*) FROM plant_images) as total_images,
    (SELECT COALESCE(SUM(views), 0) FROM plants WHERE status = 'published') as total_views;

DROP VIEW IF EXISTS plants_with_main_image;
CREATE VIEW plants_with_main_image AS
SELECT
    p.id, p.scientific_name, p.common_name, p.vernacular_name,
    p.family, p.genus, p.specific_epithet,
    p.state_province, p.municipality,
    p.recorded_by, p.record_number, p.catalog_number,
    COALESCE(pi.image_url, '/placeholder.svg') as imagen,
    pi.thumbnail_url, p.views, p.featured, p.created_at, p.status
FROM plants p
LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
WHERE p.status = 'published' AND p.deleted_at IS NULL;

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

-- ── Stored procedures ─────────────────────────────────────────────────────────
DELIMITER //

DROP PROCEDURE IF EXISTS cleanup_expired_uploads//
CREATE PROCEDURE cleanup_expired_uploads()
BEGIN
    DELETE FROM uploads
    WHERE is_temporary = TRUE
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END//

DROP PROCEDURE IF EXISTS get_stats_by_department//
CREATE PROCEDURE get_stats_by_department()
BEGIN
    SELECT
        state_province,
        COUNT(*) as total_plants,
        COUNT(DISTINCT family) as total_families,
        COUNT(DISTINCT genus) as total_genera
    FROM plants
    WHERE status = 'published' AND state_province IS NOT NULL
    GROUP BY state_province
    ORDER BY total_plants DESC;
END//

DELIMITER ;

COMMIT;
