// src/controllers/plants/getForMap.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Obtener plantas con coordenadas para visualización en mapa.
 * Devuelve todos los especímenes activos (no eliminados) que tengan coordenadas.
 */
const getForMap = async (data) => {
  try {
    const {
      search     = '',
      family     = '',
      department = '',
      municipality = '',
      limit      = 2000,
    } = data || {};

    let whereConditions = [
      "p.status != 'deleted'",
      'p.latitude IS NOT NULL',
      'p.longitude IS NOT NULL',
    ];
    let queryParams = [];

    if (search) {
      whereConditions.push(
        '(p.scientific_name LIKE ? OR p.vernacular_name LIKE ? OR p.family LIKE ?)'
      );
      const s = `%${search}%`;
      queryParams.push(s, s, s);
    }

    if (family)       { whereConditions.push('p.family = ?');       queryParams.push(family); }
    if (department)   { whereConditions.push('p.department = ?');   queryParams.push(department); }
    if (municipality) { whereConditions.push('p.municipality = ?'); queryParams.push(municipality); }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT
        p.id,
        p.scientific_name,
        p.vernacular_name,
        p.family,
        p.status,
        CAST(p.latitude  AS DECIMAL(10,8)) AS decimal_latitude,
        CAST(p.longitude AS DECIMAL(11,8)) AS decimal_longitude,
        p.department,
        p.municipality,
        p.collector_name                            AS recorded_by,
        DATE_FORMAT(p.collection_date, '%Y-%m-%d') AS event_date,
        p.herbarium_number                          AS catalog_number,
        p.altitude,
        p.habit,
        p.genus,
        p.collector_number,
        p.author,
        p.conservation_status,
        CASE WHEN p.uses IS NOT NULL AND p.uses != '' THEN 1 ELSE 0 END AS has_uses,
        pi.image_url                                AS image
      FROM plants p
      LEFT JOIN plant_images pi ON pi.plant_id = p.id AND pi.is_main = 1
      ${whereClause}
      ORDER BY p.scientific_name ASC
      LIMIT ?
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM plants p
      ${whereClause}
    `;

    logger.info('Ejecutando consulta de plantas para mapa');

    const plantsParams = [...queryParams, parseInt(limit)];
    const [plants]      = await db.query(query, plantsParams);
    const [countResult] = await db.query(countQuery, queryParams);

    const total = countResult[0].total;

    logger.info(`Mapa: ${total} plantas con coordenadas, devueltas: ${plants.length}`);

    const normalizedPlants = plants.map(p => ({
      ...p,
      decimal_latitude:  parseFloat(p.decimal_latitude),
      decimal_longitude: parseFloat(p.decimal_longitude),
      altitude: p.altitude != null ? Number(p.altitude) : null,
    }));

    return {
      plants: normalizedPlants,
      total,
      hasMore: total > plants.length,
    };

  } catch (error) {
    logger.error('Error al obtener plantas para mapa:', error);
    throw error;
  }
};

module.exports = getForMap;
