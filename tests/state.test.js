import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyState, validateSetup, validateInput,
  MODERN_LAND_PARS, getPlayerFlight, newId
} from '../src/state.js';

describe('createEmptyState', () => {
  it('returns state with default tournament metadata', () => {
    const s = createEmptyState();
    expect(s.tournament.name).toBe('The Ignitex Gobar');
    expect(s.tournament.venue).toBe('Modern Land Golf Club');
    expect(s.tournament.date).toBe('2026-05-22');
    expect(s.tournament.status).toBe('setup');
    expect(s.course.holes).toHaveLength(18);
    expect(s.course.holes.map(h => h.par)).toEqual(MODERN_LAND_PARS);
    expect(s.flights).toEqual([]);
    expect(s.players).toEqual([]);
    expect(s.peoriaHoles).toBeNull();
    expect(s.results).toBeNull();
  });
});

describe('newId', () => {
  it('generates unique ids', () => {
    const a = newId();
    const b = newId();
    expect(a).not.toBe(b);
  });
});

describe('validateSetup', () => {
  let state;
  beforeEach(() => { state = createEmptyState(); });

  it('fails when no players', () => {
    const r = validateSetup(state);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Minimum 2 players required');
  });

  it('fails when par total ≠ 72', () => {
    state.course.holes[0].par = 6;
    state.flights = [{ id: 'f1', name: 'Flight 1', playerIds: ['p1', 'p2'] }];
    state.players = [
      { id: 'p1', name: 'A', scores: Array(18).fill(null) },
      { id: 'p2', name: 'B', scores: Array(18).fill(null) }
    ];
    const r = validateSetup(state);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/Par total/i);
  });

  it('fails when a flight has > 5 players', () => {
    state.flights = [{ id: 'f1', name: 'Flight 1', playerIds: ['p1','p2','p3','p4','p5','p6'] }];
    state.players = Array.from({length:6}, (_, i) => ({ id: `p${i+1}`, name: `P${i+1}`, scores: Array(18).fill(null) }));
    const r = validateSetup(state);
    expect(r.errors.some(e => /max 5/i.test(e))).toBe(true);
  });

  it('passes with valid setup', () => {
    state.flights = [{ id: 'f1', name: 'Flight 1', playerIds: ['p1', 'p2'] }];
    state.players = [
      { id: 'p1', name: 'A', scores: Array(18).fill(null) },
      { id: 'p2', name: 'B', scores: Array(18).fill(null) }
    ];
    expect(validateSetup(state).valid).toBe(true);
  });
});

describe('validateInput', () => {
  it('lists empty cells by player', () => {
    const state = createEmptyState();
    state.flights = [{ id: 'f1', name: 'F1', playerIds: ['p1','p2'] }];
    state.players = [
      { id: 'p1', name: 'A', scores: [4,4,3,4,5,3,4,4,4,4,3,4,4,5,4,4,3,5] },
      { id: 'p2', name: 'B', scores: [4,4,3,4,null,3,4,4,4,null,3,4,4,5,4,4,3,5] }
    ];
    const r = validateInput(state);
    expect(r.valid).toBe(false);
    expect(r.emptyCellsBy.p2).toEqual([4, 9]);
    expect(r.emptyCellsBy.p1).toBeUndefined();
  });

  it('passes when all scores filled', () => {
    const state = createEmptyState();
    const fullScores = [4,4,3,4,5,3,4,4,4,4,3,4,4,5,4,4,3,5];
    state.flights = [{ id: 'f1', name: 'F1', playerIds: ['p1'] }];
    state.players = [{ id: 'p1', name: 'A', scores: fullScores }];
    expect(validateInput(state).valid).toBe(true);
  });
});

describe('getPlayerFlight', () => {
  it('returns flight containing player', () => {
    const state = createEmptyState();
    state.flights = [
      { id: 'f1', name: 'F1', playerIds: ['p1','p2'] },
      { id: 'f2', name: 'F2', playerIds: ['p3','p4'] }
    ];
    expect(getPlayerFlight(state, 'p3').id).toBe('f2');
  });
  it('returns null when player not in any flight', () => {
    const state = createEmptyState();
    expect(getPlayerFlight(state, 'pX')).toBeNull();
  });
});

import { loadState, saveState, clearState, STORAGE_KEY } from '../src/state.js';

describe('localStorage roundtrip', () => {
  beforeEach(() => localStorage.clear());

  it('saves and loads', () => {
    const s = createEmptyState();
    s.tournament.status = 'finalized';
    s.players = [{ id: 'p1', name: 'X', scores: Array(18).fill(4) }];
    saveState(s);
    const loaded = loadState();
    expect(loaded.tournament.status).toBe('finalized');
    expect(loaded.players[0].name).toBe('X');
  });

  it('returns empty state when no data', () => {
    localStorage.clear();
    const loaded = loadState();
    expect(loaded.tournament.status).toBe('setup');
  });

  it('clearState removes data', () => {
    saveState(createEmptyState());
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearState();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns empty on corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    const loaded = loadState();
    expect(loaded.tournament.status).toBe('setup');
  });
});
