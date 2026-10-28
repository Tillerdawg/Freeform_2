import { describe, expect, it } from 'vitest';
import { findBeats } from './beats';

const RATE = 22050;
/** A click track: a short burst at each given time, with a little noise so it isn't too easy. */
function clicks(times: number[], dur: number) {
  const x = new Float32Array(Math.ceil(dur * RATE));
  let seed = 1;
  for (let i = 0; i < x.length; i++) { seed = (seed * 16807) % 2147483647; x[i] = ((seed / 2147483647) - 0.5) * 0.02; }
  for (const t of times) for (let i = 0; i < 400; i++) { const k = Math.round(t * RATE) + i; if (k < x.length) x[k] += Math.sin(i * 0.6) * Math.exp(-i / 80); }
  return x;
}
const near = (found: number[], truth: number[], tol = 0.05) => truth.filter((t) => found.some((b) => Math.abs(b - t) < tol)).length / truth.length;

describe('automatic beat finding', () => {
  it('finds a steady 144 bpm pulse', () => {
    const truth = Array.from({ length: 40 }, (_, i) => 0.5 + (i * 60) / 144);
    const r = findBeats(clicks(truth, 18), RATE);
    expect(r.bpm).toBeGreaterThan(140); expect(r.bpm).toBeLessThan(148);
    expect(near(r.beats, truth)).toBeGreaterThan(0.95);
  });
  it('follows a tempo change (120 → 160) and a ritard', () => {
    const truth: number[] = []; let t = 0.5;
    for (let i = 0; i < 24; i++) { truth.push(t); t += 0.5; } // 120
    for (let i = 0; i < 32; i++) { truth.push(t); t += 0.375; } // 160
    for (let i = 0; i < 8; i++) { truth.push(t); t += 0.375 + i * 0.04; } // slowing down
    const r = findBeats(clicks(truth, t + 1), RATE);
    expect(near(r.beats, truth)).toBeGreaterThan(0.85);
  });
});
