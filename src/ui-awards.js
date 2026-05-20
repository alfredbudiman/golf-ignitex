const SEQUENCE = ['flightB', 'flightA', 'bno', 'flightTeam', 'bgo'];
const LABELS = {
  flightB:    'Flight B Winner',
  flightA:    'Flight A Winner',
  bno:        'Best Net Overall',
  flightTeam: 'Best Flight · Avg Net',
  bgo:        'Best Gross Overall · CHAMPION'
};
const THEMES = {
  flightB:    'emerald',
  flightA:    'silver',
  bno:        'gold',
  flightTeam: 'royal',
  bgo:        'champion'
};

const FX = {
  flightB: {
    theme: 'emerald',
    confetti: { colors: ['#3CCB7F','#88e0a8','#FFFFFF','#1f6b4a'], count: 220, waves: 2 },
    fireworks: 3,
    spotlight: 700,
    linger: 4800,
    shake: 'medium',
    countDuration: 2400,
  },
  flightA: {
    theme: 'silver',
    confetti: { colors: ['#FFFFFF','#C0C0C0','#E8E8E8','#A0A0A0'], count: 260, waves: 2 },
    fireworks: 4,
    spotlight: 800,
    linger: 5000,
    shake: 'medium',
    countDuration: 2400,
  },
  bno: {
    theme: 'gold',
    confetti: { colors: ['#FFD75A','#FFFFFF','#FFB347','#B71C2C','#FFEC8B'], count: 320, waves: 3 },
    fireworks: 6,
    spotlight: 900,
    linger: 5400,
    shake: 'big',
    countDuration: 2600,
  },
  flightTeam: {
    theme: 'royal',
    confetti: { colors: ['#1E3A8A','#3B82F6','#FFFFFF','#93C5FD','#FFD75A','#E8E8E8'], count: 360, waves: 3 },
    fireworks: 7,
    spotlight: 1000,
    linger: 5800,
    shake: 'big',
    countDuration: 2600,
  },
  bgo: {
    theme: 'champion',
    confetti: { colors: ['#B71C2C','#FFD75A','#FFFFFF','#d63347','#FFB347','#FFEC8B'], count: 480, waves: 4 },
    fireworks: 10,
    spotlight: 1200,
    linger: 7400,
    shake: 'mega',
    extras: ['crown','trophyShower','championBadge','shimmerName','emberRain','haloCrown','lensFlare'],
  }
};

// Per-category headline metric (the "suspense" number that counts up first)
function headlineFor(key, data) {
  if (key === 'bgo')        return { value: data.gross, label: 'GROSS' };
  if (key === 'flightTeam') return { value: Math.round(data.avgNet), label: 'AVG NET' };
  return { value: data.net, label: 'NET' };
}

// Secondary stats shown after the name lands (excludes the headline metric)
function secondaryStatsFor(key, data) {
  const block = (label, val) =>
    `<div><div class="stat-label">${label}</div><div class="stat-val" data-target="${val}">0</div></div>`;
  if (key === 'bgo') {
    return block('Handicap', data.handicap) + block('Net', data.net);
  }
  if (key === 'flightTeam') {
    return block('Total Net', data.totalNet) + block('Members', data.memberCount);
  }
  return block('Gross', data.gross) + block('Handicap', data.handicap);
}

