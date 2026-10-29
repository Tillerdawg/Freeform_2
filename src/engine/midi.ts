// Counts from a score's MIDI file. The MIDI has the score's exact timing (tempo map, meters, fermatas as tempo
// changes), so when the show's audio was rendered from the same MIDI, every count's time is known, nothing tapped.
// Each set's counts are spread evenly over the measures typed in its Measures box: that one rule covers counting in
// one, cut time, odd bars, and G.P. bars (withHolds gives bars no set covers a hold sub-set, as in Pyware).
import { newId, type Show } from './show';

export interface Midi {
  ppq: number; // ticks per quarter note
  tempos: [tick: number, usPerQuarter: number][];
  measures: { start: number; beats: number; den: number; sounding: boolean }[]; // in order; starts in ticks; sounding = some note is heard in it
  first: 0 | 1; // the number of measures[0]: 0 when the music opens with a pickup (m. 1 = the first full bar), else 1
  end: number; // last event tick
}

/** Read a Standard MIDI File (formats 0 and 1). Throws a readable message on anything else. */
export function parseMidi(buf: ArrayBuffer): Midi {
  const d = new DataView(buf), n = buf.byteLength;
  const tag = (at: number) => String.fromCharCode(d.getUint8(at), d.getUint8(at + 1), d.getUint8(at + 2), d.getUint8(at + 3));
  if (n < 14 || tag(0) !== 'MThd') throw new Error("That isn't a MIDI file.");
  const tracks = d.getUint16(10), div = d.getUint16(12);
  if (div & 0x8000) throw new Error('This MIDI file counts time in SMPTE frames; export it with beats (PPQ) instead.');
  const tempos: [number, number][] = [], sigs: [number, number, number][] = [], heard: [number, number][] = []; // note [on, off] ticks
  let end = 0, at = 8 + d.getUint32(4);
  for (let t = 0; t < tracks && at + 8 <= n; t++) {
    const len = d.getUint32(at + 4), stop = Math.min(n, at + 8 + len);
    if (tag(at) !== 'MTrk') { at = stop; continue; }
    let p = at + 8, tick = 0, status = 0;
    const held = new Map<number, number[]>(); // channel*128+key → start ticks still sounding
    const vlq = () => { let v = 0, b = 0; do { if (p >= stop) throw new Error('This MIDI file is cut short.'); b = d.getUint8(p++); v = v * 128 + (b & 127); } while (b & 128); return v; };
    while (p < stop) {
      tick += vlq();
      let s = d.getUint8(p);
      if (s & 0x80) p++; else s = status; // running status reuses the last status byte
      if (s === 0xff) {
        const type = d.getUint8(p++), l = vlq();
        if (type === 0x51 && l === 3) tempos.push([tick, (d.getUint8(p) << 16) | (d.getUint8(p + 1) << 8) | d.getUint8(p + 2)]);
        if (type === 0x58 && l >= 2) sigs.push([tick, d.getUint8(p), 2 ** d.getUint8(p + 1)]);
        p += l;
      } else if (s === 0xf0 || s === 0xf7) p += vlq();
      else if (s >= 0x80) {
        status = s;
        const type = s & 0xf0, key = (s & 15) * 128 + d.getUint8(p);
        if (type === 0x90 && d.getUint8(p + 1) > 0) held.set(key, [...(held.get(key) ?? []), tick]);
        else if (type === 0x80 || type === 0x90) { const on = held.get(key)?.shift(); if (on !== undefined) heard.push([on, tick]); }
        p += (s & 0xf0) === 0xc0 || (s & 0xf0) === 0xd0 ? 1 : 2;
      }
      else throw new Error("This MIDI file couldn't be read.");
      end = Math.max(end, tick);
    }
    for (const ons of held.values()) for (const on of ons) heard.push([on, end]); // never released: sounds to the end
    at = stop;
  }
  tempos.sort((a, b) => a[0] - b[0]); sigs.sort((a, b) => a[0] - b[0]);
  if (!tempos.length || tempos[0][0] > 0) tempos.unshift([0, 500000]); // MIDI's default: 120 bpm
  const measures: Midi['measures'] = [];
  let beats = 4, den = 4, si = 0;
  for (let tick = 0; tick < end; ) {
    while (si < sigs.length && sigs[si][0] <= tick) { beats = sigs[si][1]; den = sigs[si][2]; si++; }
    const len = (beats * div * 4) / den;
    const next = si < sigs.length && sigs[si][0] < tick + len ? sigs[si][0] : tick + len; // a meter change mid-bar starts a new bar
    measures.push({ start: tick, beats, den, sounding: heard.some(([on, off]) => on < next && off > tick) });
    tick = next;
  }
  if (!measures.length) measures.push({ start: 0, beats, den, sounding: false });
  // A pickup isn't marked in MIDI, but it shows: the first bar's music starts after its downbeat (the pickup sits at the
  // end of the bar). Then that bar is m. 0 and m. 1 is the first full bar, as drill counts it.
  const firstNote = Math.min(...heard.map(([on]) => on));
  const pickup = measures.length > 1 && firstNote > 0 && firstNote < measures[1].start;
  return { ppq: div, tempos, measures, end, first: pickup ? 0 : 1 };
}

