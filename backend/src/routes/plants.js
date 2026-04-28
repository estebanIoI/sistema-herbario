const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const logger = require('../utils/logger');
const { authenticateTokenMiddleware } = require('../middleware/auth');
const db = require('../config/database');
const { uploadFromBuffer, isConfigured } = require('../config/cloudinary');

// Endpoint para subir imágenes de plantas a Cloudinary
// POST /api/plantas/upload
router.post('/upload', authenticateTokenMiddleware, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      logger.error('Error al procesar imagen:', err);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'El archivo es demasiado grande. Máximo 10MB.'
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message || 'Error al subir el archivo'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha proporcionado ningún archivo'
      });
    }

    try {
      let imageUrl, thumbnailUrl, publicId;

      // Verificar si Cloudinary está configurado
      if (isConfigured()) {
        // Subir a Cloudinary
        logger.info('Subiendo imagen a Cloudinary...');

        const cloudinaryResult = await uploadFromBuffer(req.file.buffer, {
          public_id: `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          folder: `${process.env.CLOUDINARY_FOLDER || 'herbario'}/plants`
        });

        if (!cloudinaryResult.success) {
          throw new Error(cloudinaryResult.error || 'Error al subir a Cloudinary');
        }

        imageUrl = cloudinaryResult.data.url;
        thumbnailUrl = cloudinaryResult.data.thumbnailUrl;
        publicId = cloudinaryResult.data.publicId;

        logger.info(`Imagen subida a Cloudinary: ${publicId}`);
      } else {
        // Fallback: guardar localmente si Cloudinary no está configurado
        logger.warn('Cloudinary no configurado, guardando imagen localmente...');

        const fs = require('fs');
        const path = require('path');
        const { v4: uuidv4 } = require('uuid');

        const uploadsDir = path.join(__dirname, '../../uploads/plants');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${uuidv4()}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, req.file.buffer);

        const protocol = req.protocol;
        const host = req.get('host');
        imageUrl = `${protocol}://${host}/api/media/plantas/${filename}`;
        thumbnailUrl = imageUrl;
        publicId = filename;
      }

      // Registrar en la base de datos
      const [result] = await db.query(
        `INSERT INTO uploads (
          filename, original_name, file_path, file_size, mime_type,
          uploaded_by, is_temporary, entity_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          publicId,
          req.file.originalname,
          imageUrl,
          req.file.size,
          req.file.mimetype,
          req.user ? req.user.id : null,
          true,
          'plant'
        ]
      );

      logger.info(`Imagen registrada en BD: ID ${result.insertId}`);

      res.json({
        success: true,
        data: {
          id: result.insertId,
          url: imageUrl,
          thumbnailUrl: thumbnailUrl,
          filename: publicId,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (uploadError) {
      logger.error('Error al procesar la subida de imagen:', uploadError);

      return res.status(500).json({
        success: false,
        error: 'Error al procesar la subida de imagen: ' + uploadError.message
      });
    }
  });
});

module.exports = router;