export function renderAwards(state) {
  if (!state.results) return '<p>No results yet. Randomize Peoria first.</p>';
  const revealed = state.ui.revealedAwards || [];
  const nextKey = SEQUENCE.find(k => !revealed.includes(k));
  const showHero = revealed.length === 0;

  if (showHero) {
    const logoSrc = (typeof LOGO_ASSETS !== 'undefined' && LOGO_ASSETS['assets/ignitex-logo.png'])
      || 'assets/ignitex-logo.png';
    const ph = state.peoriaHoles || { par3: [], par4: [], par5: [] };
    const holeChip = (n, di) => `<div class="cp-hole" style="--di:${di}"><span>${n}</span></div>`;
    return `
      <div class="awards-cinema">
        <div class="cinema-stars"></div>
        <div class="cinema-eyebrow">— GRAND CEREMONY —</div>
        <div class="cinema-logo-tile">
          <img src="${logoSrc}" alt="Ignitex" class="cinema-logo">
        </div>
        <h1 class="cinema-subtitle">GOLF TOURNAMENT</h1>
        <div class="cinema-divider"></div>
        <div class="cinema-meta">GOBAR · MODERN LAND GOLF CLUB · 22 MAY 2026</div>

        <div class="cinema-peoria">
          <div class="cp-eyebrow">— PEORIA HOLES SELECTED —</div>
          <div class="cp-rows">
            <div class="cp-group">
              <div class="cp-group-label">PAR 3</div>
              <div class="cp-holes">
                ${(ph.par3 || []).map((n, i) => holeChip(n, i)).join('')}
              </div>
            </div>
            <div class="cp-group">
              <div class="cp-group-label">PAR 4</div>
              <div class="cp-holes">
                ${(ph.par4 || []).map((n, i) => holeChip(n, i + 2)).join('')}
              </div>
            </div>
            <div class="cp-group">
              <div class="cp-group-label">PAR 5</div>
              <div class="cp-holes">
                ${(ph.par5 || []).map((n, i) => holeChip(n, i + 4)).join('')}
              </div>
            </div>
          </div>
        </div>

        <button class="cinema-cta primary" data-action="reveal-next" data-key="${nextKey}">
          <span class="cta-icon">▶</span> BEGIN CEREMONY
        </button>
      </div>
      <div id="reveal-overlay" class="reveal-overlay" data-active="false"></div>
    `;
  }

  const allDone = revealed.length === SEQUENCE.length;
  return `
    <div class="awards-stage">
      <div class="reveal-cards">
        ${revealed.map(key => winnerRevealCard(state, key)).join('')}
      </div>

      ${nextKey ? `
        <div class="awards-controls">
          <button class="primary big pulse-cta" data-action="reveal-next" data-key="${nextKey}">▶ REVEAL NEXT WINNER</button>
          <div class="dots">
            ${SEQUENCE.map(k => `<span class="dot ${revealed.includes(k) ? 'done' : ''}">●</span>`).join('')}
          </div>
        </div>
      ` : `
        <div class="awards-complete">
          <h2>🎉 TOURNAMENT COMPLETE</h2>
          <div class="awards-complete-actions">
            <button class="primary" data-action="goto-leaderboard-peoria">🔍 View Peoria Details</button>
            <button data-action="replay-awards">↻ Replay All</button>
          </div>
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

  if (key === 'flightTeam') {
    return `
      <div class="winner-card reveal-card theme-${theme}" data-key="${key}">
        <div class="winner-label">🏆 ${LABELS[key].toUpperCase()}</div>
        <div class="winner-name">${data.name}</div>
        <div class="winner-flight">${data.memberCount} MEMBERS</div>
        <div class="winner-stats">
          <div><div class="stat-label">Avg Net</div><div class="stat-val">${data.avgNet.toFixed(1)}</div></div>
          <div><div class="stat-label">Total</div><div class="stat-val">${data.totalNet}</div></div>
        </div>
        <div class="team-roster">${data.members.map(n => `<span>${n}</span>`).join('')}</div>
        <button class="replay-btn" data-action="replay-reveal" data-key="${key}">↻ Replay</button>
      </div>
    `;
  }

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
    case 'bgo':     return fromResults(results.bgo);
    case 'bno':     return fromResults(results.bno);
    case 'flightA': return fromResults(results.flightA[0]);
    case 'flightB': return fromResults(results.flightB[0]);
    case 'flightTeam': {
      // Best playing-flight by lowest avg net (ignore empty flights).
      const valid = (results.flightStandings || []).filter(s => s.memberCount > 0);
      const winner = valid[0];
      if (!winner) return null;
      const flight = flights.find(f => f.id === winner.flightId);
      const members = flight ? flight.playerIds.map(pid => {
        const p = results.perPlayer.find(x => x.playerId === pid);
        return p ? p.name : '?';
      }) : [];
      return {
        name: winner.name,
        flightName: members.join(' · '),
        members,
        avgNet: winner.avgNet,
        totalNet: winner.totalNet,
        memberCount: winner.memberCount,
        // Aliases so common code paths (animateCountUp data-target) get sensible numbers
        net: Math.round(winner.avgNet),
        gross: 0,
        handicap: 0,
      };
    }
    default: return null;
  }
}

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

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
  overlay.dataset.shake = 'idle';

  const headline = headlineFor(key, data);
  const secondary = secondaryStatsFor(key, data);
  const letterSpans = splitToLetterSpans(data.name);

  overlay.innerHTML = `
    <div class="cinema-bar cinema-bar-top"></div>
    <div class="cinema-bar cinema-bar-bottom"></div>

    <div class="overlay-content theme-${theme}">
      <div class="fx-layer-back"></div>
      <div class="fx-layer-mid"></div>
      <div class="overlay-spotlight" style="width:${cfg.spotlight}px;height:${cfg.spotlight}px"></div>

      <div class="big-title-intro ${isChampion ? 'mega' : ''}">${LABELS[key].toUpperCase()}</div>

      ${extras.includes('crown') ? '<div class="crown" style="opacity:0">👑</div>' : ''}
      ${extras.includes('haloCrown') ? '<div class="crown-halo" style="opacity:0"></div>' : ''}
      <div class="overlay-label" style="opacity:0">${LABELS[key].toUpperCase()}</div>
      <div class="overlay-countdown" data-step="3" style="opacity:0">3</div>

      <div class="overlay-name ${extras.includes('shimmerName') ? 'champion-name' : ''}" style="display:none">${letterSpans}</div>
      ${extras.includes('lensFlare') ? '<div class="lens-flare"></div>' : ''}
      <div class="overlay-flight" style="opacity:0">${data.flightName}</div>

      <div class="overlay-headline" style="opacity:0">
        <div class="headline-num" data-target="${headline.value}">0</div>
        <div class="headline-cap">${headline.label}</div>
      </div>

      <div class="overlay-stats" style="opacity:0">${secondary}</div>
      ${extras.includes('championBadge') ? '<div class="champion-badge" style="opacity:0">CHAMPION 2026</div>' : ''}
      <div class="fx-layer-front"></div>
    </div>
  `;

  const bigTitle  = overlay.querySelector('.big-title-intro');
  const labelEl   = overlay.querySelector('.overlay-label');
  const countdown = overlay.querySelector('.overlay-countdown');
  const crownEl   = overlay.querySelector('.crown');
  const haloEl    = overlay.querySelector('.crown-halo');
  const nameEl    = overlay.querySelector('.overlay-name');
  const flightEl  = overlay.querySelector('.overlay-flight');
  const headlineEl    = overlay.querySelector('.overlay-headline');
  const headlineNumEl = overlay.querySelector('.headline-num');
  const statsEl   = overlay.querySelector('.overlay-stats');
  const badgeEl   = overlay.querySelector('.champion-badge');
  const flareEl   = overlay.querySelector('.lens-flare');

  requestAnimationFrame(() => overlay.classList.add('cinema-active'));

  spawnLights(overlay, theme);
  spawnSparkles(overlay, theme, isChampion ? 70 : 40);
  triggerShake(overlay, 'tiny');

  const bigTitleHold = isChampion ? 2600 : 1900;
  setTimeout(() => triggerShake(overlay, isChampion ? 'big' : 'medium'), 600);

  setTimeout(() => {
    if (bigTitle) bigTitle.style.display = 'none';
    labelEl.style.opacity = '1';
    countdown.style.opacity = '1';
    if (crownEl) crownEl.style.opacity = '1';
    if (haloEl) haloEl.style.opacity = '1';
    startCountdownPhase();
  }, bigTitleHold);

  function startCountdownPhase() {
    const triggerCountdownAnim = () => {
      // restart the scale-in-pulse animation on every tick
      countdown.classList.remove('tick');
      void countdown.offsetWidth;
      countdown.classList.add('tick');
    };

    let step = 3;
    triggerCountdownAnim();
    spawnShockwave(overlay, theme);
    const tick = setInterval(() => {
      step--;
      if (step > 0) {
        countdown.textContent = step;
        countdown.dataset.step = step;
        triggerCountdownAnim();
        spawnShockwave(overlay, theme);
        triggerShake(overlay, 'tiny');
      } else {
        clearInterval(tick);
        countdown.style.opacity = '0';
        setTimeout(() => { countdown.style.display = 'none'; }, 250);

        spawnCurtains(overlay, theme);
        spawnGodRays(overlay, theme, isChampion ? 7 : 5);
        if (extras.includes('trophyShower')) spawnTrophyShower(overlay);
        if (extras.includes('emberRain'))    spawnEmberRain(overlay);

        // PHASE A: headline counter fades in & counts up
        setTimeout(() => {
          headlineEl.style.opacity = '1';
          const onLand = () => {
            headlineNumEl.classList.add('settled');
            triggerShake(overlay, isChampion ? 'big' : 'medium');
            setTimeout(revealNamePhase, 550);
          };
          if (isChampion) {
            animateBgoScore(headlineNumEl, headline.value, onLand);
          } else {
            // Non-BGO: relative-threshold slowdown (fast to ~75%, stepwise to target)
            animateRelativeSlowdown(headlineNumEl, headline.value, onLand);
          }
        }, 350);
      }
    }, 800);
  }

  function revealNamePhase() {
    // Un-hide the name container; trigger per-letter burst
    nameEl.style.display = '';
    nameEl.style.opacity = '1';
    revealNameByLetters(nameEl, () => {
      triggerShake(overlay, cfg.shake);
      spawnNameBurst(overlay, nameEl, theme);
      if (flareEl) {
        flareEl.classList.add('sweep');
        setTimeout(() => flareEl.classList.remove('sweep'), 1800);
      }
      flightEl.style.opacity = '1';

      setTimeout(() => {
        statsEl.style.opacity = '1';
        statsEl.querySelectorAll('.stat-val').forEach((el, idx) => {
          const target = parseInt(el.dataset.target, 10);
          setTimeout(() => {
            el.classList.add('counting');
            animateCountUp(el, target, 700, () => {
              el.classList.remove('counting');
              el.classList.add('settled');
            });
          }, idx * 180);
        });
        if (badgeEl) setTimeout(() => { badgeEl.style.opacity = '1'; badgeEl.classList.add('pop'); }, 800);

        spawnConfetti(overlay, cfg);
        spawnFireworks(overlay, cfg.fireworks, isChampion);

        setTimeout(() => {
          overlay.classList.remove('cinema-active');
          setTimeout(() => {
            overlay.dataset.active = 'false';
            overlay.innerHTML = '';
            onComplete();
          }, 600);
        }, cfg.linger);
      }, 400);
    });
  }
}

