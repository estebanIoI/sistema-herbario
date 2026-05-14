// src/controllers/suggestions/update.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const update = async (data, user) => {
  try {
    const { id, status, notes } = data;

    if (!id) throw new Error('ID de sugerencia requerido');
    if (!status) throw new Error('Estado de sugerencia requerido');

    const validStatuses = ['pending', 'in_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Estado inválido: ${status}. Válidos: ${validStatuses.join(', ')}`);
    }

    if (!user || user.role !== 'admin') {
      throw new Error('Se requieren permisos de administrador');
    }

    // Verificar que la sugerencia existe
    const [existing] = await db.query('SELECT id, status FROM suggestions WHERE id = ?', [id]);
    if (!existing.length) throw new Error('Sugerencia no encontrada');

    // resolved_at solo se establece al aprobar o rechazar
    const isResolved = status === 'approved' || status === 'rejected';

    await db.query(
      `UPDATE suggestions
       SET status = ?, assigned_to = ?, updated_at = NOW()
           ${isResolved ? ', resolved_at = NOW()' : ''}
       WHERE id = ?`,
      [status, user.id, id]
    );

    // Registrar actividad
    try {
      await db.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, user_id, description)
         VALUES (?, 'suggestion', ?, ?, ?)`,
        ['suggestion_status_changed', id, user.id, `Sugerencia #${id} → ${status}`]
      );
    } catch { /* no interrumpir por fallo de log */ }

    logger.info(`Sugerencia #${id} → ${status} por ${user.email}`);

    return {
      success: true,
      message: `Sugerencia #${id} actualizada a estado ${status}`,
      suggestion: {
        id: parseInt(id),
        status,
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