/** The last measure's number. */
const lastBar = (m: Midi) => m.measures.length - 1 + m.first;

/** Seconds at a tick, through the tempo map. */
export function secondsAt(m: Midi, tick: number): number {
  let s = 0, last = 0, us = 500000;
  for (const [t, v] of m.tempos) { if (t > tick) break; s += ((t - last) / m.ppq) * us / 1e6; last = t; us = v; }
  return s + ((tick - last) / m.ppq) * us / 1e6;
}

/** Ticks per count in plain counting at a tick: the bottom note, or the dotted quarter in 6/8, 9/8 and 12/8. */
function beatAt(m: Midi, tick: number) {
  let k = 0;
  while (k + 1 < m.measures.length && m.measures[k + 1].start <= tick) k++;
  const { beats, den } = m.measures[k];
  return den === 8 && beats % 3 === 0 && beats > 3 ? m.ppq * 1.5 : (m.ppq * 4) / den;
}

/** Count ticks for n counts over these bars by one rule (each beat, a steady number per bar, every other beat), or null. */
function place(m: Midi, bars: number[], n: number, bar: (k: number) => number, how: 'beat' | 'bar' | 'half'): number[] | null {
  if (!bars.length || n < 1) return null;
  const beats = bars.flatMap((k) => { const a = bar(k), b = bar(k + 1), c = m.measures[k - m.first].beats; return Array.from({ length: c }, (_, j) => a + ((b - a) * j) / c); });
  if (how === 'beat') return n === beats.length ? beats : null;
  if (how === 'half') return n * 2 === beats.length ? beats.filter((_, j) => j % 2 === 0) : null;
  if (n % bars.length) return null;
  const per = n / bars.length;
  return bars.flatMap((k) => Array.from({ length: per }, (_, j) => bar(k) + ((bar(k + 1) - bar(k)) * j) / per));
}

/**
 * Bars that no set's measures cover (a G.P. between moves, or an intro before the first move) get a hold sub-set, as
 * a Pyware drill writer would write it: named after the set before it (after 4: 4A; after 4A, or if 4A is taken: 4B), standing on that
 * set's spots, one count per beat of those bars. Returns the show and the names added.
 */
export function withHolds(show: Show, m: Midi): { show: Show; added: string[]; widened: string[] } {
  const sets = [...show.sets], added: string[] = [], widened: string[] = [], names = new Set(sets.map((x) => x.name));
  const beatsIn = (a: number, b: number) => m.measures.slice(a - m.first, b - m.first + 1).reduce((sum, x) => sum + x.beats, 0);
  let end = 0; // last bar covered so far
  for (let i = 1; i < sets.length; i++) {
    const r = range(sets[i].measures);
    if (!r || r[0] < m.first || r[1] > lastBar(m)) { end = 0; continue; } // unknown measures: don't guess a gap
    if ((end || i === 1) && r[0] > end + 1 && sets[i].counts === beatsIn(end + 1, r[1]) && sets[i].counts !== beatsIn(r[0], r[1])) {
      // The set's counts fit exactly once the uncovered bars before it are included: its notes' measures are out of
      // date (Dream On set 7: "mm. 35-37, 12 Counts" but 16 counts, with m. 34 in no set). Widen it instead of a hold.
      const was = sets[i].measures, now = `${end + 1}–${r[1]}`;
      sets[i] = { ...sets[i], measures: now };
      widened.push(`Set ${sets[i].name}: its ${sets[i].counts} counts fit m. ${now}, not m. ${was}, so it now covers m. ${now}.`);
    } else if ((end || i === 1) && r[0] > end + 1) {
      const a = end + 1, b = r[0] - 1, before = sets[i - 1];
      let k = 0, name = '';
      const base = before.name.replace(/[A-Z]+$/, ''); // after 4A comes 4B, not 4AA
      do name = `${base}${String.fromCharCode(65 + k++)}`; while (names.has(name) && k < 26);
      names.add(name);
      const counts = beatsIn(a, b);
      sets.splice(i, 0, { id: newId('set'), name, counts, pos: { ...before.pos }, ...(before.labels ? { labels: { ...before.labels } } : {}), measures: a === b ? `${a}` : `${a}–${b}`, note: `Hold (m. ${a === b ? a : `${a}–${b}`})` });
      added.push(name);
      i++;
    }
    end = r[1];
  }
  return { show: added.length || widened.length ? { ...show, sets } : show, added, widened };
}

