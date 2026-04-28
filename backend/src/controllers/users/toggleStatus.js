// src/controllers/users/toggleStatus.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const toggleStatus = async (data, user) => {
  try {
    if (!user || user.role !== 'admin') {
      throw new Error('Permisos insuficientes para cambiar estado de usuarios');
    }

    const { id } = data;

    if (!id) {
      throw new Error('ID de usuario es requerido');
    }

    // No permitir que un admin se desactive a sí mismo
    if (user.id === id) {
      throw new Error('No puedes cambiar tu propio estado');
    }

    // Verificar que el usuario existe
    const [existingUsers] = await db.query(
      'SELECT id, email, name, status FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const userToToggle = existingUsers[0];
    const newStatus = userToToggle.status === 'active' ? 'inactive' : 'active';

    // Actualizar estado
    await db.query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    const action = newStatus === 'active' ? 'activado' : 'desactivado';
    
    logger.info(`Usuario ${action}: ${userToToggle.email} por ${user.email}`);

    return {
      message: `Usuario ${userToToggle.name} ${action} exitosamente`,
      userId: id,
      newStatus,
      action: newStatus === 'active' ? 'activated' : 'deactivated'
    };

  } catch (error) {
    logger.error('Error al cambiar estado de usuario:', error);
    throw error;
  }
};

module.exports = toggleStatus;
