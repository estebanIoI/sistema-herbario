// src/controllers/settings/getPublic.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const castValue = (value, type) => {
  if (value === null || value === undefined) return value;
  switch (type) {
    case 'boolean': return value === 'true' || value === true;
    case 'number':  return Number(value);
    case 'json':    try { return JSON.parse(value); } catch { return value; }
    default:        return String(value);
  }
};

const getPublic = async (data, user) => {
  try {
    const [rows] = await db.query(
      'SELECT key_name, value, type, category FROM settings WHERE is_public = 1 ORDER BY category, key_name'
    );

    // Agrupar por categoría para entrega estructurada
    const byCategory = {};
    const flat = {};

    for (const row of rows) {
      const camelKey = toCamel(row.key_name);
      const casted   = castValue(row.value, row.type);

      flat[camelKey] = casted;

      if (!byCategory[row.category]) byCategory[row.category] = {};
      byCategory[row.category][camelKey] = casted;
    }

    logger.info('Configuraciones públicas consultadas desde BD');

    // Devuelve tanto la versión plana como la agrupada por categoría
    return { ...flat, _sections: byCategory };

  } catch (error) {
    logger.error('Error al obtener configuraciones públicas:', error);
    throw error;
  }
};

module.exports = getPublic;
