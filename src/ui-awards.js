const SEQUENCE = ['flightB', 'flightA', 'bno', 'bgo'];
const LABELS = {
  flightB: 'Flight B Winner',
  flightA: 'Flight A Winner',
  bno: 'Best Net Overall',
  bgo: 'Best Gross Overall · CHAMPION'
};
const THEMES = {
  flightB: 'emerald',
  flightA: 'silver',
  bno: 'gold',
  bgo: 'champion'
};

export function renderAwards(state) {
  if (!state.results) return '<p>No results yet. Randomize Peoria first.</p>';
  const revealed = state.ui.revealedAwards || [];
  const nextKey = SEQUENCE.find(k => !revealed.includes(k));

  return `
    <div class="awards-stage">
      ${revealed.length === 0 && nextKey ? `
        <div class="awards-intro">
          <div class="intro-eyebrow">·  CEREMONY  ·</div>
          <h1>The Ignitex Gobar</h1>
          <p class="meta">22 May 2026 · Modern Land Golf Club</p>
          <div class="intro-hint">Winners revealed worst-to-best in 4 categories</div>
        </div>
      ` : ''}

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

function winnerRevealCard(state, key) {
  const data = getWinnerData(state, key);
  if (!data) return '';
  const theme = THEMES[key];
  return `
    <div class="winner-card reveal-card theme-${theme}" data-key="${key}">
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

  const theme = THEMES[key];
  overlay.dataset.active = 'true';
  overlay.dataset.theme = theme;

  const statBlock = (label, val) => `<div><div class="stat-label">${label}</div><div class="stat-val" data-target="${val}">0</div></div>`;
  const stats = key === 'bgo'
    ? statBlock('Gross', data.gross)
    : statBlock('Gross', data.gross) + statBlock('Handicap', data.handicap) + statBlock('Net', data.net);

  overlay.innerHTML = `
    <div class="overlay-content theme-${theme}">
      <div class="fx-layer-back"></div>
      <div class="fx-layer-mid"></div>
      <div class="overlay-spotlight"></div>
      ${key === 'bgo' ? '<div class="crown">👑</div>' : ''}
      <div class="overlay-label">${LABELS[key].toUpperCase()}</div>
      <div class="overlay-countdown" data-step="3">3</div>
      <div class="overlay-name ${key === 'bgo' ? 'champion-name' : ''}" style="opacity:0">${data.name}</div>
      <div class="overlay-flight" style="opacity:0">${data.flightName}</div>
      <div class="overlay-stats" style="opacity:0">${stats}</div>
      ${key === 'bgo' ? '<div class="champion-badge" style="opacity:0">CHAMPION 2026</div>' : ''}
      <div class="fx-layer-front"></div>
    </div>
  `;

  const countdown = overlay.querySelector('.overlay-countdown');
  const nameEl    = overlay.querySelector('.overlay-name');
  const flightEl  = overlay.querySelector('.overlay-flight');
  const statsEl   = overlay.querySelector('.overlay-stats');
  const badgeEl   = overlay.querySelector('.champion-badge');

  // Trigger pre-countdown effect immediately (background mood)
  spawnPreEffect(overlay, key);

  let step = 3;
  const tick = setInterval(() => {
    step--;
    if (step > 0) {
      countdown.textContent = step;
      countdown.dataset.step = step;
    } else {
      clearInterval(tick);
      countdown.style.opacity = '0';
      // Per-category mid-effect at reveal moment
      spawnRevealEffect(overlay, key);

      typewriter(nameEl, data.name, 55, () => {
        flightEl.style.opacity = '1';
        setTimeout(() => {
          statsEl.style.opacity = '1';
          statsEl.querySelectorAll('.stat-val').forEach((el, idx) => {
            const target = parseInt(el.dataset.target, 10);
            setTimeout(() => animateCountUp(el, target, 900), idx * 220);
          });
          if (badgeEl) setTimeout(() => { badgeEl.style.opacity = '1'; badgeEl.classList.add('pop'); }, 800);
          spawnConfetti(overlay, key);
          // BGO gets bonus fireworks
          if (key === 'bgo') spawnFireworks(overlay, 4);

          const lingerMs = key === 'bgo' ? 5200 : 3400;
          setTimeout(() => {
            overlay.dataset.active = 'false';
            overlay.innerHTML = '';
            onComplete();
          }, lingerMs);
        }, 400);
      });
    }
  }, 800);
}

// ---------- Per-category effect dispatchers ----------

