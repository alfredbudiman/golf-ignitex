import { categorizeHoles } from './peoria.js';

// Slot-machine reveal for the Peoria draw: PAR 3 / PAR 4 / PAR 5 each spin two
// reels that cycle random candidate holes, then lock onto the chosen holes one
// by one. Calls onComplete() once all six have settled.
export function playPeoriaSpinner(state, peoriaHoles, onComplete) {
  if (typeof document === 'undefined') { onComplete(); return; }

  const reduce = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cats = categorizeHoles(state.course.holes);
  const groups = [
    { label: 'PAR 3', pool: cats.par3, picks: peoriaHoles.par3 || [] },
    { label: 'PAR 4', pool: cats.par4, picks: peoriaHoles.par4 || [] },
    { label: 'PAR 5', pool: cats.par5, picks: peoriaHoles.par5 || [] },
  ];

  const overlay = document.createElement('div');
  overlay.className = 'peoria-spin-overlay';
  overlay.innerHTML = `
    <div class="ps-eyebrow">— MENENTUKAN PEORIA HOLES —</div>
    <h1 class="ps-title">🎲 RANDOM HOLE DRAW</h1>
    <div class="ps-groups">
      ${groups.map((g, gi) => `
        <div class="ps-group" style="--gi:${gi}">
          <div class="ps-group-label">${g.label}</div>
          <div class="ps-reels">
            ${g.picks.map((_, ri) => `
              <div class="ps-reel" data-g="${gi}" data-r="${ri}"><span class="ps-num">--</span></div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    <div class="ps-caption">Memilih 2 hole acak per kategori…</div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  // Flatten reels in spin order: par3 ×2, par4 ×2, par5 ×2
  const reels = [];
  groups.forEach((g, gi) => {
    g.picks.forEach((target, ri) => {
      const el = overlay.querySelector(`.ps-reel[data-g="${gi}"][data-r="${ri}"]`);
      if (el) reels.push({ el, numEl: el.querySelector('.ps-num'), pool: g.pool, target });
    });
  });

  const finish = () => {
    overlay.classList.add('closing');
    setTimeout(() => { overlay.remove(); onComplete(); }, 480);
  };

  if (reduce || reels.length === 0) {
    reels.forEach(r => { r.numEl.textContent = r.target; r.el.classList.add('locked'); });
    setTimeout(finish, reels.length ? 900 : 0);
    return;
  }

  // Every reel cycles random candidates until it is locked.
  const intervals = reels.map(r => setInterval(() => {
    r.numEl.textContent = r.pool[Math.floor(Math.random() * r.pool.length)];
  }, 70));

  const firstLock = 1100;
  const lockGap = 520;
  reels.forEach((r, i) => {
    setTimeout(() => {
      clearInterval(intervals[i]);
      r.numEl.textContent = r.target;
      r.el.classList.add('locked');
      // restart the lock pop animation
      r.el.classList.remove('pop'); void r.el.offsetWidth; r.el.classList.add('pop');
    }, firstLock + i * lockGap);
  });

  const allLocked = firstLock + reels.length * lockGap;
  setTimeout(() => {
    overlay.classList.add('all-locked');
    const cap = overlay.querySelector('.ps-caption');
    if (cap) cap.textContent = '✓ Peoria holes terpilih!';
  }, allLocked + 120);

  setTimeout(finish, allLocked + 1500);
}
