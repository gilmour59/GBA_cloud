import { expected, fixture } from './data.mjs';

const sameNumber = (a, b) => Number.isFinite(Number(a)) && Math.abs(Number(a) - Number(b)) < 0.011;
const fraction = (good, total) => total === 0 ? 1 : good / total;

export function scoreResult(mode, actual, seed = 'sample') {
  const answer = expected(mode, seed);
  const expectedById = new Map(answer.silver.map(row => [row.row_uid, row]));
  const actualById = new Map(actual.silver.map(row => [Number(row.row_uid), row]));
  const expectedIds = new Set(expectedById.keys());
  const actualIds = new Set(actualById.keys());
  const trueIds = [...expectedIds].filter(id => actualIds.has(id));
  const silverMembership = fraction(trueIds.length, new Set([...expectedIds, ...actualIds]).size) *
    fraction(actualById.size, actual.silver.length);
  const silverValues = fraction(trueIds.filter(id => {
    const row = actualById.get(id);
    const correct = expectedById.get(id);
    return row.record_id === correct.record_id && row.location === correct.location && row.commodity === correct.commodity &&
      sameNumber(row.harvested_area_ha, correct.harvested_area_ha) && sameNumber(row.production_mt, correct.production_mt) && Number(row.year) === correct.year;
  }).length, answer.silver.length);

  const allIds = new Set(fixture(mode, seed).map(row => row.row_uid));
  const actualQuarantine = new Set([...allIds].filter(id => !actualIds.has(id)));
  const expectedQuarantine = new Set(answer.quarantine);
  const quarantine = fraction([...expectedQuarantine].filter(id => actualQuarantine.has(id)).length,
    new Set([...expectedQuarantine, ...actualQuarantine]).size);

  const actualGold = new Map(actual.gold.map(row => [row.location, row]));
  let matchingGoldFields = 0;
  for (const correct of answer.gold) {
    const row = actualGold.get(correct.location);
    if (!row) continue;
    for (const field of ['total_production_mt', 'total_area_ha', 'yield_mt_ha']) {
      if (sameNumber(row[field], correct[field])) matchingGoldFields++;
    }
  }
  const gold = fraction(matchingGoldFields, answer.gold.length * 3) * fraction(answer.gold.length, Math.max(answer.gold.length, actualGold.size));
  const top = [...answer.gold].sort((a, b) => b.total_production_mt - a.total_production_mt)[0];
  const displayedTop = [...actual.gold].sort((a, b) => Number(b.total_production_mt) - Number(a.total_production_mt))[0];
  const dashboard = displayedTop?.location === top.location && sameNumber(displayedTop.total_production_mt, top.total_production_mt) && sameNumber(displayedTop.yield_mt_ha, top.yield_mt_ha) ? 1 : 0;

  const categories = {
    'Silver rows': Math.floor(30 * silverMembership + 10 * silverValues + 1e-9),
    'Quarantine': Math.floor(15 * quarantine + 1e-9),
    'Gold totals': Math.floor(35 * gold + 1e-9),
    'Dashboard facts': Math.round(10 * dashboard)
  };
  const score = Object.values(categories).reduce((a, b) => a + b, 0);
  return { score, categories, perfect: score === 100, feedback: Object.entries(categories).map(([name, points]) => `${name}: ${points} points`) };
}
