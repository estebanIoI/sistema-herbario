// src/controllers/users/updateProfile.js
const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const logger = require('../../utils/logger');

const updateProfile = async (data, user) => {
  try {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { name, phone, avatar_url, currentPassword, newPassword } = data;
    const userId = user.id;

    // Construir query de actualización dinámicamente
    let updateFields = [];
    let updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }

    if (avatar_url !== undefined) {
      updateFields.push('avatar_url = ?');
      updateValues.push(avatar_url || null);
    }

    // Cambio de contraseña
    if (newPassword) {
      if (!currentPassword) {
        throw new Error('Contraseña actual es requerida para cambiar la contraseña');
      }

      if (newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      // Verificar contraseña actual
      const [userPassword] = await db.query(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userPassword[0].password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Encriptar nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateFields.push('password = ?');
      updateValues.push(hashedNewPassword);
    }

    if (updateFields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    // Agregar timestamp de actualización
    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    // Ejecutar actualización
    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Obtener el usuario actualizado
    const [updatedUser] = await db.query(
      'SELECT id, email, name, role, phone, avatar_url, updated_at FROM users WHERE id = ?',
      [userId]
    );

    const userData = updatedUser[0];

    logger.info(`Perfil actualizado: ${userData.email}`);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      avatar_url: userData.avatar_url,
      updatedAt: userData.updated_at
    };

  } catch (error) {
    logger.error('Error al actualizar perfil:', error);
    throw error;
  }
};

module.exports = updateProfile;
