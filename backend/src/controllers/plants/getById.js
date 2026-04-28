// src/controllers/plants/getById.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getById = async (data, _user, context = {}) => {
  try {
    const { id } = data;

    if (!id) {
      throw new Error('ID de planta es requerido');
    }

    logger.info(`Consultando planta con ID: ${id}`);

    const [plants] = await db.query(
      `SELECT * FROM plants WHERE id = ?`,
      [id]
    );

    if (plants.length === 0) {
      throw new Error('Planta no encontrada');
    }

    const plant = plants[0];

    logger.info(`Planta encontrada: ${plant.id}`);

    // Obtener imágenes de la tabla plant_images
    const [images] = await db.query(
      `SELECT id, image_url, thumbnail_url, caption, is_main, display_order
       FROM plant_images
       WHERE plant_id = ?
       ORDER BY is_main DESC, display_order ASC`,
      [id]
    );

    plant.imageUrls = images.map(img => img.image_url);
    plant.imagesData = images;

    // Incrementar contador de vistas y registrar en activity_logs (fire-and-forget)
    Promise.all([
      db.query('UPDATE plants SET views = views + 1 WHERE id = ?', [id]),
      db.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES ('view_plant', 'plant', ?, ?, ?, ?)`,
        [id, `Vista: ${plant.scientific_name}`, context.ip || null, context.userAgent || null]
      )
    ]).catch(err => logger.error('Error registrando vista de planta:', err));

    // Crear un objeto formateado solo con las propiedades que existen
    const formattedPlant = {
      ...plant,
      // Taxonomía (solo incluir campos que existen)
      taxonomia: {
        reino: plant.kingdom || null,
        filo: plant.phylum || null,
        clase: plant.class || null,
        orden: plant.order_name || null,
        familia: plant.family || null,
        subfamilia: plant.subfamily || null,
        genero: plant.genus || null,
        subgenero: plant.subgenus || null,
        epitetoEspecifico: plant.specific_epithet || null,
        nombreCientifico: plant.scientific_name || null,
        nombreVernacular: plant.vernacular_name || null
      },
      // Ubicación (solo incluir campos que existen)
      ubicacion: {
        pais: plant.country || null,
        departamento: plant.state_province || null,
        municipio: plant.municipality || null,
        localidad: plant.locality || null,
        habitat: plant.habitat || null,
        latitud: plant.decimal_latitude || null,
        longitud: plant.decimal_longitude || null
      },
      // Colección (solo incluir campos que existen)
      coleccion: {
        numeroCatalogo: plant.catalog_number || null,
        registradoPor: plant.recorded_by || null,
        fechaEvento: plant.event_date || null
      },
      // Características (solo incluir campos que existen)
      caracteristicas: {
        descripcion: plant.description || null,
        habito: plant.plant_habit || null,
        habitat: plant.habitat || null,
        usos: plant.uses || null,
        cuidados: plant.care_instructions || null,
        colorFlor: plant.flower_color || null,
        colorFruto: plant.fruit_color || null,
        formaHoja: plant.leaf_shape || null,
        tipoTallo: plant.stem_type || null,
        tipoRaiz: plant.root_type || null,
        tipoReproduccion: plant.reproduction_type || null,
        importanciaEcologica: plant.ecological_importance || null,
        importanciaEconomica: plant.economic_importance || null,
        estadoConservacion: plant.conservation_status || null,
        amenazas: plant.threats || null
      },
      herbario: {
        notasHerbario: plant.herbarium_notes || null,
        estadoVerificacion: plant.verification_status || null,
        fechaCreacion: plant.created_at || null,
        fechaActualizacion: plant.updated_at || null
      },
      // Proporcionar las imágenes desde la tabla plant_images
      images: plant.imagesData ? plant.imagesData.map(img => ({
        id: img.id,
        url: img.image_url,
        thumbnailUrl: img.thumbnail_url,
        caption: img.caption,
        isMain: img.is_main === 1
      })) : []
    };

    // Asegurar que los campos críticos existan para el frontend
    if (plant.scientific_name) {
      logger.info(`Planta consultada: ${plant.scientific_name} (${id})`);
    } else {
      logger.info(`Planta consultada: ID ${id} (sin nombre científico)`);
    }

    return formattedPlant;

  } catch (error) {
    logger.error('Error al obtener planta por ID:', error);
    throw error;
  }
};

module.exports = getById;
