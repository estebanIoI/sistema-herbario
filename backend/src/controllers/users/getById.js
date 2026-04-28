// src/controllers/users/getById.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getById = async (data, user) => {
  try {
    const { id } = data;

    if (!id) {
      throw new Error('ID de usuario es requerido');
    }

    // Solo los admins pueden ver otros usuarios, los usuarios normales solo se pueden ver a sí mismos
    if (user.role !== 'admin' && user.id !== id) {
      throw new Error('Permisos insuficientes para acceder a este usuario');
    }

    const [users] = await db.query(
      `SELECT 
        id, email, name, role, status, avatar_url, phone,
        last_login, created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const userData = users[0];

    // Si es admin, obtener estadísticas adicionales del usuario
    if (user.role === 'admin') {
      // Plantas creadas por este usuario (si es admin)
      const [plantsCreated] = await db.query(
        'SELECT COUNT(*) as count FROM plants WHERE created_by = ?',
        [id]
      );

      // Última actividad
      const [lastActivity] = await db.query(
        'SELECT MAX(created_at) as last_activity FROM plants WHERE created_by = ?',
        [id]
      );

      userData.stats = {
        plantsCreated: plantsCreated[0].count,
        lastActivity: lastActivity[0].last_activity
      };
    }

    logger.info(`Usuario consultado: ${userData.email} por ${user.email}`);

    return userData;

  } catch (error) {
    logger.error('Error al obtener usuario por ID:', error);
    throw error;
  }
};

module.exports = getById;