// ---------- Count-up engines ----------

function animateHeadlineScore(el, target, duration, onDone) {
  if (!Number.isFinite(target)) { el.textContent = target; onDone && onDone(); return; }
  if (target === 0) { el.textContent = '0'; onDone && onDone(); return; }
  const start = performance.now();
  // easeOutQuint — strong deceleration, slow crawl near target
  const ease = t => 1 - Math.pow(1 - t, 5);
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(ease(t) * target);
    if (t < 1) requestAnimationFrame(frame);
    else onDone && onDone();
  }
  requestAnimationFrame(frame);
}

// Non-BGO: count fast to ~75% of target, then stepwise +1 with growing pauses
// for the final 25%, ending with a 600ms hold on the final number.
// We don't know what the final net will be, so this scales with target.
function animateRelativeSlowdown(el, target, onDone) {
  if (!Number.isFinite(target)) { el.textContent = target; onDone && onDone(); return; }
  if (REDUCED_MOTION) {
    animateHeadlineScore(el, target, 1200, onDone);
    return;
  }
  const slowStart = Math.max(0, Math.floor(target * 0.75));
  const slowSteps = target - slowStart;
  if (slowSteps <= 0) {
    animateHeadlineScore(el, target, 1500, onDone);
    return;
  }
  animateHeadlineScore(el, slowStart, 1000, () => {
    let cur = slowStart;
    const tick = () => {
      if (cur >= target) { onDone && onDone(); return; }
      cur++;
      el.textContent = cur;
      el.classList.remove('step-pulse');
      void el.offsetWidth;
      el.classList.add('step-pulse');
      const fromEnd = target - cur;
      // Pauses grow linearly toward the finale; last step holds 600ms
      const dur = fromEnd === 0 ? 600 : 95 + (slowSteps - fromEnd) * 9;
      setTimeout(tick, dur);
    };
    tick();
  });
}

