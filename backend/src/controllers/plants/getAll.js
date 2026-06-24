// src/controllers/plants/getAll.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getAll = async (data) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      family = '',
      genus = '',
      species = '',
      department = '',
      municipality = '',
      collector = '',
      vernacular_name = '',
      catalog_number = '',
      record_number = '',
      habitat = '',
      status = 'published'
    } = data || {};

    const offset = (page - 1) * limit;
    
    // Construir query dinámicamente
    let whereConditions = [];
    let queryParams = [];

    if (status && status !== 'all') {
      whereConditions.push("status = ?");
      queryParams.push(status);
    } else {
      // "all" muestra todos excepto eliminados
      whereConditions.push("status != 'deleted'");
    }

    if (search) {
      whereConditions.push(`(
        scientific_name LIKE ? OR 
        vernacular_name LIKE ? OR 
        family LIKE ? OR 
        genus LIKE ?
      )`);
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (family) {
      whereConditions.push('family LIKE ?');
      queryParams.push(`%${family}%`);
    }

    if (genus) {
      whereConditions.push('genus LIKE ?');
      queryParams.push(`%${genus}%`);
    }

    if (species) {
      whereConditions.push('specific_epithet LIKE ?');
      queryParams.push(`%${species}%`);
    }

    if (department) {
      whereConditions.push('state_province LIKE ?');
      queryParams.push(`%${department}%`);
    }

    if (municipality) {
      whereConditions.push('municipality LIKE ?');
      queryParams.push(`%${municipality}%`);
    }

    if (collector) {
      whereConditions.push('recorded_by LIKE ?');
      queryParams.push(`%${collector}%`);
    }

    if (vernacular_name) {
      whereConditions.push('(vernacular_name LIKE ? OR common_name LIKE ?)');
      queryParams.push(`%${vernacular_name}%`, `%${vernacular_name}%`);
    }

    if (catalog_number) {
      whereConditions.push('catalog_number LIKE ?');
      queryParams.push(`%${catalog_number}%`);
    }

    if (record_number) {
      whereConditions.push('record_number LIKE ?');
      queryParams.push(`%${record_number}%`);
    }

    if (habitat) {
      whereConditions.push('habitat LIKE ?');
      queryParams.push(`%${habitat}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Query para obtener las plantas (nombres Darwin Core)
    // Incluye imagen principal y conteo de imágenes vía subquery para el listado
    const plantsQuery = `
      SELECT
        p.id, p.catalog_number, p.scientific_name,
        p.vernacular_name, p.common_name, p.family, p.genus, p.specific_epithet,
        p.state_province, p.county, p.municipality, p.locality,
        p.recorded_by, p.event_date, p.plant_habit,
        p.description, p.habitat, p.uses,
        p.decimal_latitude, p.decimal_longitude,
        p.status, p.featured, p.views, p.created_at,
        (SELECT pi.thumbnail_url FROM plant_images pi
         WHERE pi.plant_id = p.id AND pi.is_main = 1 LIMIT 1) AS main_image_thumbnail,
        (SELECT pi.image_url FROM plant_images pi
         WHERE pi.plant_id = p.id AND pi.is_main = 1 LIMIT 1) AS main_image_url,
        (SELECT COUNT(*) FROM plant_images pi WHERE pi.plant_id = p.id) AS image_count
      FROM plants p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM plants 
      ${whereClause}
    `;

    logger.info('Ejecutando consulta de plantas con parámetros:', { 
      page, limit, search, family, genus, species, department, municipality, collector, vernacular_name, catalog_number 
    });
    logger.info('Query de plantas:', plantsQuery);
    logger.info('Parámetros de consulta:', [...queryParams, parseInt(limit), parseInt(offset)]);

    // Los parámetros para la consulta principal incluyen los filtros + limit + offset
    const plantsParams = [...queryParams, parseInt(limit), parseInt(offset)];
    // Los parámetros para el conteo solo incluyen los filtros
    const countParams = queryParams;

    const [plants] = await db.query(plantsQuery, plantsParams);
    const [totalResult] = await db.query(countQuery, countParams);
    
    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Procesar las plantas — nombres Darwin Core, sin alias
    const processedPlants = plants.map(plant => ({
      ...plant,
      imageUrls: plant.main_image_url ? [plant.main_image_url] : [],
      main_image_thumbnail: plant.main_image_thumbnail || plant.main_image_url || null,
      main_image_url: plant.main_image_url || null,
      image_count: Number(plant.image_count) || 0,
      vernacular_name: plant.vernacular_name || plant.common_name || null,
      decimal_latitude: plant.decimal_latitude != null ? parseFloat(plant.decimal_latitude) : null,
      decimal_longitude: plant.decimal_longitude != null ? parseFloat(plant.decimal_longitude) : null
    }));

    logger.info(`Consulta de plantas completada - Página: ${page}, Total: ${total}, Resultados: ${processedPlants.length}`);

    return {
      plants: processedPlants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    logger.error('Error al obtener plantas:', error);
    throw error;
  }
};

module.exports = getAll;
