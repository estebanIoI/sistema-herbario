// src/controllers/plants/taxonomyController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Controlador de Taxonomía - Herbario Digital HEAA
 * Maneja familias, géneros, especies y clasificación taxonómica
 */

/**
 * Obtener todas las familias
 */
const getFamilies = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT family as name, COUNT(*) as plant_count
      FROM plants 
      WHERE status = 'published' AND family IS NOT NULL
      GROUP BY family 
      ORDER BY family ASC
    `;

    const [families] = await db.query(query);

    res.json({
      success: true,
      data: families.map(family => ({
        name: family.name,
        value: family.name.toLowerCase(),
        label: family.name,
        plantCount: family.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en getFamilies:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener familias',
      message: error.message
    });
  }
};

/**
 * Obtener géneros por familia
 */
const getGeneraByFamily = async (req, res) => {
  try {
    const { family } = req.body.params;

    const query = `
      SELECT DISTINCT genus as name, COUNT(*) as plant_count
      FROM plants 
      WHERE status = 'published' AND family = ? AND genus IS NOT NULL
      GROUP BY genus 
      ORDER BY genus ASC
    `;

    const [genera] = await db.query(query, [family]);

    res.json({
      success: true,
      data: genera.map(genus => ({
        name: genus.name,
        value: genus.name.toLowerCase(),
        label: genus.name,
        family,
        plantCount: genus.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en getGeneraByFamily:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener géneros',
      message: error.message
    });
  }
};

/**
 * Obtener especies por género
 */
const getSpeciesByGenus = async (req, res) => {
  try {
    const { genus, family } = req.body.params;

    let query = `
      SELECT DISTINCT specific_epithet as name, COUNT(*) as plant_count
      FROM plants
      WHERE status = 'published' AND genus = ? AND specific_epithet IS NOT NULL
    `;
    let params = [genus];

    if (family) {
      query += ` AND family = ?`;
      params.push(family);
    }

    query += ` GROUP BY specific_epithet ORDER BY specific_epithet ASC`;

    const [species] = await db.query(query, params);

    res.json({
      success: true,
      data: species.map(sp => ({
        name: sp.name,
        value: sp.name.toLowerCase(),
        label: sp.name,
        genus,
        family,
        plantCount: sp.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en getSpeciesByGenus:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener especies',
      message: error.message
    });
  }
};

/**
 * Autocompletado de familias
 */
const autocompleteFamilies = async (req, res) => {
  try {
    const { query = '', limit = 10 } = req.body.params || {};

    const searchQuery = `
      SELECT DISTINCT family as name, COUNT(*) as plant_count
      FROM plants 
      WHERE status = 'published' 
      AND family IS NOT NULL 
      AND family LIKE ?
      GROUP BY family 
      ORDER BY plant_count DESC, family ASC
      LIMIT ?
    `;

    const [families] = await db.query(searchQuery, [`%${query}%`, parseInt(limit)]);

    res.json({
      success: true,
      data: families.map(family => ({
        value: family.name,
        label: `${family.name} (${family.plant_count} plantas)`,
        count: family.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en autocompleteFamilies:', error);
    res.status(500).json({
      success: false,
      error: 'Error en autocompletado de familias',
      message: error.message
    });
  }
};

/**
 * Autocompletado de géneros
 */
const autocompleteGenera = async (req, res) => {
  try {
    const { query = '', family = '', limit = 10 } = req.body.params || {};

    let searchQuery = `
      SELECT DISTINCT genus as name, family, COUNT(*) as plant_count
      FROM plants 
      WHERE status = 'published' 
      AND genus IS NOT NULL 
      AND genus LIKE ?
    `;
    let params = [`%${query}%`];

    if (family) {
      searchQuery += ` AND family = ?`;
      params.push(family);
    }

    searchQuery += `
      GROUP BY genus, family 
      ORDER BY plant_count DESC, genus ASC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [genera] = await db.query(searchQuery, params);

    res.json({
      success: true,
      data: genera.map(genus => ({
        value: genus.name,
        label: `${genus.name} (${genus.family}) - ${genus.plant_count} plantas`,
        family: genus.family,
        count: genus.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en autocompleteGenera:', error);
    res.status(500).json({
      success: false,
      error: 'Error en autocompletado de géneros',
      message: error.message
    });
  }
};

/**
 * Autocompletado de especies
 */
const autocompleteSpecies = async (req, res) => {
  try {
    const { query = '', genus = '', family = '', limit = 10 } = req.body.params || {};

    let searchQuery = `
      SELECT DISTINCT specific_epithet as name, genus, family, COUNT(*) as plant_count
      FROM plants
      WHERE status = 'published'
      AND specific_epithet IS NOT NULL
      AND specific_epithet LIKE ?
    `;
    let params = [`%${query}%`];

    if (genus) {
      searchQuery += ` AND genus = ?`;
      params.push(genus);
    }

    if (family) {
      searchQuery += ` AND family = ?`;
      params.push(family);
    }

    searchQuery += `
      GROUP BY specific_epithet, genus, family
      ORDER BY plant_count DESC, specific_epithet ASC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [species] = await db.query(searchQuery, params);

    res.json({
      success: true,
      data: species.map(sp => ({
        value: sp.name,
        label: `${sp.name} (${sp.genus} - ${sp.family}) - ${sp.plant_count} plantas`,
        genus: sp.genus,
        family: sp.family,
        count: sp.plant_count
      }))
    });

  } catch (error) {
    logger.error('Error en autocompleteSpecies:', error);
    res.status(500).json({
      success: false,
      error: 'Error en autocompletado de especies',
      message: error.message
    });
  }
};

/**
 * Obtener árbol taxonómico completo
 */
const getTaxonomyTree = async (req, res) => {
  try {
    const query = `
      SELECT
        family,
        genus,
        specific_epithet AS species,
        COUNT(*) as plant_count
      FROM plants
      WHERE status = 'published'
      AND family IS NOT NULL
      AND genus IS NOT NULL
      GROUP BY family, genus, specific_epithet
      ORDER BY family, genus, specific_epithet
    `;

    const [results] = await db.query(query);

    // Construir árbol jerárquico
    const tree = {};

    results.forEach(row => {
      if (!tree[row.family]) {
        tree[row.family] = {
          name: row.family,
          type: 'family',
          children: {},
          plantCount: 0
        };
      }

      if (!tree[row.family].children[row.genus]) {
        tree[row.family].children[row.genus] = {
          name: row.genus,
          type: 'genus',
          children: {},
          plantCount: 0
        };
      }

      if (row.species) {
        tree[row.family].children[row.genus].children[row.species] = {
          name: row.species,
          type: 'species',
          plantCount: row.plant_count
        };
        tree[row.family].children[row.genus].plantCount += row.plant_count;
      }

      tree[row.family].plantCount += row.plant_count;
    });

    // Convertir a array
    const treeArray = Object.values(tree).map(family => ({
      ...family,
      children: Object.values(family.children).map(genus => ({
        ...genus,
        children: Object.values(genus.children)
      }))
    }));

    res.json({
      success: true,
      data: treeArray
    });

  } catch (error) {
    logger.error('Error en getTaxonomyTree:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener árbol taxonómico',
      message: error.message
    });
  }
};

/**
 * Validar taxonomía
 */
const validateTaxonomy = async (req, res) => {
  try {
    const { family, genus, species } = req.body.params;

    // Verificar si la combinación taxonómica existe
    const [existing] = await db.query(`
      SELECT COUNT(*) as count
      FROM plants
      WHERE family = ? AND genus = ? AND specific_epithet = ?
      AND status = 'published'
    `, [family, genus, species]);

    // Verificar familias existentes
    const [familyExists] = await db.query(`
      SELECT COUNT(*) as count
      FROM plants 
      WHERE family = ? AND status = 'published'
    `, [family]);

    // Verificar géneros en esa familia
    const [genusExists] = await db.query(`
      SELECT COUNT(*) as count
      FROM plants 
      WHERE family = ? AND genus = ? AND status = 'published'
    `, [family, genus]);

    res.json({
      success: true,
      data: {
        exists: existing[0].count > 0,
        familyExists: familyExists[0].count > 0,
        genusExists: genusExists[0].count > 0,
        suggestions: {
          similarFamilies: familyExists[0].count === 0 ? await getSimilarNames('family', family) : [],
          similarGenera: genusExists[0].count === 0 ? await getSimilarNames('genus', genus, family) : [],
          similarSpecies: existing[0].count === 0 ? await getSimilarNames('specific_epithet', species, family, genus) : []
        }
      }
    });

  } catch (error) {
    logger.error('Error en validateTaxonomy:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar taxonomía',
      message: error.message
    });
  }
};

/**
 * Función auxiliar para buscar nombres similares
 */
const getSimilarNames = async (rank, name, family = null, genus = null) => {
  try {
    let query = `SELECT DISTINCT ${rank} as name FROM plants WHERE status = 'published' AND ${rank} IS NOT NULL`;
    let params = [];

    if (family && rank !== 'family') {
      query += ` AND family = ?`;
      params.push(family);
    }

    if (genus && rank === 'specific_epithet') {
      query += ` AND genus = ?`;
      params.push(genus);
    }

    query += ` AND ${rank} LIKE ? LIMIT 5`;
    params.push(`%${name}%`);

    const [results] = await db.query(query, params);
    return results.map(r => r.name);
  } catch (error) {
    logger.error('Error en getSimilarNames:', error);
    return [];
  }
};

module.exports = {
  getFamilies,
  getGenera: getFamilies, // Alias
  getSpecies: getFamilies, // Alias
  getGeneraByFamily,
  getSpeciesByGenus,
  autocompleteFamilies,
  autocompleteGenera,
  autocompleteSpecies,
  getTaxonomyTree,
  validateTaxonomy,
  createFamily: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' }),
  createGenus: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' }),
  updateTaxonomy: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' }),
  deleteTaxonomy: async (req, res) => res.json({ success: false, error: 'Funcionalidad pendiente' })
};
