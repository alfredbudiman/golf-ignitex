import { describe, it, expect } from 'vitest';
import { generateDemoTournament, fillRandomScores, DEMO_NAMES } from '../src/demo.js';

describe('DEMO_NAMES', () => {
  it('has at least 24 distinct names', () => {
    expect(new Set(DEMO_NAMES).size).toBeGreaterThanOrEqual(24);
  });
});

describe('generateDemoTournament', () => {
  it('returns state with 6 flights × 4 players = 24 players, all scores filled, status=input', () => {
    const s = generateDemoTournament();
    expect(s.flights).toHaveLength(6);
    s.flights.forEach(f => expect(f.playerIds).toHaveLength(4));
    expect(s.players).toHaveLength(24);
    s.players.forEach(p => {
      expect(p.scores.every(v => Number.isInteger(v))).toBe(true);
      expect(p.scores).toHaveLength(18);
    });
    expect(s.tournament.status).toBe('input');
  });

  it('scores respect double-par cap per hole', () => {
    const s = generateDemoTournament();
    for (const p of s.players) {
      for (let i = 0; i < 18; i++) {
        const par = s.course.holes[i].par;
        expect(p.scores[i]).toBeLessThanOrEqual(par * 2);
        expect(p.scores[i]).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('tee times spaced 8 minutes apart starting 07:00', () => {
    const s = generateDemoTournament();
    expect(s.flights[0].teeTime).toBe('07:00');
    expect(s.flights[1].teeTime).toBe('07:08');
    expect(s.flights[5].teeTime).toBe('07:40');
  });
});

describe('fillRandomScores', () => {
  it('fills only null cells, preserves existing', () => {
    const state = generateDemoTournament();
    state.players[0].scores[0] = 9;  // existing manual entry (within cap for par 5)
    state.players[1].scores = Array(18).fill(null);
    const result = fillRandomScores(state);
    expect(result.players[0].scores[0]).toBe(9);
    expect(result.players[1].scores.every(v => v !== null)).toBe(true);
  });
});
