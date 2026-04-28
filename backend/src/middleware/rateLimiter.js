// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limiter general para el API
const generalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana por defecto
  message: {
    success: false,
    error: 'Demasiadas peticiones',
    message: 'Has excedido el límite de peticiones. Intenta más tarde.',
    retryAfter: 'Consulta el header Retry-After para saber cuándo intentar nuevamente'
  },
  standardHeaders: true, // Retorna headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  
  // Handler personalizado para logging
  handler: (req, res) => {
    logger.warn(`Rate limit excedido - IP: ${req.ip}, URL: ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Demasiadas peticiones',
      message: 'Has excedido el límite de peticiones. Intenta más tarde.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  },

  // Omitir rate limiting para ciertas condiciones
  skip: (req) => {
    // Omitir para health checks
    if (req.path === '/health' || req.path === '/info') {
      return true;
    }
    
    // Omitir para IPs de desarrollo en modo dev
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.startsWith('192.168.'))) {
      return true;
    }
    
    return false;
  }
});

// Rate limiter más estricto para operaciones sensibles
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos por ventana
  message: {
    success: false,
    error: 'Demasiados intentos',
    message: 'Has realizado demasiados intentos. Espera antes de intentar nuevamente.'
  },
  
  handler: (req, res) => {
    logger.warn(`Rate limit estricto excedido - IP: ${req.ip}, URL: ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos',
      message: 'Has realizado demasiados intentos de esta operación. Espera antes de intentar nuevamente.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter para login (prevenir ataques de fuerza bruta)
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos de login por IP
  skipSuccessfulRequests: true, // No contar requests exitosos
  
  handler: (req, res) => {
    logger.warn(`Intentos de login excedidos - IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      email: req.body.email || 'no especificado'
    });
    
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de login',
      message: 'Has realizado demasiados intentos de inicio de sesión. Espera antes de intentar nuevamente.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  generalRateLimiter,
  strictRateLimiter,
  loginRateLimiter
};

// Exportar el rate limiter general como predeterminado
module.exports = generalRateLimiter;
module.exports.strict = strictRateLimiter;
module.exports.login = loginRateLimiter;
