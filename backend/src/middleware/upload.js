const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ===============================
// ALMACENAMIENTO EN MEMORIA (para Cloudinary)
// ===============================
const memoryStorage = multer.memoryStorage();

// ===============================
// ALMACENAMIENTO EN DISCO (respaldo local)
// ===============================
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/plants');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos (sincronizado con frontend)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG, GIF y WEBP.'), false);
  }
};

// Límites comunes
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB límite
  files: 1
};

// Upload para Cloudinary (memoria)
const uploadToCloudinary = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: limits
});

// Upload local (disco) - respaldo
const uploadToDisk = multer({
  storage: diskStorage,
  fileFilter: fileFilter,
  limits: limits
});

// Exportar ambos, con Cloudinary como default
module.exports = uploadToCloudinary;
module.exports.cloudinary = uploadToCloudinary;
module.exports.local = uploadToDisk;
