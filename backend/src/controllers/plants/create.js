// src/controllers/plants/create.js
const db = require('../../config/database');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

const create = async (data, user) => {
  try {
    if (!user || user.role !== 'admin') {
      throw new Error('Permisos insuficientes para crear plantas');
    }

    const {
      // Información básica
      catalogNumber,
      recordNumber,
      
      // Taxonomía
      scientificName,
      scientificNameAuthorship,
      kingdom = 'Plantae',
      phylum = 'Magnoliophyta',
      class: className = 'Equisetopsida',
      orderName,
      family,
      subfamily,
      genus,
      subgenus,
      specificEpithet,
      infraspecificEpithet,
      taxonRank = 'species',
      vernacularName,
      
      // Ubicación
      country = 'Colombia',
      stateProvince,
      county,
      municipality,
      locality,
      minimumElevationInMeters,
      habitat,
      decimalLatitude,
      decimalLongitude,
      decimalLatitudeSexagesimal,
      decimalLongitudeSexagesimal,
      geodetic = 'WGS84',
      
      // Colección
      recordedBy,
      identifiedBy,
      dateIdentified,
      organismQuantity,
      organismQuantityType,
      lifeStage,
      preparation,
      disposition,
      samplingProtocol,
      eventDate,
      fieldNumber,
      fieldNotes,
      
      // Características
      description,
      plantHeight,
      plantHabit,
      flowerColor,
      fruitColor,
      leafShape,
      stemType,
      rootType,
      reproductionType,
      ecologicalImportance,
      economicImportance,
      conservationStatus,
      threats,
      
      // Imágenes
      imageUrls = [],
      
      // Herbario
      herbariumNotes,
      verificationStatus = 'pending'
    } = data;

    // Validaciones requeridas
    if (!catalogNumber || !scientificName || !family || !genus || !specificEpithet || !locality || !recordedBy) {
      throw new Error('Campos requeridos: catalogNumber, scientificName, family, genus, specificEpithet, locality, recordedBy');
    }

    // Verificar que no exista el número de catálogo
    const [existingPlant] = await db.query(
      'SELECT id FROM plants WHERE catalog_number = ?',
      [catalogNumber]
    );

    if (existingPlant.length > 0) {
      throw new Error('El número de catálogo ya existe');
    }

    // Generar occurrence_id único
    const occurrenceId = `HEAA-${catalogNumber}`;

    // Procesar URLs de imágenes
    const imageUrlsJson = JSON.stringify(imageUrls);

    // Insertar nueva planta
    const [result] = await db.query(`
      INSERT INTO plants (
        occurrence_id, catalog_number, record_number,
        institution_code, institution_id, collection_code,
        scientific_name, scientific_name_authorship, kingdom, phylum, class,
        order_name, family, subfamily, genus, subgenus, specific_epithet,
        infraspecific_epithet, taxon_rank, vernacular_name,
        country, state_province, county, municipality, locality,
        minimum_elevation_in_meters, habitat, decimal_latitude, decimal_longitude,
        decimal_latitude_sexagesimal, decimal_longitude_sexagesimal, geodetic,
        recorded_by, identified_by, date_identified, organism_quantity,
        organism_quantity_type, life_stage, preparation, disposition,
        sampling_protocol, event_date, field_number, field_notes,
        description, plant_height, plant_habit, flower_color, fruit_color,
        leaf_shape, stem_type, root_type, reproduction_type, ecological_importance,
        economic_importance, conservation_status, threats, image_urls,
        herbarium_notes, verification_status, created_by
      ) VALUES (
        ?, ?, ?,
        'ITP', '800.247.940', 'HEAA',
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `, [
      occurrenceId, catalogNumber, recordNumber,
      scientificName, scientificNameAuthorship, kingdom, phylum, className,
      orderName, family, subfamily, genus, subgenus, specificEpithet,
      infraspecificEpithet, taxonRank, vernacularName,
      country, stateProvince, county, municipality, locality,
      minimumElevationInMeters, habitat, decimalLatitude, decimalLongitude,
      decimalLatitudeSexagesimal, decimalLongitudeSexagesimal, geodetic,
      recordedBy, identifiedBy, dateIdentified, organismQuantity,
      organismQuantityType, lifeStage, preparation, disposition,
      samplingProtocol, eventDate, fieldNumber, fieldNotes,
      description, plantHeight, plantHabit, flowerColor, fruitColor,
      leafShape, stemType, rootType, reproductionType, ecologicalImportance,
      economicImportance, conservationStatus, threats, imageUrlsJson,
      herbariumNotes, verificationStatus, user.id
    ]);

    // Obtener la planta creada
    const [newPlant] = await db.query(
      'SELECT * FROM plants WHERE id = ?',
      [result.insertId]
    );

    const plant = newPlant[0];

    // Crear notificación para otros administradores
    await createNotification({
      type: 'new_plant',
      title: 'Nueva planta agregada',
      message: `${user.name} agregó la planta ${scientificName}`,
      data: { plantId: plant.id },
      createdBy: user.id
    });

    logger.info(`Nueva planta creada: ${scientificName} por ${user.email}`);

    return {
      id: plant.id,
      occurrenceId: plant.occurrence_id,
      catalogNumber: plant.catalog_number,
      scientificName: plant.scientific_name,
      family: plant.family,
      genus: plant.genus,
      createdAt: plant.created_at
    };

  } catch (error) {
    logger.error('Error al crear planta:', error);
    throw error;
  }
};

const createNotification = async (notificationData) => {
  try {
    // TODO: Implementar sistema de notificaciones
    // const db = require('../../config/database');
    // await db.query('INSERT INTO notifications (...) VALUES (...)', [...]);
    logger.info('Notificación creada:', notificationData.title);
  } catch (error) {
    logger.error('Error creando notificación:', error);
  }
};

module.exports = create;
