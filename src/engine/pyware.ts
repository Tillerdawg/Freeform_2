// Import Pyware 3D ".3dj" drill files. Clean-room: written from the behavior of Jason's own files (see DECISIONS.md),
// no Pyware code. A .3dj is a chain of blocks: a 4-letter tag, a 4-byte big-endian length, then the data.
//   GRID  plain-text field description (yards from the field's center); HZHS lines are the hashes.
//   CAST  performers: u16 count, then per performer u16 id, a short string (label number), a short string (name).
//   CST2  (newer files) per performer u16 id + short string naming the 3D figure, e.g. "Trumpet Figure".
//   PAGE  one per count: u16 count, then 20-byte records: u16 id … byte 8 = dot symbol … u16 x at 13, u16 y at 15.
//         x, y are offset by 0x8000 from the field's center; 120 units = one 8-to-5 step; +x = Side 2, +y = front.
//   PROP  ends a set: the PAGEs since the previous PROP are that set's counts (the last one is the set itself).
//         Byte 25 starts a u16 length and the set's note text.
// Files keep 300+ PAGEs; the ones after the last PROP are unused.
import { FIELD_WIDTH } from './coords';
import type { HashPreset } from './coords';
import { newId, parseShow, type DrillSet, type Performer, type Section, type Show } from './show';

const UNIT = 120; // file units per step
const MAX_BYTES = 50_000_000;

const fail = (msg: string): never => { throw new Error(msg); };

/** Read a .3dj file into a Freeform show. Throws a readable error for anything it can't use. */
export function parse3dj(data: ArrayBuffer, title = 'Imported show'): Show {
  if (data.byteLength > MAX_BYTES) fail('That file is too big to be a Pyware show.');
  const b = new Uint8Array(data);
  const v = new DataView(data);
  const tagAt = (o: number) => (o + 8 <= b.length ? String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]) : '');
  if (tagAt(0) !== '3DJV') fail("That isn't a Pyware 3D (.3dj) drill file.");

  // Walk the blocks. A few blocks store a wrong length, so when the chain breaks, look ahead for the next real block.
  const blocks: { tag: string; at: number; len: number }[] = [];
  const known = /^(PREF|PRF2|GRID|CAST|CST2|CST3|COLR|PLST|PTAB|PTB2|PTB5|FACE|PAGE|PROP|SYNC|END\.)$/;
  const validAt = (o: number) => known.test(tagAt(o)) && o + 8 + v.getUint32(o + 4) <= b.length;
  let o = indexOf(b, 'PREF', 0);
  if (o < 0) fail("That Pyware file looks damaged (no settings block found).");
  while (o >= 0 && o + 8 <= b.length) {
    const tag = tagAt(o), len = v.getUint32(o + 4);
    blocks.push({ tag, at: o + 8, len });
    if (tag === 'END.' || tag === 'SYNC') break;
    let next = o + 8 + len;
    if (!validAt(next)) next = resync(b, v, o + 8, validAt);
    o = next;
  }

  const first = (tag: string) => blocks.find((x) => x.tag === tag);
  const cast = first('CAST') ?? fail('That Pyware file has no performers.');

  // Performers: label numbers from CAST, figure names from CST2 (when present).
  const labels = new Map<number, string>();
  readList(b, v, cast, (id, strs) => labels.set(id, strs[0] ?? ''), 2);
  const figures = new Map<number, string>();
  const c2 = first('CST2');
  if (c2) readList(b, v, c2, (id, strs) => figures.set(id, strs[0] ?? ''), 1);

  // Sets: the PAGEs between PROPs.
  type Rec = { x: number; y: number; sym: string };
  const readPage = (blk: { at: number; len: number }) => {
    const n = v.getUint16(blk.at), recs = new Map<number, Rec>();
    if (2 + n * 20 !== blk.len) return null;
    for (let i = 0; i < n; i++) {
      const r = blk.at + 2 + i * 20;
      recs.set(v.getUint16(r), { x: v.getUint16(r + 13) - 0x8000, y: v.getUint16(r + 15) - 0x8000, sym: String.fromCharCode(b[r + 8]) });
    }
    return recs;
  };
  const runs: { last: Map<number, Rec>; counts: number; note: string }[] = [];
  let pages: Map<number, Rec>[] = [];
  for (const blk of blocks) {
    if (blk.tag === 'PAGE') { const p = readPage(blk); if (p) pages.push(p); }
    if (blk.tag === 'PROP') {
      const textLen = blk.len >= 27 ? v.getUint16(blk.at + 25) : 0;
      const note = latin1(b.subarray(blk.at + 27, Math.min(blk.at + 27 + textLen, blk.at + blk.len))).replace(/\r\n?/g, '\n').trim();
      if (pages.length) runs.push({ last: pages[pages.length - 1], counts: runs.length ? pages.length : 0, note });
      else if (runs.length && note) runs[runs.length - 1].note += '\n' + note;
      pages = [];
    }
  }
  if (!runs.length) fail('That Pyware file has no saved sets (it may be a backup or draft copy). Try another version of the show.');

  // Sections: one per dot symbol, named after the figure most of its performers use.
  const firstSeen = new Map<number, Rec>();
  for (const r of runs) for (const [id, rec] of r.last) if (!firstSeen.has(id)) firstSeen.set(id, rec);
  const symbols = [...new Set([...firstSeen.values()].map((r) => r.sym))].sort();
  const figureOf = (sym: string) => {
    const counts = new Map<string, number>();
    for (const [id, r] of firstSeen) if (r.sym === sym) { const f = (figures.get(id) ?? '').replace(/\s*Figure$/i, '').trim(); if (f) counts.set(f, (counts.get(f) ?? 0) + 1); }
    return [...counts].sort((a, c) => c[1] - a[1])[0]?.[0] ?? '';
  };
  const names = symbols.map(figureOf);
  const sections: Section[] = symbols.map((sym, i) => {
    const base = names[i] || `Symbol ${sym}`;
    const shared = names[i] && names.filter((x) => x === names[i]).length > 1;
    return { id: newId('s'), name: shared ? `${base} (${sym})` : base, letter: sym };
  });
  const sectionOf = new Map(symbols.map((s, i) => [s, sections[i].id]));

  const performers: Performer[] = [];
  const pid = new Map<number, string>();
  const used = new Map<string, Set<number>>();
  for (const [id, rec] of [...firstSeen].sort((a, c) => a[0] - c[0])) {
    const section = sectionOf.get(rec.sym)!;
    const taken = used.get(section) ?? new Set<number>();
    let number = parseInt(labels.get(id) ?? '', 10);
    if (!Number.isFinite(number) || number < 1 || taken.has(number)) { number = 1; while (taken.has(number)) number++; }
    taken.add(number); used.set(section, taken);
    const p: Performer = { id: newId('p'), section, number };
    performers.push(p); pid.set(id, p.id);
  }

  // Field position: Freeform measures x in steps from the 50 (+ = Side 2) and y in steps from the front sideline.
  const sets: DrillSet[] = [];
  let prev: Record<string, { x: number; y: number }> = {};
  runs.forEach((r, i) => {
    const pos: Record<string, { x: number; y: number }> = { ...prev };
    for (const [id, rec] of r.last) pos[pid.get(id)!] = { x: rec.x / UNIT, y: FIELD_WIDTH / 2 - rec.y / UNIT };
    for (const p of performers) pos[p.id] ??= { x: 0, y: FIELD_WIDTH / 2 };
    const set: DrillSet = { id: newId('set'), name: String(i + 1), counts: r.counts, pos };
    const mm = r.note.match(/\bmm?\.?\s*(\d+(?:\s*[-–]\s*\d+)?)/i);
    if (mm) set.measures = mm[1].replace(/\s+/g, '').replace('-', '–');
    if (r.note) set.note = r.note;
    sets.push(set); prev = pos;
  });

  const show: Show = { format: 'freeform-show', version: 1, title, hash: hashFrom(b, first('GRID')), sections, performers, sets };
  return parseShow(JSON.stringify(show)); // same checks as any imported file
}

