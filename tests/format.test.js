import { describe, it, expect } from 'vitest';
import { formatOver, overColor, parseScoreInput } from '../src/format.js';

describe('formatOver', () => {
  it('returns "E" for zero', () => { expect(formatOver(0)).toBe('E'); });
  it('plus sign for positive', () => {
    expect(formatOver(1)).toBe('+1');
    expect(formatOver(5)).toBe('+5');
  });
  it('minus sign for negative', () => {
    expect(formatOver(-1)).toBe('-1');
    expect(formatOver(-2)).toBe('-2');
  });
});

describe('overColor', () => {
  it('returns "under" for negative', () => { expect(overColor(-1)).toBe('under'); });
  it('returns "par" for zero', () => { expect(overColor(0)).toBe('par'); });
  it('returns "over-1" for +1', () => { expect(overColor(1)).toBe('over-1'); });
  it('returns "over-2plus" for +2 or more', () => {
    expect(overColor(2)).toBe('over-2plus');
    expect(overColor(3)).toBe('over-2plus');
  });
});

describe('parseScoreInput', () => {
  it('parses "+3" as 3', () => { expect(parseScoreInput('+3')).toBe(3); });
  it('parses "-1" as -1', () => { expect(parseScoreInput('-1')).toBe(-1); });
  it('parses bare "2" as 2', () => { expect(parseScoreInput('2')).toBe(2); });
  it('parses "0" as 0', () => { expect(parseScoreInput('0')).toBe(0); });
  it('returns null for empty string', () => { expect(parseScoreInput('')).toBeNull(); });
  it('returns null for non-numeric', () => { expect(parseScoreInput('abc')).toBeNull(); });
});
