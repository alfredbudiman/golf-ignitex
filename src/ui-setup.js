import { newId } from './state.js';
import { validateSetup } from './state.js';

export function renderSetup(state) {
  const parTotal = state.course.holes.reduce((s, h) => s + h.par, 0);
  const out = state.course.holes.slice(0, 9).reduce((s, h) => s + h.par, 0);
  const inP = state.course.holes.slice(9).reduce((s, h) => s + h.par, 0);
  const setupValid = validateSetup(state);

  return `
    <section class="card">
      <h2 class="card-title">Course Par</h2>
      <div class="par-grid">
        ${state.course.holes.map((h, i) => `
          <div class="par-cell ${i === 8 ? 'divider-right' : ''}">
            <label>${h.number}</label>
            <input type="number" min="3" max="6" value="${h.par}" data-action="set-par" data-hole="${i}">
          </div>
        `).join('')}
      </div>
      <div class="par-totals">
        <span>OUT <b>${out}</b></span>
        <span>IN <b>${inP}</b></span>
        <span class="${parTotal === 72 ? 'ok' : 'warn'}">TOTAL <b>${parTotal}</b>${parTotal === 72 ? ' ✓' : ' ⚠'}</span>
        <button data-action="load-modern-land">Load Modern Land defaults</button>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Flights (Playing Groups)
        <button class="primary" data-action="add-flight">+ Add Flight</button>
      </h2>
      <div class="flights">
        ${state.flights.map(f => renderFlight(state, f)).join('')}
        ${state.flights.length === 0 ? '<p class="empty">No flights yet. Click "+ Add Flight" to start.</p>' : ''}
      </div>
    </section>

    <section class="card test-panel">
      <h2 class="card-title">Test & Demo</h2>
      <div class="actions-row">
        <button data-action="demo-tournament">🎲 Generate Demo Tournament</button>
        <button data-action="fill-random-scores" ${state.players.length === 0 ? 'disabled' : ''}>🎲 Fill Random Scores</button>
        <button class="danger" data-action="clear-data">🗑 Clear All Data</button>
      </div>
    </section>

    <div class="bottom-bar">
      <div class="counter">
        Total players: <b>${state.players.length}</b> · Flights: <b>${state.flights.length}</b>
      </div>
      <div>
        ${!setupValid.valid ? `<span class="warn">${setupValid.errors[0]}</span>` : ''}
        <button class="primary" data-action="start-tournament" ${!setupValid.valid ? 'disabled' : ''}>Start Tournament →</button>
      </div>
    </div>
  `;
}

function renderFlight(state, flight) {
  const players = flight.playerIds.map(id => state.players.find(p => p.id === id)).filter(Boolean);
  return `
    <div class="flight" data-flight-id="${flight.id}">
      <div class="flight-header">
        <input class="flight-name" type="text" value="${flight.name}" data-action="rename-flight" data-flight-id="${flight.id}">
        <input class="flight-time" type="time" value="${flight.teeTime || ''}" data-action="set-tee-time" data-flight-id="${flight.id}">
        <button class="danger" data-action="remove-flight" data-flight-id="${flight.id}">Remove</button>
      </div>
      <ul class="player-list">
        ${players.map(p => `
          <li>
            <input type="text" value="${p.name}" data-action="rename-player" data-player-id="${p.id}">
            <button class="danger" data-action="remove-player" data-player-id="${p.id}">×</button>
          </li>
        `).join('')}
      </ul>
      ${flight.playerIds.length < 5 ? `
        <div class="add-player">
          <input type="text" placeholder="Add player name and press Enter" data-action="add-player-input" data-flight-id="${flight.id}">
        </div>
      ` : '<div class="full-warn">Max 5 players per flight</div>'}
    </div>
  `;
}
