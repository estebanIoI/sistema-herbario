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

server.listen(PORT, () => {
  console.log(`🚀 Herbario HEAA · http://localhost:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('🔴 Error del servidor:', error);
  logger.error('Error del servidor:', error);
});

// Manejo graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} recibido, cerrando servidor`);
  server.close(async () => {
    await db.closePool();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
