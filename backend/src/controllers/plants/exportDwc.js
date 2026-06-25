// src/controllers/plants/exportDwc.js
// Exportación compatible con GBIF: Darwin Core Archive (DwC-A), CSV con términos
// Darwin Core puros, y Excel (SpreadsheetML). Cero dependencias externas.
const db = require('../../config/database');
const logger = require('../../utils/logger');
const { createZip } = require('../../utils/zip');

// ── Mapeo  término Darwin Core → columna en BD ───────────────────────────────
// El orden define el orden de columnas. La PRIMERA debe ser el identificador.
const DWC_FIELDS = [
  { term: 'occurrenceID',              col: '_occurrenceID' },
  { term: 'basisOfRecord',             col: '_basisOfRecord' },
  { term: 'kingdom',                   col: '_kingdom' },
  { term: 'phylum',                    col: 'phylum' },
  { term: 'class',                     col: 'class_name' },
  { term: 'order',                     col: 'order_name' },
  { term: 'catalogNumber',             col: 'catalog_number' },
  { term: 'recordNumber',              col: 'record_number' },
  { term: 'scientificName',            col: 'scientific_name' },
  { term: 'scientificNameAuthorship',  col: 'scientific_name_authorship' },
  { term: 'family',                    col: 'family' },
  { term: 'genus',                     col: 'genus' },
  { term: 'specificEpithet',           col: 'specific_epithet' },
  { term: 'infraspecificEpithet',      col: 'infraspecific_epithet' },
  { term: 'taxonRank',                 col: 'taxon_rank' },
  { term: 'taxonomicStatus',           col: 'taxonomic_status' },
  { term: 'vernacularName',            col: 'vernacular_name' },
  { term: 'recordedBy',                col: 'recorded_by' },
  { term: 'eventDate',                 col: 'event_date' },
  { term: 'identifiedBy',              col: 'identified_by' },
  { term: 'dateIdentified',            col: 'date_identified' },
  { term: 'country',                   col: 'country' },
  { term: 'stateProvince',             col: 'state_province' },
  { term: 'county',                    col: 'county' },
  { term: 'municipality',              col: 'municipality' },
  { term: 'locality',                  col: 'locality' },
  { term: 'minimumElevationInMeters',  col: 'minimum_elevation_in_meters' },
  { term: 'decimalLatitude',           col: 'decimal_latitude' },
  { term: 'decimalLongitude',          col: 'decimal_longitude' },
  { term: 'geodeticDatum',             col: '_geodeticDatum' },
  { term: 'habitat',                   col: 'habitat' },
  { term: 'typeStatus',                col: 'type_status' },
  { term: 'preparations',              col: 'preparations' },
  { term: 'disposition',               col: 'disposition' },
  { term: 'occurrenceRemarks',         col: 'observations' },
]

const DWC_NS = 'http://rs.tdwg.org/dwc/terms/'

// Columnas reales que pedimos a la BD (sin las virtuales que empiezan por _)
const DB_COLS = [
  'id', 'occurrence_id', 'catalog_number', 'record_number',
  'kingdom', 'phylum', 'class_name', 'order_name',
  'scientific_name', 'scientific_name_authorship', 'family', 'genus',
  'specific_epithet', 'infraspecific_epithet', 'taxon_rank', 'taxonomic_status',
  'vernacular_name', 'recorded_by', 'event_date', 'identified_by', 'date_identified',
  'country', 'state_province', 'county', 'municipality', 'locality',
  'minimum_elevation_in_meters', 'decimal_latitude', 'decimal_longitude',
  'habitat', 'type_status', 'preparations', 'disposition', 'observations',
]

