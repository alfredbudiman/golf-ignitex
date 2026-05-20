// Synthesized sound effects via Web Audio — no audio files needed, works in
// the single-file build and offline. Every function no-ops gracefully when
// Web Audio is unavailable (e.g. tests) or when muted.

let ctx = null;
let muted = false;

export function loadMutePref() {
  try { muted = (typeof localStorage !== 'undefined') && localStorage.getItem('ignitex-muted') === '1'; } catch { muted = false; }
  return muted;
}
export function isMuted() { return muted; }
export function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem('ignitex-muted', muted ? '1' : '0'); } catch { /* ignore */ }
  if (muted && ctx && ctx.state === 'running') ctx.suspend();
}

function ac() {
  if (muted) return null;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) { try { ctx = new AC(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Call from a user gesture (e.g. first click) so the context is unlocked.
export function unlockAudio() { ac(); }

// ---------- primitives ----------

function tone(freq, start, dur, { type = 'sine', gain = 0.18, glideTo = null } = {}) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.04);
}

function noiseBurst(start, dur, { gain = 0.18, freq = 1200, q = 0.7 } = {}) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + start;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buffer;
  const flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = freq; flt.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt).connect(g).connect(c.destination);
  src.start(t0); src.stop(t0 + dur + 0.02);
}

// ---------- spinner SFX ----------

// Soft tick while reels are cycling (call repeatedly on a timer).
export function tick() { noiseBurst(0, 0.03, { gain: 0.05, freq: 2600, q: 1.2 }); }

// Bright "ding" when a reel locks; pitch can rise per category.
export function lockDing(step = 0) {
  const base = 880 * Math.pow(2, step / 12);   // semitone steps up
  tone(base, 0, 0.22, { type: 'triangle', gain: 0.16 });
  tone(base * 1.5, 0.005, 0.22, { type: 'sine', gain: 0.10 });
}

// Little resolving chord once all six holes are locked.
export function chordResolve() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, i * 0.06, 0.5, { type: 'sine', gain: 0.12 }));
}

// ---------- reveal SFX ----------

export function countBeep(step) {
  // step 3,2,1 → rising pitch for tension
  const freq = step <= 1 ? 1320 : step === 2 ? 990 : 740;
  tone(freq, 0, step <= 1 ? 0.4 : 0.16, { type: 'square', gain: 0.12 });
}

// Rising "riser" under the score count-up; dur in seconds.
export function riser(dur = 1.6) {
  tone(220, 0, dur, { type: 'sawtooth', gain: 0.07, glideTo: 880 });
}

// Synthesized clapping: many short filtered noise bursts.
export function applause(dur = 2.4, intensity = 1) {
  const c = ac(); if (!c) return;
  const claps = Math.floor(60 * intensity * dur);
  for (let i = 0; i < claps; i++) {
    const t = Math.random() * dur;
    noiseBurst(t, 0.025 + Math.random() * 0.03, {
      gain: 0.015 + Math.random() * 0.03,
      freq: 1500 + Math.random() * 2500,
      q: 0.6,
    });
  }
}

// Triumphant fanfare; `big` adds brass + extra flourish for the champion.
export function fanfare(big = false) {
  const c = ac(); if (!c) return;
  const root = big ? 392 : 523.25;            // G4 vs C5
  const seq = [0, 4, 7, 12];                  // major arpeggio (semitones)
  seq.forEach((s, i) => {
    const f = root * Math.pow(2, s / 12);
    tone(f, i * 0.13, 0.45, { type: big ? 'sawtooth' : 'triangle', gain: big ? 0.16 : 0.13 });
    if (big) tone(f / 2, i * 0.13, 0.45, { type: 'sawtooth', gain: 0.08 }); // octave-below brass
  });
  // Held top chord
  const topAt = seq.length * 0.13;
  [0, 7, 12].forEach((s) => tone(root * Math.pow(2, s / 12), topAt, big ? 1.1 : 0.7, {
    type: big ? 'sawtooth' : 'triangle', gain: big ? 0.13 : 0.1,
  }));
  if (big) tone(root * 2, topAt, 1.2, { type: 'triangle', gain: 0.12 });
}
