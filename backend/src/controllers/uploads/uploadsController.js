// src/controllers/uploads/uploadsController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto');

/**
 * Controlador de Uploads - Herbario Digital HEAA
 * Maneja la subida, procesamiento y gestión de archivos
 */

// Configuración de multer para manejo de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `plant-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB por defecto
    files: 5 // Máximo 5 archivos por request
  }
});

/**
 * Middleware para subir un solo archivo
 */
const singleUpload = upload.single('image');

/**
 * Middleware para subir múltiples archivos
 */
const multipleUpload = upload.array('images', 10);

/**
 * Subir un archivo individual
 */
const uploadFile = async (req, res) => {
  try {
    singleUpload(req, res, async (err) => {
      if (err) {
        logger.error('Error en upload de archivo:', err);
        return res.status(400).json({
          success: false,
          error: 'Error al subir archivo',
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se recibió ningún archivo'
        });
      }

      try {
        // Procesar imagen (crear thumbnail y optimizar)
        const processedFile = await processImage(req.file);
        
        // Calcular hash del archivo
        const fileBuffer = await fs.readFile(req.file.path);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

        // Guardar información en base de datos
        const [result] = await db.query(`
          INSERT INTO uploads (
            filename, original_name, file_path, file_size, mime_type, 
            file_hash, uploaded_by, entity_type, entity_id, is_temporary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.size,
          req.file.mimetype,
          fileHash,
          req.user?.id,
          req.body.entity_type || null,
          req.body.entity_id || null,
          req.body.is_temporary !== 'false'
        ]);

        logger.info(`Archivo subido: ${req.file.filename} por usuario ${req.user?.id}`);

        res.json({
          success: true,
          data: {
            id: result.insertId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            url: `/uploads/images/${req.file.filename}`,
            thumbnailUrl: processedFile.thumbnailUrl,
            size: req.file.size,
            mimeType: req.file.mimetype,
            hash: fileHash
          }
        });

      } catch (processError) {
        // Limpiar archivo si hay error en el procesamiento
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error('Error al eliminar archivo tras error:', unlinkError);
        }
        throw processError;
      }
    });

  } catch (error) {
    logger.error('Error en uploadFile:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno al subir archivo',
      message: error.message
    });
  }
};

/**
 * Subir múltiples archivos
 */
const uploadMultiple = async (req, res) => {
  try {
    multipleUpload(req, res, async (err) => {
      if (err) {
        logger.error('Error en upload múltiple:', err);
        return res.status(400).json({
          success: false,
          error: 'Error al subir archivos',
          message: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se recibieron archivos'
        });
      }

      const uploadedFiles = [];
      const errors = [];

      for (const file of req.files) {
        try {
          // Procesar imagen
          const processedFile = await processImage(file);
          
          // Calcular hash
          const fileBuffer = await fs.readFile(file.path);
          const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

          // Guardar en base de datos
          const [result] = await db.query(`
            INSERT INTO uploads (
              filename, original_name, file_path, file_size, mime_type, 
              file_hash, uploaded_by, entity_type, entity_id, is_temporary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            file.filename,
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            fileHash,
            req.user?.id,
            req.body.entity_type || null,
            req.body.entity_id || null,
            req.body.is_temporary !== 'false'
          ]);

          uploadedFiles.push({
            id: result.insertId,
            filename: file.filename,
            originalName: file.originalname,
            url: `/uploads/images/${file.filename}`,
            thumbnailUrl: processedFile.thumbnailUrl,
            size: file.size,
            mimeType: file.mimetype,
            hash: fileHash
          });

        } catch (processError) {
          logger.error(`Error procesando archivo ${file.filename}:`, processError);
          errors.push({
            filename: file.originalname,
            error: processError.message
          });
          
          // Limpiar archivo con error
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Error al eliminar archivo con error:', unlinkError);
          }
        }
      }

      logger.info(`Archivos múltiples subidos: ${uploadedFiles.length} exitosos, ${errors.length} errores`);

      res.json({
        success: uploadedFiles.length > 0,
        data: {
          uploaded: uploadedFiles,
          errors: errors,
          totalUploaded: uploadedFiles.length,
          totalErrors: errors.length
        }
      });
    });

  } catch (error) {
    logger.error('Error en uploadMultiple:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno al subir archivos',
      message: error.message
    });
  }
};

/**
 * Eliminar archivo
 */
