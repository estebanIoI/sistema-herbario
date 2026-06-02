-- ============================================================
-- MIGRACIÓN COMPLETA · Herbario Digital HEAA · v3.0
-- Fecha: 2026-06-02
-- MySQL 8.0+ (RENAME COLUMN requiere MySQL 8.0)
-- ============================================================
-- SEGURO: no elimina datos existentes.
-- Detecta el estado de la BD y aplica solo lo que falta.
-- Ejecutar como root o como usuario con ALTER, CREATE, DROP privs.
-- ============================================================

USE herbario_heaa;

-- ============================================================
-- PASO 0: VER ESTADO ANTES DE MIGRAR (opcional, informativo)
-- ============================================================
-- Descomentar para verificar qué hay que migrar:
-- SHOW COLUMNS FROM plants LIKE 'herbarium_number';  -- resultado → DwC pendiente
-- SHOW COLUMNS FROM plants LIKE 'catalog_number';    -- resultado → DwC ya aplicada
-- SHOW TABLES LIKE 'posts';                          -- sin resultado → crear posts


-- ============================================================
-- PASO 1: TABLA posts (crear si no existe)
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
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

SELECT 'posts: OK' AS paso_1;


-- ============================================================
-- PASO 2: MIGRACIÓN DARWIN CORE — renombrar 16 columnas en plants
-- Solo actúa si la columna tiene el nombre viejo
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS _dwc_migrate//
CREATE PROCEDURE _dwc_migrate()
BEGIN
    DECLARE db_name VARCHAR(64);
    SET db_name = DATABASE();

    -- 1. herbarium_number → catalog_number
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'herbarium_number'
    ) THEN
        ALTER TABLE plants RENAME COLUMN herbarium_number TO catalog_number;
        SELECT 'herbarium_number → catalog_number  ✓' AS dwc_paso;
    END IF;

    -- 2. species → specific_epithet
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'species'
    ) THEN
        ALTER TABLE plants RENAME COLUMN species TO specific_epithet;
        SELECT 'species → specific_epithet  ✓' AS dwc_paso;
    END IF;

    -- 3. author → scientific_name_authorship
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'author'
    ) THEN
        ALTER TABLE plants RENAME COLUMN author TO scientific_name_authorship;
        SELECT 'author → scientific_name_authorship  ✓' AS dwc_paso;
    END IF;

    -- 4. collector_name → recorded_by
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'collector_name'
    ) THEN
        ALTER TABLE plants RENAME COLUMN collector_name TO recorded_by;
        SELECT 'collector_name → recorded_by  ✓' AS dwc_paso;
    END IF;

    -- 5. collector_number → record_number
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'collector_number'
    ) THEN
        ALTER TABLE plants RENAME COLUMN collector_number TO record_number;
        SELECT 'collector_number → record_number  ✓' AS dwc_paso;
    END IF;

    -- 6. collection_date → event_date
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'collection_date'
    ) THEN
        ALTER TABLE plants RENAME COLUMN collection_date TO event_date;
        SELECT 'collection_date → event_date  ✓' AS dwc_paso;
    END IF;

    -- 7. department → state_province
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'department'
    ) THEN
        ALTER TABLE plants RENAME COLUMN department TO state_province;
        SELECT 'department → state_province  ✓' AS dwc_paso;
    END IF;

    -- 8. specific_location → locality
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'specific_location'
    ) THEN
        ALTER TABLE plants RENAME COLUMN specific_location TO locality;
        SELECT 'specific_location → locality  ✓' AS dwc_paso;
    END IF;

    -- 9. altitude → minimum_elevation_in_meters
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'altitude'
    ) THEN
        ALTER TABLE plants RENAME COLUMN altitude TO minimum_elevation_in_meters;
        SELECT 'altitude → minimum_elevation_in_meters  ✓' AS dwc_paso;
    END IF;

    -- 10. latitude → decimal_latitude
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'latitude'
    ) THEN
        ALTER TABLE plants RENAME COLUMN latitude TO decimal_latitude;
        SELECT 'latitude → decimal_latitude  ✓' AS dwc_paso;
    END IF;

    -- 11. longitude → decimal_longitude
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'longitude'
    ) THEN
        ALTER TABLE plants RENAME COLUMN longitude TO decimal_longitude;
        SELECT 'longitude → decimal_longitude  ✓' AS dwc_paso;
    END IF;

    -- 12. latitude_sexagesimal → decimal_latitude_sexagesimal
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'latitude_sexagesimal'
    ) THEN
        ALTER TABLE plants RENAME COLUMN latitude_sexagesimal TO decimal_latitude_sexagesimal;
        SELECT 'latitude_sexagesimal → decimal_latitude_sexagesimal  ✓' AS dwc_paso;
    END IF;

    -- 13. longitude_sexagesimal → decimal_longitude_sexagesimal
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'longitude_sexagesimal'
    ) THEN
        ALTER TABLE plants RENAME COLUMN longitude_sexagesimal TO decimal_longitude_sexagesimal;
        SELECT 'longitude_sexagesimal → decimal_longitude_sexagesimal  ✓' AS dwc_paso;
    END IF;

    -- 14. preparation → preparations
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'preparation'
    ) THEN
        ALTER TABLE plants RENAME COLUMN preparation TO preparations;
        SELECT 'preparation → preparations  ✓' AS dwc_paso;
    END IF;

    -- 15. habit → plant_habit
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'habit'
    ) THEN
        ALTER TABLE plants RENAME COLUMN habit TO plant_habit;
        SELECT 'habit → plant_habit  ✓' AS dwc_paso;
    END IF;

    -- 16. geodetic_datum → geodetic
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'plants' AND COLUMN_NAME = 'geodetic_datum'
    ) THEN
        ALTER TABLE plants RENAME COLUMN geodetic_datum TO geodetic;
        SELECT 'geodetic_datum → geodetic  ✓' AS dwc_paso;
    END IF;

    SELECT 'DwC migration: completa' AS paso_2;
