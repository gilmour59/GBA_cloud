import initSqlJs from 'sql.js';
import { fixture } from './data.mjs';

const SQL = await initSqlJs();
const COLUMNS = ['row_uid', 'record_id', 'location', 'commodity', 'harvested_area_ha', 'production_mt', 'year'];

export function validateSql(sql) {
  if (typeof sql !== 'string' || sql.length < 10 || sql.length > 5000) throw new Error('Enter a SELECT query under 5,000 characters.');
  const cleaned = sql.trim().replace(/;\s*$/, '');
  if (!/^(SELECT|WITH)\b/i.test(cleaned) || /;/.test(cleaned)) throw new Error('Use one SELECT query at a time.');
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|REPLACE|VACUUM|LOAD_EXTENSION)\b/i.test(cleaned)) throw new Error('Only read-only SELECT queries are allowed.');
  return cleaned;
}

function selectRows(db, sql) {
  const prepared = db.prepare(validateSql(sql));
  try {
    const rows = [];
    const names = prepared.getColumnNames();
    if (names.length === 0) throw new Error('The query must return columns.');
    while (prepared.step()) {
      rows.push(prepared.getAsObject());
      if (rows.length > 500) throw new Error('Query returned too many rows.');
    }
    return rows;
  } finally { prepared.free(); }
}

export function runPipeline(mode, silverSql, goldSql, seed = 'sample') {
  const db = new SQL.Database();
  try {
    db.run('CREATE TABLE bronze (row_uid INTEGER, record_id TEXT, location TEXT, commodity TEXT, harvested_area_ha TEXT, production_mt TEXT, year INTEGER)');
    const insert = db.prepare('INSERT INTO bronze VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of fixture(mode, seed)) insert.run(COLUMNS.map(name => row[name]));
    insert.free();
    const silver = selectRows(db, silverSql);
    const required = COLUMNS;
    if (silver.length && required.some(name => !(name in silver[0]))) throw new Error(`Silver must return: ${required.join(', ')}.`);
    db.run('CREATE TABLE silver (row_uid INTEGER, record_id TEXT, location TEXT, commodity TEXT, harvested_area_ha REAL, production_mt REAL, year INTEGER)');
    const addSilver = db.prepare('INSERT INTO silver VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of silver) addSilver.run(required.map(name => row[name]));
    addSilver.free();
    const gold = selectRows(db, goldSql);
    const goldColumns = ['location', 'total_production_mt', 'total_area_ha', 'yield_mt_ha'];
    if (gold.length && goldColumns.some(name => !(name in gold[0]))) throw new Error(`Gold must return: ${goldColumns.join(', ')}.`);
    return { silver, gold };
  } finally { db.close(); }
}
