import { computeGross } from './peoria.js';

export function renderLeaderboard(state) {
  if (state.tournament.status === 'finalized') return renderFinal(state);
  return renderProvisional(state);
}

function renderProvisional(state) {
  // After Finalize, before Randomize: SEAL the standings so the BGO is a surprise.
  if (state.tournament.status === 'locked') return renderSealed(state);

  const par = 72;
  const rows = state.players.map(p => {
    const filled = p.scores.filter(s => s != null).length;
    const gross = computeGross(p.scores);
    const flight = state.flights.find(f => f.playerIds.includes(p.id));
    return { name: p.name, flightName: flight?.name || '—', filled, gross, dnf: !!p.dnf };
  }).sort((a, b) => {
    if (a.dnf !== b.dnf) return a.dnf ? 1 : -1;   // DNF players sink to the bottom
    if (a.filled !== b.filled) return b.filled - a.filled;
    return a.gross - b.gross;
  });

  const showFinalize = state.tournament.status === 'input';

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
          <tr class="${r.dnf ? 'player-dnf' : ''}">
            <td class="rank">${r.dnf ? '—' : i + 1}</td>
            <td>${r.name}${r.dnf ? ' <span class="dnf-badge">DNF</span>' : ''}</td>
            <td>${r.flightName}</td>
            <td>${r.filled}/18</td>
            <td class="num"><b>${r.gross}</b></td>
            <td class="num">${r.dnf ? '—' : (r.filled === 18 ? formatOverSimple(r.gross - par) : '—')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="bottom-bar">
      <div></div>
      <div>
        ${showFinalize ? '<button class="primary" data-action="finalize-scoring">🔒 Finalize Scoring</button>' : ''}
      </div>
    </div>
  `;
}

function renderSealed(state) {
  const totalPlayers = state.players.length;
  const flightCount = state.flights.length;
  return `
    <div class="banner banner-locked">
      <strong>🔒 SCORING LOCKED</strong>
      All scores submitted. Standings sealed to preserve the surprise.
    </div>

    <section class="card sealed-card">
      <div class="sealed-emoji">🤫</div>
      <h2 class="sealed-title">The Champion Awaits</h2>
      <p class="sealed-sub">${totalPlayers} PLAYERS · ${flightCount} FLIGHTS · 4 AWARDS</p>
      <p class="sealed-meta">Hit <b>Randomize Peoria Holes</b> to begin the reveal ceremony.</p>
    </section>

    <div class="bottom-bar">
      <div>
        <button data-action="edit-setup">← Back to Setup</button>
      </div>
      <div>
        <button class="primary big pulse-cta" data-action="randomize-peoria">🎲 Randomize Peoria Holes</button>
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

  const revealed = state.ui.revealedAwards || [];
  const allRevealed = ['flightB','flightA','bno','bgo'].every(k => revealed.includes(k));

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
      if (allRevealed) {
        if (r.playerId === results.bgo.playerId) badge = 'BGO 🏆';
        if (r.playerId === results.bno.playerId) badge = badge ? `${badge}, BNO 🏆` : 'BNO 🏆';
        if (!badge) {
          if (results.flightA.find(x => x.playerId === r.playerId)) badge = 'Flight A';
          else if (results.flightB.find(x => x.playerId === r.playerId)) badge = 'Flight B';
        }
      }
      return { ...r, rank: i + 1, flightName: f?.name || '—', badge };
    });

  // If not all revealed, sealed view — no standings table leaked
  if (!allRevealed) {
    return `
      <div class="banner banner-locked">
        <strong>🔒 Awards Ceremony In Progress</strong>
        ${revealed.length}/4 winners revealed. Full standings unlock once all four are announced.
      </div>

      <section class="card peoria-holes-card">
        <h2 class="card-title">🎲 Peoria Holes</h2>
        <div class="peoria-display">
          <span>Par 3: ${holeChips(peoriaHoles.par3, 0)}</span>
          <span>Par 4: ${holeChips(peoriaHoles.par4, 2)}</span>
          <span>Par 5: ${holeChips(peoriaHoles.par5, 4)}</span>
        </div>
      </section>

      <section class="card sealed-card">
        <div class="sealed-emoji">🔐</div>
        <h2 class="sealed-title">Standings Sealed</h2>
        <p class="sealed-sub">${revealed.length}/4 WINNERS REVEALED</p>
        <p class="sealed-meta">Return to the <b>Awards</b> tab to reveal the rest.</p>
      </section>

      <div class="bottom-bar">
        <div>
          <button data-action="unlock-scoring">🔓 Unlock Scoring</button>
        </div>
        <div>
          <button class="primary big pulse-cta" data-action="goto-awards">🏆 Back to Awards Ceremony →</button>
        </div>
      </div>
    `;
  }

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
      ${(() => {
        const dnf = state.players.filter(p => p.dnf);
        if (dnf.length === 0) return '';
        return `<p class="dnf-note">DNF (tidak dihitung dalam skor, hadiah & best flight): ${dnf.map(p => p.name).join(', ')}</p>`;
      })()}
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
            const norm = s.memberCount === 0 ? 0 : 1 - ((s.avgNet - minA) / range);
            const winnerClass = i === 0 && s.memberCount > 0 ? ' team-winner' : '';
            return `
              <div class="flight-stat${winnerClass}" style="animation: fadeInUp 360ms ease-out both; animation-delay: ${i * 60}ms">
                <div class="rank">${i + 1}${i === 0 && s.memberCount > 0 ? ' 🏆' : ''}</div>
                <div class="name">${s.name}</div>
                <div class="bar-wrap"><div class="bar" style="width:${(0.15 + norm * 0.85) * 100}%; animation-delay:${100 + i * 60}ms"></div></div>
                <div class="num"><b>${s.avgNet.toFixed(1)}</b> <span class="muted">(${s.memberCount})</span></div>
              </div>
            `;
          }).join('');
        })()}
      </div>
    </section>

    ${renderPeoriaVerification(state)}

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

