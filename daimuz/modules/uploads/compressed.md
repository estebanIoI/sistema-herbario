# uploads — compressed

- **Qué hace:** Gestión de archivos multimedia. Subida a Cloudinary (prod) o local (dev), resize con sharp, validación MIME/tamaño, detección de duplicados via hash MD5. 8 servicios.
- **Tablas:** `uploads` (filename, file_hash MD5, is_temporary, expires_at) · `plant_images`
- **Endpoints:** `POST /api/plantas/upload` (multipart, ruta directa) · `GET /api/media/plantas/:file` (servir local) · `uploads.uploadFile` · `uploads.uploadMultiple` · `uploads.deleteFile` · `uploads.validateFile` · `uploads.resizeImage` · `uploads.getStorageStats`
- **Archivos:** `middleware/upload.js` (Multer: 10MB, MIME check) · `routes/plants.js` · `routes/media.js` · `config/cloudinary.js` · `controllers/uploads/uploadsController.js`
- **⚠️ Regla crítica:** `NODE_ENV=production` → Cloudinary obligatorio (carpeta `herbario/plantas/{id}/`). `NODE_ENV=development` → almacenamiento local `/uploads/`. Límite 10MB. Sanitizar nombre de archivo para prevenir path traversal. `uploads` no tiene `deleted_at` — archivos temporales se limpian con `CALL cleanup_expired_uploads()`.

---

## Red de conexiones

- Flujo completo de imagen: [[plant-upload-flow]]
- Regla Cloudinary: [[universal-constraints]] (#5) · [[integrations]]
- Módulo que lo usa: [[plants/compressed|plants]]
- Tablas: [[db-tables-index]]
- Capa: [[backend]]
- Índice: [[modules-index]] · [[DAIMUZ]]
