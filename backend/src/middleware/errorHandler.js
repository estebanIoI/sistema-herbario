// src/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error(`Error en ${req.method} ${req.originalUrl}:`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Errores de validación de Mongoose/Sequelize
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      messages: errors
    });
  }

  // Errores de duplicación (MySQL)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      error: 'Datos duplicados',
      message: 'Ya existe un registro con estos datos'
    });
  }

  // Errores de clave foránea (MySQL)
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      error: 'Referencia inválida',
      message: 'El registro referenciado no existe'
    });
  }

  // Error de conexión a base de datos
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      success: false,
      error: 'Error de base de datos',
      message: 'Servicio temporalmente no disponible'
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      message: 'El token de autenticación no es válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado',
      message: 'El token de autenticación ha expirado'
    });
  }

  // Error de archivo muy grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Archivo muy grande',
      message: 'El archivo excede el tamaño máximo permitido'
    });
  }

  // Error de tipo de archivo no permitido
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(415).json({
      success: false,
      error: 'Tipo de archivo no permitido',
      message: 'El tipo de archivo no está permitido'
    });
  }

  // Errores de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido',
      message: 'El formato JSON enviado no es válido'
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  // En producción, no exponer detalles internos
  const response = {
    success: false,
    error: statusCode === 500 ? 'Error interno del servidor' : message
  };

  // En desarrollo, incluir más detalles
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
