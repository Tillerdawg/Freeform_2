import { describe, expect, it } from 'vitest';
import { countAt, synced, timeAt, validMusic, peaks, peakBetween } from './music';

describe('music timing from taps', () => {
  const taps = [2, 2.5, 3, 3.5, 4.5, 5.5]; // counts 0–3 at 120 bpm, then a slowdown to 60 bpm (a ritard)
  it('maps counts to seconds, following tempo changes', () => {
    expect(timeAt(taps, 0)).toBe(2);
    expect(timeAt(taps, 2.5)).toBe(3.25);
    expect(timeAt(taps, 3.5)).toBe(4); // halfway through the slower count
    expect(timeAt(taps, 7)).toBe(5.5 + 2 * 0.75); // past the last tap: the last 4 taps' pace (3 s / 4 counts)
    expect(timeAt(taps, -1)).toBe(1.5); // before count 0: the first gap's pace
  });
  it('maps seconds back to counts (its inverse)', () => {
    for (const c of [0, 0.3, 2.5, 3.5, 4, 5, 6.2]) expect(countAt(taps, timeAt(taps, c))).toBeCloseTo(c, 9);
    expect(countAt(taps, 0)).toBe(-4);
  });
  it('checks music settings read from a file', () => {
    expect(validMusic({ name: 'Opener.mp3', audioId: 'a1b2', taps })).toBe(true);
    expect(validMusic({ name: 'x', audioId: 'a1', taps: [1, 1] })).toBe(false); // not increasing
    expect(validMusic({ name: 'x', audioId: '../etc', taps: [] })).toBe(false);
    expect(validMusic({ name: 'x', audioId: 'a1', taps: [NaN] })).toBe(false);
    expect(synced({ name: 'x', audioId: 'a', taps: [1] })).toBe(false);
  });
});

describe('waveform peaks', () => {
  it('keeps the loudest sample per slice, scaled so the loudest is 1', () => {
    const ch = new Float32Array([0.1, -0.4, 0.2, 0.05, 0, 0.8, -0.2, 0.1]); // 4 samples per slice at sampleRate 400, rate 100
    const p = peaks([ch], 400);
    expect([...p].map((v) => +v.toFixed(3))).toEqual([0.5, 1]);
    expect(peakBetween(p, 100, 0, 0.005)).toBe(0.5); // inside the first slice
    expect(peakBetween(p, 100, 0, 0.02)).toBe(1);
    expect(peakBetween(p, 100, 5, 6)).toBe(0); // past the end
  });
});
