// src/controllers/plants/plantsController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');
const { validationResult } = require('express-validator');
const { exportData, getExportFormats } = require('./exportData');

/**
 * Controlador de Plantas - Herbario Digital HEAA
 * Maneja todas las operaciones CRUD y funcionalidades específicas de plantas
 */

// ===============================
// OPERACIONES CRUD BÁSICAS
// ===============================

/**
 * Obtener todas las plantas con paginación y filtros
 */
const getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search = '', 
      familia = '', 
      genero = '',
      departamento = '',
      municipio = '',
      colector = '',
      status = 'published'
    } = req.body.params || {};

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereConditions = ['p.status = ?'];
    let queryParams = [status];
    
    // Construir condiciones WHERE dinámicamente
    if (search) {
      whereConditions.push('(p.scientific_name LIKE ? OR p.common_name LIKE ? OR p.vernacular_name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (familia) {
      whereConditions.push('p.family = ?');
      queryParams.push(familia);
    }
    
    if (genero) {
      whereConditions.push('p.genus = ?');
      queryParams.push(genero);
    }
    
    if (departamento) {
      whereConditions.push('p.state_province = ?');
      queryParams.push(departamento);
    }

    if (municipio) {
      whereConditions.push('p.municipality = ?');
      queryParams.push(municipio);
    }

    if (colector) {
      whereConditions.push('p.recorded_by LIKE ?');
      queryParams.push(`%${colector}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query principal con JOIN para obtener imágenes
    const plantsQuery = `
      SELECT 
        p.*,
        pi.image_url as main_image,
        pi.thumbnail_url,
        COUNT(pimg.id) as total_images
      FROM plants p
      LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
      LEFT JOIN plant_images pimg ON p.id = pimg.plant_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM plants p
      WHERE ${whereClause}
    `;

    const [plants] = await db.query(plantsQuery, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await db.query(countQuery, queryParams);
    
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        plants: plants.map(plant => ({
          id: plant.id,
          nombre: plant.scientific_name,
          nombreComun: plant.common_name,
          familia: plant.family,
          genero: plant.genus,
          especie: plant.specific_epithet,
          departamento: plant.state_province,
          municipio: plant.municipality,
          colector: plant.recorded_by,
          numeroColector: plant.record_number,
          catalogNumber: plant.catalog_number,
          imagen: plant.main_image || '/placeholder.svg',
          thumbnail: plant.thumbnail_url,
          totalImages: plant.total_images || 0,
          createdAt: plant.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error en getAll plants:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener plantas',
      message: error.message
    });
  }
};

/**
 * Obtener planta por ID con toda la información detallada
 */
const getById = async (req, res) => {
  try {
    const { id } = req.body.params;

    // Query principal para obtener la planta
    const plantQuery = `
      SELECT 
        p.*,
        u.name as collector_user_name,
        u.email as collector_email
      FROM plants p
      LEFT JOIN users u ON p.collector_user_id = u.id
      WHERE p.id = ? AND p.status = 'published'
    `;

    // Query para obtener todas las imágenes
    const imagesQuery = `
      SELECT 
        id, image_url, thumbnail_url, caption, is_main, display_order
      FROM plant_images 
      WHERE plant_id = ? 
      ORDER BY is_main DESC, display_order ASC
    `;

    const [plantResult] = await db.query(plantQuery, [id]);
    const [images] = await db.query(imagesQuery, [id]);

    if (plantResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Planta no encontrada'
      });
    }

    const plant = plantResult[0];

    // Incrementar contador de vistas
    await db.query('UPDATE plants SET views = views + 1 WHERE id = ?', [id]);

    const plantData = {
      id: plant.id,
      nombre: plant.scientific_name,
      nombreComun: plant.common_name,
      familia: plant.family,
      genero: plant.genus,
      especie: plant.specific_epithet,
      autor: plant.scientific_name_authorship,
      descripcion: plant.description,
      habitat: plant.habitat,
      usos: plant.uses,
      cuidados: plant.care_instructions,
      imagen: images.find(img => img.is_main)?.image_url || '/placeholder.svg',
      imagenes: images.map(img => ({
        id: img.id,
        url: img.image_url,
        thumbnail: img.thumbnail_url,
        caption: img.caption,
        isMain: img.is_main
      })),
      // Datos del herbario (Darwin Core)
      catalogNumber: plant.catalog_number,
      recordNumber: plant.record_number,
      determino: plant.determined_by,
      fechaDeterminacion: plant.determination_date,
      colector: plant.recorded_by,
      fechaColeccion: plant.event_date,
      localizacion: `${plant.country}, ${plant.state_province}, ${plant.municipality}, ${plant.locality}`,
      nombreVernaculo: plant.vernacular_name,
      habito: plant.plant_habit,
      estadoReproductivo: plant.reproductive_state,
      altitud: plant.minimum_elevation_in_meters,
      coordenadas: {
        latitud: plant.decimal_latitude,
        longitud: plant.decimal_longitude
      },
      observaciones: plant.observations,
      views: plant.views + 1,
      createdAt: plant.created_at,
      updatedAt: plant.updated_at
    };

    res.json({
      success: true,
      data: plantData
    });

  } catch (error) {
    logger.error('Error en getById plants:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener planta',
      message: error.message
    });
  }
};

/**
 * Crear nueva planta
 * Soporta dos firmas:
 * 1) Gateway de servicios: create(data, user)
 * 2) Ruta Express clásica: create(req, res)
 */
const create = async (req, res) => {
  try {
    // Detectar si viene del service gateway o de Express
    const isExpress = req && req.body && res && typeof res.status === 'function';
    
    let plantData, user;
    
    if (isExpress) {
      // Modo Express clásico
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Datos de validación incorrectos',
          details: errors.array()
        });
      }
      
      plantData = req.body.params;
      user = req.user;
    } else {
      // Modo service gateway (req son los datos, res es el usuario)
      plantData = req;
      user = res;
    }

    const {
      // Cols 36-50: Taxonomía
      scientific_name,
      common_name,
      vernacular_name,
      family,
      genus,
      specific_epithet,           // Col 46 · specificEpithet (antes: species)
      scientific_name_authorship, // Col 37 · scientificNameAuthorship (antes: author)
      infraspecific_epithet,      // Col 47
      taxonomic_status,
      taxon_rank,
      taxon_remarks,

      // Taxonomía extendida (Darwin Core)
      kingdom,
      phylum,
      class_name,
      order_name,
      subfamily,
      subgenus,

      // Cols 8-9: Espécimen
      catalog_number,   // Col 8 · catalogNumber (antes: herbarium_number)
      record_number,    // Col 9 · recordNumber (antes: collector_number)

      // Identificación
      determination_date,
      determined_by,
      identified_by,    // Col 32 · identifiedBy
      date_identified,  // Col 33 · dateIdentified
      updated_by,       // Col 34 · updatedBy
      date_updated,     // Col 35 · dateUpdated
      type_status,

      // Cols 4-7: Institución
      institution_code,
      institution_id,
      collection_code,
      collection_id,
      geodetic,         // Col 31 · geodeticDatum (antes: geodetic_datum)

      // Cols 1-3: Registro Darwin Core
      occurrence_id,
      basis_of_record,
      record_type,

      // Cols 10-20: Colección
      recorded_by,      // Col 10 · recordedBy (antes: collector_name)
      additional_collectors,
      event_date,       // Col 17 · eventDate (antes: collection_date)
      field_number,     // Col 19 · fieldNumber
      field_notes,      // Col 20 · fieldNotes
      organism_quantity,
      organism_quantity_type,
      life_stage,
      preparations,     // Col 14 · preparations (antes: preparation)
      disposition,
      sampling_protocol,

      // Cols 21-31: Ubicación
      country,
      state_province,   // Col 22 · stateProvince (antes: department)
      county,           // Col 23 · county (municipio)
      municipality,     // Col 24 · municipality (vereda/centro poblado)
      locality,         // Col 25 · locality (antes: specific_location)
      decimal_latitude,             // Col 27 · decimalLatitude (antes: latitude)
      decimal_longitude,            // Col 29 · decimalLongitude (antes: longitude)
      decimal_latitude_sexagesimal, // Col 28 (antes: latitude_sexagesimal)
      decimal_longitude_sexagesimal,// Col 30 (antes: longitude_sexagesimal)
      minimum_elevation_in_meters,  // Col 26 · minimumElevationInMeters (antes: altitude)
      coordinate_uncertainty,
      georeferenced_by,

      // Ecología y hábitat
      habitat,
      substrate,
      associated_species,
      abundance,
      reproductive_state,

      // Morfología
      plant_habit,      // (antes: habit)
      height_min,
      height_max,
      description,
      distinguishing_features,
      flower_color,
      fruit_color,
      leaf_characteristics,

      // Uso y conservación
      uses,
      care_instructions,
      conservation_status,

      // Sistema
      status = 'draft',
      featured,
      observations,
      notes,

      // Cols 51-52: Registro digital
      project,
      photo_record
    } = plantData;

    const insertQuery = `
      INSERT INTO plants (
        scientific_name, common_name, vernacular_name, family, genus, specific_epithet, scientific_name_authorship,
        infraspecific_epithet, taxonomic_status, taxon_rank, taxon_remarks,
        kingdom, phylum, class_name, order_name, subfamily, subgenus,
        catalog_number, determination_date, determined_by, identified_by, date_identified, type_status,
        institution_code, institution_id, collection_code, collection_id, geodetic,
        occurrence_id, basis_of_record, record_type,
        recorded_by, record_number, additional_collectors, event_date,
        field_number, field_notes, organism_quantity, organism_quantity_type,
        life_stage, preparations, disposition, sampling_protocol,
        country, state_province, county, municipality, locality,
        decimal_latitude, decimal_longitude, decimal_latitude_sexagesimal, decimal_longitude_sexagesimal,
        minimum_elevation_in_meters, coordinate_uncertainty, georeferenced_by,
        habitat, substrate, associated_species, abundance, reproductive_state,
        plant_habit, height_min, height_max, description, distinguishing_features,
        flower_color, fruit_color, leaf_characteristics,
        uses, care_instructions, conservation_status, status, featured,
        observations, notes, updated_by, date_updated, project, photo_record,
        created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, NOW(), NOW()
      )
    `;

    // Para guardado por secciones, permitir scientific_name temporal si está vacío
    const tempScientificName = scientific_name || 'Espécimen sin clasificar';

    const values = [
      tempScientificName, common_name, vernacular_name, family, genus, specific_epithet, scientific_name_authorship,
      infraspecific_epithet, taxonomic_status || 'accepted', taxon_rank || 'species', taxon_remarks,
      kingdom || 'Plantae', phylum || 'Magnoliophyta', class_name || 'Equisetopsida', order_name, subfamily, subgenus,
      catalog_number, determination_date, determined_by, identified_by, date_identified, type_status || 'none',
      institution_code || 'Instituto Tecnológico del Putumayo (ITP)', institution_id || '800.247.940', collection_code || 'HEAA', collection_id || 'HEAA-ITP', geodetic || 'WGS84',
      occurrence_id, basis_of_record, record_type,
      recorded_by, record_number, additional_collectors, event_date,
      field_number, field_notes, organism_quantity, organism_quantity_type,
      life_stage, preparations, disposition, sampling_protocol,
      country || 'Colombia', state_province, county, municipality, locality,
      decimal_latitude, decimal_longitude, decimal_latitude_sexagesimal, decimal_longitude_sexagesimal,
      minimum_elevation_in_meters, coordinate_uncertainty, georeferenced_by,
      habitat, substrate, associated_species, abundance, reproductive_state,
      plant_habit, height_min, height_max, description, distinguishing_features,
      flower_color, fruit_color, leaf_characteristics,
      uses, care_instructions, conservation_status || 'NE', status, featured || false,
      observations, notes, updated_by, date_updated, project, photo_record,
      user?.id
    ];

    // Verificar unicidad de catalog_number con manejo de legacy soft-delete
    if (catalog_number) {
      const [conflict] = await db.query(
        'SELECT id, status FROM plants WHERE catalog_number = ?',
        [catalog_number]
      );
      if (conflict.length > 0) {
        if (conflict[0].status === 'deleted') {
          await db.query('DELETE FROM plant_images WHERE plant_id = ?', [conflict[0].id]);
          await db.query('DELETE FROM plants WHERE id = ?', [conflict[0].id]);
          logger.info(`Purgado registro soft-deleted con catalog_number=${catalog_number} (ID ${conflict[0].id})`);
        } else {
          const err = new Error('El número de catálogo ya está en uso por otro espécimen activo. Cada espécimen debe tener un número único en la colección (estándar Darwin Core · catalogNumber).');
          err.statusCode = 409;
          throw err;
        }
      }
    }

    const [result] = await db.query(insertQuery, values);
    const plantId = result.insertId;

    // Procesar imágenes si se proporcionan
    // Preferir el array `images` que trae url + thumbnailUrl reales de Cloudinary
    const imageSources = plantData.images && Array.isArray(plantData.images) && plantData.images.length > 0
      ? plantData.images
      : (plantData.imageUrls && Array.isArray(plantData.imageUrls) && plantData.imageUrls.length > 0)
        ? plantData.imageUrls.map(url => ({ url, thumbnailUrl: url }))
        : [];

    if (imageSources.length > 0) {
      logger.info(`Guardando ${imageSources.length} imagen(es) para planta ${plantId}`);
      const imageValues = imageSources.map((img, index) => [
        plantId,
        img.url,
        img.thumbnailUrl || img.url,
        index === 0
      ]);

      const imageQuery = `
        INSERT INTO plant_images (plant_id, image_url, thumbnail_url, is_main)
        VALUES ?
      `;
      await db.query(imageQuery, [imageValues]);

      // Marcar los uploads como permanentes y vincularlos a la planta
      if (plantData.imageIds && Array.isArray(plantData.imageIds) && plantData.imageIds.length > 0) {
        await db.query(
          'UPDATE uploads SET is_temporary = false, entity_type = ? WHERE id IN (?)',
          ['plant', plantData.imageIds]
        );
      }
    }

    logger.info(`Nueva planta creada: ID ${plantId} - ${tempScientificName}`);

    const plantResult = {
      id: plantId,
      scientific_name: tempScientificName,
      status,
      message: 'Planta creada exitosamente'
    };

    if (isExpress) {
      return res.status(201).json({ success: true, data: plantResult });
    } else {
      // En service gateway el serviceController ya envuelve en { success, data }
      // devolver solo el objeto de datos para evitar doble anidado
      return plantResult;
    }

  } catch (error) {
    logger.error('Error en create plants:', error);

    // Detectar el modo nuevamente para el error handling
    const isExpressMode = req && req.body && res && typeof res.status === 'function';

    // Manejar errores específicos de MySQL o errores manuales con statusCode
    let errorMessage = error.message || 'Error al crear planta';
    let statusCode = error.statusCode || 500;

    if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      if (error.message.includes('catalog_number')) {
        errorMessage = 'El número de catálogo ya está registrado. Usa uno diferente o edita el espécimen existente.';
      } else {
        errorMessage = 'Ya existe un registro con estos datos. Verifique que no haya duplicados.';
      }
    }

    const errorResponse = {
      success: false,
      error: errorMessage,
      message: error.message,
      code: error.code
    };

    if (isExpressMode) {
      return res.status(statusCode).json(errorResponse);
    } else {
      // Para el service gateway, crear un error con información adicional
      const customError = new Error(errorMessage);
      customError.statusCode = statusCode;
      customError.code = error.code;
      throw customError;
    }
  }
};

/**
 * Actualizar planta existente
 * Soporta dos firmas:
 * 1) Gateway de servicios: update(data, user)
 * 2) Ruta Express clásica: update(req, res)
 */
const update = async (firstArg, secondArg) => {
  const isExpress = firstArg && firstArg.body && secondArg && typeof secondArg.status === 'function';
  let id, updateData;
  
  try {
    if (isExpress) {
      // Modo Express (req,res)
      const { id: plantId, ...data } = firstArg.body.params;
      id = plantId;
      updateData = data;
    } else {
      // Modo servicio (data, user)
      const { id: plantId, ...data } = firstArg;
      id = plantId;
      updateData = data;
    }

    if (!id) {
      const error = 'ID de planta requerido';
      if (isExpress) {
        return secondArg.status(400).json({
          success: false,
          error
        });
      } else {
        throw new Error(error);
      }
    }

    // Verificar que la planta existe
    const [existing] = await db.query('SELECT id FROM plants WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = 'Planta no encontrada';
      if (isExpress) {
        return secondArg.status(404).json({
          success: false,
          error
        });
      } else {
        throw new Error(error);
      }
    }

    // Campos que no deben actualizarse directamente en la tabla plants
    const excludeFields = ['imageUrls', 'imageIds', 'images', 'localImages', 'existingImages'];

    // Valores permitidos para columnas ENUM — un valor fuera del set se convierte en null
    const ENUM_ALLOWED = {
      status: ['draft', 'published', 'review', 'deleted'],
      taxonomic_status: ['accepted', 'synonym', 'unresolved'],
      type_status: ['holotype', 'isotype', 'paratype', 'lectotype', 'neotype', 'epitype', 'none'],
      conservation_status: ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE'],
      abundance: ['rare', 'occasional', 'frequent', 'abundant'],
    };

    // Columnas válidas de la tabla plants — nombres DwC snake_case (whitelist)
    const VALID_COLUMNS = new Set([
      // Taxonomía
      'scientific_name','common_name','vernacular_name','family','genus',
      'specific_epithet','scientific_name_authorship',
      'infraspecific_epithet','taxonomic_status','taxon_rank','taxon_remarks',
      'kingdom','phylum','class_name','order_name','subfamily','subgenus',
      // Espécimen / herbario
      'catalog_number','record_number','determination_date','determined_by',
      'identified_by','date_identified','updated_by','date_updated','type_status',
      // Institución
      'institution_code','institution_id','collection_code','collection_id','geodetic',
      // Registro DwC
      'occurrence_id','basis_of_record','record_type',
      // Colección
      'recorded_by','additional_collectors','event_date',
      'field_number','field_notes','organism_quantity','organism_quantity_type',
      'life_stage','preparations','disposition','sampling_protocol',
      // Ubicación
      'country','state_province','county','municipality','locality',
      'decimal_latitude','decimal_longitude',
      'decimal_latitude_sexagesimal','decimal_longitude_sexagesimal',
      'minimum_elevation_in_meters','coordinate_uncertainty','georeferenced_by',
      // Ecología
      'habitat','substrate','associated_species','abundance','reproductive_state',
      // Morfología
      'plant_habit','height_min','height_max','description','distinguishing_features',
      'flower_color','fruit_color','leaf_characteristics',
      // Uso y conservación
      'uses','care_instructions','conservation_status',
      // Sistema
      'status','featured','observations','notes','additional_remarks',
      // Proyecto
      'project','photo_record',
    ]);

    // Columnas NOT NULL: nunca se actualizan a null (se saltan si el valor es null)
    const NOT_NULL_COLUMNS = new Set(['scientific_name']);

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || excludeFields.includes(key)) return;
      if (!VALID_COLUMNS.has(key)) return;
      let value = updateData[key];
      // Nunca poner NULL en columnas NOT NULL (protege scientific_name entre secciones)
      if (value === null && NOT_NULL_COLUMNS.has(key)) return;
      // Convertir a null si el valor no está en el ENUM permitido
      if (ENUM_ALLOWED[key] && value !== null && !ENUM_ALLOWED[key].includes(value)) {
        value = null;
      }
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    });

    if (updateFields.length === 0) {
      const error = 'No hay datos para actualizar';
      if (isExpress) {
        return secondArg.status(400).json({
          success: false,
          error
        });
      } else {
        throw new Error(error);
      }
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `
      UPDATE plants
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await db.query(updateQuery, updateValues);

    // Procesar imágenes si se proporcionan
    // Preferir images[] (trae thumbnailUrl real de Cloudinary) sobre imageUrls[]
    const incomingImages = updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0
      ? updateData.images
      : (updateData.imageUrls && Array.isArray(updateData.imageUrls) && updateData.imageUrls.length > 0)
        ? updateData.imageUrls.map(url => ({ url, thumbnailUrl: url }))
        : null;

    if (incomingImages) {
      const existingImagesQuery = 'SELECT id, image_url FROM plant_images WHERE plant_id = ?';
      const [existingImages] = await db.query(existingImagesQuery, [id]);

      const newImageUrls = incomingImages.map(img => img.url);
      const imagesToDelete = existingImages.filter(img => !newImageUrls.includes(img.image_url));

      if (imagesToDelete.length > 0) {
        const deleteIds = imagesToDelete.map(img => img.id);
        await db.query('DELETE FROM plant_images WHERE id IN (?)', [deleteIds]);
      }

      const existingUrls = existingImages.map(img => img.image_url);
      const imagesToAdd = incomingImages.filter(img => !existingUrls.includes(img.url));

      if (imagesToAdd.length > 0) {
        const imageValues = imagesToAdd.map((img, index) => [
          id,
          img.url,
          img.thumbnailUrl || img.url,
          existingImages.length === 0 && index === 0
        ]);
        await db.query('INSERT INTO plant_images (plant_id, image_url, thumbnail_url, is_main) VALUES ?', [imageValues]);
      }

      // Marcar uploads como permanentes
      if (updateData.imageIds && Array.isArray(updateData.imageIds) && updateData.imageIds.length > 0) {
        await db.query(
          'UPDATE uploads SET is_temporary = false, entity_type = ? WHERE id IN (?)',
          ['plant', updateData.imageIds]
        );
      }
    }

    logger.info(`Planta actualizada: ID ${id}`);

    const updateResult = { id, message: 'Planta actualizada exitosamente' };

    if (isExpress) {
      secondArg.json({ success: true, data: updateResult });
    } else {
      return updateResult;
    }

  } catch (error) {
    logger.error('Error en update plants:', error);
    
    if (isExpress) {
      secondArg.status(500).json({
        success: false,
        error: 'Error al actualizar planta',
        message: error.message
      });
    } else {
      throw error;
    }
  }
};

/**
 * Eliminar planta (hard delete)
 * Soporta dos firmas:
 * 1) Gateway de servicios: deletePlant(data, user)
 * 2) Ruta Express clásica: deletePlant(req, res)
 */
// ── SOFT DELETE (Trazabilidad total) ─────────────────────────────────────────
// NO borra físicamente: marca status='deleted' y registra quién/cuándo/por qué.
// El borrado físico real solo ocurre vía `purgeDeleted` (papelera → admin).
const deletePlant = async (firstArg, secondArg) => {
  const isExpress = firstArg && firstArg.body && secondArg && typeof secondArg.status === 'function';
  let id, user, reason;
  try {
    if (isExpress) {
      // Modo Express (req,res)
      id = firstArg.body?.params?.id;
      reason = firstArg.body?.params?.reason ?? null;
      user = firstArg.user || null;
    } else {
      // Modo servicio (data, user)
      id = firstArg?.id;
      reason = firstArg?.reason ?? null;
      user = secondArg || null;
    }

    if (!id) {
      throw new Error('ID de planta requerido');
    }

    const [existing] = await db.query('SELECT id, scientific_name, status FROM plants WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (isExpress) {
        return secondArg.status(404).json({ success: false, error: 'Planta no encontrada' });
      }
      throw new Error('Planta no encontrada');
    }

    // Soft delete: cambio de estado + metadatos de trazabilidad (las imágenes se conservan)
    await db.query(
      `UPDATE plants
         SET status = 'deleted',
             deleted_at = NOW(),
             deleted_by = ?,
             deletion_reason = ?
       WHERE id = ?`,
      [user?.id ?? null, reason, id]
    );

    logger.info(`Planta archivada (soft delete): ID ${id} - ${existing[0].scientific_name} por usuario ID ${user?.id ?? '—'}${reason ? ` · motivo: ${reason}` : ''}`);

    const result = { id, status: 'deleted', message: 'Espécimen archivado. El registro se conserva y puede restaurarse.' };

    if (isExpress) {
      return secondArg.json({ success: true, data: result });
    }
    return result;

  } catch (error) {
    logger.error('Error en delete plants:', error);
    if (isExpress) {
      return secondArg.status(500).json({
        success: false,
        error: 'Error al archivar planta',
        message: error.message
      });
    }
    throw error;
  }
};

