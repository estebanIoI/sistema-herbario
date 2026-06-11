// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Todo el API pasa por un único endpoint POST /api/service y el servicio
 * concreto viaja en req.body.service. Por eso clasificamos el rate limiting
 * según el servicio invocado, en vez de aplicar un único límite a todo.
 *
 * Objetivo: que la navegación PÚBLICA (solo lecturas) nunca se bloquee
 * —ni siquiera cuando muchos visitantes comparten la misma IP, como en la
 * red de un campus— mientras se mantiene protección estricta contra
 * fuerza bruta de login y abuso de operaciones de escritura.
 */

// Servicios de SOLO LECTURA que usa el sitio público de forma anónima.
const PUBLIC_READ_SERVICES = new Set([
  'settings.getPublic',
  'public.getStats',
  'public.getFeaturedPlants',
  'plants.getAll',
  'plants.getById',
  'plants.search',
  'plants.advancedSearch',
  'plants.getForMap',
  'plants.getMostViewed',
  'plants.export',
  'posts.getAll',
  'posts.getById',
  'filters.getFilterOptions',
  'taxonomy.getFamilies',
  'taxonomy.getGenera',
  'locations.getAll',
  'autocomplete.search',
]);

// Servicios de autenticación (objetivo de ataques de fuerza bruta).
const AUTH_SERVICES = new Set(['auth.login', 'auth.register']);

const getService = (req) =>
  req.body && typeof req.body.service === 'string' ? req.body.service : '';

// Cualquier GET/HEAD/OPTIONS es una lectura (sirve imágenes en /api/media,
// health checks, preflights CORS, etc.), igual que los servicios de lectura
// declarados arriba. Todo eso va al cubo generoso de lecturas.
const isPublicRead = (req) =>
  req.method === 'GET' ||
  req.method === 'HEAD' ||
  req.method === 'OPTIONS' ||
  PUBLIC_READ_SERVICES.has(getService(req));

const isHealth = (req) => req.path === '/health' || req.path === '/info';

const isDevLocal = (req) =>
  process.env.NODE_ENV === 'development' &&
  (req.ip === '127.0.0.1' || req.ip === '::1' || (req.ip || '').startsWith('192.168.'));

// Fábrica de handlers 429 con logging consistente.
const tooMany = (error, message) => (req, res) => {
  logger.warn(`Rate limit excedido - IP: ${req.ip}, service: ${getService(req) || req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    service: getService(req),
  });
  res.status(429).json({
    success: false,
    error,
    message,
    retryAfter: req.rateLimit ? Math.round(req.rateLimit.resetTime / 1000) : undefined,
  });
};

// 1) Lecturas públicas — límite ALTO por IP (la navegación normal jamás lo alcanza).
const publicReadLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS) || 60 * 1000, // 1 min
  max: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX) || 1000, // 1000 lecturas/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isHealth(req) || isDevLocal(req) || !isPublicRead(req),
  handler: tooMany(
    'Demasiadas peticiones',
    'Se recibieron demasiadas solicitudes de lectura desde tu red. Intenta de nuevo en un momento.'
  ),
});

// 2) Escrituras y operaciones autenticadas — límite MODERADO por IP.
const writeLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    isHealth(req) ||
    isDevLocal(req) ||
    isPublicRead(req) ||
    AUTH_SERVICES.has(getService(req)),
  handler: tooMany(
    'Demasiadas peticiones',
    'Has excedido el límite de operaciones. Espera un momento e intenta nuevamente.'
  ),
});

// 3) Autenticación — ESTRICTO contra fuerza bruta (solo cuentan los intentos fallidos).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevLocal(req) || !AUTH_SERVICES.has(getService(req)),
  handler: tooMany(
    'Demasiados intentos de inicio de sesión',
    'Has realizado demasiados intentos. Espera unos minutos antes de volver a intentar.'
  ),
});

// Limitador estricto genérico (compatibilidad con usos previos).
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_STRICT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany(
    'Demasiados intentos',
    'Has realizado demasiados intentos de esta operación. Espera antes de intentar nuevamente.'
  ),
});

// Pila de middlewares: cada limitador omite los requests que no le competen,
// de modo que cada categoría tiene su propio cubo independiente por IP.
const apiRateLimiter = [authLimiter, publicReadLimiter, writeLimiter];

module.exports = apiRateLimiter;
module.exports.publicReadLimiter = publicReadLimiter;
module.exports.writeLimiter = writeLimiter;
module.exports.authLimiter = authLimiter;
module.exports.strict = strictRateLimiter;
module.exports.login = authLimiter;
module.exports.PUBLIC_READ_SERVICES = PUBLIC_READ_SERVICES;
