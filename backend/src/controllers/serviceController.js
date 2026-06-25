const { services } = require("../services");
const { authenticateToken } = require("../middleware/auth");
const logger = require('../utils/logger');
const db = require('../config/database');

// Servicios que requieren autenticación
const SERVICES_REQUIRING_AUTH = [
  // Autenticación
  'auth.me',
  'auth.logout',
  
  // Usuarios (solo admin)
  'users.getAll',
  'users.getById',
  'users.create',
  'users.update',
  'users.delete',
  'users.toggleStatus',
  'users.updateProfile',
  
  // Plantas (admin para CUD, público para R)
  'plants.create',
  'plants.update',
  'plants.delete',
  'plants.restore',
  'plants.import',
  'plants.bulkDelete',
  
  // Dashboard (solo admin)
  'dashboard.getStats',
  'dashboard.getRecentActivity',
  'dashboard.getVisitorStats',
  'dashboard.getTopSearches',
  
  // Sugerencias (admin para gestión)
  'suggestions.approve',
  'suggestions.reject',
  'suggestions.getByStatus',
  'suggestions.getAll',
  'suggestions.countUnread',
  
  // Configuraciones (admin)
  'settings.update',
  'settings.updateMultiple',
  'settings.getAll',
  'settings.reset',
  'settings.backup',
  'settings.restore',
  'settings.testCloudinary',
  
  // Subida de archivos
  'uploads.uploadImage',
  'uploads.deleteImage',
  
  // Exportación (requiere auth — gateado a Investigador/Admin en ROLE_GRANTS)
  'plants.export',
  'plants.exportDwc',

  // Backup
  'backup.generate',

  // Notificaciones
  'notifications.getAll',
  'notifications.markAsRead',
  'notifications.create',

  // PQRSDF (solo gestión admin — el create es público)
  'pqrsdf.getAll',
  'pqrsdf.getById',
  'pqrsdf.updateStatus',
  'pqrsdf.respond',

  // Sugerencias — acciones adicionales
  'suggestions.update',
  'suggestions.updateStatus',
  'suggestions.respond',
  'suggestions.getStats',
  'suggestions.getById',

  // Publicaciones (admin para CUD)
  'posts.create',
  'posts.update',
  'posts.delete',
];

/**
 * Controlador principal que maneja todas las peticiones de servicios
 */
