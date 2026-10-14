const $ = id => document.getElementById(id);
const state = { mode: 'rice', rows: [], cacaoRows: [], token: null, sessionStart: null, sql: null, lastRun: null, contest: null };
try {
  const saved = JSON.parse(sessionStorage.getItem('gba-contest-session') || 'null');
  if (saved?.token && saved?.start) { state.token = saved.token; state.sessionStart = saved.start; }
} catch { sessionStorage.removeItem('gba-contest-session'); }

const goldCorrect = `SELECT
  location,
  ROUND(SUM(production_mt), 2) AS total_production_mt,
  ROUND(SUM(harvested_area_ha), 2) AS total_area_ha,
  ROUND(SUM(production_mt) / SUM(harvested_area_ha), 2) AS yield_mt_ha
FROM silver
GROUP BY location
ORDER BY location`;

function silverQuery(crop, places) {
  return `WITH ranked AS (
  SELECT row_uid, record_id, TRIM(location) AS location,
    UPPER(TRIM(commodity)) AS commodity,
    harvested_area_ha, production_mt, year,
    ROW_NUMBER() OVER (PARTITION BY record_id ORDER BY row_uid) AS rn
  FROM bronze
)
SELECT row_uid, record_id, location, commodity,
  CAST(harvested_area_ha AS REAL) AS harvested_area_ha,
  CAST(production_mt AS REAL) AS production_mt, year
FROM ranked
WHERE location IN (${places.map(p => `'${p}'`).join(', ')})
  AND commodity = '${crop}'
  AND CAST(harvested_area_ha AS REAL) > 0
  AND CAST(production_mt AS REAL) >= 0`;
}

const riceCorrection = `${silverQuery('RICE', ['Pinefield', 'Riverbend', 'Hillcrest', 'Lakeside'])}
  AND TRIM(production_mt) <> ''
  AND TRIM(production_mt) NOT GLOB '*[^0-9.]*'
  AND rn = 1`;

const starters = {
  rice: {
    silver: silverQuery('RICE', ['Pinefield', 'Riverbend', 'Hillcrest', 'Lakeside']),
    gold: goldCorrect
  },
  cacao: {
    silver: silverQuery('CACAO', ['Cedarvale', 'Brookhaven', 'Sunridge', 'Mossfield']),
    gold: goldCorrect.replace('SUM(production_mt) / SUM(harvested_area_ha)', 'AVG(production_mt / harvested_area_ha)')
  }
};

function notice(message, error = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('error', error);
}

async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function post(path, value) {
  return api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) });
}

function table(tableElement, rows, limit = 10) {
  tableElement.replaceChildren();
  if (!rows.length) return;
  const names = Object.keys(rows[0]);
  const head = tableElement.createTHead().insertRow();
  for (const name of names) { const cell = document.createElement('th'); cell.textContent = name.replaceAll('_', ' '); head.append(cell); }
  const body = tableElement.createTBody();
  for (const row of rows.slice(0, limit)) {
    const tr = body.insertRow();
    for (const name of names) tr.insertCell().textContent = row[name] == null ? 'NULL' : String(row[name]);
  }
}

function drawChart(gold) {
  const chart = $('chart');
  chart.replaceChildren();
  chart.classList.toggle('empty', !gold.length);
  if (!gold.length) { chart.textContent = 'No Gold rows to chart.'; $('yieldNote').textContent = ''; return; }
  const sorted = [...gold].sort((a, b) => Number(b.total_production_mt) - Number(a.total_production_mt));
  const max = Math.max(1, ...sorted.map(row => Number(row.total_production_mt) || 0));
  for (const item of sorted) {
    const row = document.createElement('div'); row.className = 'bar-row';
    const label = document.createElement('span'); label.textContent = item.location;
    const track = document.createElement('div'); track.className = 'bar-track';
    const fill = document.createElement('div'); fill.className = 'bar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, Number(item.total_production_mt) / max * 100))}%`;
    track.append(fill);
    const value = document.createElement('span'); value.className = 'bar-value'; value.textContent = Number(item.total_production_mt).toFixed(1);
    row.append(label, track, value); chart.append(row);
  }
  $('yieldNote').textContent = `Top place: ${sorted[0].location} · ${Number(sorted[0].yield_mt_ha).toFixed(2)} metric tons per hectare`;
}

function safeSelect(sql) {
  if (typeof sql !== 'string' || sql.length < 10 || sql.length > 5000) throw new Error('Enter a SELECT query under 5,000 characters.');
  const cleaned = sql.trim().replace(/;\s*$/, '');
  if (!/^(SELECT|WITH)\b/i.test(cleaned) || /;/.test(cleaned) || /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|REPLACE|VACUUM|LOAD_EXTENSION)\b/i.test(cleaned)) throw new Error('Use one read-only SELECT query per editor.');
  return cleaned;
}

