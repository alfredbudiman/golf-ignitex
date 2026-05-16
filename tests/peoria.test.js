import { describe, it, expect } from 'vitest';
import {
  categorizeHoles,
  pickPeoriaHoles,
  capScore,
  computeGross,
  computePeoriaOver,
  computeHandicap,
  computeNet,
  compareNetTiebreak,
  splitFlights,
  computePlayerResult,
} from '../src/peoria.js';

const MODERN_LAND_HOLES = [
  { number: 1, par: 5 }, { number: 2, par: 4 }, { number: 3, par: 3 },
  { number: 4, par: 4 }, { number: 5, par: 5 }, { number: 6, par: 3 },
  { number: 7, par: 4 }, { number: 8, par: 4 }, { number: 9, par: 4 },
  { number: 10, par: 4 }, { number: 11, par: 3 }, { number: 12, par: 4 },
  { number: 13, par: 4 }, { number: 14, par: 5 }, { number: 15, par: 4 },
  { number: 16, par: 4 }, { number: 17, par: 3 }, { number: 18, par: 5 }
];

describe('categorizeHoles', () => {
  it('groups Modern Land par 72 holes by par', () => {
    const result = categorizeHoles(MODERN_LAND_HOLES);
    expect(result.par3).toEqual([3, 6, 11, 17]);
    expect(result.par4).toEqual([2, 4, 7, 8, 9, 10, 12, 13, 15, 16]);
    expect(result.par5).toEqual([1, 5, 14, 18]);
  });
});

describe('pickPeoriaHoles', () => {
  it('picks 2 par-3, 2 par-4, 2 par-5 holes with stratified random', () => {
    let i = 0;
    const seq = [0.0, 0.3, 0.0, 0.2, 0.5, 0.7, 0.1, 0.4];
    const rng = () => seq[i++ % seq.length];

    const picked = pickPeoriaHoles(MODERN_LAND_HOLES, rng);

    expect(picked.par3).toHaveLength(2);
    expect(picked.par4).toHaveLength(2);
    expect(picked.par5).toHaveLength(2);
    expect(picked.par3.every(n => [3,6,11,17].includes(n))).toBe(true);
    expect(picked.par4.every(n => [2,4,7,8,9,10,12,13,15,16].includes(n))).toBe(true);
    expect(picked.par5.every(n => [1,5,14,18].includes(n))).toBe(true);
    expect(new Set(picked.par3).size).toBe(2);
    expect(new Set(picked.par4).size).toBe(2);
    expect(new Set(picked.par5).size).toBe(2);
    expect(picked.all).toHaveLength(6);
    expect(picked.all).toEqual([...picked.all].sort((a, b) => a - b));
  });

  it('returns different selections across multiple calls with Math.random', () => {
    const a = pickPeoriaHoles(MODERN_LAND_HOLES, Math.random);
    const b = pickPeoriaHoles(MODERN_LAND_HOLES, Math.random);
    const c = pickPeoriaHoles(MODERN_LAND_HOLES, Math.random);
    const same = (x, y) => JSON.stringify(x.all) === JSON.stringify(y.all);
    expect(same(a, b) && same(b, c)).toBe(false);
  });
});

describe('capScore', () => {
  it('caps at 2*par', () => {
    expect(capScore(3, 7)).toBe(6);
    expect(capScore(4, 9)).toBe(8);
    expect(capScore(5, 11)).toBe(10);
  });
  it('returns stroke when under cap', () => {
    expect(capScore(4, 4)).toBe(4);
    expect(capScore(4, 3)).toBe(3);
  });
});

describe('computeGross', () => {
  it('sums all 18 strokes', () => {
    expect(computeGross([4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4])).toBe(72);
  });
});

describe('computePeoriaOver', () => {
  it('sums (stroke - par) over the picked holes only', () => {
    const scores = MODERN_LAND_HOLES.map(h => h.par + 1);
    const peoria = { all: [1, 3, 5, 8, 12, 17] };
    expect(computePeoriaOver(scores, MODERN_LAND_HOLES, peoria)).toBe(6);
  });

  it('handles birdies (negative over) and double-par cap', () => {
    const scores = MODERN_LAND_HOLES.map(h => h.par);
    scores[0] = 3;
    scores[2] = 6;
    const peoria = { all: [1, 3] };
    expect(computePeoriaOver(scores, MODERN_LAND_HOLES, peoria)).toBe(1);
  });
});

describe('computeHandicap', () => {
  it('multiplies over by 3 without cap', () => {
    expect(computeHandicap(8)).toBe(24);
    expect(computeHandicap(20)).toBe(60);
    expect(computeHandicap(0)).toBe(0);
  });
});

describe('computeNet', () => {
  it('gross minus handicap', () => {
    expect(computeNet(85, 24)).toBe(61);
  });
});

describe('compareNetTiebreak', () => {
  it('lower net wins', () => {
    expect(compareNetTiebreak({ net: 60, handicap: 20, name: 'A' }, { net: 61, handicap: 20, name: 'B' })).toBeLessThan(0);
  });
  it('on net tie, lower handicap wins', () => {
    expect(compareNetTiebreak({ net: 60, handicap: 12, name: 'A' }, { net: 60, handicap: 18, name: 'B' })).toBeLessThan(0);
  });
  it('on handicap tie, alphabetical by name', () => {
    expect(compareNetTiebreak({ net: 60, handicap: 18, name: 'Andi' }, { net: 60, handicap: 18, name: 'Budi' })).toBeLessThan(0);
  });
});

describe('splitFlights', () => {
  const makeResults = (data) =>
    data.map(([id, gross, net, hcp, name]) => ({ playerId: id, gross, net, handicap: hcp, name }));

  it('excludes BGO and BNO from flight pools (same player wins both)', () => {
    const results = makeResults([
      ['p1', 70, 55, 15, 'Alice'],
      ['p2', 80, 56, 24, 'Bob'],
      ['p3', 75, 60, 15, 'Cara'],
      ['p4', 82, 65, 17, 'Dan'],
    ]);
    const { bgo, bno, flightA, flightB } = splitFlights(results);
    expect(bgo.playerId).toBe('p1');
    expect(bno.playerId).toBe('p1');
    expect(flightA.map(r => r.playerId)).toEqual(['p2', 'p3']);
    expect(flightB.map(r => r.playerId)).toEqual(['p4']);
  });

  it('handles BGO != BNO (different players)', () => {
    const results = makeResults([
      ['p1', 72, 60, 12, 'Alice'],
      ['p2', 80, 55, 25, 'Bob'],
      ['p3', 75, 58, 17, 'Cara'],
      ['p4', 78, 62, 16, 'Dan'],
      ['p5', 82, 65, 17, 'Eli'],
    ]);
    const { bgo, bno, flightA, flightB } = splitFlights(results);
    expect(bgo.playerId).toBe('p1');
    expect(bno.playerId).toBe('p2');
    expect(flightA.map(r => r.playerId)).toEqual(['p3', 'p4']);
    expect(flightB.map(r => r.playerId)).toEqual(['p5']);
  });
});
