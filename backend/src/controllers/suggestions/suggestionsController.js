// src/controllers/suggestions/suggestionsController.js
const getAll      = require('./getAll');
const create      = require('./create');
const approve     = require('./approve');
const reject      = require('./reject');
const update      = require('./update');
const countUnread = require('./countUnread');
const getById     = require('./getById');
const vote        = require('./vote');
const getStats    = require('./getStats');

module.exports = {
  getAll,
  create,
  approve,
  reject,
  update,
  countUnread,
  getById,
  vote,
  getStats,
};
