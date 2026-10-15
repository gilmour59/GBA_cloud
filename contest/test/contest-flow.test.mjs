import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

async function unusedPort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('presenter starts and ends a contest without an automatic deadline', async () => {
  const port = await unusedPort();
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', PRESENTER_PIN: 'test-pin', RAILWAY_ENVIRONMENT: '', STATE_FILE: '' },
    stdio: 'ignore'
  });
  const url = `http://127.0.0.1:${port}`;
  const request = (path, body) => fetch(url + path, body && { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try { await request('/api/status'); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 25)); }
    }
    assert.ok(ready, 'server started');
    assert.equal((await (await request('/api/status')).json()).active, false);
    assert.equal((await request('/api/presenter/start', { pin: 'test-pin' })).status, 200);
    const active = await (await request('/api/status')).json();
    assert.equal(active.active, true);
    assert.equal('endsAt' in active, false);
    assert.equal('secondsLeft' in active, false);
    assert.equal((await request('/api/presenter/start', { pin: 'test-pin' })).status, 409);
    assert.equal((await request('/api/presenter/stop', { pin: 'test-pin' })).status, 200);
    assert.equal((await (await request('/api/status')).json()).closed, true);
  } finally {
    child.kill();
  }
});
