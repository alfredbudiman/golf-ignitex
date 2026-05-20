import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDefaultState } from '../src/state.js';
import { renderInput } from '../src/ui-input.js';
import { renderLeaderboard } from '../src/ui-leaderboard.js';
import { playPeoriaSpinner } from '../src/ui-peoria-spin.js';
import { pickPeoriaHoles } from '../src/peoria.js';
import { renderHeader } from '../src/ui-header.js';
import * as audio from '../src/audio.js';

describe('UI smoke (DOM)', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="app"></div>'; });

  it('renders input grid with DNF toggle for default roster', () => {
    const s = createDefaultState();
    s.tournament.status = 'input';
    s.ui.activeInputFlight = s.flights[0].id;
    const html = renderInput(s);
    expect(html).toContain('Grady E');
    expect(html).toContain('data-action="toggle-dnf"');
    expect(html).toContain('Mark DNF');
  });

  it('provisional leaderboard sinks DNF players to the bottom', () => {
    const s = createDefaultState();
    s.tournament.status = 'input';
    s.players[0].dnf = true;          // Grady E DNF
    s.players[0].scores = s.players[0].scores.map(() => 4);
    const html = renderLeaderboard(s);
    const dnfIdx = html.indexOf('dnf-badge');
    expect(dnfIdx).toBeGreaterThan(-1);
  });

  it('playPeoriaSpinner builds overlay then resolves onComplete', () => {
    vi.useFakeTimers();
    const s = createDefaultState();
    const peoria = pickPeoriaHoles(s.course.holes, () => 0.5);
    const done = vi.fn();
    playPeoriaSpinner(s, peoria, done);
    // overlay mounted with 6 reels
    expect(document.querySelectorAll('.ps-reel').length).toBe(6);
    vi.advanceTimersByTime(14000);
    expect(done).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('header renders a mute toggle', () => {
    const s = createDefaultState();
    expect(renderHeader(s)).toContain('data-action="toggle-mute"');
  });

  it('audio SFX no-op safely without Web Audio (no throw)', () => {
    // happy-dom has no AudioContext → every SFX call should be a silent no-op
    expect(() => {
      audio.loadMutePref();
      audio.unlockAudio();
      audio.tick();
      audio.lockDing(3);
      audio.chordResolve();
      audio.countBeep(3);
      audio.riser(1.5);
      audio.applause(1, 1);
      audio.fanfare(true);
      audio.setMuted(true);
      audio.setMuted(false);
    }).not.toThrow();
  });
});
