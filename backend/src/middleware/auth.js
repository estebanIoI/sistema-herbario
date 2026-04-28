const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware para autenticar tokens JWT en requests HTTP
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  logger.info("🔐 Verificando token de autenticación");

  if (!token) {
    logger.warn("⛔ No se envió ningún token");
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'herbario_secret_key');
    logger.info(`✅ Token válido para usuario: ${decoded.email}`);

    // Verificar que el usuario existe y está activo
    const [results] = await db.query(
      'SELECT id, email, name, role, status FROM users WHERE id = ? AND status = "active"', 
      [decoded.id]
    );
    
    const user = results[0];

    if (!user) {
      logger.warn(`❌ Usuario no encontrado o inactivo: ${decoded.id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario no autorizado' 
      });
    }

    logger.info(`✅ Usuario autenticado: ${user.email} - Rol: ${user.role}`);
    req.user = user;
    next();
  } catch (error) {
    logger.error(`❌ Error al verificar token: ${error.message}`);
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

/**
 * Función para validar tokens en servicios (no middleware)
 */
const authenticateTokenSync = (token) => {
  try {
    if (!token) {
      console.error('⛔ Error de autenticación: No se proporcionó token');
      throw new Error('Token requerido');
    }

    // Limpiar el token (a veces puede venir con "Bearer " al principio)
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    console.log(`🔑 Verificando token: ${cleanToken.substring(0, 10)}...`);

    // Verificar el token con la clave secreta
    const jwtSecret = process.env.JWT_SECRET || 'herbario_secret_key';
    const decoded = jwt.verify(cleanToken, jwtSecret);
    
    console.log(`✅ Token verificado exitosamente para: ${decoded.email}`);
    return decoded;
  } catch (error) {
    console.error(`❌ Error al verificar token: ${error.message}`, error);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado. Por favor inicie sesión nuevamente.');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido. El formato o la firma del token es incorrecta.');
    } else {
      throw new Error('Error de autenticación: ' + error.message);
    }
  }
};

/**
 * Middleware para autorizar roles específicos
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Usuario ${req.user.email} intentó acceder sin permisos. Rol: ${req.user.role}, Requerido: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar si el usuario es administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Se requieren permisos de administrador'
    });
  }
  next();
};

module.exports = {
  authenticateToken: authenticateTokenSync, // Para usar en serviceController
  authenticateTokenMiddleware: authenticateToken, // Para usar como middleware
  authorizeRoles,
  requireAdmin
};
