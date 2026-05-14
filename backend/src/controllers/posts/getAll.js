const db = require('../../config/database');
const logger = require('../../utils/logger');

const getAll = async (data, user) => {
  const { category, status, page = 1, limit = 20, search } = data || {};

  const conditions = [];
  const params = [];

  if (!user || user.role !== 'admin') {
    conditions.push("p.status = 'published'");
  } else if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  if (category) {
    conditions.push('p.category = ?');
    params.push(category);
  }

  if (search) {
    conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.tags LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [posts] = await db.query(
    `SELECT p.id, p.title, p.excerpt, p.image_url, p.category, p.tags,
            p.status, p.views, p.created_at, p.updated_at,
            u.name AS author_name, u.avatar_url AS author_avatar
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM posts p ${where}`,
    params
  );
  const total = countRows[0].total;

  logger.info(`Posts recuperados: ${posts.length} de ${total}`);
  return { posts, total, page: parseInt(page), limit: parseInt(limit) };
};

module.exports = getAll;
