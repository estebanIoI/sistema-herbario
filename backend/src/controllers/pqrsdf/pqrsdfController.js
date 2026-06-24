// src/controllers/pqrsdf/pqrsdfController.js
const db = require('../../config/database');
const logger = require('../../utils/logger');

const TIPOS_VALIDOS = ['peticion', 'queja', 'reclamo', 'sugerencia', 'denuncia', 'felicitacion'];

const TIEMPOS_RESPUESTA = {
  peticion:    '15 días hábiles',
  queja:       '15 días hábiles',
  reclamo:     '15 días hábiles',
  sugerencia:  '15 días hábiles',
  denuncia:    'Se remite a la autoridad competente e informa al denunciante',
  felicitacion:'Respuesta inmediata o dentro de 10 a 15 días hábiles',
};

const generateRadicado = (id) => {
  const n = new Date();
  const ymd = `${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}`;
  return `PQRSDF-${ymd}-${String(id).padStart(5,'0')}`;
};

// pqrsdf.create — público, no requiere autenticación
const create = async (data) => {
  const {
    tipo,
    anonimo       = false,
    nombre,
    tipo_identificacion = 'CC',
    numero_documento,
    direccion_correspondencia,
    medio_respuesta = 'email',
    telefono,
    pais          = 'Colombia',
    departamento,
    ciudad,
    email,
    fax,
    mensaje,
    autoriza      = false,
  } = data || {};

  // Validaciones
  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) throw new Error('Tipo de comunicación inválido o no especificado');
  if (!mensaje || mensaje.trim().length < 10) throw new Error('El mensaje debe tener al menos 10 caracteres');
  if (!autoriza) throw new Error('Debe aceptar la política de tratamiento de datos personales');

  if (!anonimo) {
    if (!nombre || nombre.trim().length < 2) throw new Error('El nombre completo es requerido');
    if (medio_respuesta === 'email' && !email) throw new Error('El correo electrónico es requerido cuando elige respuesta por email');
    if (medio_respuesta === 'correo_fisico' && !direccion_correspondencia) throw new Error('La dirección de correspondencia es requerida');
  }

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Correo electrónico inválido');
  }

  const [result] = await db.query(`
    INSERT INTO pqrsdf (
      tipo, anonimo,
      nombre, tipo_identificacion, numero_documento,
      direccion_correspondencia, medio_respuesta,
      telefono, pais, departamento, ciudad, email, fax,
      mensaje, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
  `, [
    tipo,
    anonimo ? 1 : 0,
    anonimo ? null : (nombre || null),
    anonimo ? null : tipo_identificacion,
    anonimo ? null : (numero_documento || null),
    anonimo ? null : (direccion_correspondencia || null),
    medio_respuesta,
    telefono || null,
    pais || 'Colombia',
    departamento || null,
    ciudad || null,
    email || null,
    fax || null,
    mensaje.trim(),
  ]);

  const id     = result.insertId;
  const radicado = generateRadicado(id);
  const fechaRadicacion = new Date();

  await db.query('UPDATE pqrsdf SET radicado = ? WHERE id = ?', [radicado, id]);

  try {
    await db.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, description) VALUES (?, ?, ?, ?)`,
      ['pqrsdf_created', 'pqrsdf', id, `Nueva ${tipo}: ${radicado}`]
    );
  } catch { /* no interrumpir el flujo */ }

  logger.info(`PQRSDF radicado: ${radicado} | tipo: ${tipo} | anónimo: ${anonimo}`);

  return {
    radicado,
    tipo,
    fechaRadicacion: fechaRadicacion.toISOString(),
    tiempoRespuesta: TIEMPOS_RESPUESTA[tipo],
    message: 'Su solicitud ha sido radicada exitosamente. Guarde el número de radicado como comprobante.',
  };
};

const PQRSDF_ALLOWED_SORT = {
  created_at: 'p.created_at',
  status:     'p.status',
  tipo:       'p.tipo',
  nombre:     'p.nombre',
  radicado:   'p.radicado',
};

// pqrsdf.getAll — solo admin
const getAll = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');

  const { tipo, status, search = '', page = 1, limit = 20, sortBy, sortDir = 'desc' } = data || {};
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (tipo   && tipo   !== 'all') { conditions.push('p.tipo = ?');   params.push(tipo); }
  if (status && status !== 'all') { conditions.push('p.status = ?'); params.push(status); }
  if (search.trim()) {
    conditions.push('(p.radicado LIKE ? OR p.nombre LIKE ? OR p.email LIKE ? OR p.mensaje LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q, q, q);
  }

  const whereP     = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderCol   = PQRSDF_ALLOWED_SORT[sortBy] || 'p.created_at';
  const orderDir   = sortDir === 'asc' ? 'ASC' : 'DESC';

  let rows;
  try {
    [rows] = await db.query(
      `SELECT p.*, u.name AS responded_by_name, u.email AS responded_by_email
       FROM pqrsdf p
       LEFT JOIN users u ON u.id = p.responded_by
       ${whereP} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      [rows] = await db.query(
        `SELECT * FROM pqrsdf p ${whereP} ORDER BY p.created_at ${orderDir} LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
      );
    } else { throw e; }
  }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM pqrsdf p ${whereP}`,
    params
  );

  return { pqrsdf: rows, total, page, pages: Math.ceil(total / limit) };
};

