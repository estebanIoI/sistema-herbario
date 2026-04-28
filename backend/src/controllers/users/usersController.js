// src/controllers/users/usersController.js
const getAll = require('./getAll');
const getById = require('./getById');
const create = require('./create');
const update = require('./update');
const deleteUser = require('./delete');
const updateProfile = require('./updateProfile');
const toggleStatus = require('./toggleStatus');

module.exports = {
    // Operaciones CRUD básicas
    getAll: getAll.handler || getAll,
    getById: getById.handler || getById,
    create: create.handler || create,
    update: update.handler || update,
    delete: deleteUser.handler || deleteUser,
    
    // Operaciones específicas
    updateProfile: updateProfile.handler || updateProfile,
    toggleStatus: toggleStatus.handler || toggleStatus,
    
    // Obtener perfil del usuario actual
    getProfile: async (req, res) => {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Usar el mismo controlador que getById
            req.params.id = userId;
            return (getById.handler || getById)(req, res);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil',
                error: error.message
            });
        }
    },

    // Buscar usuarios
    search: async (req, res) => {
        try {
            const { q, role, status, page = 1, limit = 10 } = req.query;
            
            // TODO: Implementar búsqueda de usuarios
            res.json({
                success: true,
                data: {
                    users: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        pages: 0
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al buscar usuarios',
                error: error.message
            });
        }
    },

    // Obtener estadísticas de usuarios
    getStats: async (req, res) => {
        try {
            // TODO: Implementar estadísticas de usuarios
            res.json({
                success: true,
                data: {
                    total: 0,
                    active: 0,
                    inactive: 0,
                    pending: 0,
                    admins: 0,
                    collectors: 0,
                    users: 0
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    },

    // Cambiar rol de usuario
    changeRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;
            
            if (!['admin', 'user', 'collector'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rol inválido'
                });
            }

            // TODO: Implementar cambio de rol
            res.json({
                success: true,
                message: 'Rol actualizado exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al cambiar rol',
                error: error.message
            });
        }
    },

    // Obtener actividad del usuario
    getActivity: async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            // TODO: Implementar historial de actividad
            res.json({
                success: true,
                data: {
                    activities: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        pages: 0
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener actividad',
                error: error.message
            });
        }
    }
};
