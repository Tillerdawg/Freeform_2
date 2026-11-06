import { expect, it } from 'vitest';
import { countsToClick } from './click';

it('clicks each whole count once, a little ahead, and starts over after a loop', () => {
  let r = countsToClick(0, 0, 0.2, 16); // starting on a set: count 0 clicks right away
  expect(r.counts).toEqual([{ c: 0, inCounts: 0 }]);
  r = countsToClick(r.next, 0.85, 0.2, 16); // count 1 is 0.15 counts away: scheduled now
  expect(r.counts.map((x) => x.c)).toEqual([1]);
  expect(r.counts[0].inCounts).toBeCloseTo(0.15);
  expect(countsToClick(r.next, 1.1, 0.2, 16).counts).toEqual([]); // already scheduled
  expect(countsToClick(r.next, 0.9, 0.2, 16).counts).toEqual([]); // still before count 1, which went out early: not again
  expect(countsToClick(r.next, 15.9, 0.2, 16).counts.map((x) => x.c)).toEqual([16]); // after a slow frame, the missed counts aren't played late
  expect(countsToClick(17, 4.5, 0.2, 16).counts).toEqual([]); // looped back: next is 5, not due yet
  expect(countsToClick(17, 4.95, 0.2, 16).counts.map((x) => x.c)).toEqual([5]);
  expect(countsToClick(16, 16, 0.2, 16).counts.map((x) => x.c)).toEqual([16]); // never past the end
});