// ── BULK SOFT DELETE ─────────────────────────────────────────────────────────
const bulkDeletePlants = async (data, user) => {
  const ids = Array.isArray(data?.ids) ? data.ids.filter(Boolean) : (data?.id ? [data.id] : []);
  const reason = data?.reason ?? null;
  if (ids.length === 0) throw new Error('Se requiere al menos un ID');

  const [res] = await db.query(
    `UPDATE plants
       SET status = 'deleted', deleted_at = NOW(), deleted_by = ?, deletion_reason = ?
     WHERE id IN (?) AND status != 'deleted'`,
    [user?.id ?? null, reason, ids]
  );
  logger.info(`Soft delete masivo: ${res.affectedRows} registro(s) archivados por usuario ID ${user?.id ?? '—'}`);
  return { archived: res.affectedRows, message: `${res.affectedRows} espécimen(es) archivado(s).` };
};

// ── RESTAURAR desde la papelera ──────────────────────────────────────────────
const restorePlant = async (data, user) => {
  const id = data?.id;
  if (!id) throw new Error('ID de planta requerido');

  const [existing] = await db.query('SELECT id, scientific_name, status FROM plants WHERE id = ?', [id]);
  if (existing.length === 0) throw new Error('Planta no encontrada');
  if (existing[0].status !== 'deleted') throw new Error('El espécimen no está archivado');

  await db.query(
    `UPDATE plants
       SET status = 'draft', deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL
     WHERE id = ?`,
    [id]
  );
  logger.info(`Planta restaurada: ID ${id} - ${existing[0].scientific_name} por usuario ID ${user?.id ?? '—'}`);
  return { id, status: 'draft', message: 'Espécimen restaurado a borrador.' };
};

