import { parentPort, workerData } from 'node:worker_threads';
import { runPipeline, runSilver, runGold } from './engine.mjs';
import { scoreResult } from './score.mjs';
import { expected } from './data.mjs';

try {
  const { mode, silverSql, goldSql, seed, stage } = workerData;
  if (stage === 'silver') {
    const silver = runSilver(mode, silverSql, seed);
    const { categories } = scoreResult(mode, { silver, gold: [] }, seed);
    parentPort.postMessage({ ok: true, result: {
      correct: categories['Silver rows'] === 40 && categories.Quarantine === 15,
      checks: [
        { label: 'Valid rows and values', points: categories['Silver rows'], max: 40 },
        { label: 'Excluded rows', points: categories.Quarantine, max: 15 }
      ]
    } });
  } else if (stage === 'gold') {
    const silver = expected(mode, seed).silver;
    const gold = runGold(silver, goldSql);
    const { categories } = scoreResult(mode, { silver, gold }, seed);
    parentPort.postMessage({ ok: true, result: {
      correct: categories['Gold totals'] === 35 && categories['Dashboard facts'] === 10,
      checks: [
        { label: 'Totals and yield', points: categories['Gold totals'], max: 35 },
        { label: 'Top-place chart facts', points: categories['Dashboard facts'], max: 10 }
      ]
    } });
  } else {
    const result = runPipeline(mode, silverSql, goldSql, seed);
    parentPort.postMessage({ ok: true, result: scoreResult(mode, result, seed) });
  }
} catch (error) {
  parentPort.postMessage({ ok: false, error: error.message });
}
