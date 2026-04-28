// src/middleware/connectionTracker.js
const logger = require('../utils/logger');

// Contador de conexiones activas
let activeConnections = 0;
let totalRequests = 0;
let requestStats = {
  get: 0,
  post: 0,
  put: 0,
  delete: 0,
  patch: 0,
  options: 0
};

// Middleware para trackear conexiones y rendimiento
const trackConnection = (req, res, next) => {
  const startTime = Date.now();
  activeConnections++;
  totalRequests++;
  
  // Incrementar contador por método
  const method = req.method.toLowerCase();
  if (requestStats[method] !== undefined) {
    requestStats[method]++;
  }

  // Log de request entrante
  logger.info(`📥 Request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    activeConnections,
    totalRequests: totalRequests
  });

  // Middleware para capturar cuando termina la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    activeConnections--;
    
    // Log de response
    logger.info(`📤 Response: ${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
      activeConnections
    });

    // Log de warning para requests lentos
    if (duration > 5000) { // Más de 5 segundos
      logger.warn(`🐌 Request lento detectado: ${req.method} ${req.originalUrl}`, {
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });

  // Middleware para capturar errores de conexión
  res.on('close', () => {
    if (!res.finished) {
      activeConnections--;
      logger.warn(`🔌 Conexión cerrada prematuramente: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        duration: `${Date.now() - startTime}ms`
      });
    }
  });

  // Continuar con el siguiente middleware
  next();
};

// Función para obtener estadísticas de conexión
const getConnectionStats = () => {
  return {
    activeConnections,
    totalRequests,
    requestsByMethod: { ...requestStats },
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
};

// Función para resetear estadísticas
const resetStats = () => {
  totalRequests = 0;
  requestStats = {
    get: 0,
    post: 0,
    put: 0,
    delete: 0,
    patch: 0,
    options: 0
  };
  logger.info('Estadísticas de conexión reseteadas');
};

// Log periódico de estadísticas (cada 10 minutos)
setInterval(() => {
  const stats = getConnectionStats();
  logger.info('📊 Estadísticas de servidor:', stats);
}, 10 * 60 * 1000);

module.exports = {
  trackConnection,
  getConnectionStats,
  resetStats
};
