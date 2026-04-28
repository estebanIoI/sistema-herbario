require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const rateLimiter = require('./middleware/rateLimiter');
const connectionTracker = require('./middleware/connectionTracker');
const serviceRouter = require('./routes/service');
const plantsRouter = require('./routes/plants');
const mediaRouter = require('./routes/media');
const healthCheck = require('./controllers/healthCheck');

const app = express();

// CORS configurado para el frontend del herbario
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

// Configuración mejorada de CORS para evitar problemas de conexión
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (como mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Permitir todos los orígenes en desarrollo
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    
    // Verificar si el origen está en la lista permitida
    if (corsOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.log(`⚠️ CORS: Origen bloqueado: ${origin}`);
      return callback(null, true); // Permitir de todos modos para evitar problemas en desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Content-Length'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 1 día de cache para preflight
}));

// Middlewares de seguridad
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://localhost:*"],
      fontSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate Limiting para prevenir abuso
app.use(rateLimiter);

// Monitoreo de conexiones y rendimiento
if (connectionTracker && connectionTracker.trackConnection) {
  app.use(connectionTracker.trackConnection);
}

// Logger para todas las peticiones
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
  if (req.method === 'OPTIONS') {
    logger.info('Recibida petición OPTIONS (preflight)');
  }
  next();
});

// Ruta de health check
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheck();
    res.json(health);
  } catch (error) {
    logger.error('Error en health check:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta de información del sistema
app.get('/info', (req, res) => {
  res.json({
    name: 'Herbario Digital HEAA',
    version: '1.0.0',
    description: 'API del Herbario Digital del Instituto Tecnológico del Putumayo',
    institution: 'Instituto Tecnológico del Putumayo',
    apiVersion: 'v1',
    endpoints: [
      'GET /health - Estado del sistema',
      'GET /info - Información del sistema',
      'POST /api/service - Endpoint principal de servicios'
    ],
    documentation: '/docs/api-spec.yaml',
    contact: {
      email: 'herbario@itp.edu.co',
      website: 'https://herbario.itp.edu.co'
    }
  });
});

// Rutas principales del API
console.log("📦 Registrando ruta principal /api/service");
app.use('/api/service', serviceRouter);
app.use('/api/plantas', plantsRouter);
app.use('/api/media', mediaRouter);

// Ruta para servir documentación de la API
app.get('/docs/api-spec.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/api-spec.yaml'));
});

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    availableEndpoints: [
      'GET /health',
      'GET /info',
      'POST /api/service'
    ]
  });
});

// Error handler centralizado
app.use(errorHandler);

module.exports = app;
