// src/config/database.js
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'herbario_heaa',
  port: parseInt(process.env.DB_PORT) || 3306,
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  
  // Configuraciones de charset para soporte completo de UTF-8
  charset: 'utf8mb4',
  
  // Timezone Colombia/Bogotá (UTC-5)
  // Afecta la serialización JS Date ↔ string MySQL (no cambia NOW() del servidor)
  timezone: '-05:00',

  // Retornar DATE/DATETIME como strings 'YYYY-MM-DD' / 'YYYY-MM-DD HH:mm:ss'
  // en lugar de objetos Date (evita off-by-one por conversión de zona horaria)
  dateStrings: ['DATE', 'DATETIME']
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    logger.info(`✅ MySQL conectado — ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (error) {
    logger.error(`❌ MySQL no disponible: ${error.message}`);
    return false;
  }
};

// Función wrapper para queries con manejo de errores
const query = async (sql, params = []) => {
  try {
    // Usar query en lugar de execute para debug
    const [rows] = await pool.query(sql, params);
    return [rows];
  } catch (error) {
    logger.error('❌ Error en query de base de datos:', {
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      params: params,
      error: error.message
    });
    throw error;
  }
};

// Función para transacciones
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('❌ Error en transacción, rollback realizado:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Función para obtener estadísticas de la base de datos
const getStats = async () => {
  try {
    const [tables] = await query('SHOW TABLES');
    const [processes] = await query('SHOW PROCESSLIST');
    const [status] = await query("SHOW STATUS LIKE 'Threads_connected'");
    
    return {
      tablesCount: tables.length,
      activeConnections: parseInt(status[0]?.Value || 0),
      processesCount: processes.length,
      poolStatus: {
        totalConnections: pool.pool._allConnections.length,
        freeConnections: pool.pool._freeConnections.length,
        acquiringConnections: pool.pool._acquiringConnections.length
      }
    };
  } catch (error) {
    logger.error('Error obteniendo estadísticas de BD:', error.message);
    return null;
  }
};

// Cerrar pool de conexiones gracefully
const closePool = async () => {
  try {
    await pool.end();
    logger.info('🔌 Pool de conexiones MySQL cerrado');
  } catch (error) {
    logger.error('❌ Error cerrando pool de conexiones:', error.message);
  }
};

// Event listeners para el pool
pool.on('connection', (connection) => {
  logger.debug(`🔗 Nueva conexión establecida: ${connection.threadId}`);
  // Establecer zona horaria de sesión → NOW() retorna hora de Colombia/Bogotá
  connection.query("SET time_zone = '-05:00'", (err) => {
    if (err) logger.error('Error al establecer time_zone de sesión:', err.message);
  });
});

pool.on('error', (error) => {
  logger.error('❌ Error en pool de conexiones MySQL:', error.message);
  if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.info('🔄 Reintentando conexión a MySQL...');
  }
});

// Probar conexión al inicializar
testConnection();

module.exports = {
  query,
  transaction,
  getStats,
  closePool,
  testConnection,
  pool
};