function rowsFrom(db, sql) {
  const stmt = db.prepare(safeSelect(sql));
  try {
    const names = stmt.getColumnNames();
    const rows = [];
    while (stmt.step()) { rows.push(stmt.getAsObject()); if (rows.length > 500) throw new Error('Query returned too many rows.'); }
    if (!names.length) throw new Error('The query must return columns.');
    return rows;
  } finally { stmt.free(); }
}

function runLocal() {
  if (!state.rows.length) throw new Error('Join the contest to load Cacao data.');
  const db = new state.sql.Database();
  try {
    db.run('CREATE TABLE bronze (row_uid INTEGER, record_id TEXT, location TEXT, commodity TEXT, harvested_area_ha TEXT, production_mt TEXT, year INTEGER)');
    const insert = db.prepare('INSERT INTO bronze VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of state.rows) insert.run([row.row_uid, row.record_id, row.location, row.commodity, row.harvested_area_ha, row.production_mt, row.year]);
    insert.free();
    const silver = rowsFrom(db, $('silverSql').value);
    const required = ['row_uid', 'record_id', 'location', 'commodity', 'harvested_area_ha', 'production_mt', 'year'];
    if (silver.length && required.some(name => !(name in silver[0]))) throw new Error(`Silver must return: ${required.join(', ')}.`);
    db.run('CREATE TABLE silver (row_uid INTEGER, record_id TEXT, location TEXT, commodity TEXT, harvested_area_ha REAL, production_mt REAL, year INTEGER)');
    const add = db.prepare('INSERT INTO silver VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of silver) add.run(required.map(name => row[name]));
    add.free();
    const gold = rowsFrom(db, $('goldSql').value);
    const goldFields = ['location', 'total_production_mt', 'total_area_ha', 'yield_mt_ha'];
    if (gold.length && goldFields.some(name => !(name in gold[0]))) throw new Error(`Gold must return: ${goldFields.join(', ')}.`);
    state.lastRun = { silver, gold, silverSql: $('silverSql').value, goldSql: $('goldSql').value };
    const selectedIds = new Set(silver.map(row => Number(row.row_uid)));
    const quarantine = state.rows.filter(row => !selectedIds.has(row.row_uid));
    $('silverCount').textContent = `${silver.length} Silver rows · ${quarantine.length} rows quarantined or excluded`;
    $('runState').textContent = 'Query ran';
    table($('silverTable'), silver, 8);
    table($('quarantineTable'), quarantine, 8);
    table($('goldTable'), gold, 20);
    drawChart(gold);
    $('accuracy').hidden = true;
    notice('Query ran successfully. The dashboard now shows your actual Gold result. Use Verify Accuracy to check it.');
  } finally { db.close(); }
}

async function verify() {
  if (!state.lastRun || state.lastRun.silverSql !== $('silverSql').value || state.lastRun.goldSql !== $('goldSql').value) throw new Error('Run your current SQL before verifying.');
  const result = await post('/api/verify', { mode: state.mode, token: state.token, silverSql: $('silverSql').value, goldSql: $('goldSql').value });
  $('accuracy').hidden = false;
  $('scoreTitle').textContent = `${result.score}% accuracy${result.perfect ? ' · Perfect!' : ''}`;
  $('scoreItems').replaceChildren();
  for (const [name, points] of Object.entries(result.categories)) { const item = document.createElement('span'); item.textContent = `${name}: ${points}`; $('scoreItems').append(item); }
  $('scoreNote').textContent = state.mode === 'rice' ? 'Instructor demo: correct the SQL and compare the dashboard.' : 'This score was calculated by the server from your submitted SQL. Category feedback does not show the hidden Cacao answer.';
  notice(result.perfect ? 'Verified 100% accuracy.' : 'Verification found differences. Review the categories, edit SQL, and run it again.');
}

async function mode(mode) {
  state.mode = mode; state.lastRun = null; state.rows = [];
  $('riceTab').classList.toggle('selected', mode === 'rice');
  $('cacaoTab').classList.toggle('selected', mode === 'cacao');
  $('join').hidden = mode !== 'cacao' || Boolean(state.token);
  $('demoFixButton').hidden = mode !== 'rice';
  $('taskText').textContent = mode === 'rice' ? 'Instructor: run the starter to show a believable wrong chart, verify it, then load the correction and verify again.' : 'Contest: repair the Silver filters and duplicate rule, then correct the Gold yield calculation.';
  $('silverSql').value = starters[mode].silver;
  $('goldSql').value = starters[mode].gold;
  $('accuracy').hidden = true; $('runState').textContent = 'Not run';
  $('silverCount').textContent = 'Run your SQL to see the cleaned rows.';
  $('silverTable').replaceChildren(); $('quarantineTable').replaceChildren(); $('goldTable').replaceChildren(); drawChart([]);
  if (mode === 'rice') {
    const data = await api('/api/demo'); state.rows = data.rows;
    notice('Rice demo loaded. Run the starter SQL to show how valid SQL can produce the wrong answer.');
  } else if (state.token) {
    try {
      if (!state.cacaoRows.length) {
        const data = await api(`/api/session?token=${encodeURIComponent(state.token)}`);
        state.cacaoRows = data.rows; $('name').value = data.name;
      }
      state.rows = state.cacaoRows;
      $('join').hidden = true; notice('Cacao data loaded. The 15-minute timer is controlled by the server.');
    } catch {
      state.token = null; state.cacaoRows = []; sessionStorage.removeItem('gba-contest-session');
      $('join').hidden = false; notice('Your session expired. Join the current contest again.');
    }
  } else notice('The Cacao challenge opens when the instructor starts the contest. Join with a display name.');
  $('rowCount').textContent = state.rows.length ? `${state.rows.length} raw rows` : 'Waiting to join';
  table($('bronzeTable'), state.rows, 12);
}

async function refreshStatus() {
  const result = await api('/api/status'); state.contest = result;
  if (state.token && state.sessionStart !== result.startsAt) {
    state.token = null; state.cacaoRows = []; sessionStorage.removeItem('gba-contest-session');
    if (state.mode === 'cacao') { state.rows = []; $('join').hidden = false; $('rowCount').textContent = 'Waiting to join'; table($('bronzeTable'), [], 12); }
  }
  $('clock').textContent = result.active ? `${String(Math.floor(result.secondsLeft / 60)).padStart(2, '0')}:${String(result.secondsLeft % 60).padStart(2, '0')} left` : result.closed ? 'Contest ended' : state.mode === 'rice' ? 'Demo mode' : 'Waiting for start';
  $('joinButton').disabled = !result.active;
  if (state.mode === 'cacao' && result.closed && !state.rows.length) notice('The contest has ended. Ask the instructor to reveal results.');
}

function showResults(data) {
  const host = $('leaderboard'); host.replaceChildren();
  const title = document.createElement('h3'); title.textContent = data.winner ? `Winner: ${data.winner.name} · ${data.winner.score}%` : 'No verified entries'; host.append(title);
  if (data.entries?.length) table(host.appendChild(document.createElement('table')), data.entries.map(entry => ({ name: entry.name, score: `${entry.score}%`, time: new Date(entry.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })), 100);
}

async function action(callback) { try { await callback(); } catch (error) { notice(error.message, true); } }

async function init() {
  state.sql = await initSqlJs({ locateFile: filename => `/vendor/${filename}` });
  await mode('rice'); await refreshStatus();
  $('riceTab').addEventListener('click', () => action(() => mode('rice')));
  $('cacaoTab').addEventListener('click', () => action(() => mode('cacao')));
  $('joinButton').addEventListener('click', () => action(async () => {
    if (!state.contest?.active) throw new Error('Wait for the instructor to start the contest.');
    const data = await post('/api/session', { name: $('name').value });
    state.token = data.token; state.rows = data.rows; state.cacaoRows = data.rows; state.sessionStart = data.status.startsAt; $('join').hidden = true;
    sessionStorage.setItem('gba-contest-session', JSON.stringify({ token: data.token, start: data.status.startsAt }));
    $('rowCount').textContent = `${data.rows.length} raw rows`; table($('bronzeTable'), data.rows, 12);
    notice('You joined the Cacao contest. Edit the SQL, then Run Query.');
  }));
  $('runButton').addEventListener('click', () => action(() => runLocal()));
  $('verifyButton').addEventListener('click', () => action(() => verify()));
  $('resetButton').addEventListener('click', () => action(() => mode(state.mode)));
  $('demoFixButton').addEventListener('click', () => { $('silverSql').value = riceCorrection; notice('Rice correction loaded. Run Query, then Verify Accuracy.'); });
  $('startButton').addEventListener('click', () => action(async () => { await post('/api/instructor/start', { pin: $('pin').value }); await refreshStatus(); notice('Contest started. Participants can now join.'); }));
  $('stopButton').addEventListener('click', () => action(async () => { const data = await post('/api/instructor/stop', { pin: $('pin').value }); await refreshStatus(); showResults(data); notice('Contest closed. Verified results are below.'); }));
  $('resultsButton').addEventListener('click', () => action(async () => showResults(await api('/api/results'))));
  for (const editor of [$('silverSql'), $('goldSql')]) {
    editor.addEventListener('paste', event => { event.preventDefault(); notice('Paste is disabled in the SQL editor. AI help is welcome; type the changes yourself.'); });
    editor.addEventListener('drop', event => event.preventDefault());
    editor.addEventListener('contextmenu', event => event.preventDefault());
  }
  setInterval(() => refreshStatus().catch(() => {}), 1000);
}

init().catch(error => notice(`Could not start the SQL engine: ${error.message}`, true));
