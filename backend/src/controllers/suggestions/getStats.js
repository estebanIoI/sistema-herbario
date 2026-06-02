const db = require('../../config/database');

const getStats = async (data, user) => {
  if (!user || user.role !== 'admin') throw new Error('Permisos insuficientes');

  const [statusCounts] = await db.query(
    'SELECT status, COUNT(*) as count FROM suggestions GROUP BY status'
  );
  const [typeCounts] = await db.query(
    'SELECT type, COUNT(*) as count FROM suggestions GROUP BY type'
  );

  const stats = {
    total: 0,
    pending: 0, in_review: 0, approved: 0, rejected: 0, implemented: 0,
    by_type: { feature: 0, bug: 0, improvement: 0, data_correction: 0, new_plant: 0 },
  };

  for (const r of statusCounts) {
    if (r.status in stats) stats[r.status] = r.count;
    stats.total += r.count;
  }
  for (const r of typeCounts) {
    if (r.type in stats.by_type) stats.by_type[r.type] = r.count;
  }

  return stats;
};

module.exports = getStats;
