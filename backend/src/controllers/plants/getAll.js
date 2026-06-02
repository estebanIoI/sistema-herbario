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
      status = 'published' // Por defecto solo plantas publicadas
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
      whereConditions.push('family = ?');
      queryParams.push(family);
    }

    if (genus) {
      whereConditions.push('genus = ?');
      queryParams.push(genus);
    }

    if (species) {
      whereConditions.push('specific_epithet LIKE ?');
      queryParams.push(`%${species}%`);
    }

    if (department) {
      whereConditions.push('state_province = ?');
      queryParams.push(department);
    }

    if (municipality) {
      whereConditions.push('municipality = ?');
      queryParams.push(municipality);
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

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Query para obtener las plantas (nombres Darwin Core)
    const plantsQuery = `
      SELECT
        id, catalog_number, scientific_name,
        vernacular_name, common_name, family, genus, specific_epithet,
        state_province, municipality, locality,
        recorded_by, event_date, plant_habit,
        description, habitat, uses, care_instructions,
        decimal_latitude, decimal_longitude,
        status, featured, views, created_at
      FROM plants
      ${whereClause}
      ORDER BY created_at DESC
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
      imageUrls: [],
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
