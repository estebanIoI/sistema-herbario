// src/controllers/auth/register.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const logger = require('../../utils/logger');

const register = async (data) => {
  try {
    const { email, password, name, phone } = data;

    // Validaciones básicas
    if (!email || !password || !name) {
      throw new Error('Email, contraseña y nombre son requeridos');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar si el email ya existe
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('El email ya está registrado');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const [result] = await db.query(
      `INSERT INTO users (email, password, name, phone, role) 
       VALUES (?, ?, ?, ?, 'user')`,
      [email, hashedPassword, name, phone || null]
    );

    // Obtener el usuario creado
    const [newUser] = await db.query(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = newUser[0];

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'herbario_secret_key',
      { expiresIn: '24h' }
    );

    logger.info(`Nuevo usuario registrado: ${user.email}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

  } catch (error) {
    logger.error('Error en registro:', error);
    throw error;
  }
};

module.exports = register;
