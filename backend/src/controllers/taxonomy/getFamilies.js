// src/controllers/taxonomy/getFamilies.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getFamilies = async (data) => {
  try {
    const { search = '', limit = 50 } = data || {};

    // Simplificar la consulta primero para probar
    let query = `
      SELECT 
        family,
        COUNT(*) as count,
        COUNT(DISTINCT genus) as genera_count
      FROM plants 
      WHERE status = 'published' AND family IS NOT NULL
    `;
    
    let queryParams = [];

    if (search) {
      query += ' AND family LIKE ?';
      queryParams.push(`%${search}%`);
    }

    query += `
      GROUP BY family 
      ORDER BY count DESC, family ASC
      LIMIT 50
    `;
    
    const [families] = await db.query(query, queryParams);

    // Obtener información adicional para cada familia
    const enrichedFamilies = await Promise.all(
      families.map(async (family) => {
        // Obtener géneros de la familia
        const [genera] = await db.query(
          'SELECT DISTINCT genus FROM plants WHERE family = ? ORDER BY genus',
          [family.family]
        );

        // Obtener ejemplar más reciente
        const [recentSpecimen] = await db.query(
          'SELECT scientific_name, collection_date FROM plants WHERE family = ? ORDER BY created_at DESC LIMIT 1',
          [family.family]
        );

        return {
          name: family.family,
          speciesCount: family.count,
          generaCount: family.genera_count,
          genera: genera.map(g => g.genus),
          recentSpecimen: recentSpecimen[0] || null
        };
      })
    );

    logger.info(`Familias consultadas - Total: ${families.length}, Búsqueda: "${search}"`);

    return {
      families: enrichedFamilies,
      total: families.length
    };

  } catch (error) {
    logger.error('Error al obtener familias:', error);
    throw error;
  }
};

module.exports = getFamilies;
