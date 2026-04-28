// src/controllers/plants/getStats.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getStats = async () => {
  try {
    // Estadísticas básicas
    const [totalResult] = await db.query('SELECT COUNT(*) as total FROM plants');
    const [familiesResult] = await db.query('SELECT COUNT(DISTINCT family) as total FROM plants');
    const [generaResult] = await db.query('SELECT COUNT(DISTINCT genus) as total FROM plants');
    const [speciesResult] = await db.query('SELECT COUNT(DISTINCT scientific_name) as total FROM plants');
    const [collectorsResult] = await db.query('SELECT COUNT(DISTINCT recorded_by) as total FROM plants');
    const [departmentsResult] = await db.query('SELECT COUNT(DISTINCT state_province) as total FROM plants');

    // Distribuciones
    const [familyDistribution] = await db.query(`
      SELECT family, COUNT(*) as count 
      FROM plants 
      GROUP BY family 
      ORDER BY count DESC 
      LIMIT 10
    `);

    const [departmentDistribution] = await db.query(`
      SELECT state_province as department, COUNT(*) as count 
      FROM plants 
      GROUP BY state_province 
      ORDER BY count DESC 
      LIMIT 10
    `);

    const [collectorDistribution] = await db.query(`
      SELECT recorded_by as collector, COUNT(*) as count 
      FROM plants 
      GROUP BY recorded_by 
      ORDER BY count DESC 
      LIMIT 10
    `);

    // Estadísticas temporales
    const [yearlyStats] = await db.query(`
      SELECT 
        YEAR(event_date) as year,
        COUNT(*) as count
      FROM plants 
      WHERE event_date IS NOT NULL
      GROUP BY YEAR(event_date)
      ORDER BY year DESC
      LIMIT 10
    `);

    const [monthlyStats] = await db.query(`
      SELECT 
        YEAR(created_at) as year,
        MONTH(created_at) as month,
        MONTHNAME(created_at) as month_name,
        COUNT(*) as count
      FROM plants 
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
    `);

    // Estadísticas de elevación
    const [elevationStats] = await db.query(`
      SELECT 
        MIN(minimum_elevation_in_meters) as min_elevation,
        MAX(minimum_elevation_in_meters) as max_elevation,
        AVG(minimum_elevation_in_meters) as avg_elevation,
        COUNT(minimum_elevation_in_meters) as records_with_elevation
      FROM plants 
      WHERE minimum_elevation_in_meters IS NOT NULL
    `);

    // Rangos de elevación
    const [elevationRanges] = await db.query(`
      SELECT 
        CASE 
          WHEN minimum_elevation_in_meters IS NULL THEN 'Sin datos'
          WHEN minimum_elevation_in_meters < 500 THEN '0-500m'
          WHEN minimum_elevation_in_meters < 1000 THEN '500-1000m'
          WHEN minimum_elevation_in_meters < 2000 THEN '1000-2000m'
          WHEN minimum_elevation_in_meters < 3000 THEN '2000-3000m'
          ELSE '3000m+'
        END as range_label,
        COUNT(*) as count
      FROM plants 
      GROUP BY range_label
      ORDER BY count DESC
    `);

    // Estado de conservación
    const [conservationStats] = await db.query(`
      SELECT 
        CASE 
          WHEN conservation_status IS NULL OR conservation_status = '' THEN 'No evaluado'
          ELSE conservation_status
        END as status,
        COUNT(*) as count
      FROM plants 
      GROUP BY status
      ORDER BY count DESC
    `);

    // Tipos de hábitat
    const [habitatStats] = await db.query(`
      SELECT 
        CASE 
          WHEN habitat IS NULL OR habitat = '' THEN 'No especificado'
          ELSE habitat
        END as habitat_type,
        COUNT(*) as count
      FROM plants 
      GROUP BY habitat_type
      ORDER BY count DESC
      LIMIT 10
    `);

    const stats = {
      overview: {
        totalSpecimens: totalResult[0].total,
        totalFamilies: familiesResult[0].total,
        totalGenera: generaResult[0].total,
        totalSpecies: speciesResult[0].total,
        totalCollectors: collectorsResult[0].total,
        totalDepartments: departmentsResult[0].total
      },
      distributions: {
        families: familyDistribution,
        departments: departmentDistribution,
        collectors: collectorDistribution,
        conservation: conservationStats,
        habitats: habitatStats,
        elevationRanges: elevationRanges
      },
      temporal: {
        yearly: yearlyStats,
        monthly: monthlyStats
      },
      elevation: elevationStats[0] || {
        min_elevation: null,
        max_elevation: null,
        avg_elevation: null,
        records_with_elevation: 0
      },
      completeness: {
        withImages: 0, // TODO: Implementar cuando se agreguen imágenes
        withCoordinates: await getCoordinatesCompleteness(),
        withElevation: elevationStats[0]?.records_with_elevation || 0,
        withHabitat: await getHabitatCompleteness(),
        withConservationStatus: await getConservationCompleteness()
      }
    };

    logger.info('Estadísticas de plantas generadas');

    return stats;

  } catch (error) {
    logger.error('Error al obtener estadísticas de plantas:', error);
    throw error;
  }
};

const getCoordinatesCompleteness = async () => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM plants WHERE decimal_latitude IS NOT NULL AND decimal_longitude IS NOT NULL'
    );
    return result[0].count;
  } catch (error) {
    return 0;
  }
};

const getHabitatCompleteness = async () => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM plants WHERE habitat IS NOT NULL AND habitat != ""'
    );
    return result[0].count;
  } catch (error) {
    return 0;
  }
};

const getConservationCompleteness = async () => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM plants WHERE conservation_status IS NOT NULL AND conservation_status != ""'
    );
    return result[0].count;
  } catch (error) {
    return 0;
  }
};

module.exports = getStats;
