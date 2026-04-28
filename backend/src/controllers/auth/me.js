// src/controllers/auth/me.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const me = async (data, user) => {
  try {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener información actualizada del usuario
    const [users] = await db.query(
      `SELECT 
        id, email, name, role, status, 
        avatar_url, phone, last_login, created_at 
       FROM users 
       WHERE id = ? AND status = 'active'`,
      [user.id]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const userData = users[0];

    logger.info(`Información de usuario solicitada: ${userData.email}`);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar_url,
      phone: userData.phone,
      lastLogin: userData.last_login,
      createdAt: userData.created_at
    };

  } catch (error) {
    logger.error('Error en obtener información de usuario:', error);
    throw error;
  }
};

module.exports = me;
