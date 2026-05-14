const db = require('../../config/database');
const logger = require('../../utils/logger');

const update = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');

  const { id, title, content, excerpt, image_url, category, tags, status } = data;
  if (!id) throw new Error('ID requerido');

  const fields = [];
  const params = [];

  if (title     !== undefined) { fields.push('title = ?');     params.push(title); }
  if (content   !== undefined) { fields.push('content = ?');   params.push(content); }
  if (excerpt   !== undefined) { fields.push('excerpt = ?');   params.push(excerpt); }
  if (image_url !== undefined) { fields.push('image_url = ?'); params.push(image_url); }
  if (category  !== undefined) { fields.push('category = ?');  params.push(category); }
  if (tags      !== undefined) { fields.push('tags = ?');      params.push(tags); }
  if (status    !== undefined) { fields.push('status = ?');    params.push(status); }

  if (!fields.length) throw new Error('No hay campos para actualizar');

  params.push(id);
  await db.query(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, params);

  const [rows] = await db.query(
    `SELECT p.*, u.name AS author_name FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     WHERE p.id = ?`,
    [id]
  );

  logger.info(`Post actualizado: id=${id} por ${user.email}`);
  return rows[0];
};

module.exports = update;