// ===============================
// FUNCIONES ESPECÍFICAS PARA EL FRONTEND
// ===============================

/**
 * Obtener plantas destacadas para la página principal
 */
const getFeaturedPlants = async (req, res) => {
  try {
    const { limit = 6 } = req.body.params || {};

    const query = `
      SELECT 
        p.id, p.scientific_name as nombre, p.common_name as nombreComun,
        p.family as familia, pi.image_url as imagen, p.views
      FROM plants p
      LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
      WHERE p.status = 'published' AND p.featured = 1
      ORDER BY p.views DESC, p.created_at DESC
      LIMIT ?
    `;

    const [plants] = await db.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: plants.map(plant => ({
        ...plant,
        imagen: plant.imagen || '/placeholder.svg'
      }))
    });

  } catch (error) {
    logger.error('Error en getFeaturedPlants:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener plantas destacadas',
      message: error.message
    });
  }
};

/**
 * Obtener plantas destacadas (versión para API Gateway)
 */
const getFeaturedPlantsData = async (data, user) => {
  try {
    const { limit = 6 } = data || {};
    const limitNumber = Math.min(Math.max(1, Number(limit) || 6), 50); // Validar límite entre 1 y 50

    const query = `
      SELECT
        p.id,
        p.scientific_name  AS scientificName,
        p.common_name      AS commonName,
        p.vernacular_name  AS vernacularName,
        p.family,
        pi.image_url       AS image,
        p.views
      FROM plants p
      LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
      WHERE p.status = 'published' AND p.featured = 1
      ORDER BY p.views DESC, p.created_at DESC
      LIMIT ${limitNumber}
    `;

    const [plants] = await db.query(query);

    return plants.map(plant => ({
      ...plant,
      image: plant.image || null,
      commonName: plant.commonName || plant.vernacularName || null,
    }));

  } catch (error) {
    logger.error('Error en getFeaturedPlantsData:', error);
    throw new Error('Error al obtener plantas destacadas');
  }
};

