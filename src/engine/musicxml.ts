// Counts from a score's MusicXML (or compressed .mxl), without exporting a MIDI: the same bar map and tempo map the
// MIDI gives (measures with their meter and whether anything sounds, tempos from <sound tempo> or metronome marks),
// in the same shape, so counts are placed by the same rules. Files come from anywhere: size-capped, and only the
// handful of tags needed are read (no DTDs or entities are fetched or expanded).
import { parseMidi, type Midi } from './midi';
import { endingNumbers, playbackOrder, type BarMarks } from './repeats';

const PPQ = 480, MAX_BYTES = 60_000_000, MAX_MEASURES = 5000;

type El = { tag: string; attrs: Record<string, string>; kids: El[]; text: string };

/** A tiny XML reader: elements, attributes and text; comments, processing instructions, DOCTYPE and CDATA skipped. */
export function parseXml(src: string): El {
  const root: El = { tag: '#root', attrs: {}, kids: [], text: '' };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  for (let m: RegExpExecArray | null; (m = re.exec(src)); ) {
    if (m[5] !== undefined) { stack[stack.length - 1].text += m[5]; continue; }
    if (!m[2]) continue; // comment, PI, DOCTYPE, CDATA
    if (m[1]) { if (stack.length > 1 && stack[stack.length - 1].tag === m[2]) stack.pop(); continue; }
    const attrs: Record<string, string> = {};
    for (const a of m[3].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = a[2] ?? a[3];
    const el: El = { tag: m[2], attrs, kids: [], text: '' };
    stack[stack.length - 1].kids.push(el);
    if (!m[4]) stack.push(el);
  }
  return root;
}

const kid = (e: El | undefined, tag: string) => e?.kids.find((k) => k.tag === tag);
const num = (e: El | undefined) => (e ? Number(e.text.trim()) : NaN);

/** Read a MusicXML score (partwise) into a bar and tempo map, with repeats, endings, D.C., D.S., Fine, and Coda played out. */
export function parseMusicXml(text: string): Midi & { warnings: string[] } {
  if (text.length > MAX_BYTES) throw new Error('That file is too big to be a score.');
  const doc = parseXml(text);
  const score = doc.kids.find((k) => k.tag === 'score-partwise');
  if (!score) throw new Error(doc.kids.some((k) => k.tag === 'score-timewise') ? 'Timewise MusicXML isn\'t supported: export the score again as standard (partwise) MusicXML.' : "That isn't a MusicXML score.");
  const parts = score.kids.filter((k) => k.tag === 'part');
  if (!parts.length) throw new Error('That score has no parts.');
  const count = Math.max(...parts.map((p) => p.kids.filter((k) => k.tag === 'measure').length));
  if (count > MAX_MEASURES) throw new Error('That score has too many measures.');
  // Per measure, over all parts: the longest voice (quarters), the meter in force, whether a note sounds, tempo marks.
  const bars = Array.from({ length: count }, () => ({ len: 0, beats: 4, den: 4, sig: false, sounding: false, tempos: [] as [number, number][] }));
  const marks: BarMarks[] = Array.from({ length: count }, () => ({}));
  const holds: Hold[] = []; // fermata notes (quarters into their bar)
  const onsets: [bar: number, at: number][] = []; // where every note and rest starts, in any part
  for (const part of parts) {
    let div = 1, beats = 4, den = 4, ending: number[] | null = null; // the ending (volta) this part is under
    part.kids.filter((k) => k.tag === 'measure').forEach((m, i) => {
      const bar = bars[i];
      if (ending) addEndings(marks[i], ending);
      let pos = 0, max = 0, chordAt = 0;
      for (const e of m.kids) {
        if (e.tag === 'attributes') {
          if (kid(e, 'divisions')) div = num(kid(e, 'divisions')) || div;
          const t = kid(e, 'time');
          if (t && kid(t, 'beats')) { beats = parseInt(kid(t, 'beats')!.text, 10) || beats; den = num(kid(t, 'beat-type')) || den; }
        } else if (e.tag === 'note') {
          if (kid(e, 'grace')) continue;
          if (!kid(e, 'rest')) bar.sounding = true;
          const d = num(kid(e, 'duration')) / div || 0, at = kid(e, 'chord') ? chordAt : pos;
          if (kid(kid(e, 'notations'), 'fermata')) holds.push([i, at, at + d, 2]);
          chordAt = at;
          onsets.push([i, at]);
          if (!kid(e, 'chord')) pos += d;
        } else if (e.tag === 'backup') pos -= num(kid(e, 'duration')) / div || 0;
        else if (e.tag === 'forward') pos += num(kid(e, 'duration')) / div || 0;
        else if (e.tag === 'barline') {
          const r = kid(e, 'repeat'), end = kid(e, 'ending');
          if (r?.attrs.direction === 'forward') marks[i].startRepeat = true;
          if (r?.attrs.direction === 'backward') marks[i].endRepeat = Math.min(Math.max(2, parseInt(r.attrs.times, 10) || 2), 20);
          if (end?.attrs.type === 'start') { ending = endingNumbers(end.attrs.number); addEndings(marks[i], ending); }
          if (end && /^(stop|discontinue)$/.test(end.attrs.type ?? '')) { addEndings(marks[i], endingNumbers(end.attrs.number)); ending = null; }
          if (kid(e, 'sound')) soundMarks(kid(e, 'sound')!, marks[i]);
        }
        if (e.tag === 'sound' || e.tag === 'direction') {
          const s = e.tag === 'sound' ? e : kid(e, 'sound');
          if (s) soundMarks(s, marks[i]);
          const bpm = Number(s?.attrs.tempo);
          // A metronome mark with no <sound tempo>: MuseScore plays it, so count it too (converted to quarters per minute).
          const met = kid(kid(e, 'direction-type'), 'metronome'), unit = met && { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25 }[kid(met, 'beat-unit')?.text.trim() ?? ''];
          const q = bpm > 0 ? bpm : met && unit ? num(kid(met, 'per-minute')) * unit * (kid(met, 'beat-unit-dot') ? 1.5 : 1) : NaN;
          if (q > 0 && q < 2000) bar.tempos.push([pos, q]);
        }
        max = Math.max(max, pos);
      }
      bar.len = Math.max(bar.len, max);
      if (!bar.sig) { bar.beats = beats; bar.den = den; bar.sig = true; }
    });
  }
  // A D.C. or D.S. in MusicXML doesn't say where it plays to: al Coda if the score has a To Coda, al Fine if it has a Fine.
  const has = (l: string) => marks.some((b) => b.markers?.includes(l));
  for (const b of marks) if (b.jump) Object.assign(b.jump, has('coda') ? { until: 'coda', continueAt: 'codab' } : has('fine') ? { until: 'fine' } : {});
  return toMap(bars, holds, onsets, marks);
}

const addEndings = (b: BarMarks, ns: number[]) => { if (ns.length) b.endings = [...new Set([...(b.endings ?? []), ...ns])]; };
const addMarker = (b: BarMarks, label: string) => { b.markers = [...new Set([...(b.markers ?? []), label])]; };

/** A MusicXML <sound>'s playback marks, in MuseScore's labels: segno, coda (To Coda), codab (the Coda), fine, and the jumps. */
function soundMarks(s: El, b: BarMarks) {
  const a = s.attrs;
  if (a.segno) addMarker(b, 'segno');
  if (a.tocoda) addMarker(b, 'coda');
  if (a.coda) addMarker(b, 'codab');
  if (a.fine) addMarker(b, 'fine');
  if (a.dacapo === 'yes') b.jump = { to: 'start', until: 'end' };
  if (a.dalsegno) b.jump = { to: 'segno', until: 'end' };
}

type Bar = { len: number; beats: number; den: number; sig?: boolean; sounding: boolean; tempos: [number, number][] };
type Hold = [bar: number, from: number, to: number, stretch: number];

/**
 * Bars (lengths in quarters, positions of tempo marks), fermatas, note starts, and repeat marks → the same map a MIDI
 * gives, with the bars in the order they're heard (numbered that way too). A bar heard again takes the tempo it has
 * where it's written, as MuseScore plays it.
 */
function toMap(written: Bar[], heldNotes: Hold[], noteStarts: [number, number][], marks: BarMarks[]): Midi & { warnings: string[] } {
  const { order, capped } = playbackOrder(marks, MAX_MEASURES);
  const startBpm: number[] = []; // the tempo in force at each written bar's downbeat
  let bpm = 120; // no mark at the start: 120 bpm, as MuseScore plays it
  for (const b of written) {
    const marks0 = b.tempos.filter(([p]) => p <= 1e-9);
    startBpm.push(marks0.length ? marks0[marks0.length - 1][1] : bpm);
    if (b.tempos.length) bpm = [...b.tempos].sort((x, y) => x[0] - y[0])[b.tempos.length - 1][1];
  }
  const at: number[][] = written.map(() => []); // written bar → where it's heard
  order.forEach((w, p) => at[w].push(p));
  const bars = order.map((w) => ({ ...written[w], tempos: [[0, startBpm[w]] as [number, number], ...written[w].tempos.filter(([p]) => p > 1e-9)] }));
  const holds = heldNotes.flatMap(([w, a, b, k]) => at[w].map((p) => [p, a, b, k] as Hold));
  const onsets = noteStarts.flatMap(([w, q]) => at[w].map((p) => [p, q] as [number, number]));
  const measures: Midi['measures'] = [], tempos: Midi['tempos'] = [];
  let tick = 0;
  for (const [k, b] of bars.entries()) {
    const full = (b.beats * 4) / b.den;
    const len = b.len > 0 ? b.len : full; // a bar no part fills (an empty measure) takes its meter's length
    // A bar shorter or longer than its meter (a pickup, a glitch) keeps its real length, counted in the meter's note value.
    let beats = b.beats, den = b.den;
    if (Math.abs(len - full) > 1e-9) {
      const whole = (x: number) => Math.abs(x - Math.round(x)) < 1e-6;
      while (!whole((len * den) / 4) && den < 64) den *= 2; // 3.5 quarters → 7/8
      beats = Math.round((len * den) / 4);
    }
    for (const [p, bpm] of b.tempos) tempos.push([tick + Math.round(p * PPQ), Math.round(60e6 / bpm)]);
    measures.push({ start: tick, beats, den, sounding: b.sounding, ...(order[k] !== k ? { written: order[k] + 1 } : {}) });
    tick += Math.round(len * PPQ);
  }
  tempos.sort((a, b) => a[0] - b[0]);
  if (!tempos.length || tempos[0][0] > 0) tempos.unshift([0, 500000]); // no mark at the start: 120 bpm, as MuseScore plays it
  // Fermatas, as MuseScore plays them: from the fermata to the next note or rest that starts in any part (not the
  // whole note: a whole-bar rest with a fermata holds only until someone else moves), held `stretch` times as long (MuseScore's default: twice).
  const tk = (i: number, q: number) => measures[i].start + Math.round(q * PPQ);
  const starts = [...new Set(onsets.map(([i, q]) => tk(i, q)))].sort((a, b) => a - b);
  const spans = holds.map(([i, a, b, k]) => { const s = tk(i, a), next = starts.find((t) => t > s) ?? Infinity; return [s, Math.min(tk(i, b), next), k] as const; }).filter(([a, b]) => b > a);
  const base = (t: number) => { let us = tempos[0][1]; for (const [k, v] of tempos) if (k <= t) us = v; return us; };
  const held = (t: number) => Math.max(1, ...spans.filter(([a, b]) => t >= a && t < b).map(([, , k]) => k)); // the stretch in force
  const edges = [...new Set([...tempos.map(([k]) => k), ...spans.flatMap(([a, b]) => [a, b])])].sort((a, b) => a - b);
  const map = edges.map((t) => [t, base(t) * held(t)] as [number, number]);
  const dedup = map.filter((t, k) => k === 0 || t[1] !== map[k - 1][1]);
  return { ppq: PPQ, tempos: dedup, measures, end: tick, warnings: repeatNote(order, written.length, capped) };
}

/** What playing out the repeats did to the bar numbers, with one example, so a director knows how to type Measures. */
export function repeatNote(order: number[], written: number, capped: boolean): string[] {
  if (capped) return ["This score's repeats and jumps couldn't be followed (they loop or run too long), so its bars are counted as written, once through."];
  const p = order.findIndex((w, k) => k > 0 && w !== order[k - 1] + 1);
  if (p < 0) return [];
  let q = p;
  while (q + 1 < order.length && order[q + 1] === order[q] + 1) q++;
  const span = (a: number, b: number) => (a === b ? `m. ${a}` : `m. ${a}–${b}`);
  return [`Repeats played out: the score's ${written} bars play as ${order.length}, numbered in the order they're heard. For example, ${span(p + 1, q + 1)} here is written ${span(order[p] + 1, order[q] + 1)}. Type each set's measures the same way.`];
}

/** The files in a zip (as text, read on demand): .mxl and MuseScore's .mscz are both zips. */
async function readZip(buf: ArrayBuffer, what: string): Promise<Record<string, () => Promise<string>>> {
  const v = new DataView(buf), b = new Uint8Array(buf);
  let e = -1;
  for (let o = b.length - 22; o >= Math.max(0, b.length - 65557); o--) if (v.getUint32(o, true) === 0x06054b50) { e = o; break; }
  if (e < 0) throw new Error(`That ${what} file is damaged (it isn't a readable zip).`);
  const n = v.getUint16(e + 10, true);
  let o = v.getUint32(e + 16, true);
  const files: Record<string, () => Promise<string>> = {};
  for (let k = 0; k < n && o + 46 <= b.length; k++) {
    if (v.getUint32(o, true) !== 0x02014b50) break;
    const method = v.getUint16(o + 10, true), size = v.getUint32(o + 20, true), nameLen = v.getUint16(o + 28, true);
    const extra = v.getUint16(o + 30, true), comment = v.getUint16(o + 32, true), local = v.getUint32(o + 42, true);
    const name = new TextDecoder().decode(b.subarray(o + 46, o + 46 + nameLen));
    files[name] = async () => {
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const data = b.slice(start, start + size);
      if (method === 0) return new TextDecoder().decode(data);
      if (method !== 8) throw new Error(`That ${what} file uses a compression FreeFORM can't read.`);
      return new TextDecoder().decode(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    };
    o += 46 + nameLen + extra + comment;
  }
  return files;
}

/** The main score file inside a compressed MusicXML (.mxl) zip. */
export async function unzipMxl(buf: ArrayBuffer): Promise<string> {
  const files = await readZip(buf, '.mxl');
  const container = files['META-INF/container.xml'] && parseXml(await files['META-INF/container.xml']());
  const rootfile = container && findDeep(container, 'rootfile')?.attrs['full-path'];
  const main = (rootfile && files[rootfile]) ? rootfile : Object.keys(files).find((f) => !f.startsWith('META-INF/') && /\.(musicxml|xml)$/i.test(f));
  if (!main) throw new Error('No score was found inside that .mxl file.');
  return files[main]();
}

function findDeep(e: El, tag: string): El | undefined {
  for (const k of e.kids) { if (k.tag === tag) return k; const f = findDeep(k, tag); if (f) return f; }
}

/** A score's bar and tempo map from a MuseScore (.mscz), MIDI, MusicXML or .mxl file (told apart by content, not the file name). */
export async function parseScore(buf: ArrayBuffer): Promise<Midi & { warnings?: string[] }> {
  if (buf.byteLength > MAX_BYTES) throw new Error('That file is too big to be a score.');
  const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
  const sig = String.fromCharCode(...head);
  if (sig === 'MThd') return parseMidi(buf);
  if (sig.startsWith('PK')) {
    const files = await readZip(buf, 'score');
    const mscx = Object.keys(files).find((f) => !f.includes('/') && /\.mscx$/i.test(f)); // a MuseScore .mscz (its parts live in Excerpts/)
    return mscx ? parseMscx(await files[mscx]()) : parseMusicXml(await unzipMxl(buf));
  }
  if (/<museScore\b/.test(new TextDecoder().decode(buf.slice(0, 2000)))) return parseMscx(new TextDecoder().decode(buf)); // an uncompressed .mscx
  const text = new TextDecoder().decode(buf);
  if (/<score-(partwise|timewise)\b/.test(text.slice(0, 5000))) return parseMusicXml(text);
  throw new Error("That isn't a MuseScore, MusicXML, or MIDI file. Choose the score's .mscz, or export it as MusicXML or MIDI.");
}

const DUR: Record<string, number> = { longa: 16, breve: 8, whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25, '32nd': 0.125, '64th': 0.0625, '128th': 0.03125, '256th': 0.015625 };
const frac = (t: string | undefined) => { const [a, b] = (t ?? '').split('/').map(Number); return b ? a / b : NaN; };
const isGrace = (c: El) => c.kids.some((k) => /^(grace|acciaccatura|appoggiatura)/.test(k.tag));

/**
 * A MuseScore 4 score (the .mscx inside a .mscz): measures and their real lengths (an irregular bar's `len`, else
 * its meter), tempo marks (stored in quarters per second), fermatas with their stretch, and whether anything sounds.
 */
export function parseMscx(text: string): Midi & { warnings: string[] } {
  if (text.length > MAX_BYTES) throw new Error('That file is too big to be a score.');
  const ms = parseXml(text).kids.find((k) => k.tag === 'museScore');
  const version = parseFloat(ms?.attrs.version ?? '');
  if (!ms) throw new Error("That isn't a MuseScore score.");
  if (!(version >= 3)) throw new Error('This MuseScore file is from an older version (before MuseScore 3). Open it in MuseScore 4 and save it, or export it as MusicXML.');
  const score = kid(ms, 'Score');
  const staves = (score?.kids ?? []).filter((k) => k.tag === 'Staff' && k.kids.some((m) => m.tag === 'Measure'));
  if (!staves.length) throw new Error('That MuseScore file has no music in it.');
  const count = Math.max(...staves.map((st) => st.kids.filter((k) => k.tag === 'Measure' && !kid(k, 'multiMeasureRest')).length));
  if (count > MAX_MEASURES) throw new Error('That score has too many measures.');
  const bars: Bar[] = Array.from({ length: count }, () => ({ len: 0, beats: 4, den: 4, sounding: false, tempos: [] }));
  const holds: Hold[] = [], onsets: [number, number][] = [];
  const marks: BarMarks[] = Array.from({ length: count }, () => ({}));
  staves.forEach((st, si) => {
    let beats = 4, den = 4;
    // A multi-measure rest is stored as an extra measure in front of the real ones: skip it (MuseScore rebuilds it).
    st.kids.filter((k) => k.tag === 'Measure' && !kid(k, 'multiMeasureRest')).forEach((m, i) => {
      const bar = bars[i];
      if (kid(m, 'startRepeat')) marks[i].startRepeat = true;
      if (kid(m, 'endRepeat')) marks[i].endRepeat = Math.min(Math.max(2, num(kid(m, 'endRepeat')) || 2), 20);
      // Jumps, markers, and voltas: on the measure or in a voice, depending on the MuseScore version.
      for (const e of [...m.kids, ...m.kids.filter((k) => k.tag === 'voice').flatMap((v) => v.kids)]) {
        if (e.tag === 'Marker' && kid(e, 'label')) addMarker(marks[i], kid(e, 'label')!.text.trim());
        else if (e.tag === 'Jump') {
          const t = (tag: string) => kid(e, tag)?.text.trim() ?? '';
          marks[i].jump = { to: t('jumpTo') || 'start', until: t('playUntil') || 'end', ...(t('continueAt') ? { continueAt: t('continueAt') } : {}), ...(num(kid(e, 'playRepeats')) ? { playRepeats: true } : {}) };
        } else if (e.tag === 'Spanner' && e.attrs.type === 'Volta' && kid(e, 'Volta')) { // its end is this many bars on
          const n = num(kid(kid(kid(e, 'next'), 'location'), 'measures')) || 1;
          for (let k = i; k < Math.min(count, i + n); k++) addEndings(marks[k], endingNumbers(kid(kid(e, 'Volta'), 'endings')?.text));
        }
      }
      for (const v of m.kids.filter((k) => k.tag === 'voice')) {
        let pos = 0;
        const tup = [1];
        let fermata = 0; // the stretch of a fermata waiting for its chord or rest
        for (const e of v.kids) {
          if (e.tag === 'TimeSig') { beats = num(kid(e, 'sigN')) || beats; den = num(kid(e, 'sigD')) || den; }
          else if (e.tag === 'Tuplet') tup.push(tup[tup.length - 1] * (num(kid(e, 'normalNotes')) / num(kid(e, 'actualNotes')) || 1));
          else if (e.tag === 'endTuplet') { if (tup.length > 1) tup.pop(); }
          else if (e.tag === 'location') pos += frac(kid(e, 'fractions')?.text) * 4 || 0;
          else if (e.tag === 'Tempo') { const q = num(kid(e, 'tempo')) * 60; if (q > 0 && q < 2000) bar.tempos.push([pos, q]); }
          else if (e.tag === 'Fermata') fermata = num(kid(e, 'timeStretch')) || 2; // MuseScore 4 holds a fermata twice as long by default
          else if ((e.tag === 'Chord' || e.tag === 'Rest') && !isGrace(e)) {
            const t = kid(e, 'durationType')?.text.trim() ?? '';
            const d = t === 'measure' ? frac(kid(e, 'duration')?.text) * 4 : (DUR[t] ?? 0) * (2 - 1 / 2 ** (num(kid(e, 'dots')) || 0)) * tup[tup.length - 1];
            if (e.tag === 'Chord') bar.sounding = true;
            onsets.push([i, pos]);
            if (fermata) { holds.push([i, pos, pos + (d || 0), fermata]); fermata = 0; }
            pos += d || 0;
          }
        }
      }
      if (si === 0) { bar.beats = beats; bar.den = den; }
      const len = frac(m.attrs.len) * 4; // an irregular bar (a pickup) says how long it really is; otherwise its meter
      bar.len = Number.isFinite(len) ? len : Math.max(bar.len, (beats * 4) / den);
    });
  });
  return toMap(bars, holds, onsets, marks);
}
