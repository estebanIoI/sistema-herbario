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
  
  // Configuraciones adicionales para optimización
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  
  // Configuraciones de charset para soporte completo de UTF-8
  charset: 'utf8mb4',
  
  // Timezone
  timezone: '+00:00'
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Conexión a MySQL establecida exitosamente');
    logger.info(`🗄️ Base de datos: ${dbConfig.database} en ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    logger.error('❌ Error al conectar con MySQL:', error.message);
    logger.error('🔧 Verifica la configuración de base de datos en .env');
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
