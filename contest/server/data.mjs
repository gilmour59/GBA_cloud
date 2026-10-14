const locations = {
  rice: ['Pinefield', 'Riverbend', 'Hillcrest', 'Lakeside'],
  cacao: ['Cedarvale', 'Brookhaven', 'Sunridge', 'Mossfield']
};

export const rules = {
  rice: { crop: 'RICE', unit: 'province', count: 96 },
  cacao: { crop: 'CACAO', unit: 'municipality', count: 144 }
};

export function fixture(mode, seed = 'sample') {
  const rule = rules[mode];
  if (!rule) throw new Error('Unknown dataset');
  const variant = parseInt(createHash('sha256').update(String(seed)).digest('hex').slice(0, 6), 16);
  const rows = [];
  for (let index = 1; index <= rule.count; index++) {
    const area = 2 + ((index + variant) % 7) * 0.5;
    const yieldPerHa = mode === 'cacao'
      ? 1.2 + ((index + variant) % 7) * 0.18
      : 1.4 + ((index + variant) % 5) * 0.2;
    const production = area * yieldPerHa;
    rows.push({
      row_uid: index,
      record_id: `${mode === 'rice' ? 'R' : 'C'}-${String(index).padStart(3, '0')}`,
      location: locations[mode][(index - 1) % 4],
      commodity: rule.crop,
      harvested_area_ha: area.toFixed(1),
      production_mt: production.toFixed(2),
      year: 2025
    });
  }
  rows[8].location = '  ';
  rows[15].production_mt = '-4.00';
  rows[22].production_mt = 'n/a';
  rows[29].harvested_area_ha = '0';
  rows[36].harvested_area_ha = '';
  rows[43].commodity = ` ${rule.crop.toLowerCase()} `;
  rows[50].location = ` ${rows[50].location} `;
  if (mode === 'cacao') {
    rows[67].year = 2024;
    rows[82].record_id = '  ';
    rows[89].location = 'North Orchard';
    rows[97].commodity = 'COCOA';
    rows[105].harvested_area_ha = 'n/a';
    rows[112].production_mt = '';
  }
  rows.push({ ...rows[60], row_uid: rule.count + 1 });
  rows.push({ ...rows[75], row_uid: rule.count + 2 });
  return rows;
}

const decimal = /^\d+(?:\.\d+)?$/;

export function expected(mode, seed = 'sample') {
  const rule = rules[mode];
  const seen = new Set();
  const silver = [];
  const quarantine = [];
  for (const raw of fixture(mode, seed)) {
    const location = locations[mode].find(name => name.toLowerCase() === raw.location.trim().toLowerCase());
    const commodity = raw.commodity.trim().toUpperCase();
    const areaText = raw.harvested_area_ha.trim();
    const productionText = raw.production_mt.trim();
    const area = Number(areaText);
    const production = Number(productionText);
    if (!location || commodity !== rule.crop || !decimal.test(areaText) || !decimal.test(productionText) || area <= 0 || production < 0 || seen.has(raw.record_id) || (mode === 'cacao' && (raw.year !== 2025 || !raw.record_id.trim()))) {
      quarantine.push(raw.row_uid);
      continue;
    }
    seen.add(raw.record_id);
    silver.push({ row_uid: raw.row_uid, record_id: raw.record_id, location, commodity, harvested_area_ha: area, production_mt: production, year: raw.year });
  }
  const totals = new Map();
  for (const row of silver) {
    const current = totals.get(row.location) ?? { location: row.location, total_production_mt: 0, total_area_ha: 0 };
    current.total_production_mt += row.production_mt;
    current.total_area_ha += row.harvested_area_ha;
    totals.set(row.location, current);
  }
  const gold = [...totals.values()].map(row => ({
    location: row.location,
    total_production_mt: round(row.total_production_mt),
    total_area_ha: round(row.total_area_ha),
    yield_mt_ha: round(row.total_production_mt / row.total_area_ha)
  })).sort((a, b) => a.location.localeCompare(b.location));
  return { silver, quarantine, gold };
}

export function qualitySummary(mode, seed = 'sample') {
  const rows = fixture(mode, seed);
  const required = ['record_id', 'location', 'commodity', 'harvested_area_ha', 'production_mt'];
  const missingRows = rows.filter(row => required.some(field => !String(row[field] ?? '').trim())).length;
  const missingCells = rows.reduce((total, row) => total + required.filter(field => !String(row[field] ?? '').trim()).length, 0);
  return { missingRows, missingCells, targetExcluded: expected(mode, seed).quarantine.length };
}

function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
import { createHash } from 'node:crypto';

