import { describe, expect, it } from 'vitest';
import { sampleShow } from './sample';
import { setStarts } from './show';
import { FPS, TAIL, videoCaption, videoFrames } from './video';

describe('video export', () => {
  const show = sampleShow(); // sets at counts 0, 16, 32, 40 (movement "Opener")
  it('at a tempo: one frame per 1/30 s, from the first set to the last, then a short hold', () => {
    const v = videoFrames(show, 1, 3, 120); // 24 counts at 120 bpm = 12 s
    expect(v.seconds).toBeCloseTo(12 + TAIL);
    expect(v.counts.length).toBe(Math.round((12 + TAIL) * FPS));
    expect(v.counts[0]).toBe(16);
    expect(v.counts[FPS]).toBeCloseTo(18); // 1 s = 2 counts
    expect(v.counts.at(-1)).toBe(40);
    expect(v.start).toBe(0);
  });
  it('with the recording: follows the tapped counts, and the music starts where the first set falls', () => {
    const taps = Array.from({ length: 41 }, (_, c) => 2 + c * 0.5 + (c > 20 ? (c - 20) * 0.25 : 0)); // slows down after count 20
    const v = videoFrames(show, 0, 3, 999, taps);
    expect(v.start).toBe(2);
    expect(v.seconds).toBeCloseTo(taps[40] - 2 + TAIL);
    expect(v.counts[FPS]).toBeCloseTo(2); // 0.5 s per count at first
    const s = setStarts(show);
    expect(v.counts.every((c, k) => k === 0 || c >= v.counts[k - 1])).toBe(true); // never backward
    expect(v.counts.at(-1)).toBe(s[3]);
  });
  it('captions the corner with the title, the piece, and where the drill is', () => {
    expect(videoCaption(show, 16)).toEqual({ title: 'Sample Show · Opener', place: 'Set 2' });
    expect(videoCaption(show, 21.5)).toEqual({ title: 'Sample Show · Opener', place: 'Set 2 → 3 · count 6 of 16' });
    expect(videoCaption({ ...show, title: '', movements: undefined }, 0).title).toBe('Untitled show');
  });
});
