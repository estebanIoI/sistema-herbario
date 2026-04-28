const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Middleware para agregar headers CORS a todas las rutas de media
router.use((req, res, next) => {
  // Permitir acceso cross-origin para imágenes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Endpoint para servir imágenes de plantas
// GET /api/media/plantas/:file
router.get('/plantas/:file', (req, res) => {
  const filename = req.params.file;
  
  // Sanitización básica del nombre de archivo
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Nombre de archivo inválido'
    });
  }

  const uploadsDir = path.join(__dirname, '../../uploads/plants');
  const filePath = path.join(uploadsDir, filename);

  // Seguridad: Verificar que el archivo esté dentro del directorio de uploads
  // path.resolve resuelve ".." así que verificamos que empiece con el directorio base
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadsDir = path.resolve(uploadsDir);

  if (!resolvedPath.startsWith(resolvedUploadsDir)) {
    logger.warn(`Intento de Path Traversal detectado: ${filename}`);
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado'
    });
  }

  // Verificar si el archivo existe
  if (!fs.existsSync(filePath)) {
    logger.warn(`Imagen no encontrada: ${filename}`);
    return res.status(404).json({
      success: false,
      error: 'Imagen no encontrada'
    });
  }

  // Servir el archivo
  res.sendFile(filePath, (err) => {
    if (err) {
      logger.error(`Error al enviar archivo ${filename}:`, err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error al recuperar la imagen'
        });
      }
    }
  });
});

module.exports = router;
