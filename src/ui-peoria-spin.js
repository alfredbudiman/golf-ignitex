import { categorizeHoles } from './peoria.js';

// Slot-machine reveal for the Peoria draw. Each par category (3 / 4 / 5)
// resolves in turn: its category lights up, its two reels cycle random
// candidate holes and lock one by one, then the next category takes over.
// Calls onComplete() once all six holes have settled.
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
        <div class="ps-group" data-g="${gi}" style="--gi:${gi}">
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

  const caption = overlay.querySelector('.ps-caption');
  const groupEls = groups.map((_, gi) => overlay.querySelector(`.ps-group[data-g="${gi}"]`));

  // Per-group reel descriptors
  const groupReels = groups.map((g, gi) =>
    g.picks.map((target, ri) => {
      const el = overlay.querySelector(`.ps-reel[data-g="${gi}"][data-r="${ri}"]`);
      return { el, numEl: el ? el.querySelector('.ps-num') : null, pool: g.pool, target };
    }).filter(r => r.el)
  );

  const finish = () => {
    overlay.classList.add('closing');
    setTimeout(() => { overlay.remove(); onComplete(); }, 480);
  };

  if (reduce) {
    groupReels.flat().forEach(r => { r.numEl.textContent = r.target; r.el.classList.add('locked'); });
    setTimeout(finish, 900);
    return;
  }

  // Every reel spins continuously until its own lock fires.
  const spinHandles = groupReels.flat().map(r => setInterval(() => {
    r.numEl.textContent = r.pool[Math.floor(Math.random() * r.pool.length)];
  }, 75));

  // Timing (ms) — slower + staged so each par category reads clearly.
  const FIRST = 1500;     // delay before the first category resolves
  const REEL_GAP = 750;   // gap between the two reels of one category locking
  const GROUP_GAP = 1150; // pause after a category finishes before the next starts

  const lockReel = (r) => {
    if (spinHandles.length) {
      const idx = groupReels.flat().indexOf(r);
      clearInterval(spinHandles[idx]);
    }
    r.numEl.textContent = r.target;
    r.el.classList.add('locked');
    r.el.classList.remove('pop'); void r.el.offsetWidth; r.el.classList.add('pop');
  };

  // Once staging begins, pending categories dim so the active one stands out.
  setTimeout(() => overlay.classList.add('staging'), Math.max(0, FIRST - 350));

  let t = FIRST;
  const lastLockTimes = [];
  groups.forEach((g, gi) => {
    const reels = groupReels[gi];
    const groupStart = t;
    // Highlight the category about to resolve
    setTimeout(() => {
      groupEls.forEach((el, i) => el.classList.toggle('resolving', i === gi));
      if (caption) caption.textContent = `Mengundi ${g.label}…`;
    }, Math.max(0, groupStart - 350));

    reels.forEach((r, ri) => {
      const lockAt = groupStart + ri * REEL_GAP;
      setTimeout(() => lockReel(r), lockAt);
      lastLockTimes.push(lockAt);
    });

    // Mark category done after its reels lock
    const groupDone = groupStart + Math.max(0, reels.length - 1) * REEL_GAP + 250;
    setTimeout(() => {
      groupEls[gi].classList.remove('resolving');
      groupEls[gi].classList.add('done');
    }, groupDone);

    t = groupStart + Math.max(0, reels.length - 1) * REEL_GAP + REEL_GAP + GROUP_GAP;
  });

  const allLocked = lastLockTimes.length ? Math.max(...lastLockTimes) + 300 : 0;
  setTimeout(() => {
    overlay.classList.add('all-locked');
    if (caption) caption.textContent = '✓ Peoria holes terpilih!';
  }, allLocked);

  setTimeout(finish, allLocked + 1600);
}
