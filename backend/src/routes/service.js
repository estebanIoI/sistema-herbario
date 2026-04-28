// src/routes/service.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.post('/', (req, res, next) => {
  console.log("📥 Petición recibida en /api/service:", req.body);
  next(); // sigue al controlador
}, serviceController.handleRequest);

module.exports = router;