const deleteFile = async (req, res) => {
  try {
    const { id, filename } = req.body.params;

    let fileQuery;
    let queryParams;

    if (id) {
      fileQuery = 'SELECT * FROM uploads WHERE id = ?';
      queryParams = [id];
    } else if (filename) {
      fileQuery = 'SELECT * FROM uploads WHERE filename = ?';
      queryParams = [filename];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Se requiere ID o filename del archivo'
      });
    }

    const [files] = await db.query(fileQuery, queryParams);

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }

    const file = files[0];

    // Verificar permisos (solo el propietario o admin puede eliminar)
    if (req.user?.role !== 'admin' && file.uploaded_by !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar este archivo'
      });
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(file.file_path);
      
      // Eliminar thumbnail si existe
      const thumbnailPath = file.file_path.replace(/(\.[^.]+)$/, '_thumb$1');
      try {
        await fs.unlink(thumbnailPath);
      } catch (thumbError) {
        // Ignorar si el thumbnail no existe
      }
    } catch (unlinkError) {
      logger.warn(`No se pudo eliminar archivo físico: ${file.file_path}`, unlinkError);
    }

    // Eliminar registro de base de datos
    await db.query('DELETE FROM uploads WHERE id = ?', [file.id]);

    // Eliminar referencias en plant_images si aplica
    await db.query('DELETE FROM plant_images WHERE image_url LIKE ?', [`%${file.filename}%`]);

    logger.info(`Archivo eliminado: ${file.filename} por usuario ${req.user?.id}`);

    res.json({
      success: true,
      data: {
        message: 'Archivo eliminado exitosamente',
        filename: file.filename
      }
    });

  } catch (error) {
    logger.error('Error en deleteFile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar archivo',
      message: error.message
    });
  }
};

/**
 * Obtener información de archivo
 */
const getFileInfo = async (req, res) => {
  try {
    const { id, filename } = req.body.params;

    let fileQuery;
    let queryParams;

    if (id) {
      fileQuery = 'SELECT * FROM uploads WHERE id = ?';
      queryParams = [id];
    } else if (filename) {
      fileQuery = 'SELECT * FROM uploads WHERE filename = ?';
      queryParams = [filename];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Se requiere ID o filename del archivo'
      });
    }

    const [files] = await db.query(fileQuery, queryParams);

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }

    const file = files[0];

    res.json({
      success: true,
      data: {
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        url: `/uploads/images/${file.filename}`,
        size: file.file_size,
        mimeType: file.mime_type,
        hash: file.file_hash,
        entityType: file.entity_type,
        entityId: file.entity_id,
        uploadedBy: file.uploaded_by,
        isTemporary: file.is_temporary,
        createdAt: file.created_at
      }
    });

  } catch (error) {
    logger.error('Error en getFileInfo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del archivo',
      message: error.message
    });
  }
};

/**
 * Validar archivo antes de subir
 */
const validateFile = async (req, res) => {
  try {
    const { filename, size, mimeType, hash } = req.body.params;

    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      return res.json({
        success: false,
        valid: false,
        error: 'Tipo de archivo no permitido'
      });
    }

    // Verificar tamaño
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
    if (size > maxSize) {
      return res.json({
        success: false,
        valid: false,
        error: `Archivo demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }

    // Verificar si ya existe (por hash)
    let duplicate = null;
    if (hash) {
      const [existing] = await db.query('SELECT filename FROM uploads WHERE file_hash = ?', [hash]);
      if (existing.length > 0) {
        duplicate = existing[0].filename;
      }
    }

    res.json({
      success: true,
      valid: true,
      duplicate: duplicate,
      message: duplicate ? 'Archivo duplicado encontrado' : 'Archivo válido para subir'
    });

  } catch (error) {
    logger.error('Error en validateFile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar archivo',
      message: error.message
    });
  }
};

/**
 * Obtener estadísticas de almacenamiento
 */
const getStorageStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size,
        COUNT(CASE WHEN is_temporary = 1 THEN 1 END) as temporary_files,
        COUNT(CASE WHEN entity_type = 'plant' THEN 1 END) as plant_images
      FROM uploads
    `);

    const [recentUploads] = await db.query(`
      SELECT COUNT(*) as recent_uploads
      FROM uploads 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      success: true,
      data: {
        totalFiles: stats[0].total_files,
        totalSize: stats[0].total_size,
        totalSizeMB: Math.round(stats[0].total_size / 1024 / 1024 * 100) / 100,
        averageSize: stats[0].avg_size,
        temporaryFiles: stats[0].temporary_files,
        plantImages: stats[0].plant_images,
        recentUploads: recentUploads[0].recent_uploads
      }
    });

  } catch (error) {
    logger.error('Error en getStorageStats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de almacenamiento',
      message: error.message
    });
  }
};

/**
 * Procesar imagen (crear thumbnail y optimizar)
 */
const processImage = async (file) => {
  try {
    const thumbnailFilename = file.filename.replace(/(\.[^.]+)$/, '_thumb$1');
    const thumbnailPath = path.join(path.dirname(file.path), thumbnailFilename);

    // Crear thumbnail usando Sharp
    await sharp(file.path)
      .resize(300, 300, { 
        fit: 'cover',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return {
      thumbnailUrl: `/uploads/images/${thumbnailFilename}`,
      thumbnailPath: thumbnailPath
    };

  } catch (error) {
    logger.warn(`No se pudo crear thumbnail para ${file.filename}:`, error);
    return {
      thumbnailUrl: `/uploads/images/${file.filename}`,
      thumbnailPath: null
    };
  }
};

module.exports = {
  uploadFile,
  uploadMultiple,
  deleteFile,
  getFile: getFileInfo, // Alias
  getFileInfo,
  validateFile,
  getStorageStats,
  resizeImage: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' })
};
