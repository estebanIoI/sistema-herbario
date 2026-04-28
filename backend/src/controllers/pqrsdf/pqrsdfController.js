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

// pqrsdf.getAll — solo admin, para futura vista de gestión
const getAll = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');

  const { tipo, status, page = 1, limit = 20 } = data || {};
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (tipo)   { conditions.push('tipo = ?');   params.push(tipo); }
  if (status) { conditions.push('status = ?'); params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await db.query(
    `SELECT * FROM pqrsdf ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM pqrsdf ${where}`,
    params
  );

  return { pqrsdf: rows, total, page, pages: Math.ceil(total / limit) };
};

module.exports = { create, getAll };
