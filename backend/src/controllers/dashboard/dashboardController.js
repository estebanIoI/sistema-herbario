// src/controllers/dashboard/dashboardController.js
const os = require('os');
const db = require('../../config/database');
const logger = require('../../utils/logger');
const cache = require('../../services/cache');

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

/**
 * Controlador de Dashboard - Herbario Digital HEAA
 * Maneja todas las estadísticas y datos para el panel de administración
 */

/**
 * Obtener estadísticas generales del dashboard
 */
const getStats = async (req, res) => {
  try {
    // Estadísticas principales
    const [totalVisits] = await db.query(`
      SELECT COALESCE(SUM(views), 0) as total 
      FROM plants WHERE status = 'published'
    `);
    
    const [totalUsers] = await db.query(`
      SELECT COUNT(*) as total 
      FROM users WHERE status = 'active'
    `);
    
    const [totalPlants] = await db.query(`
      SELECT COUNT(*) as total 
      FROM plants WHERE status = 'published'
    `);
    
    const [newPlantsThisMonth] = await db.query(`
      SELECT COUNT(*) as total 
      FROM plants 
      WHERE status = 'published' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Calcular porcentajes de crecimiento (comparando con mes anterior)
    const [lastMonthUsers] = await db.query(`
      SELECT COUNT(*) as total 
      FROM users 
      WHERE status = 'active' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
      AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [thisMonthUsers] = await db.query(`
      SELECT COUNT(*) as total 
      FROM users 
      WHERE status = 'active' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Calcular tiempo promedio de sesión (simulado por ahora)
    const avgSessionTime = "4:32";

    // Calcular porcentajes de crecimiento
    const userGrowth = lastMonthUsers[0].total > 0 ? 
      Math.round(((thisMonthUsers[0].total - lastMonthUsers[0].total) / lastMonthUsers[0].total) * 100) : 0;

    const visitsGrowth = 15; // Simulado por ahora
    const plantsGrowth = newPlantsThisMonth[0].total > 0 ? 
      Math.round((newPlantsThisMonth[0].total / totalPlants[0].total) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalVisits: {
          value: totalVisits[0].total.toLocaleString(),
          description: `+${visitsGrowth}% desde el mes pasado`,
          trend: "up"
        },
        totalUsers: {
          value: totalUsers[0].total.toLocaleString(),
          description: `+${userGrowth}% desde el mes pasado`,
          trend: userGrowth >= 0 ? "up" : "down"
        },
        totalPlants: {
          value: totalPlants[0].total.toString(),
          description: `+${newPlantsThisMonth[0].total} nuevas este mes`,
          trend: "up"
        },
        avgSessionTime: {
          value: avgSessionTime,
          description: "Minutos por sesión",
          trend: "neutral"
        }
      }
    });

  } catch (error) {
    logger.error('Error en getStats dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
};

/**
 * Obtener datos para gráfico de visitantes (basado en vistas reales de plantas)
 */
const getVisitorsChart = async (data, user) => {
  try {
    const { period = '30d' } = data || {};

    let dateCondition;
    let groupByFormat;

    switch (period) {
      case '24h':
        dateCondition = 'al.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        groupByFormat = 'DATE_FORMAT(al.created_at, "%Y-%m-%d %H:00:00")';
        break;
      case '7d':
        dateCondition = 'al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        groupByFormat = 'DATE(al.created_at)';
        break;
      case '30d':
        dateCondition = 'al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        groupByFormat = 'DATE(al.created_at)';
        break;
      case '90d':
        dateCondition = 'al.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        groupByFormat = 'YEARWEEK(al.created_at, 3)';
        break;
      default:
        dateCondition = 'al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        groupByFormat = 'DATE(al.created_at)';
    }

    // Vistas reales de plantas desde activity_logs
    const [rows] = await db.query(`
      SELECT
        ${groupByFormat} AS period,
        COUNT(*) AS visits,
        COUNT(DISTINCT COALESCE(al.user_id, al.ip_address)) AS users
      FROM activity_logs al
      WHERE al.action = 'view_plant' AND ${dateCondition}
      GROUP BY period
      ORDER BY period ASC
    `);

    const chartData = rows.map((row) => {
      let name;
      if (period === '24h') {
        name = String(row.period).substring(11, 16); // HH:mm
      } else if (period === '90d') {
        name = `Sem. ${String(row.period).substring(4)}`; // week number
      } else {
        name = new Date(row.period).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      }
      return { name, users: Number(row.users), visits: Number(row.visits) };
    });

    return {
      chartData,
      period,
      totalVisits: chartData.reduce((sum, item) => sum + item.visits, 0),
      totalUsers: chartData.reduce((sum, item) => sum + item.users, 0)
    };

  } catch (error) {
    logger.error('Error en getVisitorsChart:', error);
    throw new Error('Error al obtener datos de visitantes');
  }
};

/**
 * Obtener plantas por familia (para gráficos)
 */
const getPlantsByFamily = async (data, user) => {
  try {
    const { limit = 10 } = data || {};

    // Paleta de colores estables (determinista por índice, no aleatoria)
    const palette = [
      '#16a34a','#2563eb','#dc2626','#d97706','#7c3aed',
      '#0891b2','#be185d','#65a30d','#ea580c','#0284c7'
    ];

    const [families] = await db.query(`
      SELECT
        family AS name,
        COUNT(*) AS count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM plants WHERE status = 'published')), 1) AS percentage
      FROM plants
      WHERE status = 'published' AND family IS NOT NULL
      GROUP BY family
      ORDER BY count DESC
      LIMIT ?
    `, [parseInt(limit)]);

    return families.map((f, i) => ({
      name: f.name,
      count: f.count,
      percentage: f.percentage,
      fill: palette[i % palette.length]
    }));

  } catch (error) {
    logger.error('Error en getPlantsByFamily:', error);
    throw new Error('Error al obtener plantas por familia');
  }
};

/**
 * Obtener plantas por ubicación
 */
const getPlantsByLocation = async (data, user) => {
  try {
    const { type = 'department', limit = 10 } = data || {};
    const field = type === 'municipality' ? 'municipality' : 'state_province';

    const [locations] = await db.query(`
      SELECT ${field} AS location, COUNT(*) AS count
      FROM plants
      WHERE status = 'published' AND ${field} IS NOT NULL
      GROUP BY ${field}
      ORDER BY count DESC
      LIMIT ?
    `, [parseInt(limit)]);

    return locations.map(l => ({ name: l.location, count: l.count }));

  } catch (error) {
    logger.error('Error en getPlantsByLocation:', error);
    throw new Error('Error al obtener plantas por ubicación');
  }
};

/**
 * Obtener actividad reciente
 */
const getRecentActivity = async (data, user) => {
  try {
    const { limit = 10 } = data || {};

    const query = `
      SELECT
        'plant_created' as type,
        scientific_name as title,
        CONCAT('Nueva planta agregada: ', scientific_name) as description,
        created_at as timestamp,
        created_by as user_id
      FROM plants
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [activities] = await db.query(query, [parseInt(limit)]);

    const userIds = [...new Set(activities.filter(a => a.user_id).map(a => a.user_id))];
    let dbUsers = [];

    if (userIds.length > 0) {
      const [userResults] = await db.query(
        `SELECT id, name FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
        userIds
      );
      dbUsers = userResults;
    }

    return activities.map(activity => ({
      ...activity,
      user: dbUsers.find(u => u.id === activity.user_id)?.name || 'Sistema',
      timestamp: new Date(activity.timestamp).toLocaleString('es-ES')
    }));

  } catch (error) {
    logger.error('Error en getRecentActivity:', error);
    throw new Error('Error al obtener actividad reciente');
  }
};

/**
 * Obtener principales colectores
 */
const getTopCollectors = async (data, user) => {
  try {
    const { limit = 5 } = data || {};

    const [collectors] = await db.query(`
      SELECT
        recorded_by AS name,
        COUNT(*) AS plant_count,
        COUNT(DISTINCT family) AS families_count
      FROM plants
      WHERE status = 'published' AND recorded_by IS NOT NULL
      GROUP BY recorded_by
      ORDER BY plant_count DESC
      LIMIT ?
    `, [parseInt(limit)]);

    return collectors;

  } catch (error) {
    logger.error('Error en getTopCollectors:', error);
    throw new Error('Error al obtener principales colectores');
  }
};

/**
 * Obtener estadísticas mensuales
 */
const getMonthlyStats = async (data, user) => {
  try {
    const { months = 12 } = data || {};

    const monthNames = [
      'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
    ];

    const [stats] = await db.query(`
      SELECT
        YEAR(created_at) AS year,
        MONTH(created_at) AS month,
        COUNT(*) AS plants_added,
        COUNT(DISTINCT family) AS new_families
      FROM plants
      WHERE status = 'published'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
    `, [parseInt(months)]);

    return stats.map(s => ({
      period: `${monthNames[s.month - 1]} ${s.year}`,
      plants_added: s.plants_added,
      new_families: s.new_families
    }));

  } catch (error) {
    logger.error('Error en getMonthlyStats:', error);
    throw new Error('Error al obtener estadísticas mensuales');
  }
};

/**
 * Obtener información de salud del sistema (datos reales del OS y BD)
 */
const getSystemHealth = async (data, user) => {
  try {
    // Tiempo de respuesta real de la BD
    const start = Date.now();
    const [dbTest] = await db.query('SELECT 1 as test');
    const dbResponseTime = Date.now() - start;
    const dbStatus = dbTest[0].test === 1 ? 'healthy' : 'error';

    // Memoria real del servidor (Node.js os module)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPct = Math.round((usedMem / totalMem) * 100);

    // Almacenamiento real: sum de archivos en tabla uploads
    const [storageRow] = await db.query(
      `SELECT COALESCE(SUM(file_size), 0) AS used_bytes, COUNT(*) AS file_count
       FROM uploads WHERE is_temporary = 0 OR is_temporary IS NULL`
    );
    const usedBytes = Number(storageRow[0].used_bytes);

    return {
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`
      },
      memory: {
        total: formatBytes(totalMem),
        used: formatBytes(usedMem),
        free: formatBytes(freeMem),
        usage: `${memPct}%`,
        status: memPct > 85 ? 'warning' : 'healthy'
      },
      storage: {
        usedBytes,
        used: formatBytes(usedBytes),
        fileCount: Number(storageRow[0].file_count),
        status: 'healthy'
      },
      uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      overall: dbStatus === 'healthy' ? 'healthy' : 'error'
    };

  } catch (error) {
    logger.error('Error en getSystemHealth:', error);
    throw new Error('Error al obtener información del sistema');
  }
};

