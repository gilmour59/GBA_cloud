import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function loadState(file, newSeed) {
  if (!file) return { seed: newSeed, sessions: [], entries: [], contest: { startsAt: null, closed: false } };
  let saved;
  try {
    saved = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { seed: newSeed, sessions: [], entries: [], contest: { startsAt: null, closed: false } };
    throw new Error(`Cannot read contest state at ${file}: ${error.message}`);
  }
  if (!saved || typeof saved.seed !== 'string' || !Array.isArray(saved.sessions) || !Array.isArray(saved.entries) ||
      !saved.contest || typeof saved.contest !== 'object' || !('closed' in saved.contest) ||
      !('startsAt' in saved.contest)) {
    throw new Error(`Contest state at ${file} has an unexpected format; refusing to reset scores.`);
  }
  return saved;
}

export function saveState(file, state) {
  if (!file) return;
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, JSON.stringify(state), { mode: 0o600 });
    renameSync(temporary, file);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}
