// src/controllers/auth/login.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const logger = require('../../utils/logger');

const login = async (data, _user, context = {}) => {
  try {
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    const [users] = await db.query(
      'SELECT id, email, password, name, role, status FROM users WHERE email = ? AND status = "active"',
      [email]
    );

    if (users.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Registrar sesión en activity_logs para calcular tiempo de sesión luego
    db.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, description, ip_address, user_agent, metadata)
       VALUES (?, 'login', 'session', ?, ?, ?, JSON_OBJECT('login_at', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')))`,
      [user.id, `Login: ${user.email}`, context.ip || null, context.userAgent || null]
    ).catch(err => logger.error('Error registrando login en activity_logs:', err));

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'herbario_secret_key',
      { expiresIn: '24h' }
    );

    logger.info(`Usuario autenticado: ${user.email}`);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    };

  } catch (error) {
    logger.error('Error en login:', error);
    throw error;
  }
};

module.exports = login;
