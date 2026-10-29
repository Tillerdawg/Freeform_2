import { describe, expect, it } from 'vitest';
import { countsFromMidi, parseMidi, secondsAt } from './midi';

/** A one-track MIDI: 480 ticks per quarter, events as [delta, ...bytes]. */
function midi(events: number[][]) {
  const vlq = (v: number) => { const out = [v & 127]; while ((v >>= 7)) out.unshift((v & 127) | 128); return out; };
  const body = events.flatMap(([dt, ...b]) => [...vlq(dt), ...b]).concat([0, 0xff, 0x2f, 0]);
  const u32 = (v: number) => [v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255];
  const bytes = [...'MThd'].map((c) => c.charCodeAt(0)).concat(u32(6), [0, 0, 0, 1, 480 >> 8, 480 & 255],
    [...'MTrk'].map((c) => c.charCodeAt(0)), u32(body.length), body);
  return new Uint8Array(bytes).buffer;
}
const tempo = (bpm: number) => { const us = Math.round(60e6 / bpm); return [0xff, 0x51, 3, us >> 16, (us >> 8) & 255, us & 255]; };
const meter = (n: number, d: number) => [0xff, 0x58, 4, n, Math.log2(d), 24, 8];

// 4 bars of 3/4 at 120, then a 4/4 bar at 60 (a G.P. bar), then 2 bars of 4/4 at 60; a note with running status.
const file = midi([[0, ...tempo(120)], [0, ...meter(3, 4)], [0, 0x90, 60, 100], [480, 60, 0],
  [480 * 12 - 480, ...meter(4, 4)], [0, ...tempo(60)], [480 * 12, 0x80, 60, 0]]);

describe('counts from a MIDI file', () => {
  it('reads the tempo map and the bars', () => {
    const m = parseMidi(file);
    expect(m.measures.slice(0, 6).map((x) => `${x.beats}/${x.den}@${x.start}`)).toEqual(
      ['3/4@0', '3/4@1440', '3/4@2880', '3/4@4320', '4/4@5760', '4/4@7680']);
    expect(secondsAt(m, 5760)).toBe(6); // 12 quarters at 120
    expect(secondsAt(m, 5760 + 480)).toBe(7); // then a quarter at 60
  });
  it("spreads each set's counts over its measures: in 3, in one, a skipped G.P. bar", () => {
    const m = parseMidi(file);
    const r = countsFromMidi(m, [{ name: '1', counts: 0 }, { name: '2', counts: 6, measures: '1–2' }, { name: '3', counts: 2, measures: '3-4' }, { name: '4', counts: 8, measures: '6–7' }]);
    expect(r.matched).toBe(3);
    expect(r.notes).toEqual([]);
    expect(r.taps.slice(0, 8)).toEqual([0, 0.001, 0.5, 1, 1.5, 2, 2.5, 3]); // count 0 would be before the music: clamped
    expect(r.taps.slice(8, 9)).toEqual([4.5]); // in one: count 2 of set 3 on the downbeat of m. 4
    expect(r.taps[9]).toBe(10); // m. 5 (the G.P.) is in no set: set 4's count 1 is m. 6's downbeat
    expect(r.taps.length).toBe(17);
  });
  it('skips a silent bar (G.P.) inside a set when the counts fit the bars that sound', () => {
    const m = parseMidi(file);
    expect(m.measures.map((x) => x.sounding)).toEqual([true, false, false, false, false, false, false]);
    // only m. 1 has a note here, so: a set over m. 1–2 with 3 counts fits m. 1 alone
    const r = countsFromMidi(m, [{ name: '1', counts: 0 }, { name: '2', counts: 3, measures: '1–2' }]);
    expect(r.notes).toEqual([]);
    expect(r.taps).toEqual([0, 0.001, 0.5, 1]);
  });
  it('flags a set whose counts do not fit its measures, and counts plain beats without measures', () => {
    const m = parseMidi(file);
    const r = countsFromMidi(m, [{ name: '1', counts: 0 }, { name: '2', counts: 5, measures: '1–2' }, { name: '3', counts: 2 }]);
    expect(r.notes[0]).toMatch(/Set 2: 5 counts over m\. 1–2/);
    expect(r.taps.length).toBe(8);
    expect(r.taps[7] - r.taps[6]).toBeCloseTo(0.5, 9); // plain quarter beats at 120
  });
  it('rejects files that are not MIDI', () => {
    expect(() => parseMidi(new TextEncoder().encode('hello there, not midi').buffer)).toThrow(/isn't a MIDI file/);
  });
});
