import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, expected } from '../server/data.mjs';
import { runPipeline, runGold, validateSql } from '../server/engine.mjs';
import { scoreResult } from '../server/score.mjs';

function silverSql(mode, corrected) {
  const places = mode === 'rice' ? ['Pinefield', 'Riverbend', 'Hillcrest', 'Lakeside'] : ['Cedarvale', 'Brookhaven', 'Sunridge', 'Mossfield'];
  return `WITH ranked AS (
    SELECT row_uid, record_id, TRIM(location) AS location, UPPER(TRIM(commodity)) AS commodity,
      harvested_area_ha, production_mt, year,
      ROW_NUMBER() OVER (PARTITION BY record_id ORDER BY row_uid) AS rn FROM bronze)
    SELECT row_uid, record_id, location, commodity,
      CAST(harvested_area_ha AS REAL) AS harvested_area_ha,
      CAST(production_mt AS REAL) AS production_mt, year FROM ranked
    WHERE location IN (${places.map(p => `'${p}'`).join(',')})
      AND commodity = '${mode.toUpperCase()}'
      AND CAST(harvested_area_ha AS REAL) > 0 AND CAST(production_mt AS REAL) >= 0
      ${corrected ? "AND TRIM(production_mt) <> '' AND TRIM(production_mt) NOT GLOB '*[^0-9.]*' AND rn = 1" : ''}`;
}

const goldSql = `SELECT location, ROUND(SUM(production_mt), 2) AS total_production_mt,
  ROUND(SUM(harvested_area_ha), 2) AS total_area_ha,
  ROUND(SUM(production_mt) / SUM(harvested_area_ha), 2) AS yield_mt_ha
  FROM silver GROUP BY location ORDER BY location`;

test('fixtures are separate, reproducible, and have known quality errors', () => {
  assert.deepEqual(fixture('rice'), fixture('rice'));
  assert.equal(fixture('rice').length, 98);
  assert.equal(fixture('cacao').length, 146);
  assert.equal(expected('cacao').quarantine.length, 7);
});

test('corrected SQL produces 100% on both datasets', () => {
  for (const seed of ['sample', 'rehearsal-42']) {
    for (const mode of ['rice', 'cacao']) {
      const result = runPipeline(mode, silverSql(mode, true), goldSql, seed);
      assert.equal(scoreResult(mode, result, seed).score, 100);
    }
  }
});

test('valid but wrong SQL runs and scores below 100%', () => {
  const result = runPipeline('cacao', silverSql('cacao', false), goldSql.replace('SUM(production_mt) / SUM(harvested_area_ha)', 'AVG(production_mt / harvested_area_ha)'));
  assert.ok(result.gold.length > 0);
  assert.ok(scoreResult('cacao', result).score < 100);
});

test('Cacao Gold starter is wrong even with correct Silver for varied seeds', () => {
  const wrongGold = goldSql.replace('SUM(production_mt) / SUM(harvested_area_ha)', 'AVG(production_mt / harvested_area_ha)');
  for (const seed of ['sample', ...Array.from({ length: 20 }, (_, index) => `seed-${index}`)]) {
    const silver = expected('cacao', seed).silver;
    const gold = runGold(silver, wrongGold);
    assert.ok(scoreResult('cacao', { silver, gold }, seed).categories['Gold totals'] < 35, seed);
  }
});

test('one missing Silver row cannot round up to a perfect score', () => {
  const result = runPipeline('cacao', silverSql('cacao', true), goldSql);
  result.silver.pop();
  assert.ok(scoreResult('cacao', result).score < 100);
});

test('read-only single-query rule rejects writes', () => {
  assert.throws(() => validateSql('DROP TABLE bronze'), /SELECT/);
  assert.throws(() => validateSql('SELECT * FROM bronze; DELETE FROM bronze'), /SELECT/);
});