// pqrsdf.updateStatus — solo admin
const updateStatus = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const { id, status } = data || {};
  const VALID = ['pendiente', 'en_revision', 'respondido'];
  if (!id) throw new Error('ID requerido');
  if (!VALID.includes(status)) throw new Error(`Estado inválido. Valores permitidos: ${VALID.join(', ')}`);
  await db.query('UPDATE pqrsdf SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

  try {
    await db.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, user_id, description) VALUES (?, 'pqrsdf', ?, ?, ?)`,
      ['pqrsdf_status_changed', id, user.id, `PQRSDF #${id} → ${status} por ${user.email}`]
    );
  } catch { /* no interrumpir */ }

  return { success: true, message: 'Estado actualizado' };
};

// pqrsdf.respond — solo admin, guarda respuesta oficial y cambia estado a respondido
const respond = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const { id, respuesta } = data || {};
  if (!id) throw new Error('ID requerido');
  if (!respuesta || respuesta.trim().length < 5) throw new Error('La respuesta debe tener al menos 5 caracteres');

  const [existing] = await db.query('SELECT id, status FROM pqrsdf WHERE id = ?', [id]);
  if (!existing.length) throw new Error('Solicitud no encontrada');

  try {
    await db.query(
      `UPDATE pqrsdf
       SET respuesta = ?, responded_by = ?, responded_at = NOW(),
           status = 'respondido', updated_at = NOW()
       WHERE id = ?`,
      [respuesta.trim(), user.id, id]
    );
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      throw new Error('Migración pendiente: ejecuta "node migrate.js" en la carpeta backend y reinicia el servidor.');
    }
    throw e;
  }

  try {
    await db.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, user_id, description) VALUES (?, 'pqrsdf', ?, ?, ?)`,
      ['pqrsdf_responded', id, user.id, `PQRSDF #${id} respondido por ${user.email}`]
    );
  } catch { /* no interrumpir */ }

  logger.info(`PQRSDF #${id} respondido por ${user.email}`);
  return { success: true, message: 'Respuesta registrada correctamente' };
};

// pqrsdf.getById — solo admin
const getById = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');
  const { id } = data || {};
  if (!id) throw new Error('ID requerido');

  const [rows] = await db.query(
    `SELECT p.*, u.name AS responded_by_name, u.email AS responded_by_email
     FROM pqrsdf p
     LEFT JOIN users u ON u.id = p.responded_by
     WHERE p.id = ?`,
    [id]
  );
  if (!rows.length) throw new Error('Solicitud no encontrada');

  const [logs] = await db.query(
    `SELECT al.action, al.description, al.created_at, u.name AS user_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.entity_type = 'pqrsdf' AND al.entity_id = ?
     ORDER BY al.created_at ASC`,
    [id]
  );

  return { pqrsdf: rows[0], history: logs };
};

module.exports = { create, getAll, updateStatus, respond, getById };
