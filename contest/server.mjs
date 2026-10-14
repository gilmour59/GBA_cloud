import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { fixture } from './server/data.mjs';
import { loadState, saveState } from './server/state.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || (process.env.RAILWAY_ENVIRONMENT ? '0.0.0.0' : '127.0.0.1');
const pin = process.env.PRESENTER_PIN || process.env.INSTRUCTOR_PIN || String(randomBytes(4).readUInt32BE() % 900000 + 100000);
const stateFile = process.env.STATE_FILE;
if (process.env.RAILWAY_ENVIRONMENT && !stateFile) throw new Error('Set STATE_FILE to a mounted Railway volume path before deploying.');
const saved = loadState(stateFile, process.env.CONTEST_SEED || randomBytes(8).toString('hex'));
const seed = saved.seed;
const sessions = new Map(saved.sessions);
const entries = saved.entries;
const failedPins = new Map();
let contest = saved.contest;

function persist() {
  saveState(stateFile, { seed, sessions: [...sessions], entries, contest });
}
persist();

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(value));
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16000) throw new Error('Request is too large.');
  }
  return JSON.parse(raw || '{}');
}

function status() {
  const now = Date.now();
  const active = Boolean(contest.startsAt && !contest.closed && now >= contest.startsAt && now < contest.endsAt);
  return { active, started: Boolean(contest.startsAt), closed: contest.closed || Boolean(contest.endsAt && now >= contest.endsAt), secondsLeft: active ? Math.max(0, Math.ceil((contest.endsAt - now) / 1000)) : 0, startsAt: contest.startsAt, endsAt: contest.endsAt };
}

function checkPin(candidate) {
  const a = Buffer.from(String(candidate ?? ''));
  const b = Buffer.from(pin);
  return a.length === b.length && timingSafeEqual(a, b);
}

function presenterAllowed(req, candidate) {
  const key = req.socket.remoteAddress || 'unknown';
  const failed = (failedPins.get(key) || []).filter(at => Date.now() - at < 10 * 60 * 1000);
  if (failed.length >= 5) throw new Error('Too many PIN attempts. Try again later.');
  if (!checkPin(candidate)) { failed.push(Date.now()); failedPins.set(key, failed); return false; }
  failedPins.delete(key);
  return true;
}

function verifyInWorker(payload) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./server/verify-worker.mjs', import.meta.url), { workerData: payload, resourceLimits: { maxOldGenerationSizeMb: 64 } });
    const timer = setTimeout(() => { worker.terminate(); reject(new Error('Query took too long. Simplify it and try again.')); }, 3000);
    worker.once('message', message => { clearTimeout(timer); worker.terminate(); message.ok ? resolve(message.result) : reject(new Error(message.error)); });
    worker.once('error', error => { clearTimeout(timer); reject(error); });
    worker.once('exit', code => { if (code !== 0) { clearTimeout(timer); reject(new Error('Verification stopped unexpectedly.')); } });
  });
}

function ranking() {
  const perfect = entries.filter(row => row.score === 100).sort((a, b) => a.at - b.at || a.order - b.order);
  const byParticipant = new Map();
  for (const row of entries) {
    const previous = byParticipant.get(row.token);
    if (!previous || row.score > previous.score || (row.score === previous.score && row.at < previous.at)) byParticipant.set(row.token, row);
  }
  const best = [...byParticipant.values()].sort((a, b) => b.score - a.score || a.at - b.at || a.order - b.order);
  const winner = perfect[0] ?? best[0] ?? null;
  return { winner: winner ? { name: winner.name, score: winner.score, at: winner.at } : null, entries: best.map(({ name, score, at }) => ({ name, score, at })) };
}

