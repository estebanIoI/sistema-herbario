// src/controllers/plants/locationsController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Controlador de Ubicaciones - Herbario Digital HEAA
 * Maneja departamentos, municipios y sitios de colección
 */

/**
 * Obtener todos los departamentos
 */
const getDepartments = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT state_province as name, COUNT(*) as plant_count
      FROM plants
      WHERE status = 'published' AND state_province IS NOT NULL
      GROUP BY state_province
      ORDER BY state_province ASC
    `;

    const [departments] = await db.query(query);

    res.json({
      success: true,
      data: departments.map(dept => ({
        name: dept.name,
        value: dept.name.toLowerCase(),
        label: dept.name,
        plantCount: dept.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en getDepartments:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener departamentos',
      message: error.message
    });
  }
};

/**
 * Obtener municipios por departamento
 */
const getMunicipalitiesByDepartment = async (req, res) => {
  try {
    const { department } = req.body.params;

    const query = `
      SELECT DISTINCT municipality as name, COUNT(*) as plant_count
      FROM plants
      WHERE status = 'published' AND state_province = ? AND municipality IS NOT NULL
      GROUP BY municipality
      ORDER BY municipality ASC
    `;

    const [municipalities] = await db.query(query, [department]);

    res.json({
      success: true,
      data: municipalities.map(mun => ({
        name: mun.name,
        value: mun.name.toLowerCase(),
        label: mun.name,
        department,
        plantCount: mun.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en getMunicipalitiesByDepartment:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener municipios',
      message: error.message
    });
  }
};

/**
 * Obtener todos los municipios
 */
const getMunicipalities = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        municipality as name,
        state_province AS department,
        COUNT(*) as plant_count
      FROM plants
      WHERE status = 'published' AND municipality IS NOT NULL
      GROUP BY municipality, state_province
      ORDER BY state_province, municipality ASC
    `;

    const [municipalities] = await db.query(query);

    res.json({
      success: true,
      data: municipalities.map(mun => ({
        name: mun.name,
        value: mun.name.toLowerCase(),
        label: `${mun.name} (${mun.department})`,
        department: mun.department,
        plantCount: mun.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en getMunicipalities:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener municipios',
      message: error.message
    });
  }
};

/**
 * Obtener sitios de colección específicos
 */
const getCollectionSites = async (req, res) => {
  try {
    const { department = '', municipality = '', limit = 20 } = req.body.params || {};

    let query = `
      SELECT DISTINCT
        locality as name,
        state_province AS department,
        municipality,
        COUNT(*) as plant_count,
        AVG(decimal_latitude) as avg_latitude,
        AVG(decimal_longitude) as avg_longitude
      FROM plants
      WHERE status = 'published' AND locality IS NOT NULL
    `;
    let params = [];

    if (department) {
      query += ` AND state_province = ?`;
      params.push(department);
    }

    if (municipality) {
      query += ` AND municipality = ?`;
      params.push(municipality);
    }

    query += `
      GROUP BY locality, state_province, municipality
      ORDER BY plant_count DESC, locality ASC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [sites] = await db.query(query, params);

    res.json({
      success: true,
      data: sites.map(site => ({
        name: site.name,
        fullLocation: `${site.name}, ${site.municipality}, ${site.department}`,
        department: site.department,
        municipality: site.municipality,
        plantCount: site.plant_count,
        coordinates: {
          latitude: site.avg_latitude,
          longitude: site.avg_longitude
        }
      }))
    });

  } catch (error) {
    logger.error('Error en getCollectionSites:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener sitios de colección',
      message: error.message
    });
  }
};

/**
 * Autocompletado de ubicaciones
 */
const autocompleteLocations = async (req, res) => {
  try {
    const { query = '', type = 'all', limit = 10 } = req.body.params || {};

    let searchResults = [];

    // Buscar departamentos
    if (type === 'all' || type === 'department') {
      const [departments] = await db.query(`
        SELECT DISTINCT
          state_province as name,
          'department' as type,
          COUNT(*) as plant_count
        FROM plants
        WHERE status = 'published'
        AND state_province IS NOT NULL
        AND state_province LIKE ?
        GROUP BY state_province
        ORDER BY plant_count DESC
        LIMIT ?
      `, [`%${query}%`, Math.ceil(parseInt(limit) / 2)]);

      searchResults = searchResults.concat(departments.map(dept => ({
        value: dept.name,
        label: `${dept.name} (Departamento) - ${dept.plant_count} plantas`,
        type: 'department',
        count: dept.plant_count
      })));
    }

    // Buscar municipios
    if (type === 'all' || type === 'municipality') {
      const [municipalities] = await db.query(`
        SELECT DISTINCT
          municipality as name,
          state_province AS department,
          'municipality' as type,
          COUNT(*) as plant_count
        FROM plants
        WHERE status = 'published'
        AND municipality IS NOT NULL
        AND municipality LIKE ?
        GROUP BY municipality, state_province
        ORDER BY plant_count DESC
        LIMIT ?
      `, [`%${query}%`, Math.ceil(parseInt(limit) / 2)]);

      searchResults = searchResults.concat(municipalities.map(mun => ({
        value: mun.name,
        label: `${mun.name}, ${mun.department} (Municipio) - ${mun.plant_count} plantas`,
        type: 'municipality',
        department: mun.department,
        count: mun.plant_count
      })));
    }

    // Limitar y ordenar resultados finales
    searchResults = searchResults
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    logger.error('Error en autocompleteLocations:', error);
    res.status(500).json({
      success: false,
      error: 'Error en autocompletado de ubicaciones',
      message: error.message
    });
  }
};

/**
 * Obtener estadísticas de ubicaciones
 */
const getLocationStats = async (req, res) => {
  try {
    // Estadísticas por departamento
    const [deptStats] = await db.query(`
      SELECT
        state_province AS department,
        COUNT(*) as plant_count,
        COUNT(DISTINCT family) as family_count,
        COUNT(DISTINCT genus) as genus_count
      FROM plants
      WHERE status = 'published' AND state_province IS NOT NULL
      GROUP BY state_province
      ORDER BY plant_count DESC
      LIMIT 10
    `);

    // Estadísticas por municipio
    const [munStats] = await db.query(`
      SELECT
        municipality,
        state_province AS department,
        COUNT(*) as plant_count,
        COUNT(DISTINCT family) as family_count
      FROM plants
      WHERE status = 'published' AND municipality IS NOT NULL
      GROUP BY municipality, state_province
      ORDER BY plant_count DESC
      LIMIT 10
    `);

    // Distribución altitudinal
    const [altitudeStats] = await db.query(`
      SELECT 
        CASE
          WHEN minimum_elevation_in_meters < 500 THEN '0-500m'
          WHEN minimum_elevation_in_meters < 1000 THEN '500-1000m'
          WHEN minimum_elevation_in_meters < 1500 THEN '1000-1500m'
          WHEN minimum_elevation_in_meters < 2000 THEN '1500-2000m'
          WHEN minimum_elevation_in_meters < 2500 THEN '2000-2500m'
          WHEN minimum_elevation_in_meters < 3000 THEN '2500-3000m'
          ELSE '3000m+'
        END as altitude_range,
        COUNT(*) as plant_count
      FROM plants
      WHERE status = 'published' AND minimum_elevation_in_meters IS NOT NULL
      GROUP BY altitude_range
      ORDER BY MIN(minimum_elevation_in_meters)
    `);

    res.json({
      success: true,
      data: {
        departmentStats: deptStats,
        municipalityStats: munStats,
        altitudeDistribution: altitudeStats
      }
    });

  } catch (error) {
    logger.error('Error en getLocationStats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de ubicaciones',
      message: error.message
    });
  }
};

/**
 * Validar ubicación
 */
const validateLocation = async (req, res) => {
  try {
    const { department, municipality, specificLocation } = req.body.params;

    // Verificar si el departamento existe
    const [deptExists] = await db.query(`
      SELECT COUNT(*) as count
      FROM plants
      WHERE state_province = ? AND status = 'published'
    `, [department]);

    // Verificar si el municipio existe en ese departamento
    const [munExists] = await db.query(`
      SELECT COUNT(*) as count
      FROM plants
      WHERE state_province = ? AND municipality = ? AND status = 'published'
    `, [department, municipality]);

    // Verificar ubicación específica
    let locationExists = 0;
    if (specificLocation) {
      const [locExists] = await db.query(`
        SELECT COUNT(*) as count
        FROM plants
        WHERE state_province = ? AND municipality = ? AND locality = ? AND status = 'published'
      `, [department, municipality, specificLocation]);
      locationExists = locExists[0].count;
    }

    res.json({
      success: true,
      data: {
        departmentExists: deptExists[0].count > 0,
        municipalityExists: munExists[0].count > 0,
        locationExists: locationExists > 0,
        suggestions: {
          similarDepartments: deptExists[0].count === 0 ? await getSimilarLocations('state_province', department) : [],
          similarMunicipalities: munExists[0].count === 0 ? await getSimilarLocations('municipality', municipality, department) : []
        }
      }
    });

  } catch (error) {
    logger.error('Error en validateLocation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar ubicación',
      message: error.message
    });
  }
};

/**
 * Función auxiliar para buscar ubicaciones similares
 */
const getSimilarLocations = async (type, name, department = null) => {
  try {
    let query = `SELECT DISTINCT ${type} as name FROM plants WHERE status = 'published' AND ${type} IS NOT NULL`;
    let params = [];

    if (department && type === 'municipality') {
      query += ` AND state_province = ?`;
      params.push(department);
    }

    query += ` AND ${type} LIKE ? LIMIT 5`;
    params.push(`%${name}%`);

    const [results] = await db.query(query, params);
    return results.map(r => r.name);
  } catch (error) {
    logger.error('Error en getSimilarLocations:', error);
    return [];
  }
};

module.exports = {
  getDepartments,
  getMunicipalities,
  getMunicipalitiesByDepartment,
  getCollectionSites,
  autocompleteLocations,
  getLocationStats,
  validateLocation,
  createLocation: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' }),
  updateLocation: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' }),
  deleteLocation: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' })
};
