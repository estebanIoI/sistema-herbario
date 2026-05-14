const db = require('../../config/database');
const logger = require('../../utils/logger');

const create = async (data, user) => {
  if (!user || user.role !== 'admin') {
    throw new Error('Permisos insuficientes');
  }

  const { title, content, excerpt, image_url, category = 'publicacion', tags, status = 'draft' } = data;

  if (!title || !title.trim()) {
    throw new Error('El título es requerido');
  }

  const [result] = await db.query(
    `INSERT INTO posts (title, content, excerpt, image_url, category, tags, author_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title.trim(), content || null, excerpt || null, image_url || null, category, tags || null, user.id, status]
  );

  const [rows] = await db.query(
    `SELECT p.*, u.name AS author_name FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     WHERE p.id = ?`,
    [result.insertId]
  );

  logger.info(`Post creado: "${title}" por ${user.email}`);
  return rows[0];
};

module.exports = create;
