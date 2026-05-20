import { loadState, saveState, clearState, newId, MODERN_LAND_PARS, validateInput } from './state.js';
import { generateDemoTournament, fillRandomScores } from './demo.js';
import { parseScoreInput, formatOver, overColor } from './format.js';
import { capScore, pickPeoriaHoles, computePlayerResult, splitFlights } from './peoria.js';
import { render } from './render.js';
import { playRevealAnimation } from './ui-awards.js';
import { playPeoriaSpinner } from './ui-peoria-spin.js';
import { generateSnapshotHtml, downloadSnapshot } from './snapshot.js';

let state = loadState();

function update(fn) {
  fn(state);
  saveState(state);
  render(state);
}

function formatSumLocal(stroke, par) {
  if (stroke === 0) return '—';
  const o = stroke - par;
  return `${stroke} (${formatOver(o)})`;
}

function updateRowTotals(playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return;
  const cell = document.querySelector(`[data-action="set-score"][data-player-id="${playerId}"]`);
  if (!cell) return;
  const row = cell.closest('tr');
  if (!row) return;

  let out = 0, inSum = 0;
  for (let i = 0; i < 9; i++)  if (player.scores[i] != null) out += player.scores[i];
  for (let i = 9; i < 18; i++) if (player.scores[i] != null) inSum += player.scores[i];
  const tot = out + inSum;

  const sums = row.querySelectorAll('.sum');
  if (sums.length >= 3) {
    sums[0].textContent = formatSumLocal(out, 36);
    sums[1].textContent = formatSumLocal(inSum, 36);
    sums[2].textContent = formatSumLocal(tot, 72);
  }
}

function updateInputProgress() {
  const totalPlayers = state.players.length;
  if (totalPlayers === 0) return;
  const completePlayers = state.players.filter(p => p.dnf || p.scores.every(s => s !== null && s !== undefined)).length;

  const fill = document.querySelector('.progress-fill');
  if (fill) fill.style.width = `${(completePlayers / totalPlayers) * 100}%`;
  const text = document.querySelector('.input-progress > span');
  if (text) text.textContent = `${completePlayers}/${totalPlayers} players complete`;

  state.flights.forEach(f => {
    const complete = f.playerIds.every(pid => {
      const p = state.players.find(p => p.id === pid);
      return p?.dnf || p?.scores.every(s => s !== null && s !== undefined);
    });
    const pill = document.querySelector(`.flight-pill[data-flight-id="${f.id}"]`);
    if (pill) pill.textContent = `${complete ? '✓ ' : ''}${f.name}`;
  });
}

function computeFlightStandings(flights, perPlayer) {
  return flights.map(f => {
    const members = perPlayer.filter(r => f.playerIds.includes(r.playerId));
    if (members.length === 0) return { flightId: f.id, name: f.name, avgNet: 0, totalNet: 0, memberCount: 0 };
    const totalNet = members.reduce((s, m) => s + m.net, 0);
    return { flightId: f.id, name: f.name, totalNet, memberCount: members.length, avgNet: totalNet / members.length };
  }).sort((a, b) => {
    // Empty flights last (so the avg-net=0 case doesn't claim the win)
    if (a.memberCount === 0) return 1;
    if (b.memberCount === 0) return -1;
    return a.avgNet - b.avgNet;
  });
}

function replace(newState) {
  state = newState;
  saveState(state);
  render(state);
}