// ── Filtros (mismo criterio que la exportación CSV) ──────────────────────────
function buildWhere(data = {}) {
  const {
    search = '', family = '', genus = '', species = '', department = '',
    municipality = '', collector = '', vernacular_name = '', catalog_number = '',
    record_number = '', habitat = '',
  } = data
  const where = ["status = 'published'"]
  const params = []
  if (search) {
    where.push('(scientific_name LIKE ? OR vernacular_name LIKE ? OR family LIKE ? OR genus LIKE ?)')
    const s = `%${search}%`; params.push(s, s, s, s)
  }
  if (family)         { where.push('family LIKE ?');           params.push(`%${family}%`) }
  if (genus)          { where.push('genus LIKE ?');            params.push(`%${genus}%`) }
  if (species)        { where.push('specific_epithet LIKE ?'); params.push(`%${species}%`) }
  if (department)     { where.push('state_province LIKE ?');   params.push(`%${department}%`) }
  if (municipality)   { where.push('municipality LIKE ?');     params.push(`%${municipality}%`) }
  if (collector)      { where.push('recorded_by LIKE ?');      params.push(`%${collector}%`) }
  if (vernacular_name){ where.push('vernacular_name LIKE ?');  params.push(`%${vernacular_name}%`) }
  if (catalog_number) { where.push('catalog_number LIKE ?');   params.push(`%${catalog_number}%`) }
  if (record_number)  { where.push('record_number LIKE ?');    params.push(`%${record_number}%`) }
  if (habitat)        { where.push('habitat LIKE ?');          params.push(`%${habitat}%`) }
  return { whereClause: 'WHERE ' + where.join(' AND '), params }
}

// Añade las columnas virtuales (occurrenceID estable, valores fijos)
function withVirtuals(p) {
  return {
    ...p,
    _occurrenceID: p.occurrence_id || `urn:catalog:HEAA:${p.catalog_number || p.id}`,
    _basisOfRecord: 'PreservedSpecimen',
    _kingdom: p.kingdom || 'Plantae',
    _geodeticDatum: (p.decimal_latitude != null && p.decimal_longitude != null) ? 'WGS84' : '',
  }
}

async function fetchRows(data, user) {
  const { whereClause, params } = buildWhere(data)
  const limit = Math.min(parseInt(data?.limit) || 5000, 10000)
  const [plants] = await db.query(
    `SELECT ${DB_COLS.join(', ')} FROM plants ${whereClause} ORDER BY catalog_number ASC LIMIT ?`,
    [...params, limit]
  )
  logger.info(`Export DwC (${data?.format || 'dwca'}): ${plants.length} registros por ${user?.email ?? 'anónimo'}`)
  return plants.map(withVirtuals)
}

// ── Serializadores ───────────────────────────────────────────────────────────
const fmtDate = v => {
  if (!v) return ''
  try { return new Date(v).toISOString().slice(0, 10) } catch { return String(v) }
}
const cellVal = (row, f) => {
  let v = row[f.col]
  if (v == null) return ''
  if (f.term === 'eventDate' || f.term === 'dateIdentified') v = fmtDate(v)
  return String(v)
}

// TSV para el núcleo del DwC-A (tab-delimitado, sin comillas → sanitizar)
const sanitizeTsv = s => String(s).replace(/[\t\r\n]+/g, ' ').trim()
function toOccurrenceTxt(rows) {
  const header = DWC_FIELDS.map(f => f.term).join('\t')
  const body = rows.map(r => DWC_FIELDS.map(f => sanitizeTsv(cellVal(r, f))).join('\t')).join('\n')
  return header + '\n' + body + '\n'
}

// CSV con términos Darwin Core puros
const escCsv = v => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function toDwcCsv(rows) {
  const header = DWC_FIELDS.map(f => f.term).join(',')
  const body = rows.map(r => DWC_FIELDS.map(f => escCsv(cellVal(r, f))).join(',')).join('\n')
  return '﻿' + header + '\n' + body + '\n'
}