/** Hashes from the GRID text ("HZHS -8.75" = yards from center): high school ±8.75, college ±6.25, NFL ±3.75. */
function hashFrom(b: Uint8Array, grid?: { at: number; len: number }): HashPreset {
  if (!grid) return 'highSchool';
  const m = latin1(b.subarray(grid.at, grid.at + grid.len)).match(/HZHS\s+(-?[\d.]+)/);
  const yd = m ? Math.abs(parseFloat(m[1])) : 8.75;
  const options: [HashPreset, number][] = [['highSchool', 8.75], ['college', 6.25], ['nfl', 3.75]];
  return options.sort((a, c) => Math.abs(a[1] - yd) - Math.abs(c[1] - yd))[0][0];
}

/** CAST/CST2: u16 count, then per entry u16 id followed by `strings` short (length-prefixed) strings. */
function readList(b: Uint8Array, v: DataView, blk: { at: number; len: number }, each: (id: number, strs: string[]) => void, strings: number) {
  const end = blk.at + blk.len;
  let o = blk.at + 2;
  for (let k = v.getUint16(blk.at); k > 0 && o + 2 <= end; k--) {
    const id = v.getUint16(o); o += 2;
    const strs: string[] = [];
    for (let s = 0; s < strings && o < end; s++) { const n = b[o]; strs.push(latin1(b.subarray(o + 1, o + 1 + n))); o += 1 + n; }
    each(id, strs);
  }
}

function resync(b: Uint8Array, v: DataView, from: number, validAt: (o: number) => boolean): number {
  for (let o = from; o + 8 <= b.length; o++) {
    const t = b[o];
    if ((t === 0x50 || t === 0x53 || t === 0x45) && validAt(o)) { // P(AGE|ROP), S(YNC), E(ND.)
      const tag = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
      if (tag !== 'PAGE' || (v.getUint32(o + 4) - 2) % 20 === 0) return o;
    }
  }
  return -1;
}

const indexOf = (b: Uint8Array, s: string, from: number) => {
  outer: for (let o = from; o + s.length <= b.length; o++) {
    for (let i = 0; i < s.length; i++) if (b[o + i] !== s.charCodeAt(i)) continue outer;
    return o;
  }
  return -1;
};
const latin1 = (a: Uint8Array) => Array.from(a, (c) => String.fromCharCode(c)).join('');
