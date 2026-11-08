import { expect, it } from 'vitest';
import { countInBeat } from './countIn';

it('counts in at the tempo, or at the recording\'s pace where play starts', () => {
  expect(countInBeat(120, null, 0)).toBe(0.5);
  expect(countInBeat(120, [1, 1.6, 2.2, 2.6, 3.0], 2)).toBeCloseTo(0.4); // the music speeds up at count 2
  expect(countInBeat(120, [1, 1.6, 2.2], 0)).toBeCloseTo(0.6);
  expect(countInBeat(90, [1, 1, 1], 0)).toBeCloseTo(60 / 90); // taps that make no sense: the tempo
});
