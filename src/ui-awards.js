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

// Per-category escalating effect configs (all mega; BGO is supreme)
const FX = {
  flightB: {
    theme: 'emerald',
    confetti: { colors: ['#3CCB7F','#88e0a8','#FFFFFF','#1f6b4a'], count: 200, waves: 2 },
    fireworks: 2,
    spotlight: 600,
    linger: 4400,
  },
  flightA: {
    theme: 'silver',
    confetti: { colors: ['#FFFFFF','#C0C0C0','#E8E8E8','#A0A0A0'], count: 230, waves: 2 },
    fireworks: 3,
    spotlight: 700,
    linger: 4600,
  },
  bno: {
    theme: 'gold',
    confetti: { colors: ['#FFD75A','#FFFFFF','#FFB347','#B71C2C','#FFEC8B'], count: 280, waves: 3 },
    fireworks: 5,
    spotlight: 800,
    linger: 5000,
  },
  bgo: {
    theme: 'champion',
    confetti: { colors: ['#B71C2C','#FFD75A','#FFFFFF','#d63347','#FFB347','#FFEC8B'], count: 420, waves: 4 },
    fireworks: 8,
    spotlight: 1100,
    linger: 6800,
    extras: ['crown','trophyShower','championBadge','shimmerName'],
  }
};