// BGO: glide to (target - 10), then increment one by one with pauses that grow
// — final digit holds for 1s before continuing.
function animateBgoScore(el, target, onDone) {
  if (!Number.isFinite(target)) { el.textContent = target; onDone && onDone(); return; }
  if (REDUCED_MOTION) {
    animateHeadlineScore(el, target, 1500, onDone);
    return;
  }
  const slowStart = Math.max(0, target - 10);
  animateHeadlineScore(el, slowStart, 1500, () => {
    let cur = slowStart;
    const tick = () => {
      if (cur >= target) { onDone && onDone(); return; }
      cur++;
      el.textContent = cur;
      // restart the per-step pulse animation
      el.classList.remove('step-pulse');
      void el.offsetWidth;
      el.classList.add('step-pulse');
      // Tighter near start of phase, longer as we approach the final number
      const fromEnd = target - cur; // 9 down to 0
      const dur = fromEnd === 0 ? 1000 : 220 + (9 - fromEnd) * 50;
      setTimeout(tick, dur);
    };
    tick();
  });
}

function animateCountUp(el, target, duration = 800, onDone) {
  if (!Number.isFinite(target)) { el.textContent = target; onDone && onDone(); return; }
  if (target === 0) { el.textContent = '0'; onDone && onDone(); return; }
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(ease(t) * target);
    if (t < 1) requestAnimationFrame(frame);
    else onDone && onDone();
  }
  requestAnimationFrame(frame);
}