/**
 * A lone bar that's a fraction of a beat longer or shorter than the bars around it (9/8 between 4/4 bars) is almost
 * always a glitch from converting the score (one part had an extra or missing rest), not the music: it puts a hitch in
 * the audio and moves every count after it. A real meter change (a 6/4 or 2/4 bar) is a whole number of beats.
 */
export function oddBars(m: Midi): string[] {
  const len = (k: number) => (m.measures[k].beats * 4) / m.measures[k].den; // in quarters
  const out: string[] = [];
  for (let k = 0; k < m.measures.length; k++) {
    const near = [m.measures[k - 1], m.measures[k + 1]].filter(Boolean);
    if (!near.length) continue;
    const beat = 4 / near[0].den, here = len(k);
    const same = near.every((x) => x.beats === near[0].beats && x.den === near[0].den);
    if (same && (here !== (near[0].beats * 4) / near[0].den) && Math.abs(here / beat - Math.round(here / beat)) > 1e-9)
      out.push(`m. ${k + m.first} is ${m.measures[k].beats}/${m.measures[k].den} between ${near[0].beats}/${near[0].den} bars, a fraction of a beat off: usually a glitch from converting the score (an extra or missing rest in one part), which puts a hitch in the music. Check that bar in the score and export again.`);
  }
  return out;
}

/** "5–20", "5-20" or "69" → [5, 20]; anything else (pickups, notes) → null. */
const range = (s?: string): [number, number] | null => {
  const r = s?.trim().match(/^(\d+)\s*(?:[–-]\s*(\d+))?$/);
  return r ? [+r[1], +(r[2] ?? r[1])] : null;
};

/**
 * Taps (seconds per count, count 0 = set 1) for a show's sets. Count 1 of a set lands on the downbeat of its first
 * measure and the set is hit on its last count. Sets without measures keep counting plain beats from where the last
 * set ended. `matched` = sets placed by their measures; `notes` = sets that don't fit theirs.
 */
export function countsFromMidi(m: Midi, sets: { name: string; counts: number; measures?: string }[]): { taps: number[]; matched: number; notes: string[] } {
  const ticks: number[] = [NaN], notes: string[] = [];
  let matched = 0;
  const bar = (k: number) => m.measures[k - m.first]?.start ?? m.measures[m.measures.length - 1].start + (k - lastBar(m)) * beatAt(m, m.end) * 4;
  for (let i = 1; i < sets.length; i++) {
    const { counts: n, name } = sets[i], r = range(sets[i].measures), prev = ticks[ticks.length - 1];
    if (r && r[0] >= m.first && r[1] >= r[0] && r[1] <= lastBar(m) && (Number.isNaN(prev) || bar(r[0]) > prev)) {
      const all = Array.from({ length: r[1] - r[0] + 1 }, (_, k) => r[0] + k);
      const beats = all.reduce((s, k) => s + m.measures[k - m.first].beats, 0);
      // A count on each beat; or on each beat of the bars that sound (a G.P. inside the set, where the band holds);
      // or a steady number per bar (in one, in 2); or every other beat.
      const sounding = all.filter((k) => m.measures[k - m.first].sounding);
      const placed = place(m, all, n, bar, 'beat') ?? place(m, sounding, n, bar, 'beat') ?? place(m, all, n, bar, 'bar') ?? place(m, all, n, bar, 'half');
      const a = bar(r[0]), step = (bar(r[1] + 1) - a) / n;
      const got = placed ?? Array.from({ length: n }, (_, j) => a + j * step);
      if (Number.isNaN(prev)) ticks[0] = got[0] - (got.length > 1 ? got[1] - got[0] : step);
      ticks.push(...got);
      matched++;
      if (!placed) notes.push(`Set ${name}: ${n} counts over m. ${r[0]}–${r[1]} (${all.length} bars, ${beats} beats); spread evenly, so check its measures.`);
    } else {
      if (sets[i].measures && !r) notes.push(`Set ${name}: measures "${sets[i].measures}" aren't plain numbers, so it counts plain beats.`);
      else if (r) notes.push(`Set ${name}: m. ${sets[i].measures} doesn't follow the set before it in this MIDI, so it counts plain beats.`);
      let t = Number.isNaN(prev) ? 0 : prev;
      if (Number.isNaN(prev)) { ticks[0] = 0; t = 0; } else t += beatAt(m, t);
      for (let j = 0; j < n; j++, t += beatAt(m, t)) ticks.push(t);
    }
  }
  if (ticks.length === 1) ticks.push(beatAt(m, 0)); // a one-set show: still two taps, so playback has a pace
  if (ticks[0] < 0) ticks[0] = 0; // count 0 before the music starts: the move into count 1 is just a little shorter
  notes.push(...oddBars(m));
  const taps = ticks.map((t) => secondsAt(m, t));
  for (let i = 1; i < taps.length; i++) if (!(taps[i] > taps[i - 1])) taps[i] = taps[i - 1] + 0.001; // keep strictly increasing
  return { taps, matched, notes };
}
