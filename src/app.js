import { loadState, saveState, clearState, newId, MODERN_LAND_PARS, validateInput } from './state.js';
import { generateDemoTournament, fillRandomScores } from './demo.js';
import { parseScoreInput } from './format.js';
import { capScore, pickPeoriaHoles, computePlayerResult, splitFlights } from './peoria.js';
import { render } from './render.js';
import { playRevealAnimation } from './ui-awards.js';
import { generateSnapshotHtml, downloadSnapshot } from './snapshot.js';

let state = loadState();

function update(fn) {
  fn(state);
  saveState(state);
  render(state);
}

function computeFlightStandings(flights, perPlayer) {
  return flights.map(f => {
    const members = perPlayer.filter(r => f.playerIds.includes(r.playerId));
    if (members.length === 0) return { flightId: f.id, name: f.name, avgNet: 0, totalNet: 0, memberCount: 0 };
    const totalNet = members.reduce((s, m) => s + m.net, 0);
    return { flightId: f.id, name: f.name, totalNet, memberCount: members.length, avgNet: totalNet / members.length };
  }).sort((a, b) => a.avgNet - b.avgNet);
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
      // capture position in input order BEFORE re-render
      const allBefore = Array.from(document.querySelectorAll('[data-action="set-score"]'));
      const currentIdx = allBefore.indexOf(el);

      update(s => {
        const player = s.players.find(p => p.id === pid);
        if (!player) return;
        if (over === null) { player.scores[hole] = null; return; }
        const par = s.course.holes[hole].par;
        const stroke = capScore(par, Math.max(1, par + over));
        player.scores[hole] = stroke;
      });

      // After re-render, find the next cell by position in fresh DOM
      setTimeout(() => {
        const allAfter = Array.from(document.querySelectorAll('[data-action="set-score"]'));
        if (currentIdx >= 0 && currentIdx + 1 < allAfter.length) {
          allAfter[currentIdx + 1].focus();
        }
      }, 0);
      break;
    }
    case 'finalize-scoring': {
      const v = validateInput(state);
      if (!v.valid) {
        const firstPid = Object.keys(v.emptyCellsBy)[0];
        const firstHole = v.emptyCellsBy[firstPid][0];
        alert(`Cannot finalize: ${v.errors.join('; ')}\n\nFirst missing: player ${firstPid} hole ${firstHole + 1}`);
        return;
      }
      if (!confirm('Lock all scoring? You can still unlock from Leaderboard.')) return;
      update(s => { s.tournament.status = 'locked'; s.ui.activeTab = 'leaderboard'; });
      break;
    }
    case 'randomize-peoria': {
      update(s => {
        s.peoriaHoles = pickPeoriaHoles(s.course.holes, Math.random);
        const perPlayer = s.players.map(p => {
          const r = computePlayerResult(p, s.course.holes, s.peoriaHoles);
          return { playerId: p.id, name: p.name, ...r };
        });
        const flightSplit = splitFlights(perPlayer);
        const flightStandings = computeFlightStandings(s.flights, perPlayer);
        s.results = { perPlayer, ...flightSplit, flightStandings };
        s.tournament.status = 'finalized';
        s.ui.revealedAwards = [];
        s.ui.activeTab = 'leaderboard';
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
  if (e.key !== 'Enter') return;
  const t = e.target;
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
