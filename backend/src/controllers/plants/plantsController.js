// src/controllers/plants/plantsController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');
const { validationResult } = require('express-validator');

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
      whereConditions.push('p.department = ?');
      queryParams.push(departamento);
    }
    
    if (municipio) {
      whereConditions.push('p.municipality = ?');
      queryParams.push(municipio);
    }
    
    if (colector) {
      whereConditions.push('p.collector_name LIKE ?');
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
          especie: plant.species,
          departamento: plant.department,
          municipio: plant.municipality,
          colector: plant.collector_name,
          numeroColector: plant.collector_number,
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
      especie: plant.species,
      autor: plant.author,
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
      // Datos del herbario
      numeroHerbario: plant.herbarium_number,
      determino: plant.determined_by,
      fechaDeterminacion: plant.determination_date,
      colector: plant.collector_name,
      numeroColector: plant.collector_number,
      fechaColeccion: plant.collection_date,
      localizacion: `${plant.country}, ${plant.department}, ${plant.municipality}, ${plant.specific_location}`,
      nombreVernaculo: plant.vernacular_name,
      habito: plant.habit,
      estadoReproductivo: plant.reproductive_state,
      altitud: plant.altitude,
      coordenadas: {
        latitud: plant.latitude,
        longitud: plant.longitude
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
      // Información básica y taxonómica
      scientific_name,
      common_name,
      vernacular_name,
      family,
      genus,
      species,
      author,
      infraspecific_epithet,
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

      // Herbario e identificación
      herbarium_number,
      determination_date,
      determined_by,
      identified_by,
      date_identified,
      type_status,

      // Información institucional
      institution_code,
      institution_id,
      collection_code,
      collection_id,
      geodetic_datum,

      // Darwin Core - Registro
      occurrence_id,
      basis_of_record,
      record_type,

      // Colección
      collector_name,
      collector_number,
      additional_collectors,
      collection_date,
      field_number,
      field_notes,
      organism_quantity,
      organism_quantity_type,
      life_stage,
      preparation,
      disposition,
      sampling_protocol,

      // Ubicación geográfica
      country,
      department,
      county,
      municipality,
      specific_location,
      latitude,
      longitude,
      latitude_sexagesimal,
      longitude_sexagesimal,
      altitude,
      coordinate_uncertainty,
      georeferenced_by,

      // Ecología y hábitat
      habitat,
      substrate,
      associated_species,
      abundance,
      reproductive_state,

      // Descripción morfológica
      habit,
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

      // Actualización y proyecto
      updated_by,
      date_updated,
      project,
      photo_record
    } = plantData;

    const insertQuery = `
      INSERT INTO plants (
        scientific_name, common_name, vernacular_name, family, genus, species, author,
        infraspecific_epithet, taxonomic_status, taxon_rank, taxon_remarks,
        kingdom, phylum, class_name, order_name, subfamily, subgenus,
        herbarium_number, determination_date, determined_by, identified_by, date_identified, type_status,
        institution_code, institution_id, collection_code, collection_id, geodetic_datum,
        occurrence_id, basis_of_record, record_type,
        collector_name, collector_number, additional_collectors, collection_date,
        field_number, field_notes, organism_quantity, organism_quantity_type,
        life_stage, preparation, disposition, sampling_protocol,
        country, department, county, municipality, specific_location,
        latitude, longitude, latitude_sexagesimal, longitude_sexagesimal,
        altitude, coordinate_uncertainty, georeferenced_by,
        habitat, substrate, associated_species, abundance, reproductive_state,
        habit, height_min, height_max, description, distinguishing_features,
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
      tempScientificName, common_name, vernacular_name, family, genus, species, author,
      infraspecific_epithet, taxonomic_status || 'accepted', taxon_rank || 'species', taxon_remarks,
      kingdom || 'Plantae', phylum || 'Magnoliophyta', class_name || 'Equisetopsida', order_name, subfamily, subgenus,
      herbarium_number, determination_date, determined_by, identified_by, date_identified, type_status || 'none',
      institution_code || 'Instituto Tecnológico del Putumayo (ITP)', institution_id || '800.247.940', collection_code || 'HEAA', collection_id, geodetic_datum || 'WGS84',
      occurrence_id, basis_of_record, record_type,
      collector_name, collector_number, additional_collectors, collection_date,
      field_number, field_notes, organism_quantity, organism_quantity_type,
      life_stage, preparation, disposition, sampling_protocol,
      country || 'Colombia', department, county, municipality, specific_location,
      latitude, longitude, latitude_sexagesimal, longitude_sexagesimal,
      altitude, coordinate_uncertainty, georeferenced_by,
      habitat, substrate, associated_species, abundance, reproductive_state,
      habit, height_min, height_max, description, distinguishing_features,
      flower_color, fruit_color, leaf_characteristics,
      uses, care_instructions, conservation_status || 'NE', status, featured || false,
      observations, notes, updated_by, date_updated, project, photo_record,
      user?.id
    ];

    const [result] = await db.query(insertQuery, values);
    const plantId = result.insertId;

    // Procesar imágenes si se proporcionan
    if (plantData.imageUrls && Array.isArray(plantData.imageUrls) && plantData.imageUrls.length > 0) {
      logger.info(`Guardando ${plantData.imageUrls.length} imagen(es) para planta ${plantId}`);
      const imageValues = plantData.imageUrls.map((url, index) => [
        plantId, 
        url, 
        url, // thumbnail_url (por ahora igual a la url)
        index === 0 // is_main (la primera es la principal)
      ]);

      if (imageValues.length > 0) {
        const imageQuery = `
          INSERT INTO plant_images (plant_id, image_url, thumbnail_url, is_main)
          VALUES ?
        `;
        await db.query(imageQuery, [imageValues]);
      }
    }

    logger.info(`Nueva planta creada: ID ${plantId} - ${tempScientificName}`);

    const responseData = {
      success: true,
      data: {
        id: plantId,
        scientific_name: tempScientificName,
        status,
        message: 'Planta creada exitosamente'
      }
    };

    if (isExpress) {
      return res.status(201).json(responseData);
    } else {
      return responseData;
    }

  } catch (error) {
    logger.error('Error en create plants:', error);

    // Detectar el modo nuevamente para el error handling
    const isExpressMode = req && req.body && res && typeof res.status === 'function';

    // Manejar errores específicos de MySQL
    let errorMessage = 'Error al crear planta';
    let statusCode = 500;

    if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 409; // Conflict
      if (error.message.includes('herbarium_number')) {
        errorMessage = 'El número de herbario ya está registrado. Por favor, use un número diferente.';
      } else if (error.message.includes('scientific_name')) {
        errorMessage = 'Ya existe una planta con este nombre científico.';
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

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && !excludeFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
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
    if (updateData.imageUrls && Array.isArray(updateData.imageUrls) && updateData.imageUrls.length > 0) {
      // Primero, eliminar imágenes existentes que no están en la nueva lista
      const existingImagesQuery = 'SELECT id, image_url FROM plant_images WHERE plant_id = ?';
      const [existingImages] = await db.query(existingImagesQuery, [id]);

      const newImageUrls = updateData.imageUrls;
      const imagesToDelete = existingImages.filter(img => !newImageUrls.includes(img.image_url));

      if (imagesToDelete.length > 0) {
        const deleteIds = imagesToDelete.map(img => img.id);
        await db.query('DELETE FROM plant_images WHERE id IN (?)', [deleteIds]);
      }

      // Agregar nuevas imágenes que no existen
      const existingUrls = existingImages.map(img => img.image_url);
      const imagesToAdd = newImageUrls.filter(url => !existingUrls.includes(url));

      if (imagesToAdd.length > 0) {
        const imageValues = imagesToAdd.map((url, index) => [
          id,
          url,
          url, // thumbnail_url
          existingImages.length === 0 && index === 0 // is_main solo si no hay otras imágenes y es la primera
        ]);

        const imageQuery = `
          INSERT INTO plant_images (plant_id, image_url, thumbnail_url, is_main)
          VALUES ?
        `;
        await db.query(imageQuery, [imageValues]);
      }
    }

    logger.info(`Planta actualizada: ID ${id}`);

    const result = {
      success: true,
      data: {
        id,
        message: 'Planta actualizada exitosamente'
      }
    };

    if (isExpress) {
      secondArg.json(result);
    } else {
      return result;
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
 * Eliminar planta (soft delete)
 * Soporta dos firmas:
 * 1) Gateway de servicios: deletePlant(data, user)
 * 2) Ruta Express clásica: deletePlant(req, res)
 */
const deletePlant = async (firstArg, secondArg) => {
  const isExpress = firstArg && firstArg.body && secondArg && typeof secondArg.status === 'function';
  let id;
  try {
    if (isExpress) {
      // Modo Express (req,res)
      id = firstArg.body?.params?.id;
    } else {
      // Modo servicio (data, user)
      id = firstArg?.id;
    }

    if (!id) {
      throw new Error('ID de planta requerido');
    }

    const [existing] = await db.query('SELECT id, scientific_name FROM plants WHERE id = ?', [id]);
    if (existing.length === 0) {
      if (isExpress) {
        return secondArg.status(404).json({ success: false, error: 'Planta no encontrada' });
      }
      throw new Error('Planta no encontrada');
    }

    // Soft delete
    await db.query('UPDATE plants SET status = ?, deleted_at = NOW() WHERE id = ?', ['deleted', id]);

    logger.info(`Planta eliminada: ID ${id} - ${existing[0].scientific_name}`);

    const result = { id, message: 'Planta eliminada exitosamente' };

    if (isExpress) {
      return secondArg.json({ success: true, data: result });
    }
    // En modo servicio devolvemos solo el objeto; serviceController lo envolverá
    return result;

  } catch (error) {
    logger.error('Error en delete plants:', error);
    if (isExpress) {
      return secondArg.status(500).json({
        success: false,
        error: 'Error al eliminar planta',
        message: error.message
      });
    }
    // En modo servicio relanzamos para que serviceController maneje el status
    throw error;
  }
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
const getFilterOptions = async (req, res) => {
  try {
    const [families] = await db.query('SELECT DISTINCT family FROM plants WHERE status = "published" AND family IS NOT NULL ORDER BY family');
    const [genera] = await db.query('SELECT DISTINCT genus FROM plants WHERE status = "published" AND genus IS NOT NULL ORDER BY genus');
    const [departments] = await db.query('SELECT DISTINCT department FROM plants WHERE status = "published" AND department IS NOT NULL ORDER BY department');
    const [municipalities] = await db.query('SELECT DISTINCT municipality FROM plants WHERE status = "published" AND municipality IS NOT NULL ORDER BY municipality');
    const [collectors] = await db.query('SELECT DISTINCT collector_name FROM plants WHERE status = "published" AND collector_name IS NOT NULL ORDER BY collector_name');

    res.json({
      success: true,
      data: {
        families: families.map(f => ({ value: f.family.toLowerCase(), label: f.family })),
        genera: genera.map(g => ({ value: g.genus.toLowerCase(), label: g.genus })),
        departments: departments.map(d => ({ value: d.department.toLowerCase(), label: d.department })),
        municipalities: municipalities.map(m => ({ value: m.municipality.toLowerCase(), label: m.municipality })),
        collectors: collectors.map(c => ({ value: c.collector_name.toLowerCase(), label: c.collector_name }))
      }
    });

  } catch (error) {
    logger.error('Error en getFilterOptions:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener opciones de filtros',
      message: error.message
    });
  }
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
            whereConditions.push('p.species LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'departamento':
            whereConditions.push('p.department LIKE ?');
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
            whereConditions.push('p.collector_name LIKE ?');
            queryParams.push(`%${value}%`);
            break;
          case 'numeroColector':
            whereConditions.push('p.collector_number LIKE ?');
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
        p.family as familia, p.genus as genero, p.species as especie,
        p.department as departamento, p.municipality as municipio,
        p.collector_name as colector, p.collector_number as numeroColector,
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
      // scientific_name es requerido; si no viene intentar construirlo de genus + species
      if (!row.scientific_name && row.genus && row.species) {
        row.scientific_name = `${row.genus} ${row.species}`;
      }
      if (!row.scientific_name) {
        errors.push({ row: i + 2, error: 'Falta nombre científico (scientific_name)' });
        continue;
      }

      // Convertir valores numéricos
      const toNum = v => (v !== undefined && v !== null && v !== '' ? Number(v) || null : null);
      const toDate = v => {
        if (!v) return null;
        const s = String(v).trim();
        if (!s) return null;
        // Excel puede mandar fecha como número serial o string
        return s.includes('T') ? s.split('T')[0] : s;
      };

      const result = await create({
        ...row,
        altitude: toNum(row.altitude),
        latitude: toNum(row.latitude),
        longitude: toNum(row.longitude),
        height_min: toNum(row.height_min),
        height_max: toNum(row.height_max),
        collection_date: toDate(row.collection_date),
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

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deletePlant,
  importData,
  getFeaturedPlants,
  getFeaturedPlantsData,
  getFilterOptions,
  advancedSearch,
  getStats,
  // Aliases para compatibilidad
  bulkDelete: deletePlant,
  search: advancedSearch,
  searchByFamily: advancedSearch,
  searchByGenus: advancedSearch,
  searchByLocation: advancedSearch,
  searchByCollector: advancedSearch,
  getRandomPlants: getFeaturedPlants,
  getRecent: getAll,
  getMostViewed: getAll,
  getByStatus: getAll,
  uploadImage: async () => ({ success: false, error: 'Usar servicio uploads.uploadFile' }),
  deleteImage: async () => ({ success: false, error: 'Usar servicio uploads.deleteFile' }),
  getImages: async () => ({ success: false, error: 'Incluido en getById' }),
  setMainImage: async () => ({ success: false, error: 'Usar servicio uploads.setMainImage' }),
  exportData: async () => ({ success: false, error: 'Funcionalidad pendiente' }),
  getExportFormats: async () => ({ success: false, error: 'Funcionalidad pendiente' }),
  checkDuplicates: async () => ({ success: false, error: 'Funcionalidad pendiente' }),
  validatePlantData: async () => ({ success: false, error: 'Funcionalidad pendiente' }),
  getFieldValues: getFilterOptions
};
