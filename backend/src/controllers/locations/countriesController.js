// src/controllers/locations/countriesController.js
// Proxy para CountriesNow API con caché de 24 h (Redis con fallback a memoria)
const cache = require('../../services/cache');
const logger = require('../../utils/logger');

const GEO_TTL = 86400; // 24 h en segundos

const COUNTRIES_NOW = 'https://countriesnow.space/api/v0.1';

// ── helpers ───────────────────────────────────────────────────────────────────

async function cnFetch(path, body) {
  const opts = body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET',  headers: { Accept: 'application/json' } };

  const res = await fetch(`${COUNTRIES_NOW}${path}`, opts);
  if (!res.ok) throw new Error(`CountriesNow respondió ${res.status} en ${path}`);
  const json = await res.json();
  if (json.error) throw new Error(json.msg || 'Error en CountriesNow');
  return json.data;
}

// ── servicios ─────────────────────────────────────────────────────────────────

/**
 * Lista de países
 * No requiere parámetros
 */
const getCountries = async () => {
  const cacheKey = 'geo:countries';
  const cached = await cache.get(cacheKey);
  if (cached) return { countries: cached };

  const data = await cnFetch('/countries/iso');
  // data es array de { name, Iso2, Iso3 }
  const countries = data.map(c => c.name).sort();
  await cache.set(cacheKey, countries, GEO_TTL);
  logger.info(`Geo: ${countries.length} países cargados y cacheados`);
  return { countries };
};

/**
 * Estados / departamentos de un país
 * Parámetros: { country: string }
 */
const SUFFIX_RE = /\s+(Department|Departamento|Province|Region|State|Oblast|Prefecture|District|Territory|County)$/i;

const getStates = async (data) => {
  const { country } = data || {};
  if (!country) throw new Error('Se requiere el parámetro country');

  const cacheKey = `geo:states:${country.toLowerCase()}`;
  const cached = await cache.get(cacheKey);
  // cached es array de { label, original }
  if (cached) return { states: cached.map(s => s.label) };

  const result = await cnFetch('/countries/states', { country });
  // result.states es array de { name, state_code }
  const states = (result.states || [])
    .map(s => ({ label: s.name.replace(SUFFIX_RE, '').trim(), original: s.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  await cache.set(cacheKey, states, GEO_TTL);
  logger.info(`Geo: ${states.length} estados de "${country}" cacheados`);
  return { states: states.map(s => s.label) };
};

/**
 * Ciudades / municipios de un estado
 * Parámetros: { country: string, state: string }
 *
 * IMPORTANTE: el frontend envía el label limpio (sin sufijo).
 * Recuperamos el nombre original desde el caché de estados para
 * que CountriesNow lo reconozca.
 */
const getCities = async (data) => {
  const { country, state } = data || {};
  if (!country || !state) throw new Error('Se requieren los parámetros country y state');

  const cacheKey = `geo:cities:${country.toLowerCase()}:${state.toLowerCase()}`;
  const cached = await cache.get(cacheKey);
  if (cached) return { cities: cached };

  // Resolver el nombre original del estado desde el caché de getStates
  const statesCacheKey = `geo:states:${country.toLowerCase()}`;
  const statesCache = await cache.get(statesCacheKey);
  // Si el caché de estados existe, buscar el original; si no, intentar con el nombre tal cual
  const originalState = statesCache
    ? (statesCache.find(s => s.label.toLowerCase() === state.toLowerCase())?.original || state)
    : state;

  const cities = await cnFetch('/countries/state/cities', { country, state: originalState });
  const sorted = (cities || []).slice().sort();
  await cache.set(cacheKey, sorted, GEO_TTL);
  logger.info(`Geo: ${sorted.length} ciudades de "${originalState}, ${country}" cacheadas`);
  return { cities: sorted };
};

module.exports = { getCountries, getStates, getCities };
