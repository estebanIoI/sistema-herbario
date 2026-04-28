// src/controllers/healthCheck.js
const logger = require('../utils/logger');

const healthCheck = async () => {
  try {
    const timestamp = new Date().toISOString();
    
    // Verificaciones básicas del sistema
    const health = {
      status: 'healthy',
      timestamp,
      system: 'Herbario Digital HEAA',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024
      },
      services: {
        database: await checkDatabaseConnection(),
        api: 'operational',
        uploads: 'operational'
      }
    };

    logger.info('Health check realizado exitosamente');
    return health;
  } catch (error) {
    logger.error('Error en health check:', error);
    throw error;
  }
};

const checkDatabaseConnection = async () => {
  try {
    const db = require('../config/database');
    await db.query('SELECT 1');
    return 'connected';
  } catch (error) {
    logger.error('Error de conexión a base de datos:', error);
    return 'disconnected';
  }
};

module.exports = healthCheck;
