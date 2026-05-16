const SEQUENCE = ['flightB', 'flightA', 'bno', 'bgo'];
const LABELS = {
  flightB: 'Flight B Winner',
  flightA: 'Flight A Winner',
  bno: 'Best Net Overall',
  bgo: 'Best Gross Overall'
};

export function renderAwards(state) {
  if (!state.results) return '<p>No results yet. Randomize Peoria first.</p>';
  const revealed = state.ui.revealedAwards || [];
  const nextKey = SEQUENCE.find(k => !revealed.includes(k));

  return `
    <div class="awards-stage">
      ${revealed.length === 0 && nextKey ? '<div class="awards-intro"><h1>The Ignitex Gobar · Awards</h1><p class="meta">22 May 2026 · Modern Land Golf Club</p></div>' : ''}

      <div class="reveal-cards">
        ${revealed.map(key => winnerRevealCard(state, key, false)).join('')}
      </div>

      ${nextKey ? `
        <div class="awards-controls">
          <button class="primary big" data-action="reveal-next" data-key="${nextKey}">▶ Reveal Next Winner</button>
          <div class="next-up">Up next: <b>${LABELS[nextKey].toUpperCase()}</b></div>
          <div class="dots">
            ${SEQUENCE.map(k => `<span class="dot ${revealed.includes(k) ? 'done' : (k === nextKey ? 'next' : '')}">●</span>`).join('')}
          </div>
        </div>
      ` : `
        <div class="awards-complete">
          <h2>🎉 Tournament Complete</h2>
          <button data-action="replay-awards">↻ Replay All</button>
        </div>
      `}
    </div>

    <div id="reveal-overlay" class="reveal-overlay" data-active="false"></div>
  `;
}

function winnerRevealCard(state, key, animating) {
  const data = getWinnerData(state, key);
  if (!data) return '';
  return `
    <div class="winner-card reveal-card" data-key="${key}" ${animating ? 'data-animating="true"' : ''}>
      <div class="winner-label">🏆 ${LABELS[key].toUpperCase()}</div>
      <div class="winner-name">${data.name}</div>
      <div class="winner-flight">${data.flightName}</div>
      <div class="winner-stats">
        ${key === 'bgo'
          ? `<div><div class="stat-label">Gross</div><div class="stat-val">${data.gross}</div></div>`
          : `
            <div><div class="stat-label">Gross</div><div class="stat-val">${data.gross}</div></div>
            <div><div class="stat-label">Handicap</div><div class="stat-val">${data.handicap}</div></div>
            <div><div class="stat-label">Net</div><div class="stat-val">${data.net}</div></div>
          `
        }
      </div>
      <button class="replay-btn" data-action="replay-reveal" data-key="${key}">↻ Replay</button>
    </div>
  `;
}

export function getWinnerData(state, key) {
  const { results, flights } = state;
  if (!results) return null;

  const lookupFlight = (pid) => flights.find(f => f.playerIds.includes(pid))?.name || '—';
  const fromResults = (rec) => {
    if (!rec) return null;
    const detail = results.perPlayer.find(p => p.playerId === rec.playerId);
    return { ...detail, flightName: lookupFlight(rec.playerId) };
  };

  switch (key) {
    case 'bgo': return fromResults(results.bgo);
    case 'bno': return fromResults(results.bno);
    case 'flightA': return fromResults(results.flightA[0]);
    case 'flightB': return fromResults(results.flightB[0]);
    default: return null;
  }
}

export function playRevealAnimation(state, key, onComplete) {
  const overlay = document.getElementById('reveal-overlay');
  if (!overlay) { onComplete(); return; }

  const data = getWinnerData(state, key);
  if (!data) { onComplete(); return; }

  overlay.dataset.active = 'true';
  const statBlock = (label, val) => `
    <div><div class="stat-label">${label}</div><div class="stat-val" data-target="${val}">0</div></div>
  `;
  overlay.innerHTML = `
    <div class="overlay-content">
      <div class="overlay-spotlight"></div>
      <div class="overlay-label">${LABELS[key].toUpperCase()}</div>
      <div class="overlay-countdown" data-step="3">3</div>
      <div class="overlay-name" style="opacity:0">${data.name}</div>
      <div class="overlay-flight" style="opacity:0">${data.flightName}</div>
      <div class="overlay-stats" style="opacity:0">
        ${key === 'bgo'
          ? statBlock('Gross', data.gross)
          : statBlock('Gross', data.gross) + statBlock('Handicap', data.handicap) + statBlock('Net', data.net)
        }
      </div>
      ${(key === 'bgo' || key === 'bno') ? '<div class="confetti"></div>' : ''}
    </div>
  `;

  const countdown = overlay.querySelector('.overlay-countdown');
  const nameEl = overlay.querySelector('.overlay-name');
  const flightEl = overlay.querySelector('.overlay-flight');
  const statsEl = overlay.querySelector('.overlay-stats');

  let step = 3;
  const tick = setInterval(() => {
    step--;
    if (step > 0) {
      countdown.textContent = step;
      countdown.dataset.step = step;
    } else {
      clearInterval(tick);
      countdown.style.opacity = '0';
      typewriter(nameEl, data.name, 55, () => {
        flightEl.style.opacity = '1';
        setTimeout(() => {
          statsEl.style.opacity = '1';
          // Animate stat numbers counting up
          statsEl.querySelectorAll('.stat-val').forEach((el, idx) => {
            const target = parseInt(el.dataset.target, 10);
            setTimeout(() => animateCountUp(el, target, 900), idx * 220);
          });
          if (key === 'bgo' || key === 'bno') spawnConfetti(overlay);
          setTimeout(() => {
            overlay.dataset.active = 'false';
            overlay.innerHTML = '';
            onComplete();
          }, 3200);
        }, 400);
      });
    }
  }, 800);
}

function animateCountUp(el, target, duration = 800) {
  if (!Number.isFinite(target)) { el.textContent = target; return; }
  if (target === 0) { el.textContent = '0'; return; }
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(ease(t) * target);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function typewriter(el, text, charMs, onDone) {
  el.style.opacity = '1';
  el.textContent = '';
  let i = 0;
  const id = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(id);
      setTimeout(onDone, 300);
    }
  }, charMs);
}

function spawnConfetti(overlay) {
  const confetti = overlay.querySelector('.confetti');
  if (!confetti) return;
  const colors = ['#B71C2C', '#FFFFFF', '#FFD75A', '#d63347', '#FFB347'];
  for (let i = 0; i < 140; i++) {
    const p = document.createElement('span');
    p.style.background = colors[i % colors.length];
    p.style.left = Math.random() * 100 + '%';
    const size = 6 + Math.random() * 8;
    p.style.width = size + 'px';
    p.style.height = (size * (0.6 + Math.random() * 1.2)) + 'px';
    if (i % 4 === 0) p.style.borderRadius = '50%';
    p.style.setProperty('--dur', (1.8 + Math.random() * 2) + 's');
    p.style.setProperty('--delay', (Math.random() * 0.8) + 's');
    p.style.setProperty('--x', (Math.random() * 300 - 150) + 'px');
    confetti.appendChild(p);
  }
}