/**
 * Obtener opciones para filtros avanzados
 */
const getFilterOptions = async (data, user) => {
  const [families]      = await db.query('SELECT DISTINCT family FROM plants WHERE status = "published" AND family IS NOT NULL ORDER BY family');
  const [genera]        = await db.query('SELECT DISTINCT genus FROM plants WHERE status = "published" AND genus IS NOT NULL ORDER BY genus');
  const [departments]   = await db.query('SELECT DISTINCT state_province AS department FROM plants WHERE status = "published" AND state_province IS NOT NULL ORDER BY state_province');
  const [municipalities]= await db.query('SELECT DISTINCT municipality FROM plants WHERE status = "published" AND municipality IS NOT NULL ORDER BY municipality');
  const [collectors]    = await db.query('SELECT DISTINCT recorded_by FROM plants WHERE status = "published" AND recorded_by IS NOT NULL ORDER BY recorded_by');

  return {
    families:      families.map(f => ({ value: f.family,        label: f.family })),
    genera:        genera.map(g   => ({ value: g.genus,         label: g.genus })),
    departments:   departments.map(d => ({ value: d.department, label: d.department })),
    municipalities:municipalities.map(m => ({ value: m.municipality, label: m.municipality })),
    collectors:    collectors.map(c => ({ value: c.recorded_by, label: c.recorded_by })),
  };
};