/**
 * Obtener información de almacenamiento (datos reales de la BD)
 */
const getStorageInfo = async (data, user) => {
  try {
    const [imageCount] = await db.query('SELECT COUNT(*) as total FROM plant_images');

    // Bytes reales almacenados en uploads
    const [uploadsRow] = await db.query(`
      SELECT
        COALESCE(SUM(file_size), 0) AS used_bytes,
        COUNT(*) AS total_files
      FROM uploads
      WHERE is_temporary = 0 OR is_temporary IS NULL
    `);

    // Tamaño real de imágenes de plantas (si tienen file_size en plant_images)
    const [imgSizeRow] = await db.query(`
      SELECT COALESCE(SUM(file_size), 0) AS img_bytes
      FROM plant_images
      WHERE file_size IS NOT NULL
    `);

    const usedBytes = Number(uploadsRow[0].used_bytes) + Number(imgSizeRow[0].img_bytes);

    return {
      totalImages: Number(imageCount[0].total),
      totalFiles: Number(uploadsRow[0].total_files),
      usedStorage: formatBytes(usedBytes),
      usedBytes,
      // Memoria libre del servidor como referencia del espacio disponible
      serverFreeMemory: formatBytes(os.freemem()),
      serverTotalMemory: formatBytes(os.totalmem())
    };

  } catch (error) {
    logger.error('Error en getStorageInfo:', error);
    throw new Error('Error al obtener información de almacenamiento');
  }
};

