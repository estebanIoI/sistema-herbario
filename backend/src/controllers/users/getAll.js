// src/controllers/users/getAll.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getAll = async (data, user) => {
  try {
    if (!user || user.role !== 'admin') {
      throw new Error('Permisos insuficientes para acceder a usuarios');
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = ''
    } = data || {};

    const offset = (page - 1) * limit;
    
    // Construir condiciones WHERE
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam);
    }

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    if (status === 'active') {
      whereConditions.push('status = "active"');
    } else if (status === 'inactive') {
      whereConditions.push('status = "inactive"');
    } else if (status === 'pending') {
      whereConditions.push('status = "pending"');
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Query para obtener usuarios
    const usersQuery = `
      SELECT 
        id, email, name, role, status, avatar_url, phone,
        last_login, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users 
      ${whereClause}
    `;

    const [users] = await db.query(usersQuery, [...queryParams, limit, offset]);
    const [totalResult] = await db.query(countQuery, queryParams);
    
    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Eliminar información sensible
    const safeUsers = users.map(user => ({
      ...user,
      // No incluir información sensible en la respuesta
      password: undefined
    }));

    logger.info(`Lista de usuarios consultada por ${user.email} - Total: ${total}`);

    return {
      users: safeUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    logger.error('Error al obtener usuarios:', error);
    throw error;
  }
};

module.exports = getAll;
