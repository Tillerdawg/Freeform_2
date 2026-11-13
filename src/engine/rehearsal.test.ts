// @ts-expect-error: the tests run in Node, but its type definitions aren't installed (nothing else needs them)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseMidi, secondsAt } from './midi';
import { parseScore } from './musicxml';
import { RATE, renderMidi, wavBytes } from './rehearsal';

// The sound library the app ships (public/sounds), read from disk.
const file: Uint8Array = readFileSync(new URL('../../public/sounds/GeneralUser-GS.sf3', import.meta.url));
const bank = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;

/** A one-track MIDI at 120 bpm, then 60 bpm from beat 3: a trumpet rests one beat, then plays three quarter notes. */
function midi(): ArrayBuffer {
  const P = 480, vlq = (n: number) => { const b = [n & 127]; while ((n >>= 7)) b.unshift((n & 127) | 128); return b; };
  const ev = [
    0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20, // 120 bpm
    0, 0xc0, 56, // trumpet
    ...vlq(P), 0x90, 67, 100, ...vlq(P), 0x80, 67, 0, // beat 2
    0, 0xff, 0x51, 3, 0x0f, 0x42, 0x40, // 60 bpm from beat 3
    0, 0x90, 67, 100, ...vlq(P), 0x80, 67, 0,
    0, 0x90, 67, 100, ...vlq(P), 0x80, 67, 0,
    0, 0xff, 0x2f, 0,
  ];
  const len = [24, 16, 8, 0].map((s) => (ev.length >> s) & 255);
  return new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, P >> 8, P & 255, 0x4d, 0x54, 0x72, 0x6b, ...len, ...ev]).buffer;
}

describe('rehearsal tracks', () => {
  it('play the MIDI from its time 0, so the audio lines up with the counts', async () => {
    const m = midi(), map = parseMidi(m);
    const seen: number[] = [];
    const { left, right, sampleRate } = await renderMidi(bank, m, (f) => seen.push(f));
    expect(sampleRate).toBe(RATE);
    expect(seen.at(-1)).toBe(1);
    // As long as the score plays (by FreeFORM's own clock: 0.5 + 0.5 + 1 + 1 s), plus 2 s for the last note to ring.
    expect(secondsAt(map, map.end)).toBe(3);
    expect(left.length / RATE).toBeCloseTo(3 + 2, 2);
    // Silent through the rest on beat 1; the first note sounds right at 0.5 s, as the counts say.
    const first = left.findIndex((x, i) => Math.abs(x) > 0.01 || Math.abs(right[i]) > 0.01) / RATE;
    expect(first).toBeGreaterThanOrEqual(0.5);
    expect(first).toBeLessThan(0.53);
    // Scaled to a steady peak.
    expect([...left, ...right].reduce((a, x) => Math.max(a, Math.abs(x)), 0)).toBeCloseTo(0.9, 3);
  });
  it('refuse a MIDI with no notes', async () => {
    const empty = new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 1, 0xe0, 0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 4, 0, 0xff, 0x2f, 0]).buffer;
    await expect(renderMidi(bank, empty)).rejects.toThrow(/no music/);
  });
  it('write a WAV for browsers that cannot compress audio', () => {
    const w = wavBytes(new Float32Array([0, 1]), new Float32Array([-1, 0.5]), 44100);
    const v = new DataView(w.buffer);
    expect(new TextDecoder().decode(w.slice(0, 4))).toBe('RIFF');
    expect(v.getUint32(24, true)).toBe(44100);
    expect([v.getInt16(44, true), v.getInt16(46, true), v.getInt16(48, true), v.getInt16(50, true)]).toEqual([0, -32767, 32767, 16384]);
  });
  it('passes an imported MIDI straight to the rehearsal renderer', async () => {
    const file = midi();
    expect((await parseScore(file)).rehearsal).toBe(file);
  });
});
