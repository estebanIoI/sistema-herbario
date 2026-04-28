// src/controllers/locations/getDepartments.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getDepartments = async (data) => {
  try {
    const { search = '', limit = 50 } = data || {};

    let query = `
      SELECT 
        state_province as department,
        COUNT(*) as specimens_count,
        COUNT(DISTINCT family) as families_count,
        COUNT(DISTINCT genus) as genera_count,
        COUNT(DISTINCT municipality) as municipalities_count
      FROM plants 
    `;
    
    let queryParams = [];

    if (search) {
      query += ' WHERE state_province LIKE ?';
      queryParams.push(`%${search}%`);
    }

    query += `
      GROUP BY state_province 
      ORDER BY specimens_count DESC, state_province ASC
      LIMIT ?
    `;
    
    queryParams.push(parseInt(limit));

    const [departments] = await db.query(query, queryParams);

    // Enriquecer datos con información adicional
    const enrichedDepartments = await Promise.all(
      departments.map(async (dept) => {
        // Obtener municipios del departamento
        const [municipalities] = await db.query(
          `SELECT DISTINCT municipality, COUNT(*) as count 
           FROM plants 
           WHERE state_province = ? AND municipality IS NOT NULL 
           GROUP BY municipality 
           ORDER BY count DESC`,
          [dept.department]
        );

        // Obtener familias más representadas
        const [topFamilies] = await db.query(
          `SELECT family, COUNT(*) as count 
           FROM plants 
           WHERE state_province = ? 
           GROUP BY family 
           ORDER BY count DESC 
           LIMIT 5`,
          [dept.department]
        );

        // Obtener rango de elevaciones
        const [elevationRange] = await db.query(
          `SELECT 
             MIN(minimum_elevation_in_meters) as min_elevation,
             MAX(minimum_elevation_in_meters) as max_elevation,
             AVG(minimum_elevation_in_meters) as avg_elevation
           FROM plants 
           WHERE state_province = ? AND minimum_elevation_in_meters IS NOT NULL`,
          [dept.department]
        );

        return {
          name: dept.department,
          specimensCount: dept.specimens_count,
          familiesCount: dept.families_count,
          generaCount: dept.genera_count,
          municipalitiesCount: dept.municipalities_count,
          municipalities: municipalities,
          topFamilies: topFamilies,
          elevationRange: elevationRange[0] || {
            min_elevation: null,
            max_elevation: null,
            avg_elevation: null
          }
        };
      })
    );

    logger.info(`Departamentos consultados - Total: ${departments.length}, Búsqueda: "${search}"`);

    return {
      departments: enrichedDepartments,
      total: departments.length
    };

  } catch (error) {
    logger.error('Error al obtener departamentos:', error);
    throw error;
  }
};

module.exports = getDepartments;
