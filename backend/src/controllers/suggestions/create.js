// src/controllers/suggestions/create.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const create = async (data) => {
  try {
    logger.info('Iniciando creación de sugerencia con datos:', JSON.stringify(data));
    
    const {
      type,
      title,
      description,
      name,
      email,
      plantId = null
    } = data;

    // Validaciones básicas
    if (!type || !title || !description) {
      throw new Error('Campos requeridos: type, title, description');
    }

    // Validar tipo de sugerencia
    const validTypes = ['feature', 'bug', 'improvement', 'data_correction', 'new_plant'];
    if (!validTypes.includes(type)) {
      throw new Error('Tipo de sugerencia inválido');
    }

    // Validar email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email inválido');
      }
    }

    // Construimos los datos de la sugerencia
    let metadata = {};
    if (name) metadata.contact_name = name;
    if (email) metadata.contact_email = email;
    
    // Insertar en la base de datos
    let suggestionId;
    let submittedAt;
    
    try {
      // Primero verificamos la conexión
      await db.query('SELECT 1');
      
      // Verificar si la tabla existe
      const [tables] = await db.query(`
        SELECT TABLE_NAME FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `, [process.env.DB_NAME || 'herbario_heaa', 'suggestions']);
      
      if (tables.length === 0) {
        throw new Error('La tabla de sugerencias no existe en la base de datos');
      }
      
      // Proceder con la inserción
      // Construir metadatos para el campo attachments (JSON)
      const metadata = {};
      if (name) metadata.contact_name = name;
      if (email) metadata.contact_email = email;

      const [result] = await db.query(`
        INSERT INTO suggestions (
          type, title, description, plant_id, status,
          priority, attachments, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', 'medium', ?, NOW(), NOW())
      `, [
        type, title, description, plantId, 
        JSON.stringify(metadata)
      ]);
      
      suggestionId = result.insertId;
      submittedAt = new Date();
    } catch (dbError) {
      logger.error('Error específico de base de datos:', dbError);
      throw new Error(`Error de base de datos: ${dbError.message}`);
    }

    // Registrar actividad
    try {
      await db.query(`
        INSERT INTO activity_logs (
          action, entity_type, entity_id, description
        ) VALUES (?, ?, ?, ?)
      `, [
        'suggestion_created', 'suggestion', suggestionId, `Nueva sugerencia: ${title}`
      ]);
    } catch (logError) {
      logger.error('Error al registrar actividad:', logError);
      // No interrumpir el flujo por error en logs
    }

    logger.info(`Nueva sugerencia creada: ${title} ${name ? `por ${name}` : ''} ${email ? `(${email})` : ''}`);

    return {
      id: suggestionId,
      message: 'Sugerencia enviada exitosamente',
      status: 'pending',
      submittedAt,
      note: 'Tu sugerencia será revisada por nuestro equipo y recibirás una respuesta pronto.'
    };

  } catch (error) {
    logger.error('Error al crear sugerencia:', error);
    throw error;
  }
};

const createNotificationForAdmins = async (notificationData) => {
  try {
    // TODO: Implementar sistema de notificaciones
    // Obtener todos los administradores y crear notificaciones
    /*
    const [admins] = await db.query('SELECT id FROM users WHERE role = "admin" AND status = "active"');
    
    for (const admin of admins) {
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        admin.id, notificationData.type, notificationData.title,
        notificationData.message, JSON.stringify(notificationData.data)
      ]);
    }
    */
    
    logger.info('Notificación para administradores creada:', notificationData.title);
  } catch (error) {
    logger.error('Error creando notificación para administradores:', error);
  }
};

module.exports = create;
