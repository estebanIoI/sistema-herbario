// Simulación de envío de notificaciones (puede ser por socket, email, push, etc.)

const logger = require('../utils/logger');

exports.send = async (to, message, type = 'info') => {
  // Aquí podrías emitir por socket, enviar email, etc.
  logger.info(`Notificación enviada a ${to}: [${type}] ${message}`);
};
