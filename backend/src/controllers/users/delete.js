// src/controllers/users/delete.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const deleteUser = async (data, user) => {
  try {
    if (!user || user.role !== 'admin') {
      throw new Error('Permisos insuficientes para eliminar usuarios');
    }

    const { id } = data;

    if (!id) {
      throw new Error('ID de usuario es requerido');
    }

    // No permitir que un admin se elimine a sí mismo
    if (user.id === id) {
      throw new Error('No puedes eliminar tu propia cuenta');
    }

    // Verificar que el usuario existe
    const [existingUsers] = await db.query(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const userToDelete = existingUsers[0];

    // Verificar si el usuario tiene plantas asociadas
    const [plantsCount] = await db.query(
      'SELECT COUNT(*) as count FROM plants WHERE created_by = ?',
      [id]
    );

    if (plantsCount[0].count > 0) {
      // En lugar de eliminar, desactivar el usuario para mantener integridad referencial
      await db.query(
        'UPDATE users SET status = "inactive", email = CONCAT(email, "_deleted_", NOW()), updated_at = NOW() WHERE id = ?',
        [id]
      );

      logger.info(`Usuario desactivado (tiene plantas asociadas): ${userToDelete.email} por ${user.email}`);

      return {
        message: `Usuario ${userToDelete.name} desactivado debido a que tiene plantas asociadas`,
        action: 'deactivated',
        plantsCount: plantsCount[0].count
      };
    } else {
      // Eliminar completamente si no tiene datos asociados
      await db.query('DELETE FROM users WHERE id = ?', [id]);

      logger.info(`Usuario eliminado: ${userToDelete.email} por ${user.email}`);

      return {
        message: `Usuario ${userToDelete.name} eliminado exitosamente`,
        action: 'deleted'
      };
    }

  } catch (error) {
    logger.error('Error al eliminar usuario:', error);
    throw error;
  }
};

module.exports = deleteUser;
