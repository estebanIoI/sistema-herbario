// src/controllers/suggestions/countUnread.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Cuenta las sugerencias no leídas (con status 'pending')
 * 
 * @param {Object} data - Datos de la solicitud (no se requiere en este caso)
 * @param {Object} user - Usuario autenticado
 * @returns {Promise<Object>} - Conteo de sugerencias no leídas
 */
const countUnread = async (data, user) => {
  try {
    logger.info('Contando sugerencias no leídas');

    // Consulta para contar sugerencias con status 'pending'
    const [results] = await db.query(`
      SELECT COUNT(*) as count 
      FROM suggestions 
      WHERE status = 'pending'
    `);

    const count = results[0].count || 0;

    logger.info(`Encontradas ${count} sugerencias no leídas`);

    return { count };
  } catch (error) {
    logger.error('Error al contar sugerencias no leídas:', error);
    throw new Error('Error al obtener el conteo de sugerencias no leídas');
  }
};

module.exports = countUnread;