/**
 * Colecciones distintas registradas en la BD
 * Útil para el buscador del formulario de nueva planta.
 * Parámetros opcionales: { q: string } — filtra por código
 */
/**
 * Buscador de colectores: combina usuarios de la BD + recorded_by existentes en plantas.
 * Parámetros: { q: string }
 */
const getCollectors = async (data) => {
  const q = (data?.q ?? '').trim();
  const like = `%${q}%`;

  // Usuarios activos de la BD
  const [users] = await db.query(
    `SELECT name FROM users WHERE status = 'active' AND name LIKE ? ORDER BY name ASC LIMIT 20`,
    [like]
  );

  // Colectores registrados en plantas (recorded_by)
  const [collectors] = await db.query(
    `SELECT DISTINCT recorded_by AS name FROM plants
     WHERE recorded_by IS NOT NULL AND recorded_by != '' AND recorded_by LIKE ?
     ORDER BY recorded_by ASC LIMIT 20`,
    [like]
  );

  // Merge y dedup por nombre
  const seen = new Set();
  const results = [];
  for (const row of [...users, ...collectors]) {
    const name = row.name?.trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      results.push(name);
    }
  }
  results.sort((a, b) => a.localeCompare(b));
  return { collectors: results.slice(0, 20) };
};

const getCollections = async (data) => {
  const q = data?.q?.trim() ?? '';
  const params = q ? [`%${q}%`, `%${q}%`] : [];
  const where  = q ? 'WHERE (collection_code LIKE ? OR collection_id LIKE ?) AND collection_code IS NOT NULL'
                   : 'WHERE collection_code IS NOT NULL';
  const [rows] = await db.query(
    `SELECT collection_code, MAX(COALESCE(collection_id, '')) AS collection_id
     FROM plants
     ${where}
     GROUP BY collection_code
     ORDER BY collection_code ASC
     LIMIT 30`,
    params
  );
  return {
    collections: rows.map(r => ({
      code: r.collection_code,
      id:   r.collection_id ?? '',
    })),
  };
};