function handleAction(action, el, e) {
  switch (action) {
    case 'switch-tab':
      update(s => { s.ui.activeTab = el.dataset.tab; });
      break;
    case 'toggle-display':
      update(s => { s.ui.displayMode = !s.ui.displayMode; });
      document.body.dataset.displayMode = String(state.ui.displayMode);
      break;
    case 'set-par': {
      const i = parseInt(el.dataset.hole, 10);
      const v = parseInt(el.value, 10);
      if (Number.isInteger(v) && v >= 3 && v <= 6) update(s => { s.course.holes[i].par = v; });
      break;
    }
    case 'load-modern-land':
      update(s => { s.course.holes.forEach((h, i) => h.par = MODERN_LAND_PARS[i]); });
      break;
    case 'add-flight':
      update(s => {
        const n = s.flights.length + 1;
        s.flights.push({ id: newId('f'), name: `Flight ${n}`, teeTime: '', playerIds: [] });
      });
      break;
    case 'remove-flight': {
      const fid = el.dataset.flightId;
      update(s => {
        const flight = s.flights.find(f => f.id === fid);
        if (flight) s.players = s.players.filter(p => !flight.playerIds.includes(p.id));
        s.flights = s.flights.filter(f => f.id !== fid);
      });
      break;
    }
    case 'rename-flight':
      update(s => { const f = s.flights.find(f => f.id === el.dataset.flightId); if (f) f.name = el.value; });
      break;
    case 'set-tee-time':
      update(s => { const f = s.flights.find(f => f.id === el.dataset.flightId); if (f) f.teeTime = el.value; });
      break;
    case 'rename-player':
      update(s => { const p = s.players.find(p => p.id === el.dataset.playerId); if (p) p.name = el.value; });
      break;
    case 'remove-player': {
      const pid = el.dataset.playerId;
      update(s => {
        s.players = s.players.filter(p => p.id !== pid);
        for (const f of s.flights) f.playerIds = f.playerIds.filter(id => id !== pid);
      });
      break;
    }
    case 'toggle-dnf': {
      const pid = el.dataset.playerId;
      update(s => { const p = s.players.find(p => p.id === pid); if (p) p.dnf = !p.dnf; });
      break;
    }
    case 'demo-tournament':
      if (confirm('Replace current data with demo tournament?')) replace(generateDemoTournament());
      break;
    case 'fill-random-scores':
      if (confirm('Fill empty cells with random scores?')) replace(fillRandomScores(state));
      break;
    case 'clear-data':
      if (confirm('Erase ALL data? This cannot be undone.')) {
        clearState();
        state = loadState();
        render(state);
      }
      break;
    case 'start-tournament':
      update(s => { s.tournament.status = 'input'; s.ui.activeTab = 'input'; s.ui.activeInputFlight = s.flights[0]?.id || null; });
      break;
    case 'select-input-flight':
      update(s => { s.ui.activeInputFlight = el.dataset.flightId; });
      break;
    case 'edit-setup':
      update(s => { s.ui.activeTab = 'setup'; s.tournament.status = 'setup'; });
      break;
    case 'set-score': {
      const pid = el.dataset.playerId;
      const hole = parseInt(el.dataset.hole, 10);
      const over = parseScoreInput(el.value);
      const player = state.players.find(p => p.id === pid);
      if (!player) break;

      let stroke = null;
      if (over !== null) {
        const par = state.course.holes[hole].par;
        stroke = capScore(par, Math.max(1, par + over));
      }
      player.scores[hole] = stroke;
      saveState(state);

      // Targeted DOM update — no full re-render, so user keeps focus where they click
      if (stroke !== null) {
        const par = state.course.holes[hole].par;
        const newOver = stroke - par;
        el.className = `score-cell ${overColor(newOver)}`;
        el.value = formatOver(newOver);
      } else {
        el.className = 'score-cell';
        el.value = '';
      }
      updateRowTotals(pid);
      updateInputProgress();
      break;
    }
    case 'finalize-scoring': {
      const v = validateInput(state);
      if (!v.valid) {
        const missing = Object.entries(v.emptyCellsBy).map(([pid, holes]) => {
          const p = state.players.find(x => x.id === pid);
          return `${p?.name || pid} (missing holes: ${holes.map(h => h + 1).join(',')})`;
        });
        alert(
          `Cannot finalize — incomplete scores:\n\n${missing.join('\n')}\n\n` +
          `To skip a no-show player: go to Setup → Edit and remove them.`
        );
        return;
      }
      if (!confirm('Lock all scoring? You can still unlock from Leaderboard.')) return;
      update(s => { s.tournament.status = 'locked'; s.ui.activeTab = 'leaderboard'; });
      break;
    }
    case 'randomize-peoria': {
      const peoriaHoles = pickPeoriaHoles(state.course.holes, Math.random);
      // Slot-machine reveal of the 6 holes, then compute & jump to Awards.
      playPeoriaSpinner(state, peoriaHoles, () => {
        update(s => {
          s.peoriaHoles = peoriaHoles;
          // DNF players are excluded from all scoring, prizes, and flight standings.
          const perPlayer = s.players.filter(p => !p.dnf).map(p => {
            const r = computePlayerResult(p, s.course.holes, s.peoriaHoles);
            return { playerId: p.id, name: p.name, ...r };
          });
          const flightSplit = splitFlights(perPlayer);
          const flightStandings = computeFlightStandings(s.flights, perPlayer);
          s.results = { perPlayer, ...flightSplit, flightStandings };
          s.tournament.status = 'finalized';
          s.ui.revealedAwards = [];
          s.ui.activeTab = 'awards';
        });
      });
      break;
    }
    case 'unlock-scoring':
      if (!confirm('Unlock scoring? Peoria holes and results will be cleared.')) return;
      update(s => {
        s.tournament.status = 'input';
        s.peoriaHoles = null;
        s.results = null;
        s.ui.activeTab = 'input';
        s.ui.revealedAwards = [];
      });
      break;
    case 'goto-awards':
      update(s => { s.ui.activeTab = 'awards'; });
      break;
    case 'goto-leaderboard-peoria':
      update(s => { s.ui.activeTab = 'leaderboard'; });
      setTimeout(() => {
        const target = document.querySelector('.peoria-verify-card');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      break;
    case 'reveal-next': {
      const key = el.dataset.key;
      playRevealAnimation(state, key, () => {
        update(s => { s.ui.revealedAwards = [...(s.ui.revealedAwards || []), key]; });
      });
      break;
    }
    case 'replay-reveal': {
      playRevealAnimation(state, el.dataset.key, () => {});
      break;
    }
    case 'replay-awards':
      update(s => { s.ui.revealedAwards = []; });
      break;
    case 'save-snapshot': {
      generateSnapshotHtml(state).then(html => downloadSnapshot(state, html));
      break;
    }
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.ui.displayMode) {
    update(s => { s.ui.displayMode = false; });
    document.body.dataset.displayMode = 'false';
    return;
  }
  if (e.key !== 'Enter') return;
  const t = e.target;
  // Enter on score cell: commit + advance to next cell in DOM order
  if (t.dataset.action === 'set-score') {
    e.preventDefault();
    t.blur();  // triggers set-score handler to save state
    const all = Array.from(document.querySelectorAll('[data-action="set-score"]'));
    const idx = all.indexOf(t);
    if (idx >= 0 && idx + 1 < all.length) {
      setTimeout(() => all[idx + 1].focus(), 0);
    }
    return;
  }
  if (t.dataset.action === 'add-player-input') {
    const fid = t.dataset.flightId;
    const name = t.value.trim();
    if (!name) return;
    update(s => {
      const flight = s.flights.find(f => f.id === fid);
      if (!flight || flight.playerIds.length >= 5) return;
      const id = newId('p');
      s.players.push({ id, name, scores: Array(18).fill(null) });
      flight.playerIds.push(id);
    });
  }
});

document.addEventListener('blur', (e) => {
  const action = e.target.dataset?.action;
  if (['rename-flight','rename-player','set-tee-time','set-par','set-score'].includes(action)) {
    handleAction(action, e.target, e);
  }
}, true);

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) { handleAction('switch-tab', tabBtn, e); return; }
  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn && !['rename-flight','rename-player','set-tee-time','set-par','add-player-input','set-score'].includes(actionBtn.dataset.action)) {
    handleAction(actionBtn.dataset.action, actionBtn, e);
  }
});

document.body.dataset.displayMode = String(state.ui.displayMode);
render(state);

window.__state = () => state;
window.__clear = () => { clearState(); state = loadState(); render(state); };