// meta.xml — describe el archivo y mapea cada columna a su término DwC
function buildMetaXml() {
  const fields = DWC_FIELDS
    .map((f, i) => `    <field index="${i}" term="${DWC_NS}${f.term}"/>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<archive xmlns="http://rs.tdwg.org/dwc/text/" metadata="eml.xml">
  <core encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="" ignoreHeaderLines="1" rowType="${DWC_NS}Occurrence">
    <files>
      <location>occurrence.txt</location>
    </files>
    <id index="0"/>
${fields}
  </core>
</archive>
`
}

// eml.xml — metadatos del conjunto de datos (formato GBIF EML)
function buildEmlXml() {
  const now = new Date().toISOString()
  const id = `herbario-heaa-${Date.now()}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<eml:eml xmlns:eml="eml://ecoinformatics.org/eml-2.1.1"
  xmlns:dc="http://purl.org/dc/terms/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  packageId="${id}" system="herbario-heaa" scope="system" xml:lang="es">
  <dataset>
    <title xml:lang="es">Herbario Digital HEAA — Instituto Tecnológico del Putumayo</title>
    <creator>
      <organizationName>Instituto Tecnológico del Putumayo · Herbario HEAA</organizationName>
    </creator>
    <metadataProvider>
      <organizationName>Herbario Digital HEAA</organizationName>
    </metadataProvider>
    <pubDate>${now.slice(0, 10)}</pubDate>
    <language>es</language>
    <abstract>
      <para>Registros de especímenes botánicos del Herbario HEAA estructurados según el estándar Darwin Core para su publicación e interoperabilidad con redes globales de biodiversidad como GBIF.</para>
    </abstract>
    <intellectualRights>
      <para>Datos publicados con fines científicos y educativos. Cite la fuente: Herbario Digital HEAA.</para>
    </intellectualRights>
    <contact>
      <organizationName>Herbario Digital HEAA</organizationName>
    </contact>
  </dataset>
</eml:eml>
`
}

// Excel (SpreadsheetML 2003) — formato XML que Excel abre nativamente
function toSpreadsheetML(rows) {
  const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const headerCells = DWC_FIELDS.map(f => `<Cell><Data ss:Type="String">${xmlEsc(f.term)}</Data></Cell>`).join('')
  const dataRows = rows.map(r => {
    const cells = DWC_FIELDS.map(f => `<Cell><Data ss:Type="String">${xmlEsc(cellVal(r, f))}</Data></Cell>`).join('')
    return `   <Row>${cells}</Row>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="DarwinCore">
  <Table>
   <Row>${headerCells}</Row>
${dataRows}
  </Table>
 </Worksheet>
</Workbook>
`
}

// ── Controller principal ─────────────────────────────────────────────────────
const exportDwc = async (data, user) => {
  const format = (data?.format || 'dwca').toLowerCase()
  const rows = await fetchRows(data, user)
  const date = new Date().toISOString().slice(0, 10)

  if (format === 'csv' || format === 'dwc-csv') {
    const csv = toDwcCsv(rows)
    return {
      base64: Buffer.from(csv, 'utf8').toString('base64'),
      filename: `herbario_HEAA_darwincore_${date}.csv`,
      mimeType: 'text/csv;charset=utf-8',
      count: rows.length,
      format: 'dwc-csv',
    }
  }

  if (format === 'xlsx' || format === 'excel' || format === 'xls') {
    const xml = toSpreadsheetML(rows)
    return {
      base64: Buffer.from(xml, 'utf8').toString('base64'),
      filename: `herbario_HEAA_${date}.xls`,
      mimeType: 'application/vnd.ms-excel',
      count: rows.length,
      format: 'excel',
    }
  }

  // Por defecto: Darwin Core Archive (zip con occurrence.txt + meta.xml + eml.xml)
  const zip = createZip([
    { name: 'occurrence.txt', content: toOccurrenceTxt(rows) },
    { name: 'meta.xml',       content: buildMetaXml() },
    { name: 'eml.xml',        content: buildEmlXml() },
  ])
  return {
    base64: zip.toString('base64'),
    filename: `herbario_HEAA_dwca_${date}.zip`,
    mimeType: 'application/zip',
    count: rows.length,
    format: 'dwca',
  }
}

module.exports = { exportDwc }
