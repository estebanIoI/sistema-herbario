// src/config/socket.js
const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

const setupSocket = (server) => {
  // Crear instancia de Socket.IO
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Middleware de autenticación para sockets (opcional)
  io.use((socket, next) => {
    // Aquí podrías verificar tokens JWT si necesitas autenticación en tiempo real
    logger.info(`🔌 Nueva conexión de socket: ${socket.id} desde ${socket.handshake.address}`);
    next();
  });

  // Event listeners principales
  io.on('connection', (socket) => {
    logger.info(`✅ Socket conectado: ${socket.id}`);

    // Unir a sala general del herbario
    socket.join('herbario_general');

    // Event: Usuario se identifica
    socket.on('user_join', (userData) => {
      if (userData.userId) {
        socket.join(`user_${userData.userId}`);
        logger.info(`👤 Usuario ${userData.userId} conectado via socket`);
      }
    });

    // Event: Admin se conecta
    socket.on('admin_join', (adminData) => {
      if (adminData.role === 'admin') {
        socket.join('admin_room');
        logger.info(`👨‍💼 Admin ${adminData.userId} conectado via socket`);
      }
    });

    // Event: Notificación de nueva planta
    socket.on('new_plant_notification', (data) => {
      // Emitir a todos los admins
      socket.to('admin_room').emit('plant_added', {
        message: `Nueva planta agregada: ${data.scientificName}`,
        plantId: data.plantId,
        timestamp: new Date().toISOString()
      });
      logger.info(`📢 Notificación de nueva planta enviada a admins`);
    });

    // Event: Nueva sugerencia
    socket.on('new_suggestion', (data) => {
      // Emitir a todos los admins
      socket.to('admin_room').emit('suggestion_received', {
        message: `Nueva sugerencia: ${data.title}`,
        suggestionId: data.id,
        timestamp: new Date().toISOString()
      });
      logger.info(`💡 Nueva sugerencia notificada a admins`);
    });

    // Event: Actualización de estadísticas
    socket.on('stats_update', (data) => {
      // Emitir a sala general
      socket.to('herbario_general').emit('stats_updated', data);
      logger.info(`📊 Estadísticas actualizadas via socket`);
    });

    // Event: Desconexión
    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket desconectado: ${socket.id}, razón: ${reason}`);
    });

    // Event: Error
    socket.on('error', (error) => {
      logger.error(`❌ Error en socket ${socket.id}:`, error);
    });
  });

  logger.info('🚀 Socket.IO configurado exitosamente');
  return io;
};

// Función para emitir eventos desde otras partes de la aplicación
const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin_room').emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.info(`📡 Evento ${event} emitido a admins`);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.info(`📡 Evento ${event} emitido a usuario ${userId}`);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.to('herbario_general').emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.info(`📡 Evento ${event} emitido a todos`);
  }
};

// Función para obtener estadísticas de conexiones
const getSocketStats = () => {
  if (!io) return null;
  
  return {
    connectedSockets: io.engine.clientsCount,
    adminConnections: io.sockets.adapter.rooms.get('admin_room')?.size || 0,
    totalRooms: io.sockets.adapter.rooms.size,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  setupSocket,
  emitToAdmins,
  emitToUser,
  emitToAll,
  getSocketStats
};
