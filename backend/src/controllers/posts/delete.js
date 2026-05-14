const db = require('../../config/database');
const logger = require('../../utils/logger');

const deletePost = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');

  const { id } = data;
  if (!id) throw new Error('ID requerido');

  const [rows] = await db.query('SELECT id, title FROM posts WHERE id = ?', [id]);
  if (!rows.length) throw new Error('Publicación no encontrada');

  await db.query('DELETE FROM posts WHERE id = ?', [id]);

  logger.info(`Post eliminado: "${rows[0].title}" por ${user.email}`);
  return { deleted: true, id };
};

module.exports = deletePost;
