// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configuración inicial desde .env (fallback)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Verificar configuración actual
const isConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return !!(cloud_name && api_key && api_secret);
};

// Leer credenciales de la BD y (re)configurar cloudinary; devuelve la carpeta activa
const reconfigureFromDB = async () => {
  try {
    const db = require('./database');
    const [rows] = await db.query(
      "SELECT key_name, value FROM settings WHERE category = 'cloudinary'"
    );
    const creds = {};
    for (const r of rows) creds[r.key_name] = r.value;

    const cloudName = creds.cloudinary_cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = creds.cloudinary_api_key    || process.env.CLOUDINARY_API_KEY;
    const apiSecret = creds.cloudinary_api_secret || process.env.CLOUDINARY_API_SECRET;
    const folder    = creds.cloudinary_folder     || process.env.CLOUDINARY_FOLDER || 'herbario';

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
      return { configured: true, folder };
    }
    return { configured: isConfigured(), folder };
  } catch {
    return { configured: isConfigured(), folder: process.env.CLOUDINARY_FOLDER || 'herbario' };
  }
};

// Subir imagen a Cloudinary
const uploadImage = async (filePath, options = {}) => {
  try {
    const { configured, folder } = await reconfigureFromDB();
    if (!configured) {
      throw new Error('Cloudinary no está configurado. Configure las credenciales en el panel de administración.');
    }

    const uploadOptions = {
      folder: `${folder}/plants`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    logger.info(`Imagen subida a Cloudinary: ${result.public_id}`);

    return {
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        thumbnailUrl: cloudinary.url(result.public_id, {
          width: 300,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        }),
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    };
  } catch (error) {
    logger.error('Error al subir imagen a Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Subir imagen desde buffer (para Multer con memory storage)
const uploadFromBuffer = async (buffer, options = {}) => {
  const { configured, folder } = await reconfigureFromDB();
  if (!configured) {
    throw new Error('Cloudinary no está configurado. Configure las credenciales en el panel de administración.');
  }

  return new Promise((resolve, reject) => {

    const uploadOptions = {
      folder: `${folder}/plants`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Error al subir imagen a Cloudinary:', error);
          reject(error);
        } else {
          logger.info(`Imagen subida a Cloudinary: ${result.public_id}`);
          resolve({
            success: true,
            data: {
              publicId: result.public_id,
              url: result.secure_url,
              thumbnailUrl: cloudinary.url(result.public_id, {
                width: 300,
                height: 300,
                crop: 'fill',
                quality: 'auto',
                fetch_format: 'auto'
              }),
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            }
          });
        }
      }
    );

    // Escribir el buffer al stream
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// Eliminar imagen de Cloudinary
const deleteImage = async (publicId) => {
  try {
    if (!isConfigured()) {
      throw new Error('Cloudinary no está configurado.');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Imagen eliminada de Cloudinary: ${publicId}`);

    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    logger.error('Error al eliminar imagen de Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generar URL optimizada
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

// Generar URL de thumbnail
const getThumbnailUrl = (publicId, size = 300) => {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

module.exports = {
  cloudinary,
  isConfigured,
  reconfigureFromDB,
  uploadImage,
  uploadFromBuffer,
  deleteImage,
  getOptimizedUrl,
  getThumbnailUrl
};