function spawnPreEffect(overlay, key) {
  const back = overlay.querySelector('.fx-layer-back');
  if (!back) return;
  if (key === 'bgo') {
    // Stadium light beams
    for (let i = 0; i < 4; i++) {
      const beam = document.createElement('div');
      beam.className = 'stadium-beam';
      beam.style.setProperty('--delay', (i * 200) + 'ms');
      beam.style.setProperty('--angle', (-25 + i * 12) + 'deg');
      back.appendChild(beam);
    }
  } else if (key === 'bno') {
    // Gold radial pulse
    const pulse = document.createElement('div');
    pulse.className = 'gold-pulse';
    back.appendChild(pulse);
  } else if (key === 'flightA') {
    // Silver streaks
    for (let i = 0; i < 3; i++) {
      const streak = document.createElement('div');
      streak.className = 'silver-streak';
      streak.style.setProperty('--delay', (i * 400) + 'ms');
      streak.style.setProperty('--top', (20 + i * 25) + '%');
      back.appendChild(streak);
    }
  } else if (key === 'flightB') {
    // Rising emerald orbs
    for (let i = 0; i < 18; i++) {
      const orb = document.createElement('div');
      orb.className = 'rising-orb';
      orb.style.setProperty('--left', Math.random() * 100 + '%');
      orb.style.setProperty('--delay', (Math.random() * 1.5) + 's');
      orb.style.setProperty('--size', (4 + Math.random() * 8) + 'px');
      back.appendChild(orb);
    }
  }
}

function spawnRevealEffect(overlay, key) {
  const mid = overlay.querySelector('.fx-layer-mid');
  if (!mid) return;
  if (key === 'bgo') {
    // Curtains slide apart
    const left = document.createElement('div');
    const right = document.createElement('div');
    left.className = 'curtain curtain-left';
    right.className = 'curtain curtain-right';
    mid.appendChild(left);
    mid.appendChild(right);
  } else if (key === 'bno') {
    // Gold ring expand
    const ring = document.createElement('div');
    ring.className = 'gold-ring';
    mid.appendChild(ring);
  } else if (key === 'flightA') {
    // Silver flash
    const flash = document.createElement('div');
    flash.className = 'silver-flash';
    mid.appendChild(flash);
  } else if (key === 'flightB') {
    // Emerald wave
    const wave = document.createElement('div');
    wave.className = 'emerald-wave';
    mid.appendChild(wave);
  }
}

function spawnConfetti(overlay, key) {
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  const palettes = {
    flightB: { colors: ['#3CCB7F','#88e0a8','#FFFFFF'], count: 80,  shapes: ['rect','circle'] },
    flightA: { colors: ['#FFFFFF','#C0C0C0','#E8E8E8','#A0A0A0'], count: 120, shapes: ['diamond','circle'] },
    bno:     { colors: ['#FFD75A','#FFFFFF','#FFB347','#B71C2C'], count: 180, shapes: ['rect','circle'] },
    bgo:     { colors: ['#B71C2C','#FFD75A','#FFFFFF','#d63347','#FFB347','#FFEC8B'], count: 280, shapes: ['rect','circle','diamond'] }
  };
  const cfg = palettes[key];
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  front.appendChild(confetti);

  // Wave releases for BGO mega effect
  const waves = key === 'bgo' ? 3 : 1;
  const perWave = Math.floor(cfg.count / waves);
  for (let w = 0; w < waves; w++) {
    setTimeout(() => {
      for (let i = 0; i < perWave; i++) {
        const p = document.createElement('span');
        p.style.background = cfg.colors[i % cfg.colors.length];
        p.style.left = Math.random() * 100 + '%';
        const size = 6 + Math.random() * 8;
        p.style.width = size + 'px';
        p.style.height = (size * (0.6 + Math.random() * 1.2)) + 'px';
        const shape = cfg.shapes[i % cfg.shapes.length];
        if (shape === 'circle') p.style.borderRadius = '50%';
        if (shape === 'diamond') p.style.transform = 'rotate(45deg)';
        p.style.setProperty('--dur', (1.6 + Math.random() * 2.2) + 's');
        p.style.setProperty('--delay', (Math.random() * 0.6) + 's');
        p.style.setProperty('--x', (Math.random() * 320 - 160) + 'px');
        confetti.appendChild(p);
      }
    }, w * 800);
  }
}

function spawnFireworks(overlay, count) {
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const burst = document.createElement('div');
      burst.className = 'firework';
      burst.style.left = (15 + Math.random() * 70) + '%';
      burst.style.top = (15 + Math.random() * 55) + '%';
      // Spawn radial particles
      for (let j = 0; j < 24; j++) {
        const p = document.createElement('span');
        const angle = (j / 24) * 360;
        const dist = 80 + Math.random() * 60;
        p.style.setProperty('--tx', Math.cos(angle * Math.PI / 180) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle * Math.PI / 180) * dist + 'px');
        const colors = ['#FFD75A','#FFFFFF','#B71C2C','#FFB347'];
        p.style.background = colors[j % colors.length];
        burst.appendChild(p);
      }
      front.appendChild(burst);
      setTimeout(() => burst.remove(), 1500);
    }, 600 + i * 700);
  }
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
