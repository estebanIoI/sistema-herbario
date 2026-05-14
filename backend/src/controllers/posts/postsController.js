const create   = require('./create');
const getAll   = require('./getAll');
const getById  = require('./getById');
const update   = require('./update');
const remove   = require('./delete');

module.exports = { create, getAll, getById, update, delete: remove };
