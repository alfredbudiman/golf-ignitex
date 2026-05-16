import { computeGross } from './peoria.js';

export function renderLeaderboard(state) {
  if (state.tournament.status === 'finalized') return renderFinal(state);
  return renderProvisional(state);
}

function renderProvisional(state) {
  const par = 72;
  const rows = state.players.map(p => {
    const filled = p.scores.filter(s => s != null).length;
    const gross = computeGross(p.scores);
    const flight = state.flights.find(f => f.playerIds.includes(p.id));
    return { name: p.name, flightName: flight?.name || '—', filled, gross };
  }).sort((a, b) => {
    if (a.filled !== b.filled) return b.filled - a.filled;
    return a.gross - b.gross;
  });

  const showFinalize = state.tournament.status === 'input';
  const showRandomize = state.tournament.status === 'locked';

  return `
    <div class="banner">
      <strong>Provisional Gross Ranking</strong> — Peoria & Net not yet computed. Will appear after Finalize → Randomize.
    </div>

    <table class="leaderboard">
      <thead>
        <tr><th>Rank</th><th>Player</th><th>Flight</th><th>Thru</th><th>Gross</th><th>+/-</th></tr>
      </thead>
      <tbody>
        ${rows.map((r, i) => `
          <tr>
            <td class="rank">${i + 1}</td>
            <td>${r.name}</td>
            <td>${r.flightName}</td>
            <td>${r.filled}/18</td>
            <td class="num"><b>${r.gross}</b></td>
            <td class="num">${r.filled === 18 ? formatOverSimple(r.gross - par) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="bottom-bar">
      <div></div>
      <div>
        ${showFinalize ? '<button class="primary" data-action="finalize-scoring">🔒 Finalize Scoring</button>' : ''}
        ${showRandomize ? '<button class="primary" data-action="randomize-peoria">🎲 Randomize Peoria Holes</button>' : ''}
      </div>
    </div>
  `;
}

function formatOverSimple(over) {
  if (over === 0) return 'E';
  return over > 0 ? `+${over}` : `${over}`;
}

function renderFinal(state) {
  return '<p>Final view — coming in next task.</p>';
}