const assets = new Map([
  ['/', ['public/student.html', 'text/html; charset=utf-8']],
  ['/presenter', ['public/index.html', 'text/html; charset=utf-8']],
  ['/presenter/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/instructor', ['public/index.html', 'text/html; charset=utf-8']],
  ['/instructor/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['public/app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['public/style.css', 'text/css; charset=utf-8']],
  ['/vendor/sql-wasm.js', ['node_modules/sql.js/dist/sql-wasm.js', 'text/javascript; charset=utf-8']],
  ['/vendor/sql-wasm.wasm', ['node_modules/sql.js/dist/sql-wasm.wasm', 'application/wasm']]
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    if (req.method === 'GET' && assets.has(path)) {
      const [relative, type] = assets.get(path);
      const data = await readFile(join(root, relative));
      res.writeHead(200, { 'content-type': type, 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'" });
      res.end(data);
      return;
    }
    if (req.method === 'GET' && path === '/api/status') return json(res, 200, status());
    if (req.method === 'GET' && path === '/api/demo') return json(res, 200, { rows: fixture('rice', seed) });
    if (req.method === 'GET' && path === '/api/session') {
      const token = url.searchParams.get('token');
      const session = sessions.get(token);
      if (!session) return json(res, 404, { error: 'Session expired. Join again if the contest is active.' });
      return json(res, 200, { token, name: session.name, rows: fixture('cacao', seed), status: status() });
    }
    if (req.method === 'POST' && path === '/api/session') {
      const input = await body(req);
      if (!status().active) return json(res, 403, { error: 'Wait for the presenter to start the contest.' });
      const name = String(input.name || '').trim().replace(/[<>]/g, '').slice(0, 24);
      if (!name) return json(res, 400, { error: 'Enter a display name to join.' });
      if ([...sessions.values()].some(session => session.name.toLowerCase() === name.toLowerCase())) return json(res, 409, { error: 'That display name is in use. Choose another.' });
      const token = randomUUID();
      sessions.set(token, { name, joinedAt: Date.now() });
      persist();
      return json(res, 200, { token, rows: fixture('cacao', seed), status: status() });
    }
    if (req.method === 'POST' && path === '/api/verify') {
      const input = await body(req);
      const mode = input.mode === 'rice' ? 'rice' : 'cacao';
      const receivedAt = Date.now();
      if (mode === 'cacao' && (!status().active || !sessions.has(input.token))) return json(res, 403, { error: 'Join an active contest before verifying.' });
      const result = await verifyInWorker({ mode, silverSql: input.silverSql, goldSql: input.goldSql, seed });
      if (mode === 'cacao' && receivedAt < contest.endsAt && !contest.closed) {
        const session = sessions.get(input.token);
        entries.push({ token: input.token, name: session.name, score: result.score, at: receivedAt, order: entries.length });
        persist();
      }
      return json(res, 200, result);
    }
    if (req.method === 'POST' && path === '/api/check-stage') {
      const input = await body(req);
      const mode = input.mode === 'rice' ? 'rice' : 'cacao';
      const stage = input.stage;
      if (stage !== 'silver' && stage !== 'gold') return json(res, 400, { error: 'Choose Silver or Gold to check.' });
      if (mode === 'cacao' && (!status().active || !sessions.has(input.token))) return json(res, 403, { error: 'Join an active contest before checking accuracy.' });
      const result = await verifyInWorker({ mode, stage, silverSql: input.silverSql, goldSql: input.goldSql, seed });
      return json(res, 200, result);
    }
    if (req.method === 'POST' && (path === '/api/presenter/start' || path === '/api/instructor/start')) {
      const input = await body(req);
      if (!presenterAllowed(req, input.pin)) return json(res, 403, { error: 'Incorrect presenter PIN.' });
      sessions.clear(); entries.length = 0;
      contest = { startsAt: Date.now(), endsAt: Date.now() + 15 * 60 * 1000, closed: false };
      persist();
      return json(res, 200, status());
    }
    if (req.method === 'POST' && (path === '/api/presenter/stop' || path === '/api/instructor/stop')) {
      const input = await body(req);
      if (!presenterAllowed(req, input.pin)) return json(res, 403, { error: 'Incorrect presenter PIN.' });
      contest.closed = true;
      persist();
      return json(res, 200, { ...status(), ...ranking() });
    }
    if (req.method === 'GET' && path === '/api/results') {
      if (!status().closed) return json(res, 403, { error: 'Results are available after the contest closes.' });
      return json(res, 200, ranking());
    }
    json(res, 404, { error: 'Not found.' });
  } catch (error) { json(res, 400, { error: error.message }); }
});

server.listen(port, host, () => {
  console.log(`Classroom contest: http://${host}:${port}`);
  console.log(process.env.PRESENTER_PIN || process.env.INSTRUCTOR_PIN ? 'Presenter PIN loaded from the environment.' : `Presenter PIN: ${pin}`);
});
