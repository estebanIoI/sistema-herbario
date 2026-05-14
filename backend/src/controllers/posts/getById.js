const db = require('../../config/database');
const logger = require('../../utils/logger');

const getById = async (data) => {
  const { id } = data;
  if (!id) throw new Error('ID requerido');

  const [rows] = await db.query(
    `SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     WHERE p.id = ?`,
    [id]
  );

  if (!rows.length) throw new Error('Publicación no encontrada');

  await db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

  logger.info(`Post visto: id=${id}`);
  return rows[0];
};

module.exports = getById;
