// src/controllers/suggestions/respond.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const respond = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Se requieren permisos de administrador');

  const { id, admin_response } = data || {};
  if (!id) throw new Error('ID de sugerencia requerido');
  if (!admin_response || admin_response.trim().length < 5) {
    throw new Error('La respuesta debe tener al menos 5 caracteres');
  }

  const [existing] = await db.query('SELECT id, status FROM suggestions WHERE id = ?', [id]);
  if (!existing.length) throw new Error('Sugerencia no encontrada');

  await db.query(
    `UPDATE suggestions
     SET admin_response = ?, responded_by = ?, responded_at = NOW(),
         status = 'implemented', assigned_to = ?, updated_at = NOW()
     WHERE id = ?`,
    [admin_response.trim(), user.id, user.id, id]
  );

  try {
    await db.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, user_id, description) VALUES (?, 'suggestion', ?, ?, ?)`,
      ['suggestion_responded', id, user.id, `Sugerencia #${id} respondida por ${user.email}`]
    );
  } catch { /* no interrumpir */ }

  logger.info(`Sugerencia #${id} respondida por ${user.email}`);
  return { success: true, message: 'Respuesta registrada correctamente' };
};

module.exports = respond;
