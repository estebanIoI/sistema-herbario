// src/controllers/suggestions/approve.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Aprobar una sugerencia
 * @param {Object} data - Datos de la solicitud
 * @param {Object} user - Información del usuario autenticado
 * @returns {Object} Resultado de la operación
 */
const approve = async (data, user) => {
  try {
    const { id, notes } = data;
    
    console.log(`🟢 Aprobando sugerencia #${id} por usuario: ${user?.name || 'desconocido'}`);
    
    if (!id) {
      throw new Error('ID de sugerencia requerido');
    }
    
    if (!user || user.role !== 'admin') {
      logger.warn(`Usuario sin permisos intentó aprobar sugerencia: ${user?.email || 'anónimo'}`);
      throw new Error('Se requieren permisos de administrador');
    }

    // Actualizar el estado de la sugerencia en la base de datos
    const now = new Date();
    
    // Primero verificamos que la sugerencia existe
    const [existingSuggestion] = await db.query(
      'SELECT * FROM suggestions WHERE id = ?', 
      [id]
    );
    
    if (existingSuggestion.length === 0) {
      throw new Error(`Sugerencia #${id} no encontrada`);
    }
    
    // Actualizamos el estado de la sugerencia
    const [updateResult] = await db.query(
      `UPDATE suggestions 
       SET status = 'approved', 
           assigned_to = ?, 
           resolved_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [user.id, now, now, id]
    );
    
    if (updateResult.affectedRows === 0) {
      throw new Error(`Error al actualizar sugerencia #${id}`);
    }
    
    // Obtenemos la sugerencia actualizada para devolver en la respuesta
    const [updatedSuggestion] = await db.query(
      'SELECT * FROM suggestions WHERE id = ?', 
      [id]
    );
    
    // Registro de actividad
    logger.info(`Sugerencia #${id} aprobada por ${user.name} (${user.email})`);
    
    return {
      success: true,
      message: `Sugerencia #${id} aprobada exitosamente`,
      suggestion: {
        id: parseInt(id),
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: now.toISOString(),
        notes: notes || '',
        // Incluimos datos adicionales de la sugerencia actualizada
        ...updatedSuggestion[0]
      }
    };
    
  } catch (error) {
    logger.error(`Error al aprobar sugerencia: ${error.message}`);
    throw error;
  }
};

module.exports = approve;
