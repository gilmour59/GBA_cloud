const statusElement = document.getElementById('monitorStatus');
const rowsElement = document.getElementById('monitorRows');
let loading = false;

async function refreshMonitor() {
  if (loading) return;
  loading = true;
  let pin;
  try { pin = window.opener?.document.getElementById('pin')?.value; } catch { /* Opened outside the presenter page. */ }
  if (!pin) {
    statusElement.textContent = 'Open this window from the presenter page after entering your PIN.';
    statusElement.className = 'stage-check needs-work';
    rowsElement.replaceChildren();
    loading = false;
    return;
  }
  try {
    const response = await fetch('/api/presenter/monitor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load live progress.');
    rowsElement.replaceChildren();
    for (const participant of data.participants) {
      const row = rowsElement.insertRow();
      for (const value of [participant.name, participant.silver, participant.gold, participant.bestScore == null ? '—' : `${participant.bestScore}%`, participant.verifications]) {
        row.insertCell().textContent = String(value);
      }
    }
    if (!data.participants.length) rowsElement.insertRow().insertCell().textContent = 'No participants yet.';
    statusElement.textContent = `${data.participants.length} participant${data.participants.length === 1 ? '' : 's'} · Updated ${new Date().toLocaleTimeString()}`;
    statusElement.className = 'stage-check correct';
  } catch (error) {
    statusElement.textContent = error.message;
    statusElement.className = 'stage-check needs-work';
    rowsElement.replaceChildren();
  } finally { loading = false; }
}

refreshMonitor();
setInterval(refreshMonitor, 3000);
