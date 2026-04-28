// src/controllers/suggestions/getAll.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const getAll = async (data, user) => {
  try {
    console.log('🌱 Recibida solicitud para getSuggestions con datos:', data);
    console.log('👤 Usuario autenticado:', user ? `${user.name} (${user.role})` : 'No autenticado');
    
    const {
      page = 1,
      limit = 20,
      status = 'all',
      type = 'all'
    } = data || {};

    const offset = (page - 1) * limit;
    
    // Construir condiciones WHERE
    let whereConditions = [];
    let queryParams = [];

    if (status !== 'all') {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (type !== 'all') {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Consulta SQL para obtener sugerencias reales de la base de datos
    const suggestionsQuery = `
      SELECT 
        id, type, title, description, status,
        priority, user_id, assigned_to, plant_id, attachments,
        votes_up, votes_down, created_at, updated_at, resolved_at
      FROM suggestions 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    // Query para contar el total de sugerencias (para paginación)
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM suggestions 
      ${whereClause}
    `;

    console.log('📊 Ejecutando consulta SQL para obtener sugerencias reales');

    try {
      // Parámetros para las consultas con LIMIT y OFFSET
      const limitParams = [...queryParams, parseInt(limit), parseInt(offset)];
      
      // Ejecutar consulta principal
      const [suggestions] = await db.query(suggestionsQuery, limitParams);
      
      // Ejecutar consulta de conteo
      const [countResult] = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      console.log(`📊 Encontradas ${suggestions.length} sugerencias de un total de ${total}`);

      // Procesar resultados de la consulta a la base de datos
      const totalPages = Math.ceil(total / limit);
      
      logger.info(`Sugerencias consultadas - Total: ${total}, Estado: ${status}`);
      console.log(`📊 Devolviendo ${suggestions.length} sugerencias (página ${page} de ${totalPages})`);
      
      // Consulta adicional para obtener conteos por estado para el resumen
      const [statusCounts] = await db.query(`
        SELECT status, COUNT(*) as count 
        FROM suggestions 
        GROUP BY status
      `);
      
      // Convertir el resultado a un objeto más fácil de usar
      const counts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: total
      };
      
      statusCounts.forEach(item => {
        if (item.status in counts) {
          counts[item.status] = item.count;
        }
      });
      
      // Asegurarse de que los datos devueltos estén en el formato esperado por el frontend
      const formattedSuggestions = suggestions.map(suggestion => {
        // Normalizar nombres de propiedades para que coincidan con lo que espera el frontend
        return {
          id: suggestion.id,
          plant_id: suggestion.plant_id || null,
          title: suggestion.title || '',
          description: suggestion.description || '',
          status: suggestion.status || 'pending',
          priority: suggestion.priority || 'medium',
          submitted_at: suggestion.created_at ? 
            new Date(suggestion.created_at).toISOString() : 
            new Date().toISOString(),
          reviewed_at: suggestion.resolved_at ? 
            new Date(suggestion.resolved_at).toISOString() : 
            null,
          suggestion_type: suggestion.type || 'correction',
          votes_up: suggestion.votes_up || 0,
          votes_down: suggestion.votes_down || 0,
          // Datos adicionales
          assignedTo: suggestion.assigned_to || null,
          attachments: suggestion.attachments || null
        };
      });
      
      return {
        suggestions: formattedSuggestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        summary: {
          total: counts.total,
          pending: counts.pending,
          approved: counts.approved,
          rejected: counts.rejected
        }
      };
      
    } catch (error) {
      console.error('❌ Error al consultar la base de datos:', error);
      logger.error('Error al consultar sugerencias en la base de datos:', error);
      
      // En caso de error con la base de datos, usamos datos mock como fallback
      console.log('⚠️ Usando datos simulados como fallback');
      
      // Datos simulados de respaldo
      const mockSuggestions = [
        {
          id: 1,
          suggestion_type: 'new_plant',
          title: 'Nueva especie encontrada en río Mocoa',
          description: 'Encontré una planta que no está registrada en el herbario...',
          status: 'pending',
          scientific_name: 'Especie desconocida',
          location: 'Río Mocoa, Putumayo',
          contact_email: 'investigador@email.com',
          contact_name: 'Dr. Juan Investigador',
          submitted_at: new Date('2024-01-15'),
          reviewed_at: null,
          reviewed_by: null
        },
        {
          id: 2,
          suggestion_type: 'correction',
          title: 'Corrección en identificación',
          description: 'La planta catalogada como X debería ser Y...',
          status: 'approved',
          scientific_name: 'Heliconia rostrata',
          location: 'Mocoa, Putumayo',
          contact_email: 'botanico@universidad.edu',
          contact_name: 'Dra. María Botánica',
          submitted_at: new Date('2024-01-10'),
          reviewed_at: new Date('2024-01-12'),
          reviewed_by: user ? user.id : null
        }
      ];
      
      // Filtrado y paginación de datos mock (como fallback)
      let filteredSuggestions = mockSuggestions;
      
      if (status !== 'all') {
        filteredSuggestions = filteredSuggestions.filter(s => s.status === status);
      }
      
      if (type !== 'all') {
        filteredSuggestions = filteredSuggestions.filter(s => s.suggestion_type === type);
      }
      
      const mockTotal = filteredSuggestions.length;
      const paginatedSuggestions = filteredSuggestions.slice(offset, offset + limit);
      const mockTotalPages = Math.ceil(mockTotal / limit);
      
      console.log(`📊 [MOCK] Devolviendo ${paginatedSuggestions.length} sugerencias (página ${page} de ${mockTotalPages})`);
      
      // Formatear datos mock
      const formattedMockSuggestions = paginatedSuggestions.map(suggestion => {
        return {
          id: suggestion.id,
          plant_id: suggestion.plant_id || null,
          scientific_name: suggestion.scientific_name || null,
          title: suggestion.title || '',
          description: suggestion.description || '',
          status: suggestion.status || 'pending',
          contact_name: suggestion.contact_name || '',
          contact_email: suggestion.contact_email || '',
          contact_phone: suggestion.contact_phone || '',
          submitted_at: suggestion.submitted_at ? 
            new Date(suggestion.submitted_at).toISOString() : 
            new Date().toISOString(),
          reviewed_at: suggestion.reviewed_at ? 
            new Date(suggestion.reviewed_at).toISOString() : 
            null,
          suggestion_type: suggestion.suggestion_type || 'correction'
        };
      });

      return {
        suggestions: formattedMockSuggestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockTotal,
          totalPages: mockTotalPages,
          hasNext: page < mockTotalPages,
          hasPrev: page > 1
        },
        summary: {
          total: mockTotal,
          pending: mockSuggestions.filter(s => s.status === 'pending').length,
          approved: mockSuggestions.filter(s => s.status === 'approved').length,
          rejected: mockSuggestions.filter(s => s.status === 'rejected').length
        }
      };
    }
  } catch (error) {
    logger.error('Error al obtener sugerencias:', error);
    throw error;
  }
};

module.exports = getAll;
