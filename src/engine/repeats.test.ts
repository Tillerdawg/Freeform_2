import { describe, expect, it } from 'vitest';
import { endingNumbers, playbackOrder, type BarMarks } from './repeats';

/** Bars numbered from 1, as a director reads them: marks for bar k at key k. */
const score = (n: number, marks: Record<number, BarMarks>) => Array.from({ length: n }, (_, i) => marks[i + 1] ?? {});
const heard = (n: number, marks: Record<number, BarMarks>, max?: number) => playbackOrder(score(n, marks), max).order.map((i) => i + 1);

describe('playing out repeats', () => {
  it('leaves a score with no marks as written', () => {
    expect(heard(4, {})).toEqual([1, 2, 3, 4]);
  });
  it('plays a repeat twice, or as many times as it says', () => {
    expect(heard(5, { 2: { startRepeat: true }, 3: { endRepeat: 2 } })).toEqual([1, 2, 3, 2, 3, 4, 5]);
    expect(heard(3, { 2: { endRepeat: 3 } })).toEqual([1, 2, 1, 2, 1, 2, 3]); // no start repeat: back to the top
  });
  it('goes back to just after the last repeat when there is no start repeat', () => {
    expect(heard(5, { 2: { endRepeat: 2 }, 4: { endRepeat: 2 } })).toEqual([1, 2, 1, 2, 3, 4, 3, 4, 5]);
  });
  it('takes 1st and 2nd endings (the example from the design question)', () => {
    // m. 5–12 repeat, 1st ending m. 12, 2nd ending m. 13: 1–12, then 5–11, then 13.
    expect(heard(14, { 5: { startRepeat: true }, 12: { endings: [1], endRepeat: 2 }, 13: { endings: [2] } }))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 6, 7, 8, 9, 10, 11, 13, 14]);
  });
  it('handles multi-bar endings, a shared "1., 2." ending, and a 3rd time', () => {
    expect(heard(6, { 1: { startRepeat: true }, 2: { endings: [1] }, 3: { endings: [1], endRepeat: 2 }, 4: { endings: [2] }, 5: { endings: [2] } }))
      .toEqual([1, 2, 3, 1, 4, 5, 6]);
    expect(heard(5, { 2: { startRepeat: true }, 3: { endings: [1, 2], endRepeat: 3 }, 4: { endings: [3] } }))
      .toEqual([1, 2, 3, 2, 3, 2, 4, 5]);
  });
  it('follows D.C. al Fine, playing the last ending and no repeats on the way', () => {
    expect(heard(6, { 1: { startRepeat: true }, 2: { endings: [1], endRepeat: 2 }, 3: { endings: [2], markers: ['fine'] }, 6: { jump: { to: 'start', until: 'fine' } } }))
      .toEqual([1, 2, 1, 3, 4, 5, 6, 1, 3]);
  });
  it('follows D.S. al Coda', () => {
    // Segno at 2, To Coda at 3, D.S. al Coda at the end of 4, Coda at 5.
    expect(heard(6, { 2: { markers: ['segno'] }, 3: { markers: ['coda'] }, 4: { jump: { to: 'segno', until: 'coda', continueAt: 'codab' } }, 5: { markers: ['codab'] } }))
      .toEqual([1, 2, 3, 4, 2, 3, 5, 6]);
  });
  it('plays to the end after a plain D.C., and only follows a jump once', () => {
    expect(heard(3, { 2: { jump: { to: 'start', until: 'end' } } })).toEqual([1, 2, 1, 2, 3]);
  });
  it('plays repeats after the jump when the D.S. says to', () => {
    expect(heard(4, { 1: { startRepeat: true }, 2: { endRepeat: 2 }, 3: { jump: { to: 'start', until: 'end', playRepeats: true } } }))
      .toEqual([1, 2, 1, 2, 3, 1, 2, 1, 2, 3, 4]);
  });
  it('ignores a jump to a mark that is not there', () => {
    expect(heard(3, { 2: { jump: { to: 'segno', until: 'end' } } })).toEqual([1, 2, 3]);
  });
  it('falls back to as written past the cap', () => {
    const r = playbackOrder(score(3, { 3: { endRepeat: 50 } }), 20);
    expect(r).toEqual({ order: [0, 1, 2], capped: true });
  });
});

describe('ending numbers', () => {
  it('reads lists and ranges', () => {
    expect(endingNumbers('1')).toEqual([1]);
    expect(endingNumbers('1, 2')).toEqual([1, 2]);
    expect(endingNumbers('1., 2.')).toEqual([1, 2]);
    expect(endingNumbers('1-3')).toEqual([1, 2, 3]);
    expect(endingNumbers('')).toEqual([]);
  });
});