END//

DELIMITER ;

CALL _dwc_migrate();
DROP PROCEDURE IF EXISTS _dwc_migrate;


-- ============================================================
-- PASO 3: RECREAR VISTAS (necesario después de renombrar columnas)
-- ============================================================

DROP VIEW IF EXISTS stats_summary;
CREATE VIEW stats_summary AS
SELECT
    (SELECT COUNT(*) FROM plants WHERE status = 'published') AS total_plants,
    (SELECT COUNT(DISTINCT family) FROM plants WHERE status = 'published' AND family IS NOT NULL) AS total_families,
    (SELECT COUNT(DISTINCT genus) FROM plants WHERE status = 'published' AND genus IS NOT NULL) AS total_genera,
    (SELECT COUNT(*) FROM users WHERE status = 'active') AS total_users,
    (SELECT COUNT(*) FROM plant_images) AS total_images,
    (SELECT COALESCE(SUM(views), 0) FROM plants WHERE status = 'published') AS total_views;

DROP VIEW IF EXISTS plants_with_main_image;
CREATE VIEW plants_with_main_image AS
SELECT
    p.id, p.scientific_name, p.common_name, p.vernacular_name,
    p.family, p.genus, p.specific_epithet,
    p.state_province, p.municipality,
    p.recorded_by, p.record_number, p.catalog_number,
    COALESCE(pi.image_url, '/placeholder.svg') AS imagen,
    pi.thumbnail_url, p.views, p.featured, p.created_at, p.status
FROM plants p
LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
WHERE p.status = 'published' AND p.deleted_at IS NULL;

DROP VIEW IF EXISTS featured_plants;
CREATE VIEW featured_plants AS
SELECT
    p.id,
    p.scientific_name AS nombre,
    p.common_name AS nombreComun,
    p.family AS familia,
    COALESCE(pi.image_url, '/placeholder.svg') AS imagen,
    p.views
FROM plants p
LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
WHERE p.status = 'published' AND p.featured = TRUE AND p.deleted_at IS NULL
ORDER BY p.views DESC, p.created_at DESC;

DROP VIEW IF EXISTS recent_activity;
CREATE VIEW recent_activity AS
SELECT
    'plant' AS activity_type,
    p.scientific_name AS title,
    CONCAT('Nueva planta agregada: ', p.scientific_name) AS description,
    p.created_at AS activity_date,
    u.name AS user_name
FROM plants p
LEFT JOIN users u ON p.created_by = u.id
WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
UNION ALL
SELECT
    'suggestion' AS activity_type,
    s.title,
    CONCAT('Nueva sugerencia: ', s.title) AS description,
    s.created_at AS activity_date,
    u.name AS user_name
FROM suggestions s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY activity_date DESC;

SELECT 'Vistas: recreadas ✓' AS paso_3;


-- ============================================================
-- PASO 4: RECREAR TRIGGERS (usan nombres DwC)
-- ============================================================

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

SELECT 'Triggers: recreados ✓' AS paso_4;


-- ============================================================
-- PASO 5: RECREAR STORED PROCEDURES (usan nombres DwC)
-- ============================================================

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
        COUNT(*) AS total_plants,
        COUNT(DISTINCT family) AS total_families,
        COUNT(DISTINCT genus) AS total_genera
    FROM plants
    WHERE status = 'published' AND state_province IS NOT NULL
    GROUP BY state_province
    ORDER BY total_plants DESC;
END//

DELIMITER ;

SELECT 'Stored procedures: recreados ✓' AS paso_5;


-- ============================================================
-- PASO 6: NUEVOS SETTINGS (agregar si no existen)
-- ============================================================

INSERT INTO settings (key_name, value, type, category, description, is_public)
VALUES ('hero_stats_enabled', 'true', 'boolean', 'pagina', 'Mostrar contadores de Plantas, Familias y Géneros en el hero', TRUE)
ON DUPLICATE KEY UPDATE key_name = key_name;

SELECT 'Settings nuevos: aplicados ✓' AS paso_6;


-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plants'
     AND COLUMN_NAME = 'catalog_number') AS dwc_catalog_number_ok,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plants'
     AND COLUMN_NAME = 'state_province') AS dwc_state_province_ok,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plants'
     AND COLUMN_NAME = 'recorded_by') AS dwc_recorded_by_ok,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts') AS posts_ok,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plants_with_main_image') AS vista_plants_ok,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stats_summary') AS vista_stats_ok;

-- Resultado esperado: todos los valores = 1

SELECT '✅ Migración completa. Verificar que todos los valores = 1 arriba.' AS resultado_final;