const handleRequest = async (req, res) => {
  try {
    const { service, data = {}, token } = req.body;

    // Validación básica
    if (!service) {
      logger.warn('Petición sin servicio especificado');
      return res.status(400).json({
        success: false,
        error: 'Servicio no especificado',
        message: 'El campo "service" es requerido'
      });
    }

    // Verificar que el servicio existe
    if (!services[service]) {
      logger.warn(`Servicio no encontrado: ${service}`);
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado',
        message: `El servicio "${service}" no existe`,
        availableServices: Object.keys(services).slice(0, 10) // Mostrar solo algunos ejemplos
      });
    }

    logger.info(`📞 Ejecutando servicio: ${service}`);

    let user = null;

    // Verificar autenticación si es requerida
    if (SERVICES_REQUIRING_AUTH.includes(service)) {
      if (!token) {
        logger.warn(`Token requerido para servicio: ${service}`);
        console.error(`⛔ Petición sin token para servicio que requiere autenticación: ${service}`);
        return res.status(401).json({
          success: false,
          error: 'Autenticación requerida',
          message: 'Este servicio requiere autenticación'
        });
      }

      try {
        console.log(`🔑 Verificando token para servicio ${service}. Token recibido: ${token.substring(0, 10)}...`);
        
        // Verificar y decodificar token
        const decoded = authenticateToken(token);
        console.log(`✅ Token decodificado para usuario id: ${decoded.id}, email: ${decoded.email}, rol: ${decoded.role}`);
        
        // Obtener información completa del usuario
        const [users] = await db.query(
          'SELECT id, email, name, role, status FROM users WHERE id = ? AND status = "active"',
          [decoded.id]
        );

        if (users.length === 0) {
          logger.warn(`Usuario no encontrado o inactivo: ${decoded.id}`);
          console.error(`⛔ Usuario del token no encontrado o inactivo: ${decoded.id}`);
          return res.status(403).json({
            success: false,
            error: 'Usuario no autorizado',
            message: 'El usuario no existe o está inactivo'
          });
        }

        user = users[0];
        logger.info(`Usuario autenticado: ${user.email} - Rol: ${user.role}`);
        console.log(`👤 Usuario autenticado correctamente: ${user.email} (${user.role})`);

      } catch (authError) {
        logger.error(`Error de autenticación para servicio ${service}:`, authError);
        console.error(`❌ Error al verificar token: ${authError.message}`);
        return res.status(403).json({
          success: false,
          error: 'Token inválido',
          message: authError.message
        });
      }
    }

    // ── Control de acceso basado en roles (RBAC) ───────────────────────────
    // Jerarquía de la matriz:  público < collector < investigador < admin
    //
    // ROLE_GRANTS: servicios que NO son exclusivos de admin. Indica qué roles
    // (además de admin) pueden ejecutarlos.
    const ROLE_GRANTS = {
      // Registrar especímenes en campo con imágenes → Colector, Investigador, Admin
      'plants.create': ['admin', 'collector', 'investigador'],
      'plants.update': ['admin', 'collector', 'investigador'],
      // Búsqueda avanzada y exportación de datos → Investigador, Admin
      'plants.export': ['admin', 'investigador'],
      'plants.exportDwc': ['admin', 'investigador'],
    };

    // Gestión total del portal y roles → solo Admin
    const adminServices = [
      'users.getAll', 'users.getById', 'users.create', 'users.update', 'users.delete', 'users.toggleStatus',
      'plants.delete', 'plants.restore', 'plants.import', 'plants.bulkDelete',
      'dashboard.getStats', 'dashboard.getRecentActivity',
      'suggestions.approve', 'suggestions.reject', 'suggestions.respond',
      'suggestions.update', 'suggestions.updateStatus', 'suggestions.countUnread',
      'pqrsdf.getAll', 'pqrsdf.getById', 'pqrsdf.updateStatus', 'pqrsdf.respond',
      'settings.update', 'settings.updateMultiple', 'settings.getAll',
      'settings.reset', 'settings.backup', 'settings.restore', 'settings.testCloudinary',
      'uploads.deleteImage',
      'posts.create', 'posts.update', 'posts.delete',
      'backup.generate',
    ];

    if (ROLE_GRANTS[service]) {
      // Servicio con roles específicos
      if (!user || !ROLE_GRANTS[service].includes(user.role)) {
        logger.warn(`Acceso denegado (rol) para ${service} por ${user ? user.email : 'anónimo'} [${user ? user.role : '—'}]`);
        return res.status(403).json({
          success: false,
          error: 'Permisos insuficientes',
          message: 'Tu rol no tiene acceso a esta acción'
        });
      }
    } else if (adminServices.includes(service) && (!user || user.role !== 'admin')) {
      // Servicio exclusivo de administrador
      logger.warn(`Acceso denegado para servicio de admin: ${service} por usuario: ${user ? user.email : 'anónimo'}`);
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes',
        message: 'Se requieren permisos de administrador para este servicio'
      });
    }

    // Ejecutar el servicio
    const startTime = Date.now();
    const context = {
      ip: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.get('user-agent') || null
    };
    const result = await services[service](data, user, context);
    const executionTime = Date.now() - startTime;

    logger.info(`✅ Servicio ${service} ejecutado exitosamente en ${executionTime}ms`);

    // Respuesta exitosa
    res.json({
      success: true,
      data: result,
      service,
      timestamp: new Date().toISOString(),
      executionTime
    });

  } catch (error) {
    logger.error(`❌ Error ejecutando servicio ${req.body.service}:`, error);

    // Determinar el código de estado HTTP basado en el tipo de error
    let statusCode = error.statusCode || 500;

    // Si no tiene statusCode, intentar inferirlo del mensaje
    if (!error.statusCode) {
      if (error.code === 'ER_DUP_ENTRY') {
        statusCode = 409; // Conflict
      } else if (error.message.includes('no encontrado') || error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('permisos') || error.message.includes('autorizado')) {
        statusCode = 403;
      } else if (error.message.includes('requerido') || error.message.includes('inválido')) {
        statusCode = 400;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      service: req.body.service,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  handleRequest
};