// Per-player breakdown of the 6 Peoria holes so observers can audit each handicap.
function renderPeoriaVerification(state) {
  const { players, course, peoriaHoles, results } = state;
  if (!peoriaHoles?.all || !course?.holes) return '';

  const peoriaIdx = peoriaHoles.all.map(n => n - 1);                       // 0-indexed hole indices
  const playerById = (id) => players.find(p => p.id === id);
  const rows = [...results.perPlayer]
    .sort((a, b) => a.net - b.net || a.handicap - b.handicap || a.name.localeCompare(b.name))
    .map(r => {
      const p = playerById(r.playerId);
      const cells = peoriaIdx.map(idx => {
        const par = course.holes[idx].par;
        const stroke = p ? p.scores[idx] : null;
        const over = (stroke == null) ? 0 : (stroke - par);
        const cls = over < 0 ? 'under' : over === 0 ? 'par' : over === 1 ? 'over-1' : 'over-2plus';
        return { idx, par, stroke, over, cls };
      });
      const sumOver = cells.reduce((s, c) => s + c.over, 0);
      return { name: r.name, gross: r.gross, handicap: r.handicap, cells, sumOver };
    });

  const headerCells = peoriaIdx.map(idx => {
    const par = course.holes[idx].par;
    return `<th><div class="ph-h">H${idx + 1}</div><div class="ph-p">PAR ${par}</div></th>`;
  }).join('');

  return `
    <section class="card peoria-verify-card">
      <h2 class="card-title">
        🔍 Peoria Verification
        <span class="muted" style="font-weight:400; letter-spacing:0.05em; text-transform:none;">
          — Σ over · 3 = handicap. Highlighted holes contributed to each player's handicap.
        </span>
      </h2>
      <div class="peoria-verify-wrap">
        <table class="peoria-verify">
          <thead>
            <tr>
              <th class="ph-name">Player</th>
              ${headerCells}
              <th class="ph-sum">Σ Over</th>
              <th class="ph-hcp">× 3 = HCP</th>
              <th class="ph-net">Net</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr style="animation-delay:${i * 18}ms">
                <td class="ph-name">${r.name}</td>
                ${r.cells.map(c => `
                  <td class="ph-cell">
                    <span class="ph-stroke ${c.cls}">${c.stroke == null ? '—' : c.stroke}</span>
                    <span class="ph-over">${c.over === 0 ? 'E' : (c.over > 0 ? '+' + c.over : c.over)}</span>
                  </td>
                `).join('')}
                <td class="ph-sum num"><b>${r.sumOver > 0 ? '+' + r.sumOver : r.sumOver}</b></td>
                <td class="ph-hcp num"><b>${r.handicap}</b></td>
                <td class="ph-net num">${r.gross} − ${r.handicap} = <b>${r.gross - r.handicap}</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
