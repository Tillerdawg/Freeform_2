// Counts from a score's MusicXML (or compressed .mxl), without exporting a MIDI: the same bar map and tempo map the
// MIDI gives (measures with their meter and whether anything sounds, tempos from <sound tempo> or metronome marks),
// in the same shape, so counts are placed by the same rules. Files come from anywhere: size-capped, and only the
// handful of tags needed are read (no DTDs or entities are fetched or expanded).
import { parseMidi, type Midi } from './midi';

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

/** Read a MusicXML score (partwise) into a bar and tempo map. `warnings` lists what it can't follow (repeats). */
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
  let repeats = false;
  const holds: [bar: number, from: number, to: number][] = []; // fermata notes (quarters into their bar)
  const onsets: [bar: number, at: number][] = []; // where every note and rest starts, in any part
  for (const part of parts) {
    let div = 1, beats = 4, den = 4;
    part.kids.filter((k) => k.tag === 'measure').forEach((m, i) => {
      const bar = bars[i];
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
          if (kid(kid(e, 'notations'), 'fermata')) holds.push([i, at, at + d]);
          chordAt = at;
          onsets.push([i, at]);
          if (!kid(e, 'chord')) pos += d;
        } else if (e.tag === 'backup') pos -= num(kid(e, 'duration')) / div || 0;
        else if (e.tag === 'forward') pos += num(kid(e, 'duration')) / div || 0;
        else if (e.tag === 'barline' && (kid(e, 'repeat') || kid(e, 'ending'))) repeats = true;
        if (e.tag === 'sound' || e.tag === 'direction') {
          const s = e.tag === 'sound' ? e : kid(e, 'sound');
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
  const measures: Midi['measures'] = [], tempos: Midi['tempos'] = [];
  let tick = 0;
  for (const b of bars) {
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
    measures.push({ start: tick, beats, den, sounding: b.sounding });
    tick += Math.round(len * PPQ);
  }
  tempos.sort((a, b) => a[0] - b[0]);
  if (!tempos.length || tempos[0][0] > 0) tempos.unshift([0, 500000]); // no mark at the start: 120 bpm, as MuseScore plays it
  // Fermatas, as MuseScore plays them: from the fermata to the next note or rest that starts in any part (not the
  // whole note: a whole-bar rest with a fermata holds only until someone else moves), at half tempo.
  const tk = (i: number, q: number) => measures[i].start + Math.round(q * PPQ);
  const starts = [...new Set(onsets.map(([i, q]) => tk(i, q)))].sort((a, b) => a - b);
  const spans = holds.map(([i, a, b]) => { const s = tk(i, a), next = starts.find((t) => t > s) ?? Infinity; return [s, Math.min(tk(i, b), next)] as const; }).filter(([a, b]) => b > a);
  const base = (t: number) => { let us = tempos[0][1]; for (const [k, v] of tempos) if (k <= t) us = v; return us; };
  const held = (t: number) => spans.some(([a, b]) => t >= a && t < b);
  const edges = [...new Set([...tempos.map(([k]) => k), ...spans.flat()])].sort((a, b) => a - b);
  const map = edges.map((t) => [t, held(t) ? base(t) * 2 : base(t)] as [number, number]);
  const dedup = map.filter((t, k) => k === 0 || t[1] !== map[k - 1][1]);
  const warnings = repeats ? ['This score has repeats or endings, which are counted as written (once through). If the recording plays them, use the score\'s MIDI instead.'] : [];
  return { ppq: PPQ, tempos: dedup, measures, end: tick, warnings };
}

/** The main score file inside a compressed MusicXML (.mxl) zip. */
export async function unzipMxl(buf: ArrayBuffer): Promise<string> {
  const v = new DataView(buf), b = new Uint8Array(buf);
  let e = -1;
  for (let o = b.length - 22; o >= Math.max(0, b.length - 65557); o--) if (v.getUint32(o, true) === 0x06054b50) { e = o; break; }
  if (e < 0) throw new Error("That .mxl file is damaged (it isn't a readable zip).");
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
      if (method !== 8) throw new Error('That .mxl file uses a compression Freeform can\'t read.');
      return new TextDecoder().decode(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    };
    o += 46 + nameLen + extra + comment;
  }
  const container = files['META-INF/container.xml'] && parseXml(await files['META-INF/container.xml']());
  const rootfile = container && findDeep(container, 'rootfile')?.attrs['full-path'];
  const main = (rootfile && files[rootfile]) ? rootfile : Object.keys(files).find((f) => !f.startsWith('META-INF/') && /\.(musicxml|xml)$/i.test(f));
  if (!main) throw new Error('No score was found inside that .mxl file.');
  return files[main]();
}

function findDeep(e: El, tag: string): El | undefined {
  for (const k of e.kids) { if (k.tag === tag) return k; const f = findDeep(k, tag); if (f) return f; }
}

/** A score's bar and tempo map from a MIDI, MusicXML or .mxl file (told apart by content, not the file name). */
export async function parseScore(buf: ArrayBuffer): Promise<Midi & { warnings?: string[] }> {
  if (buf.byteLength > MAX_BYTES) throw new Error('That file is too big to be a score.');
  const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
  const sig = String.fromCharCode(...head);
  if (sig === 'MThd') return parseMidi(buf);
  if (sig.startsWith('PK')) return parseMusicXml(await unzipMxl(buf));
  const text = new TextDecoder().decode(buf);
  if (/<score-(partwise|timewise)\b/.test(text.slice(0, 5000))) return parseMusicXml(text);
  throw new Error("That isn't a MIDI or MusicXML file. Export the score from MuseScore (or Finale) as MIDI or MusicXML.");
}