// ---------- Letter helpers ----------

function splitToLetterSpans(text) {
  return Array.from(text).map((ch, i) => {
    if (ch === ' ') return `<span class="ltr space" style="--li:${i}"> </span>`;
    return `<span class="ltr" style="--li:${i}">${escapeHTML(ch)}</span>`;
  }).join('');
}

function escapeHTML(ch) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return map[ch] || ch;
}

function revealNameByLetters(nameEl, onDone) {
  nameEl.style.opacity = '1';
  const letters = nameEl.querySelectorAll('.ltr');
  const stagger = REDUCED_MOTION ? 0 : 65;
  letters.forEach((l, i) => {
    setTimeout(() => l.classList.add('in'), i * stagger);
  });
  setTimeout(onDone, letters.length * stagger + 500);
}

// ---------- Effect builders ----------

function triggerShake(overlay, intensity) {
  if (REDUCED_MOTION) return;
  overlay.dataset.shake = intensity;
  const ms = intensity === 'mega' ? 700 : intensity === 'big' ? 500 : intensity === 'medium' ? 350 : 220;
  setTimeout(() => { overlay.dataset.shake = 'idle'; }, ms);
}

function spawnLights(overlay, theme) {
  const back = overlay.querySelector('.fx-layer-back');
  if (!back) return;
  const beamColors = {
    emerald: 'rgba(60,203,127,0.22)',
    silver:  'rgba(220,220,230,0.22)',
    gold:    'rgba(255,215,90,0.22)',
    royal:   'rgba(59,130,246,0.26)',
    champion:'rgba(255,215,90,0.28)',
  };
  const color = beamColors[theme];
  const count = theme === 'champion' ? 7 : 5;
  for (let i = 0; i < count; i++) {
    const beam = document.createElement('div');
    beam.className = 'stadium-beam';
    beam.style.setProperty('--delay', (i * 180) + 'ms');
    beam.style.setProperty('--angle', (-30 + i * (60 / count)) + 'deg');
    beam.style.setProperty('--beam-color', color);
    back.appendChild(beam);
  }
}

function spawnSparkles(overlay, theme, count) {
  if (REDUCED_MOTION) return;
  const back = overlay.querySelector('.fx-layer-back');
  if (!back) return;
  const colors = {
    emerald: ['#88e0a8','#FFFFFF','#3CCB7F'],
    silver:  ['#FFFFFF','#E8E8E8','#C0C0C0'],
    gold:    ['#FFD75A','#FFFFFF','#FFEC8B'],
    royal:   ['#93C5FD','#FFFFFF','#3B82F6'],
    champion:['#FFD75A','#FFFFFF','#FF6B6B'],
  }[theme];
  const wrap = document.createElement('div');
  wrap.className = 'sparkles';
  back.appendChild(wrap);
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.style.setProperty('--sx', Math.random() * 100 + '%');
    s.style.setProperty('--sy', Math.random() * 100 + '%');
    s.style.setProperty('--sd', (1.6 + Math.random() * 2.6) + 's');
    s.style.setProperty('--sdy', (Math.random() * 5) + 's');
    s.style.setProperty('--ssz', (2 + Math.random() * 4) + 'px');
    s.style.background = colors[i % colors.length];
    wrap.appendChild(s);
  }
}

function spawnShockwave(overlay, theme) {
  if (REDUCED_MOTION) return;
  const mid = overlay.querySelector('.fx-layer-mid');
  if (!mid) return;
  const ring = document.createElement('div');
  ring.className = `shockwave shockwave-${theme}`;
  mid.appendChild(ring);
  setTimeout(() => ring.remove(), 900);
}

