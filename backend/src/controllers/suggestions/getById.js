const db = require('../../config/database');

const getById = async (data, user) => {
  const { id } = data;
  if (!id) throw new Error('ID de sugerencia requerido');

  const [rows] = await db.query('SELECT * FROM suggestions WHERE id = ?', [id]);
  if (!rows.length) throw new Error(`Sugerencia #${id} no encontrada`);

  const s = rows[0];
  let contactName = null, contactEmail = null, contactPhone = null, adminNotes = null;
  if (s.attachments) {
    try {
      const att = typeof s.attachments === 'string' ? JSON.parse(s.attachments) : s.attachments;
      contactName  = att.contact_name  || att.name  || null;
      contactEmail = att.contact_email || att.email || null;
      contactPhone = att.contact_phone || att.phone || null;
      adminNotes   = att.admin_notes   || null;
    } catch { /* attachments mal formado */ }
  }

  return {
    ...s,
    contact_name:  contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    admin_notes:   adminNotes,
  };
};

module.exports = getById;
