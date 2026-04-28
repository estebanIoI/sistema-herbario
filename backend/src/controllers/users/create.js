// src/controllers/users/create.js
const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const logger = require('../../utils/logger');

const create = async (data, user) => {
  try {
    if (!user || user.role !== 'admin') {
      throw new Error('Permisos insuficientes para crear usuarios');
    }

    const { email, password, name, role = 'user', phone } = data;

    // Validaciones básicas
    if (!email || !password || !name) {
      throw new Error('Email, contraseña y nombre son requeridos');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Validar role
    if (!['admin', 'user'].includes(role)) {
      throw new Error('Rol inválido');
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
      `INSERT INTO users (email, password, name, role, phone, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [email, hashedPassword, name, role, phone || null]
    );

    // Obtener el usuario creado
    const [newUser] = await db.query(
      'SELECT id, email, name, role, status, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const userData = newUser[0];

    logger.info(`Nuevo usuario creado: ${userData.email} por ${user.email}`);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: userData.status,
      createdAt: userData.created_at
    };

  } catch (error) {
    logger.error('Error al crear usuario:', error);
    throw error;
  }
};

module.exports = create;