function spawnGodRays(overlay, theme, count) {
  if (REDUCED_MOTION) return;
  const back = overlay.querySelector('.fx-layer-back');
  if (!back) return;
  const wrap = document.createElement('div');
  wrap.className = `god-rays god-rays-${theme}`;
  for (let i = 0; i < count; i++) {
    const ray = document.createElement('span');
    ray.style.setProperty('--rd', (i * 90) + 'ms');
    ray.style.setProperty('--ra', (-30 + (i * (60 / Math.max(1, count - 1)))) + 'deg');
    wrap.appendChild(ray);
  }
  back.appendChild(wrap);
  setTimeout(() => wrap.classList.add('fade'), 1800);
  setTimeout(() => wrap.remove(), 3200);
}

function spawnNameBurst(overlay, nameEl, theme) {
  if (REDUCED_MOTION) return;
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  const colors = {
    emerald: ['#3CCB7F','#FFFFFF','#88e0a8'],
    silver:  ['#FFFFFF','#C0C0C0','#E8E8E8'],
    gold:    ['#FFD75A','#FFFFFF','#FFB347'],
    royal:   ['#3B82F6','#FFFFFF','#93C5FD','#FFD75A'],
    champion:['#FFD75A','#FFFFFF','#B71C2C','#FFB347'],
  }[theme];
  const rect = nameEl.getBoundingClientRect();
  const ovRect = overlay.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - ovRect.left;
  const cy = rect.top + rect.height / 2 - ovRect.top;
  const burst = document.createElement('div');
  burst.className = 'name-burst';
  burst.style.left = cx + 'px';
  burst.style.top  = cy + 'px';
  const n = 36;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    const angle = (i / n) * 360 + Math.random() * 8;
    const dist = 140 + Math.random() * 160;
    p.style.setProperty('--bx', Math.cos(angle * Math.PI/180) * dist + 'px');
    p.style.setProperty('--by', Math.sin(angle * Math.PI/180) * dist + 'px');
    p.style.background = colors[i % colors.length];
    burst.appendChild(p);
  }
  front.appendChild(burst);
  setTimeout(() => burst.remove(), 1400);
}

function spawnCurtains(overlay, theme) {
  const mid = overlay.querySelector('.fx-layer-mid');
  if (!mid) return;
  const colors = {
    emerald: ['#0f3a28', '#3CCB7F', '#0f3a28'],
    silver:  ['#3a3a3a', '#C0C0C0', '#3a3a3a'],
    gold:    ['#6b4f15', '#FFD75A', '#6b4f15'],
    royal:   ['#0c1738', '#3B82F6', '#0c1738'],
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
      const particles = mega ? 36 : 24;
      for (let j = 0; j < particles; j++) {
        const p = document.createElement('span');
        const angle = (j / particles) * 360;
        const dist = 80 + Math.random() * 100;
        p.style.setProperty('--tx', Math.cos(angle * Math.PI/180) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle * Math.PI/180) * dist + 'px');
        p.style.background = palette[j % palette.length];
        burst.appendChild(p);
      }
      front.appendChild(burst);
      setTimeout(() => burst.remove(), 1600);
    }, 500 + i * 550);
  }
}

function spawnTrophyShower(overlay) {
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  const trophies = ['🏆','🥇','⭐','✨'];
  for (let i = 0; i < 16; i++) {
    setTimeout(() => {
      const t = document.createElement('div');
      t.className = 'flying-trophy';
      t.textContent = trophies[i % trophies.length];
      t.style.left = Math.random() * 90 + '%';
      t.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      t.style.setProperty('--dur', (2 + Math.random() * 1.5) + 's');
      front.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    }, i * 220);
  }
}

function spawnEmberRain(overlay) {
  if (REDUCED_MOTION) return;
  const front = overlay.querySelector('.fx-layer-front');
  if (!front) return;
  const wrap = document.createElement('div');
  wrap.className = 'ember-rain';
  front.appendChild(wrap);
  for (let i = 0; i < 60; i++) {
    const e = document.createElement('span');
    e.className = 'ember';
    e.style.left = Math.random() * 100 + '%';
    e.style.setProperty('--ed', (Math.random() * 2.2) + 's');
    e.style.setProperty('--ev', (3 + Math.random() * 3) + 's');
    e.style.setProperty('--ex', (Math.random() * 80 - 40) + 'px');
    e.style.setProperty('--es', (2 + Math.random() * 4) + 'px');
    wrap.appendChild(e);
  }
  setTimeout(() => wrap.remove(), 7500);
}
