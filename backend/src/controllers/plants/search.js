// src/controllers/plants/search.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const search = async (data) => {
  try {
    const {
      query = '',
      filters = {},
      page = 1,
      limit = 12,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = data || {};

    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    let whereConditions = [];
    let queryParams = [];

    // Búsqueda general por texto
    if (query) {
      whereConditions.push(`(
        scientific_name LIKE ? OR 
        vernacular_name LIKE ? OR 
        family LIKE ? OR 
        genus LIKE ? OR 
        specific_epithet LIKE ? OR
        recorded_by LIKE ? OR
        locality LIKE ? OR
        description LIKE ?
      )`);
      const searchParam = `%${query}%`;
      queryParams.push(
        searchParam, searchParam, searchParam, searchParam,
        searchParam, searchParam, searchParam, searchParam
      );
    }

    // Filtros específicos
    if (filters.family) {
      whereConditions.push('family = ?');
      queryParams.push(filters.family);
    }

    if (filters.genus) {
      whereConditions.push('genus = ?');
      queryParams.push(filters.genus);
    }

    if (filters.department) {
      whereConditions.push('state_province = ?');
      queryParams.push(filters.department);
    }

    if (filters.municipality) {
      whereConditions.push('municipality = ?');
      queryParams.push(filters.municipality);
    }

    if (filters.collector) {
      whereConditions.push('recorded_by LIKE ?');
      queryParams.push(`%${filters.collector}%`);
    }

    if (filters.habitat) {
      whereConditions.push('habitat LIKE ?');
      queryParams.push(`%${filters.habitat}%`);
    }

    if (filters.conservationStatus) {
      whereConditions.push('conservation_status = ?');
      queryParams.push(filters.conservationStatus);
    }

    if (filters.plantHabit) {
      whereConditions.push('plant_habit = ?');
      queryParams.push(filters.plantHabit);
    }

    if (filters.flowerColor) {
      whereConditions.push('flower_color = ?');
      queryParams.push(filters.flowerColor);
    }

    // Filtros de rango de fechas
    if (filters.dateFrom) {
      whereConditions.push('event_date >= ?');
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push('event_date <= ?');
      queryParams.push(filters.dateTo);
    }

    // Filtros de elevación
    if (filters.elevationMin) {
      whereConditions.push('minimum_elevation_in_meters >= ?');
      queryParams.push(filters.elevationMin);
    }

    if (filters.elevationMax) {
      whereConditions.push('minimum_elevation_in_meters <= ?');
      queryParams.push(filters.elevationMax);
    }

    // Filtros de coordenadas (búsqueda por área)
    if (filters.boundingBox) {
      const { north, south, east, west } = filters.boundingBox;
      whereConditions.push(
        'decimal_latitude BETWEEN ? AND ? AND decimal_longitude BETWEEN ? AND ?'
      );
      queryParams.push(south, north, west, east);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Validar campo de ordenamiento
    const validSortFields = [
      'created_at', 'scientific_name', 'family', 'genus', 
      'event_date', 'state_province', 'municipality'
    ];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) 
      ? sortOrder.toUpperCase() 
      : 'DESC';

    // Query principal
    const searchQuery = `
      SELECT 
        id, occurrence_id, catalog_number, scientific_name, 
        vernacular_name, family, genus, specific_epithet,
        state_province, municipality, locality, recorded_by,
        event_date, flower_color, plant_habit, description,
        decimal_latitude, decimal_longitude, image_urls,
        conservation_status, habitat
      FROM plants 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;

    // Query para contar
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM plants 
      ${whereClause}
    `;

    // Ejecutar queries
    const [plants] = await db.query(searchQuery, [...queryParams, limit, offset]);
    const [totalResult] = await db.query(countQuery, queryParams);
    
    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Procesar resultados
    const processedPlants = plants.map(plant => ({
      ...plant,
      imageUrls: plant.image_urls ? JSON.parse(plant.image_urls) : [],
      // Remover campo original
      image_urls: undefined
    }));

    // Generar estadísticas de la búsqueda
    const searchStats = await generateSearchStats(queryParams, whereClause);

    logger.info(`Búsqueda realizada - Query: "${query}", Filtros: ${Object.keys(filters).length}, Resultados: ${total}`);

    return {
      plants: processedPlants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      searchStats,
      appliedFilters: {
        query,
        filters,
        sortBy: validSortBy,
        sortOrder: validSortOrder
      }
    };

  } catch (error) {
    logger.error('Error en búsqueda de plantas:', error);
    throw error;
  }
};

const generateSearchStats = async (queryParams, whereClause) => {
  try {
    const db = require('../../config/database');
    
    // Estadísticas por familia
    const [familyStats] = await db.query(`
      SELECT family, COUNT(*) as count 
      FROM plants ${whereClause}
      GROUP BY family 
      ORDER BY count DESC 
      LIMIT 5
    `, queryParams);

    // Estadísticas por departamento
    const [departmentStats] = await db.query(`
      SELECT state_province, COUNT(*) as count 
      FROM plants ${whereClause}
      GROUP BY state_province 
      ORDER BY count DESC 
      LIMIT 5
    `, queryParams);

    return {
      topFamilies: familyStats,
      topDepartments: departmentStats
    };
  } catch (error) {
    logger.error('Error generando estadísticas de búsqueda:', error);
    return {};
  }
};

module.exports = search;
