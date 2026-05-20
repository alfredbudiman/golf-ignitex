import { formatOver, overColor, parseScoreInput } from './format.js';
import { capScore } from './peoria.js';
import { validateInput } from './state.js';

export function renderInput(state) {
  if (state.flights.length === 0) return '<p>No flights — go back to Setup.</p>';

  let activeFlightId = state.ui.activeInputFlight;
  if (!state.flights.find(f => f.id === activeFlightId)) activeFlightId = state.flights[0].id;
  const activeFlight = state.flights.find(f => f.id === activeFlightId);

  const totalPlayers = state.players.length;
  const completePlayers = state.players.filter(p => p.dnf || p.scores.every(s => s !== null && s !== undefined)).length;

  return `
    <div class="input-progress">
      <div class="progress-bar"><div class="progress-fill" style="width:${(completePlayers/totalPlayers)*100}%"></div></div>
      <span>${completePlayers}/${totalPlayers} players complete</span>
    </div>

    <div class="flight-pills">
      ${state.flights.map(f => {
        const complete = f.playerIds.every(pid => {
          const p = state.players.find(p => p.id === pid);
          return p?.dnf || p?.scores.every(s => s !== null && s !== undefined);
        });
        const isActive = f.id === activeFlightId;
        return `<button class="flight-pill" data-action="select-input-flight" data-flight-id="${f.id}" data-active="${isActive}">
          ${complete ? '✓ ' : ''}${f.name}
        </button>`;
      }).join('')}
    </div>

    <section class="card">
      <div class="flight-header-row">
        <h2 class="card-title">${activeFlight.name}${activeFlight.teeTime ? ` · ${activeFlight.teeTime}` : ''}</h2>
      </div>
      ${renderScoreGrid(state, activeFlight)}
    </section>

    <div class="bottom-bar">
      <button data-action="edit-setup">⚠ Edit Setup</button>
      <button class="primary" data-action="finalize-scoring">🔒 Finalize Scoring</button>
    </div>
  `;
}

function renderScoreGrid(state, flight) {
  const players = flight.playerIds.map(id => state.players.find(p => p.id === id)).filter(Boolean);
  const holes = state.course.holes;

  return `
    <table class="score-grid">
      <thead>
        <tr>
          <th class="player-col">Hole</th>
          ${holes.map((h, i) => `<th class="${i === 8 ? 'divider-right' : ''}${i === 9 ? 'divider-left' : ''}">${h.number}</th>`).join('')}
          <th>OUT</th>
          <th>IN</th>
          <th>TOT</th>
        </tr>
        <tr class="par-row">
          <th>Par</th>
          ${holes.map((h, i) => `<th class="${i === 8 ? 'divider-right' : ''}${i === 9 ? 'divider-left' : ''}">${h.par}</th>`).join('')}
          <th>36</th><th>36</th><th>72</th>
        </tr>
      </thead>
      <tbody>
        ${players.map(p => renderPlayerRow(p, holes)).join('')}
      </tbody>
    </table>
  `;
}

function renderPlayerRow(player, holes) {
  const cells = player.scores.map((stroke, i) => {
    const par = holes[i].par;
    const over = stroke != null ? stroke - par : null;
    const cls = over != null ? `score-cell ${overColor(over)}` : 'score-cell';
    const display = stroke != null ? formatOver(over) : '';
    const divider = i === 8 ? ' divider-right' : (i === 9 ? ' divider-left' : '');
    return `<td class="${divider}"><input class="${cls}" type="text" data-action="set-score" data-player-id="${player.id}" data-hole="${i}" value="${display}"></td>`;
  });
  const out = sumRange(player.scores, holes, 0, 9);
  const inSum = sumRange(player.scores, holes, 9, 18);
  const tot = out + inSum;
  const dnf = !!player.dnf;
  return `
    <tr class="${dnf ? 'player-dnf' : ''}">
      <th class="player-col">
        <span class="player-name">${player.name}</span>
        ${dnf ? '<span class="dnf-badge">DNF</span>' : ''}
        <button class="dnf-toggle ${dnf ? 'is-dnf' : ''}" data-action="toggle-dnf" data-player-id="${player.id}" title="DNF tidak dihitung dalam skor, hadiah, atau best flight">${dnf ? '↩ Undo DNF' : 'Mark DNF'}</button>
      </th>
      ${cells.join('')}
      <td class="sum">${formatSum(out, 36)}</td>
      <td class="sum">${formatSum(inSum, 36)}</td>
      <td class="sum total">${formatSum(tot, 72)}</td>
    </tr>
  `;
}

function sumRange(scores, holes, start, end) {
  let s = 0;
  for (let i = start; i < end; i++) {
    if (scores[i] != null) s += scores[i];
  }
  return s;
}

function formatSum(stroke, par) {
  if (stroke === 0) return '—';
  const over = stroke - par;
  return `${stroke} (${formatOver(over)})`;
}