export function renderAwards(state) {
  if (!state.results) return '<p>No results yet. Randomize Peoria first.</p>';
  const revealed = state.ui.revealedAwards || [];
  const nextKey = SEQUENCE.find(k => !revealed.includes(k));
  const showHero = revealed.length === 0;

  // CINEMATIC OPENING SCREEN — no spoiler, no category mention
  if (showHero) {
    return `
      <div class="awards-cinema">
        <div class="cinema-eyebrow">— GRAND CEREMONY —</div>
        <h1 class="cinema-title">
          <span class="cinema-line line-1">THE IGNITEX</span>
          <span class="cinema-line line-2">GOLF TOURNAMENT</span>
        </h1>
        <div class="cinema-divider"></div>
        <div class="cinema-meta">GOBAR · MODERN LAND GOLF CLUB · 22 MAY 2026</div>
        <button class="cinema-cta primary" data-action="reveal-next" data-key="${nextKey}">
          <span class="cta-icon">▶</span> BEGIN CEREMONY
        </button>
      </div>
      <div id="reveal-overlay" class="reveal-overlay" data-active="false"></div>
    `;
  }

  // SUBSEQUENT STATE — show stack of revealed cards + generic next button (no category preview)
  const allDone = revealed.length === SEQUENCE.length;
  return `
    <div class="awards-stage">
      <div class="reveal-cards">
        ${revealed.map(key => winnerRevealCard(state, key)).join('')}
      </div>

      ${nextKey ? `
        <div class="awards-controls">
          <button class="primary big" data-action="reveal-next" data-key="${nextKey}">▶ REVEAL NEXT WINNER</button>
          <div class="dots">
            ${SEQUENCE.map(k => `<span class="dot ${revealed.includes(k) ? 'done' : ''}">●</span>`).join('')}
          </div>
        </div>
      ` : `
        <div class="awards-complete">
          <h2>🎉 TOURNAMENT COMPLETE</h2>
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

  const cfg = FX[key];
  const theme = cfg.theme;
  const isChampion = key === 'bgo';
  const extras = cfg.extras || [];

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
      <div class="overlay-spotlight" style="width:${cfg.spotlight}px;height:${cfg.spotlight}px"></div>
      ${extras.includes('crown') ? '<div class="crown">👑</div>' : ''}
      <div class="overlay-label">${LABELS[key].toUpperCase()}</div>
      <div class="overlay-countdown" data-step="3">3</div>
      <div class="overlay-name ${extras.includes('shimmerName') ? 'champion-name' : ''}" style="opacity:0">${data.name}</div>
      <div class="overlay-flight" style="opacity:0">${data.flightName}</div>
      <div class="overlay-stats" style="opacity:0">${stats}</div>
      ${extras.includes('championBadge') ? '<div class="champion-badge" style="opacity:0">CHAMPION 2026</div>' : ''}
      <div class="fx-layer-front"></div>
    </div>
  `;

  const countdown = overlay.querySelector('.overlay-countdown');
  const nameEl    = overlay.querySelector('.overlay-name');
  const flightEl  = overlay.querySelector('.overlay-flight');
  const statsEl   = overlay.querySelector('.overlay-stats');
  const badgeEl   = overlay.querySelector('.champion-badge');

  // Pre-effect (background mood) — runs immediately during countdown
  spawnLights(overlay, theme);

  let step = 3;
  const tick = setInterval(() => {
    step--;
    if (step > 0) {
      countdown.textContent = step;
      countdown.dataset.step = step;
    } else {
      clearInterval(tick);
      countdown.style.opacity = '0';

      // Curtain reveal at name moment
      spawnCurtains(overlay, theme);

      // Trophy shower for BGO
      if (extras.includes('trophyShower')) spawnTrophyShower(overlay);

      typewriter(nameEl, data.name, 55, () => {
        flightEl.style.opacity = '1';
        setTimeout(() => {
          statsEl.style.opacity = '1';
          statsEl.querySelectorAll('.stat-val').forEach((el, idx) => {
            const target = parseInt(el.dataset.target, 10);
            setTimeout(() => animateCountUp(el, target, 900), idx * 220);
          });
          if (badgeEl) setTimeout(() => { badgeEl.style.opacity = '1'; badgeEl.classList.add('pop'); }, 800);

          // Confetti waves
          spawnConfetti(overlay, cfg);
          // Fireworks
          spawnFireworks(overlay, cfg.fireworks, isChampion);

          setTimeout(() => {
            overlay.dataset.active = 'false';
            overlay.innerHTML = '';
            onComplete();
          }, cfg.linger);
        }, 400);
      });
    }
  }, 800);
}

// ---------- Effect builders (used by all categories) ----------

function spawnLights(overlay, theme) {
  const back = overlay.querySelector('.fx-layer-back');
  if (!back) return;
  const beamColors = {
    emerald: 'rgba(60,203,127,0.22)',
    silver:  'rgba(220,220,230,0.22)',
    gold:    'rgba(255,215,90,0.22)',
    champion:'rgba(255,215,90,0.28)',
  };
  const color = beamColors[theme];
  const count = theme === 'champion' ? 6 : 4;
  for (let i = 0; i < count; i++) {
    const beam = document.createElement('div');
    beam.className = 'stadium-beam';
    beam.style.setProperty('--delay', (i * 180) + 'ms');
    beam.style.setProperty('--angle', (-25 + i * (50 / count)) + 'deg');
    beam.style.setProperty('--beam-color', color);
    back.appendChild(beam);
  }
}

function spawnCurtains(overlay, theme) {
  const mid = overlay.querySelector('.fx-layer-mid');
  if (!mid) return;
  const colors = {
    emerald: ['#0f3a28', '#3CCB7F', '#0f3a28'],
    silver:  ['#3a3a3a', '#C0C0C0', '#3a3a3a'],
    gold:    ['#6b4f15', '#FFD75A', '#6b4f15'],
    champion:['#5a0d18', '#B71C2C', '#5a0d18'],
  };
  const [a, b, c] = colors[theme];
  const left  = document.createElement('div');
  const right = document.createElement('div');
  left.className  = 'curtain curtain-left';
  right.className = 'curtain curtain-right';
  left.style.background  = `linear-gradient(180deg, ${a} 0%, ${b} 50%, ${c} 100%)`;
  right.style.background = `linear-gradient(180deg, ${a} 0%, ${b} 50%, ${c} 100%)`;
  mid.appendChild(left);
  mid.appendChild(right);
}

function spawnConfetti(overlay, cfg) {
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  const confetti = document.createElement('div');
  confetti.className = 'confetti';
  front.appendChild(confetti);

  const waves = cfg.confetti.waves;
  const perWave = Math.floor(cfg.confetti.count / waves);
  for (let w = 0; w < waves; w++) {
    setTimeout(() => {
      for (let i = 0; i < perWave; i++) {
        const p = document.createElement('span');
        p.style.background = cfg.confetti.colors[i % cfg.confetti.colors.length];
        p.style.left = Math.random() * 100 + '%';
        const size = 6 + Math.random() * 10;
        p.style.width = size + 'px';
        p.style.height = (size * (0.55 + Math.random() * 1.4)) + 'px';
        const shape = i % 4;
        if (shape === 0) p.style.borderRadius = '50%';
        if (shape === 2) p.style.transform = 'rotate(45deg)';
        p.style.setProperty('--dur', (1.7 + Math.random() * 2.4) + 's');
        p.style.setProperty('--delay', (Math.random() * 0.6) + 's');
        p.style.setProperty('--x', (Math.random() * 360 - 180) + 'px');
        confetti.appendChild(p);
      }
    }, w * 700);
  }
}

function spawnFireworks(overlay, count, mega) {
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  const palette = mega
    ? ['#FFD75A','#FFFFFF','#B71C2C','#FFB347','#FFEC8B','#d63347']
    : ['#FFFFFF','#FFD75A','#FFB347','#B71C2C'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const burst = document.createElement('div');
      burst.className = 'firework';
      burst.style.left = (10 + Math.random() * 80) + '%';
      burst.style.top  = (15 + Math.random() * 55) + '%';
      const particles = mega ? 32 : 22;
      for (let j = 0; j < particles; j++) {
        const p = document.createElement('span');
        const angle = (j / particles) * 360;
        const dist = 80 + Math.random() * 90;
        p.style.setProperty('--tx', Math.cos(angle * Math.PI/180) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle * Math.PI/180) * dist + 'px');
        p.style.background = palette[j % palette.length];
        burst.appendChild(p);
      }
      front.appendChild(burst);
      setTimeout(() => burst.remove(), 1600);
    }, 500 + i * 600);
  }
}

function spawnTrophyShower(overlay) {
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  const trophies = ['🏆','🥇','⭐','✨'];
  for (let i = 0; i < 14; i++) {
    setTimeout(() => {
      const t = document.createElement('div');
      t.className = 'flying-trophy';
      t.textContent = trophies[i % trophies.length];
      t.style.left = Math.random() * 90 + '%';
      t.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      t.style.setProperty('--dur', (2 + Math.random() * 1.5) + 's');
      front.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    }, i * 250);
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
