import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadState, saveState } from '../server/state.mjs';

test('contest state keeps the fixture seed, timer, sessions, and scores across a restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gba-contest-'));
  const file = join(dir, 'data', 'state.json');
  try {
    const initial = loadState(file, 'seed-one');
    initial.pin = '123456789012';
    initial.contest = { startsAt: 1000, endsAt: 901000, closed: false };
    initial.sessions.push(['token-one', { name: 'Student', joinedAt: 1100 }]);
    initial.entries.push({ token: 'token-one', name: 'Student', score: 100, at: 1200, order: 0 });
    saveState(file, initial);
    assert.deepEqual(loadState(file, 'different-seed'), initial);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('invalid saved state fails instead of silently resetting a contest', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gba-contest-'));
  const file = join(dir, 'state.json');
  try {
    writeFileSync(file, '{"seed":"old"}');
    assert.throws(() => loadState(file, 'new'), /unexpected format/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
