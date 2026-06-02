const db = require('../../config/database');
const logger = require('../../utils/logger');

const vote = async (data, user) => {
  const { id, type } = data; // type: 'up' | 'down'
  if (!id) throw new Error('ID de sugerencia requerido');
  if (!['up', 'down'].includes(type)) throw new Error('Tipo de voto inválido — usa "up" o "down"');

  const [existing] = await db.query('SELECT id FROM suggestions WHERE id = ?', [id]);
  if (!existing.length) throw new Error(`Sugerencia #${id} no encontrada`);

  const column = type === 'up' ? 'votes_up' : 'votes_down';
  await db.query(`UPDATE suggestions SET ${column} = ${column} + 1 WHERE id = ?`, [id]);

  const [rows] = await db.query('SELECT votes_up, votes_down FROM suggestions WHERE id = ?', [id]);

  logger.info(`Voto "${type}" registrado en sugerencia #${id}`);
  return { id: parseInt(id), votes_up: rows[0].votes_up, votes_down: rows[0].votes_down };
};

module.exports = vote;
