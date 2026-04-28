require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { setupSocket } = require('./src/config/socket');
const logger = require('./src/utils/logger');
const db = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Configurar WebSockets si es necesario
if (setupSocket) {
  setupSocket(server);
}

// Health check de la base de datos
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('🟢 Conexión a base de datos exitosa');
    logger.info('Base de datos MySQL conectada exitosamente');
  } catch (err) {
    console.error('🔴 Error al conectar BD:', err.message);
    logger.error('Error de conexión a base de datos:', err);
  }
})();

server.listen(PORT, () => {
  console.log('🚀 Servidor del Herbario Digital HEAA iniciado');
  console.log(`📡 Escuchando en: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API endpoints: http://localhost:${PORT}/api`);
  console.log('🌿 Sistema: Herbario Digital HEAA - Instituto Tecnológico del Putumayo');
  
  logger.info(`Servidor del Herbario Digital iniciado en puerto ${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('🔴 Error del servidor:', error);
  logger.error('Error del servidor:', error);
});

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  logger.info('SIGTERM recibido, iniciando shutdown graceful');
  
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    logger.info('Servidor cerrado exitosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  logger.info('SIGINT recibido, iniciando shutdown graceful');
  
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    logger.info('Servidor cerrado exitosamente');
    process.exit(0);
  });
});
