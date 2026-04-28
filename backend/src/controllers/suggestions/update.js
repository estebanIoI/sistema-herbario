// src/controllers/suggestions/update.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Actualizar el estado de una sugerencia
 * @param {Object} data - Datos de la solicitud
 * @param {Object} user - Información del usuario autenticado
 * @returns {Object} Resultado de la operación
 */
const update = async (data, user) => {
  try {
    const { id, status, notes } = data;
    
    console.log(`🔄 Actualizando sugerencia #${id} a estado: ${status} por usuario: ${user?.name || 'desconocido'}`);
    
    if (!id) {
      throw new Error('ID de sugerencia requerido');
    }
    
    if (!status) {
      throw new Error('Estado de sugerencia requerido');
    }
    
    // Validar el estado
    const validStatuses = ['pending', 'in_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Estado inválido: ${status}. Estados válidos: ${validStatuses.join(', ')}`);
    }
    
    if (!user || user.role !== 'admin') {
      logger.warn(`Usuario sin permisos intentó actualizar sugerencia: ${user?.email || 'anónimo'}`);
      throw new Error('Se requieren permisos de administrador');
    }

    // Por ahora, simulamos actualizar la sugerencia (cuando se implemente la BD real)
    // TODO: Implementar actualización real en base de datos
    
    // Registro de actividad
    logger.info(`Sugerencia #${id} actualizada a estado ${status} por ${user.name} (${user.email})`);
    
    return {
      success: true,
      message: `Sugerencia #${id} actualizada a estado ${status}`,
      suggestion: {
        id: parseInt(id),
        status: status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: notes || ''
      }
    };
    
  } catch (error) {
    logger.error(`Error al actualizar sugerencia: ${error.message}`);
    throw error;
  }
};

module.exports = update;