/**
 * Búsqueda avanzada con múltiples filtros
 */
const advancedSearch = async (req, res) => {
  try {
    const { filters = [], page = 1, limit = 12 } = req.body.params || {};
    
    let whereConditions = ['p.status = "published"'];
    let queryParams = [];
    
    // Procesar cada filtro
    filters.forEach(filter => {
      const { field, value } = filter;
      if (field && value) {
        switch (field) {
          case 'familia':
            whereConditions.push('p.family LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'genero':
            whereConditions.push('p.genus LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'especie':
            whereConditions.push('p.specific_epithet LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'departamento':
            whereConditions.push('p.state_province LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'municipio':
            whereConditions.push('p.municipality LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'nombreComun':
            whereConditions.push('p.common_name LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'colector':
            whereConditions.push('p.recorded_by LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'numeroColector':
            whereConditions.push('p.record_number LIKE ?');
            queryParams.push(`%${value}%`);
            break;
        }
      }
    });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = whereConditions.join(' AND ');

    const searchQuery = `
      SELECT 
        p.id, p.scientific_name as nombre, p.common_name as nombreComun,
        p.family as familia, p.genus as genero, p.specific_epithet as especie,
        p.state_province as departamento, p.municipality as municipio,
        p.recorded_by as colector, p.record_number as numeroColector,
        pi.image_url as imagen, pi.thumbnail_url
      FROM plants p
      LEFT JOIN plant_images pi ON p.id = pi.plant_id AND pi.is_main = 1
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM plants p
      WHERE ${whereClause}
    `;

    const [plants] = await db.query(searchQuery, [...queryParams, parseInt(limit), offset]);
    const [countResult] = await db.query(countQuery, queryParams);
    
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        plants: plants.map(plant => ({
          ...plant,
          imagen: plant.imagen || '/placeholder.svg'
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        appliedFilters: filters
      }
    });

  } catch (error) {
    logger.error('Error en advancedSearch:', error);
    res.status(500).json({
      success: false,
      error: 'Error en búsqueda avanzada',
      message: error.message
    });
  }
};

/**
 * Obtener estadísticas de plantas
 */
const getStats = async (req, res) => {
  try {
    const [totalPlants] = await db.query('SELECT COUNT(*) as total FROM plants WHERE status = "published"');
    const [totalFamilies] = await db.query('SELECT COUNT(DISTINCT family) as total FROM plants WHERE status = "published"');
    const [totalGenera] = await db.query('SELECT COUNT(DISTINCT genus) as total FROM plants WHERE status = "published"');
    const [recentPlants] = await db.query('SELECT COUNT(*) as total FROM plants WHERE status = "published" AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    
    res.json({
      success: true,
      data: {
        totalPlants: totalPlants[0].total,
        totalFamilies: totalFamilies[0].total,
        totalGenera: totalGenera[0].total,
        recentPlants: recentPlants[0].total
      }
    });

  } catch (error) {
    logger.error('Error en getStats plants:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
};

// ── Importación masiva desde Excel (service gateway) ─────────────────────────
const importData = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');

  const { plants: rows } = data || {};
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('Lista de plantas requerida');

  const imported = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // scientific_name es requerido; si no viene, construirlo de genus + specific_epithet
      if (!row.scientific_name && row.genus && row.specific_epithet) {
        row.scientific_name = `${row.genus} ${row.specific_epithet}`;
      }
      if (!row.scientific_name) {
        errors.push({ row: i + 2, error: 'Falta nombre científico (Nombre Científico)' });
        continue;
      }

      const toNum = v => (v !== undefined && v !== null && v !== '' ? Number(v) || null : null);
      const toDate = v => {
        if (!v) return null;
        const s = String(v).trim();
        if (!s) return null;
        return s.includes('T') ? s.split('T')[0] : s;
      };

      const result = await create({
        ...row,
        minimum_elevation_in_meters: toNum(row.minimum_elevation_in_meters),
        decimal_latitude: toNum(row.decimal_latitude),
        decimal_longitude: toNum(row.decimal_longitude),
        height_min: toNum(row.height_min),
        height_max: toNum(row.height_max),
        event_date: toDate(row.event_date),
        date_identified: toDate(row.date_identified),
        date_updated: toDate(row.date_updated),
        status: row.status || 'draft',
      }, user);

      if (result && result.data && result.data.id) {
        imported.push(result.data.id);
      } else {
        errors.push({ row: i + 2, error: 'Error al insertar en la base de datos' });
      }
    } catch (err) {
      errors.push({ row: i + 2, error: err.message || 'Error desconocido' });
    }
  }

  logger.info(`Importación completada: ${imported.length} plantas importadas, ${errors.length} errores`);
  return { imported: imported.length, errors };
};

/**
 * Purgar todos los registros soft-deleted (status = 'deleted') que quedaron
 * de versiones anteriores del sistema. Elimina también sus imágenes.
 */
const purgeDeleted = async (data, user) => {
  const [rows] = await db.query('SELECT id FROM plants WHERE status = ?', ['deleted']);
  if (rows.length === 0) return { purged: 0, message: 'No hay registros eliminados que limpiar.' };
  const ids = rows.map(r => r.id);
  await db.query('DELETE FROM plant_images WHERE plant_id IN (?)', [ids]);
  await db.query('DELETE FROM plants WHERE id IN (?)', [ids]);
  logger.info(`Purgados ${ids.length} registros soft-deleted por usuario ID ${user?.id}`);
  return { purged: ids.length, message: `${ids.length} registro(s) eliminado(s) permanentemente.` };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deletePlant,
  restore: restorePlant,
  purgeDeleted,
  importData,
  getFeaturedPlants,
  getFeaturedPlantsData,
  getFilterOptions,
  getCollections,
  getCollectors,
  advancedSearch,
  getStats,
  bulkDelete: bulkDeletePlants,
  // Aliases para compatibilidad
  search: advancedSearch,
  searchByFamily: advancedSearch,
  searchByGenus: advancedSearch,
  searchByLocation: advancedSearch,
  searchByCollector: advancedSearch,
  getRandomPlants: getFeaturedPlants,
  getRecent: getAll,
  getMostViewed: async (data) => {
    const limit = Math.min(parseInt(data?.limit || 5), 50);
    const [plants] = await db.query(
      `SELECT id, scientific_name, common_name, COALESCE(views, 0) AS views
       FROM plants
       ORDER BY views DESC LIMIT ?`,
      [limit]
    );
    return plants;
  },
  getByStatus: getAll,
  uploadImage: async () => ({ success: false, error: 'Usar servicio uploads.uploadFile' }),
  deleteImage: async () => ({ success: false, error: 'Usar servicio uploads.deleteFile' }),
  getImages: async () => ({ success: false, error: 'Incluido en getById' }),
  setMainImage: async () => ({ success: false, error: 'Usar servicio uploads.setMainImage' }),
  exportData,
  getExportFormats,
  checkDuplicates: async () => ({ success: false, error: 'Funcionalidad pendiente' }),
  validatePlantData: async () => ({ success: false, error: 'Funcionalidad pendiente' }),
  getFieldValues: getFilterOptions
};
