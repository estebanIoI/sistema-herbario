const db = require('../../config/database');
const logger = require('../../utils/logger');

const getAll = async (data, user) => {
  const { page = 1, limit = 20, status = 'all', type = 'all' } = data || {};
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (status !== 'all') { conditions.push('status = ?'); params.push(status); }
  if (type   !== 'all') { conditions.push('type = ?');   params.push(type); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [suggestions] = await db.query(
    `SELECT id, type, title, description, status, priority,
            user_id, assigned_to, plant_id, attachments,
            votes_up, votes_down, created_at, updated_at, resolved_at
     FROM suggestions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM suggestions ${where}`, params
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
      contact_name:   contactName,
      contact_email:  contactEmail,
      contact_phone:  contactPhone,
      admin_notes:    adminNotes,
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
