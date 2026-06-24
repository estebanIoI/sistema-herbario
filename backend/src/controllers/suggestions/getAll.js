const db = require('../../config/database');
const logger = require('../../utils/logger');

const ALLOWED_SORT = {
  submitted_at: 's.created_at',
  status:       's.status',
  type:         's.type',
  title:        's.title',
  priority:     's.priority',
};

const getAll = async (data, user) => {
  const { page = 1, limit = 20, status = 'all', type = 'all', search = '', sortBy, sortDir = 'desc' } = data || {};
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (status !== 'all' && status) { conditions.push('s.status = ?'); params.push(status); }
  if (type   !== 'all' && type)   { conditions.push('s.type = ?');   params.push(type); }
  if (search.trim()) {
    conditions.push('(s.title LIKE ? OR s.description LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q);
  }

  const whereS = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const whereCount = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const orderCol = ALLOWED_SORT[sortBy] || 's.created_at';
  const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC';

  // Intentar query con columnas nuevas; si no existen (migración pendiente), usar query base
  let suggestions;
  try {
    [suggestions] = await db.query(
      `SELECT s.id, s.type, s.title, s.description, s.status, s.priority,
              s.user_id, s.assigned_to, s.plant_id, s.attachments,
              s.votes_up, s.votes_down, s.created_at, s.updated_at, s.resolved_at,
              s.admin_response, s.responded_at,
              u.name AS responded_by_name, u.email AS responded_by_email
       FROM suggestions s
       LEFT JOIN users u ON u.id = s.responded_by
       ${whereS} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      // Columnas de respuesta aún no existen — usar query base hasta que se corra la migración
      [suggestions] = await db.query(
        `SELECT id, type, title, description, status, priority,
                user_id, assigned_to, plant_id, attachments,
                votes_up, votes_down, created_at, updated_at, resolved_at
         FROM suggestions ${whereS} ORDER BY created_at ${orderDir} LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );
    } else { throw e; }
  }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM suggestions s ${whereCount}`, params
  );

  // Conteos por estado (todos los 5 estados)
  const [statusRows] = await db.query(
    'SELECT status, COUNT(*) as count FROM suggestions GROUP BY status'
  );
  const counts = { pending: 0, in_review: 0, approved: 0, rejected: 0, implemented: 0 };
  for (const r of statusRows) {
    if (r.status in counts) counts[r.status] = r.count;
  }

  const formatted = suggestions.map(s => {
    let contactName = null, contactEmail = null, contactPhone = null, adminNotes = null;
    if (s.attachments) {
      try {
        const att = typeof s.attachments === 'string' ? JSON.parse(s.attachments) : s.attachments;
        contactName  = att.contact_name  || att.name  || null;
        contactEmail = att.contact_email || att.email || null;
        contactPhone = att.contact_phone || att.phone || null;
        adminNotes   = att.admin_notes   || null;
      } catch { /* ignorar */ }
    }
    return {
      id:             s.id,
      plant_id:       s.plant_id || null,
      title:          s.title || '',
      description:    s.description || '',
      suggestion_type:s.type || 'correction',
      status:         s.status || 'pending',
      priority:       s.priority || 'medium',
      votes_up:       s.votes_up || 0,
      votes_down:     s.votes_down || 0,
      submitted_at:   s.created_at ? new Date(s.created_at).toISOString() : null,
      reviewed_at:    s.resolved_at ? new Date(s.resolved_at).toISOString() : null,
      assigned_to:    s.assigned_to || null,
      contact_name:          contactName,
      contact_email:         contactEmail,
      contact_phone:         contactPhone,
      admin_notes:           adminNotes,
      admin_response:        s.admin_response || null,
      responded_at:          s.responded_at ? new Date(s.responded_at).toISOString() : null,
      responded_by_name:     s.responded_by_name || null,
      responded_by_email:    s.responded_by_email || null,
    };
  });

  const totalPages = Math.ceil(total / limit);
  logger.info(`Sugerencias consultadas — total: ${total}, estado: ${status}`);

  return {
    suggestions: formatted,
    pagination: {
      page:       parseInt(page),
      limit:      parseInt(limit),
      total,
      totalPages,
      hasNext:    page < totalPages,
      hasPrev:    page > 1,
    },
    summary: { total, ...counts },
  };
};

module.exports = getAll;
