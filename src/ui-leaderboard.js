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
  const { peoriaHoles, results, flights } = state;
  if (!results) return '<p>No results yet.</p>';

  const enrichRow = (r) => {
    if (!r) return null;
    const p = results.perPlayer.find(x => x.playerId === r.playerId);
    const f = flights.find(x => x.playerIds.includes(r.playerId));
    return { ...p, flightName: f?.name || '—' };
  };

  const bgo = enrichRow(results.bgo);
  const bno = enrichRow(results.bno);
  const flightAEnriched = results.flightA.map(enrichRow);
  const flightBEnriched = results.flightB.map(enrichRow);

  const fullStandings = [...results.perPlayer]
    .sort((a, b) => a.net - b.net || a.handicap - b.handicap || a.name.localeCompare(b.name))
    .map((r, i) => {
      const f = flights.find(x => x.playerIds.includes(r.playerId));
      let badge = '';
      if (r.playerId === results.bgo.playerId) badge = 'BGO 🏆';
      if (r.playerId === results.bno.playerId) badge = badge ? `${badge}, BNO 🏆` : 'BNO 🏆';
      if (!badge) {
        if (results.flightA.find(x => x.playerId === r.playerId)) badge = 'Flight A';
        else if (results.flightB.find(x => x.playerId === r.playerId)) badge = 'Flight B';
      }
      return { ...r, rank: i + 1, flightName: f?.name || '—', badge };
    });

  return `
    <section class="card peoria-holes-card">
      <h2 class="card-title">🎲 Peoria Holes</h2>
      <div class="peoria-display">
        <span>Par 3: ${holeChips(peoriaHoles.par3, 0)}</span>
        <span>Par 4: ${holeChips(peoriaHoles.par4, 2)}</span>
        <span>Par 5: ${holeChips(peoriaHoles.par5, 4)}</span>
      </div>
    </section>

    <div class="winner-summary">
      ${winnerCard('BEST GROSS OVERALL', bgo.name, bgo.flightName, [['Gross', bgo.gross]])}
      ${winnerCard('BEST NET OVERALL', bno.name, bno.flightName, [['Gross', bno.gross], ['Hcp', bno.handicap], ['Net', bno.net]])}
    </div>

    <div class="flight-winners">
      <section class="card">
        <h2 class="card-title">Flight A · Top 3</h2>
        ${podiumList(flightAEnriched)}
      </section>
      <section class="card">
        <h2 class="card-title">Flight B · Top 3</h2>
        ${podiumList(flightBEnriched)}
      </section>
    </div>

    <section class="card">
      <h2 class="card-title">Full Standings</h2>
      <table class="leaderboard">
        <thead>
          <tr><th>R</th><th>Player</th><th>Flight</th><th>Gross</th><th>Hcp</th><th>Net</th><th>Class</th></tr>
        </thead>
        <tbody>
          ${fullStandings.map((r, i) => `
            <tr style="animation-delay:${i * 22}ms">
              <td class="rank">${r.rank}</td>
              <td>${r.name}</td>
              <td>${r.flightName}</td>
              <td class="num">${r.gross}</td>
              <td class="num">${r.handicap}</td>
              <td class="num"><b>${r.net}</b></td>
              <td>${r.badge}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2 class="card-title">Standings by Playing Flight (Avg Net)</h2>
      <div class="flight-standings">
        ${(() => {
          const avgs = results.flightStandings.map(s => s.avgNet).filter(v => v > 0);
          const minA = Math.min(...avgs);
          const maxA = Math.max(...avgs);
          const range = Math.max(1, maxA - minA);
          return results.flightStandings.map((s, i) => {
            // Bar: longer = better (lower net) → invert
            const norm = s.memberCount === 0 ? 0 : 1 - ((s.avgNet - minA) / range);
            return `
              <div class="flight-stat" style="animation: fadeInUp 360ms ease-out both; animation-delay: ${i * 60}ms">
                <div class="rank">${i + 1}</div>
                <div class="name">${s.name}</div>
                <div class="bar-wrap"><div class="bar" style="width:${(0.15 + norm * 0.85) * 100}%; animation-delay:${100 + i * 60}ms"></div></div>
                <div class="num"><b>${s.avgNet.toFixed(1)}</b> <span class="muted">(${s.memberCount})</span></div>
              </div>
            `;
          }).join('');
        })()}
      </div>
    </section>

    <div class="bottom-bar">
      <div>
        <button data-action="unlock-scoring">🔓 Unlock Scoring</button>
        <button data-action="randomize-peoria">🎲 Re-randomize Peoria</button>
      </div>
      <div>
        <button class="primary" data-action="goto-awards">🏆 Go to Awards Ceremony →</button>
        <button data-action="save-snapshot">Save Snapshot</button>
      </div>
    </div>
  `;
}

function winnerCard(label, name, flightName, stats) {
  return `
    <div class="winner-card">
      <div class="winner-label">${label}</div>
      <div class="winner-name">${name}</div>
      <div class="winner-flight">${flightName}</div>
      <div class="winner-stats">
        ${stats.map(([l, v]) => `<div><div class="stat-label">${l}</div><div class="stat-val">${v}</div></div>`).join('')}
      </div>
    </div>
  `;
}

function podiumList(rows) {
  if (rows.length === 0) return '<p class="empty">—</p>';
  return `
    <ol class="podium">
      ${rows.slice(0, 3).map((r, i) => `
        <li>
          <span class="medal">${['🥇','🥈','🥉'][i]}</span>
          <span class="name">${r.name}</span>
          <span class="num"><b>${r.net}</b> <span class="muted">(${r.gross} - ${r.handicap})</span></span>
        </li>
      `).join('')}
    </ol>
  `;
}

function holeChips(holes, startDelay) {
  return holes.map((n, i) => `<span class="hole-chip" style="animation-delay:${(startDelay + i) * 90}ms">${n}</span>`).join('');
}
