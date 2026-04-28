// src/controllers/auth/logout.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const logout = async (data, user, context = {}) => {
  try {
    if (user) {
      // Buscar el último login para calcular duración de sesión
      const [lastLogin] = await db.query(
        `SELECT JSON_UNQUOTE(metadata->>'$.login_at') as login_at
         FROM activity_logs
         WHERE user_id = ? AND action = 'login'
         ORDER BY created_at DESC LIMIT 1`,
        [user.id]
      );

      let sessionDurationSeconds = null;
      if (lastLogin.length > 0 && lastLogin[0].login_at) {
        const loginAt = new Date(lastLogin[0].login_at);
        const now = new Date();
        const diff = Math.round((now - loginAt) / 1000);
        // Solo guardar si la sesión duró entre 10 segundos y 24 horas (descartar outliers)
        if (diff >= 10 && diff <= 86400) {
          sessionDurationSeconds = diff;
        }
      }

      db.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, description, ip_address, user_agent, metadata)
         VALUES (?, 'logout', 'session', ?, ?, ?, JSON_OBJECT('session_duration_seconds', ?))`,
        [user.id, `Logout: ${user.email}`, context.ip || null, context.userAgent || null, sessionDurationSeconds]
      ).catch(err => logger.error('Error registrando logout en activity_logs:', err));

      logger.info(`Usuario desconectado: ${user.email} (sesión: ${sessionDurationSeconds ?? 'desconocida'}s)`);
    }

    return { message: 'Sesión cerrada exitosamente' };

  } catch (error) {
    logger.error('Error en logout:', error);
    throw error;
  }
};

module.exports = logout;
