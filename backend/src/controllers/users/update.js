// src/controllers/users/update.js
const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const logger = require('../../utils/logger');

const update = async (data, user) => {
  try {
    const { id, email, name, role, phone, password, status } = data;

    if (!id) {
      throw new Error('ID de usuario es requerido');
    }

    // Solo los admins pueden actualizar otros usuarios
    if (user.role !== 'admin' && user.id !== id) {
      throw new Error('Permisos insuficientes para actualizar este usuario');
    }

    // Verificar que el usuario existe
    const [existingUsers] = await db.query(
      'SELECT id, email, role FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const existingUser = existingUsers[0];

    // Los usuarios normales no pueden cambiar su propio rol
    if (user.role !== 'admin' && role && role !== existingUser.role) {
      throw new Error('No puedes cambiar tu propio rol');
    }

    // Construir query de actualización dinámicamente
    let updateFields = [];
    let updateValues = [];

    if (email && email !== existingUser.email) {
      // Verificar que el nuevo email no esté en uso
      const [emailCheck] = await db.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (emailCheck.length > 0) {
        throw new Error('El email ya está en uso');
      }
      
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }

    // Solo admins pueden cambiar roles y estados
    if (user.role === 'admin') {
      if (role) {
        if (!['admin', 'investigador', 'collector', 'user'].includes(role)) {
          throw new Error('Rol inválido');
        }
        updateFields.push('role = ?');
        updateValues.push(role);
      }

    // Actualizar status si se proporciona
    if (status !== undefined) {
      if (!['active', 'inactive', 'pending'].includes(status)) {
        throw new Error('Status inválido');
      }
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    }

    if (password) {
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    // Agregar timestamp de actualización
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    // Ejecutar actualización
    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Obtener el usuario actualizado
    const [updatedUser] = await db.query(
      'SELECT id, email, name, role, status, phone, updated_at FROM users WHERE id = ?',
      [id]
    );

    const userData = updatedUser[0];

    logger.info(`Usuario actualizado: ${userData.email} por ${user.email}`);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: userData.status,
      phone: userData.phone,
      updatedAt: userData.updated_at
    };

  } catch (error) {
    logger.error('Error al actualizar usuario:', error);
    throw error;
  }
};

module.exports = update;