/**
 * Obtener estadísticas públicas (para página principal)
 */
const getPublicStats = async (req, res) => {
  try {
    const [totalPlants] = await db.query('SELECT COUNT(*) as total FROM plants WHERE status = "published"');
    const [totalFamilies] = await db.query('SELECT COUNT(DISTINCT family) as total FROM plants WHERE status = "published"');
    const [totalGenera] = await db.query('SELECT COUNT(DISTINCT genus) as total FROM plants WHERE status = "published"');
    const [totalLocations] = await db.query('SELECT COUNT(DISTINCT CONCAT(state_province, "-", municipality)) as total FROM plants WHERE status = "published"');

    res.json({
      success: true,
      data: {
        totalPlants: totalPlants[0].total,
        totalFamilies: totalFamilies[0].total,
        totalGenera: totalGenera[0].total,
        totalLocations: totalLocations[0].total,
        institution: 'Instituto Tecnológico del Putumayo',
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error en getPublicStats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas públicas',
      message: error.message
    });
  }
};

/**
 * Obtener estadísticas públicas (versión para API Gateway)
 */
const getPublicStatsData = async (data, user) => {
  try {
    // Caché (Redis con fallback a memoria) — estadísticas públicas, TTL 2 min
    const cacheKey = 'stats:public';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [totalPlants]   = await db.query('SELECT COUNT(*) as total FROM plants WHERE status = "published"');
    const [totalFamilies] = await db.query('SELECT COUNT(DISTINCT family) as total FROM plants WHERE status = "published"');
    const [totalGenera]   = await db.query('SELECT COUNT(DISTINCT genus) as total FROM plants WHERE status = "published"');
    const [totalSpecies]  = await db.query('SELECT COUNT(DISTINCT scientific_name) as total FROM plants WHERE status = "published"');

    const result = {
      totalPlants:   totalPlants[0].total,
      totalFamilies: totalFamilies[0].total,
      totalGenera:   totalGenera[0].total,
      totalSpecies:  totalSpecies[0].total,
      institution: 'Instituto Tecnológico del Putumayo',
      lastUpdate: new Date().toISOString()
    };

    await cache.set(cacheKey, result, 120);
    return result;

  } catch (error) {
    logger.error('Error en getPublicStatsData:', error);
    throw new Error('Error al obtener estadísticas públicas');
  }
};

module.exports = {
  getStats,
  getVisitorsChart,
  getPlantsByFamily,
  getPlantsByLocation,
  getRecentActivity,
  getTopCollectors,
  getMonthlyStats,
  getSystemHealth,
  getStorageInfo,
  getPublicStats,
  getPublicStatsData
};
