// src/controllers/dashboard/getStats.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getStats = async (data, user) => {
  try {
    if (!user || user.role !== 'admin') {
      throw new Error('Permisos insuficientes para acceder al dashboard');
    }

    // ── Totales generales ──────────────────────────────────────────────────────
    const [[totalPlantsRow]] = await db.query('SELECT COUNT(*) AS total FROM plants');
    const [[totalUsersRow]]  = await db.query('SELECT COUNT(*) AS total FROM users WHERE status = "active"');

    // ── Nuevos este mes ────────────────────────────────────────────────────────
    const [[plantsThisMonthRow]] = await db.query(`
      SELECT COUNT(*) AS total FROM plants
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at)  = YEAR(CURRENT_DATE())
    `);
    const [[usersThisMonthRow]] = await db.query(`
      SELECT COUNT(*) AS total FROM users
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at)  = YEAR(CURRENT_DATE())
    `);

    // ── Vistas totales (suma del contador en plants) ───────────────────────────
    const [[totalViewsRow]] = await db.query(
      'SELECT COALESCE(SUM(views), 0) AS total FROM plants'
    );

    // ── Vistas este mes vs mes anterior (activity_logs) ───────────────────────
    const [[visitsThisMonthRow]] = await db.query(`
      SELECT COUNT(*) AS total FROM activity_logs
      WHERE action = 'view_plant'
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at)  = YEAR(CURRENT_DATE())
    `);
    const [[visitsLastMonthRow]] = await db.query(`
      SELECT COUNT(*) AS total FROM activity_logs
      WHERE action = 'view_plant'
        AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(created_at)  = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
    `);

    const visitsThisMonth = Number(visitsThisMonthRow.total);
    const visitsLastMonth = Number(visitsLastMonthRow.total);
    const visitsGrowth = visitsLastMonth > 0
      ? Math.round(((visitsThisMonth - visitsLastMonth) / visitsLastMonth) * 100)
      : visitsThisMonth > 0 ? 100 : 0;

    // ── Crecimiento de usuarios ────────────────────────────────────────────────
    const [[usersLastMonthRow]] = await db.query(`
      SELECT COUNT(*) AS total FROM users
      WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(created_at)  = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
    `);
    const usersThisMonth = Number(usersThisMonthRow.total);
    const usersLastMonth = Number(usersLastMonthRow.total);
    const usersGrowth = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0;

    // ── Tiempo promedio de sesión real (activity_logs logout) ─────────────────
    const [[sessionRow]] = await db.query(`
      SELECT AVG(CAST(JSON_UNQUOTE(metadata->>'$.session_duration_seconds') AS UNSIGNED)) AS avg_seconds
      FROM activity_logs
      WHERE action = 'logout'
        AND metadata->>'$.session_duration_seconds' IS NOT NULL
        AND CAST(JSON_UNQUOTE(metadata->>'$.session_duration_seconds') AS UNSIGNED) > 0
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    let avgSessionTime = 'Sin datos';
    if (sessionRow.avg_seconds) {
      const sec  = Math.round(Number(sessionRow.avg_seconds));
      const mins = Math.floor(sec / 60);
      const secs = sec % 60;
      avgSessionTime = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    // ── Distribuciones ─────────────────────────────────────────────────────────
    const [topFamilies]     = await db.query(`SELECT family, COUNT(*) AS count FROM plants GROUP BY family ORDER BY count DESC LIMIT 5`);
    const [topDepartments]  = await db.query(`SELECT department, COUNT(*) AS count FROM plants GROUP BY department ORDER BY count DESC LIMIT 5`);
    const [topCollectors]   = await db.query(`SELECT collector_name AS collector, COUNT(*) AS count FROM plants GROUP BY collector_name ORDER BY count DESC LIMIT 5`);
    const [habitatStats]    = await db.query(`
      SELECT CASE WHEN habitat IS NULL OR habitat = '' THEN 'No especificado' ELSE habitat END AS habitat_type,
             COUNT(*) AS count
      FROM plants GROUP BY habitat_type ORDER BY count DESC LIMIT 10
    `);
    const [conservationStats] = await db.query(`
      SELECT CASE WHEN conservation_status IS NULL OR conservation_status = '' THEN 'No evaluado' ELSE conservation_status END AS status,
             COUNT(*) AS count
      FROM plants GROUP BY status ORDER BY count DESC
    `);
    const [elevationStats] = await db.query(`
      SELECT CASE
               WHEN minimum_elevation_in_meters IS NULL THEN 'No especificada'
               WHEN minimum_elevation_in_meters < 500   THEN '0-500m'
               WHEN minimum_elevation_in_meters < 1000  THEN '500-1000m'
               WHEN minimum_elevation_in_meters < 2000  THEN '1000-2000m'
               WHEN minimum_elevation_in_meters < 3000  THEN '2000-3000m'
               ELSE '3000m+'
             END AS elevation_range,
             COUNT(*) AS count
      FROM plants GROUP BY elevation_range ORDER BY count DESC
    `);

    // ── Tendencias ─────────────────────────────────────────────────────────────
    const [yearlyStats]  = await db.query(`
      SELECT YEAR(created_at) AS year, COUNT(*) AS count
      FROM plants
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 5 YEAR)
      GROUP BY YEAR(created_at) ORDER BY year DESC
    `);
    const [monthlyStats] = await db.query(`
      SELECT YEAR(created_at) AS year, MONTH(created_at) AS month,
             MONTHNAME(created_at) AS month_name, COUNT(*) AS count
      FROM plants
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
    `);

    // ── Actividad reciente ─────────────────────────────────────────────────────
    const [recentActivity] = await db.query(`
      SELECT p.id, p.scientific_name, p.family, p.created_at,
             u.name AS created_by_name
      FROM plants p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC LIMIT 10
    `);

    logger.info(`Estadísticas del dashboard consultadas por ${user.email}`);

    return {
      overview: {
        totalPlants:     Number(totalPlantsRow.total),
        totalUsers:      Number(totalUsersRow.total),
        totalViews:      Number(totalViewsRow.total),
        plantsThisMonth: Number(plantsThisMonthRow.total),
        usersThisMonth,
        usersGrowth,
        visitsThisMonth,
        visitsGrowth,
        avgSessionTime
      },
      distributions: {
        topFamilies, topDepartments, topCollectors,
        habitatStats, conservationStats, elevationStats
      },
      trends: { yearlyStats, monthlyStats },
      recentActivity
    };

  } catch (error) {
    logger.error('Error al obtener estadísticas del dashboard:', error);
    throw error;
  }
};

module.exports = getStats;
