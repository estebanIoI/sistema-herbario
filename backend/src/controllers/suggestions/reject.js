const db = require('../../config/database');
const logger = require('../../utils/logger');

const reject = async (data, user) => {
  const { id, notes } = data;

  if (!id) throw new Error('ID de sugerencia requerido');
  if (!user || user.role !== 'admin') throw new Error('Se requieren permisos de administrador');

  const [existing] = await db.query('SELECT * FROM suggestions WHERE id = ?', [id]);
  if (!existing.length) throw new Error(`Sugerencia #${id} no encontrada`);

  const now = new Date();

  let attachments = {};
  if (existing[0].attachments) {
    try {
      attachments = typeof existing[0].attachments === 'string'
        ? JSON.parse(existing[0].attachments)
        : existing[0].attachments;
    } catch { /* ignorar */ }
  }
  if (notes) attachments.admin_notes = notes;

  await db.query(
    `UPDATE suggestions
     SET status = 'rejected', assigned_to = ?, resolved_at = ?, updated_at = ?,
         attachments = ?
     WHERE id = ?`,
    [user.id, now, now, JSON.stringify(attachments), id]
  );

  try {
    await db.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, user_id, description)
       VALUES ('suggestion_rejected', 'suggestion', ?, ?, ?)`,
      [id, user.id, `Sugerencia #${id} rechazada por ${user.email}`]
    );
  } catch { /* no interrumpir por fallo de log */ }

  logger.info(`Sugerencia #${id} rechazada por ${user.email}`);

  return {
    id: parseInt(id),
    status: 'rejected',
    reviewed_by: user.id,
    reviewed_at: now.toISOString(),
    admin_notes: notes || null,
  };
};

module.exports = reject;
