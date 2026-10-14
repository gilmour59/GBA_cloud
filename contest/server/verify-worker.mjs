import { parentPort, workerData } from 'node:worker_threads';
import { runPipeline } from './engine.mjs';
import { scoreResult } from './score.mjs';

try {
  const result = runPipeline(workerData.mode, workerData.silverSql, workerData.goldSql, workerData.seed);
  parentPort.postMessage({ ok: true, result: scoreResult(workerData.mode, result, workerData.seed) });
} catch (error) {
  parentPort.postMessage({ ok: false, error: error.message });
}
