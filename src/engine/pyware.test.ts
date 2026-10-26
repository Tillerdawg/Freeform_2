import { describe, expect, it } from 'vitest';
import { parse3dj } from './pyware';
import { setStarts } from './show';

// A tiny synthetic .3dj built from the layout parse3dj documents (no real show files in the repo).
const enc = new TextEncoder();
const u16 = (n: number) => [n >> 8, n & 255];
const u32 = (n: number) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
const str = (s: string) => [s.length, ...enc.encode(s)];
const block = (tag: string, data: number[], len = data.length) => [...enc.encode(tag), ...u32(len), ...data];

type Dot = { id: number; sym: string; x: number; y: number }; // x, y in steps, Pyware's way: from center, +y = front
const page = (dots: Dot[]) => block('PAGE', [...u16(dots.length), ...dots.flatMap((d) => {
  const r = Array(20).fill(0);
  r.splice(0, 2, ...u16(d.id)); r[2] = 2; r[8] = r[12] = d.sym.charCodeAt(0);
  r.splice(13, 2, ...u16(0x8000 + Math.round(d.x * 120))); r.splice(15, 2, ...u16(0x8000 + Math.round(d.y * 120)));
  return r;
})]);
const prop = (note: string) => block('PROP', [0, 1, 2, 0, 1, ...Array(16).fill(0), 1, 0, 0, 10, ...u16(note.length), ...enc.encode(note)]);
const grid = (hash: number) => block('GRID', [0, 0, ...str(`HZHS -${hash}`), ...str(`HZHS ${hash}`)]);

function file(parts: number[][], { figures = true, hash = 8.75 } = {}) {
  const cast = [[1, 'T', '1'], [2, 'T', '2'], [3, 'A', '1'], [4, 'X', '1']] as const;
  return new Uint8Array([
    ...block('3DJV', [0, 0, 0, 4, 0, 1, 0, 0, 0, 0]),
    ...enc.encode('PRPT'), ...u32(12), ...Array(9).fill(0), // real files store a wrong length here
    ...block('PREF', [0]),
    ...grid(hash),
    ...block('CAST', [...u16(cast.length), ...cast.flatMap(([id, , n]) => [...u16(id), ...str(n), ...str('Name Withheld')])]),
    ...(figures ? block('CST2', [...u16(4), ...u16(1), ...str('Trumpet Figure'), ...u16(2), ...str('Trumpet Figure'), ...u16(3), ...str('Saxophone Figure'), ...u16(4), ...str('Saxophone Figure')]) : []),
    ...parts.flat(),
    ...block('SYNC', [0, 0, 0, 0]),
  ]).buffer;
}

const at = (x: number, y: number) => [
  { id: 1, sym: 'T', x, y }, { id: 2, sym: 'T', x: x + 2, y }, { id: 3, sym: 'A', x: -x, y }, { id: 4, sym: 'X', x: 0, y: 0 },
];

describe('Pyware .3dj import', () => {
  const show = parse3dj(file([
    page(at(-4, 30)), prop('Opening set'),
    page(at(-3, 29)), page(at(-2, 28)), page(at(-1, 27)), page(at(0, 26)), prop('Set 2\r\n\r\nmm. 1-2, 4 count MOVE'),
    page(at(8, 10)), page(at(8, 10)), prop('Set 3 mm. 3 HOLD'),
    page(at(40, 40)), page(at(40, 40)), // unused trailing pages: no PROP after them
  ]), 'My Show');

  it('makes one set per PROP, with counts from the pages before it', () => {
    expect(show.title).toBe('My Show');
    expect(show.sets.map((s) => s.counts)).toEqual([0, 4, 2]);
    expect(setStarts(show).at(-1)).toBe(6);
  });
  it('places dots in Freeform steps: x from the 50 (+ Side 2), y from the front sideline', () => {
    const t1 = show.performers.find((p) => p.number === 1 && show.sections.find((s) => s.id === p.section)!.letter === 'T')!;
    expect(show.sets[0].pos[t1.id]).toEqual({ x: -4, y: 42 - 30 }); // Pyware +y is toward the front
    expect(show.sets[1].pos[t1.id]).toEqual({ x: 0, y: 16 });
    expect(show.sets[2].pos[t1.id]).toEqual({ x: 8, y: 32 });
  });
  it('names sections after their figures, telling apart symbols that share one', () => {
    expect(show.sections.map((s) => [s.letter, s.name])).toEqual([['A', 'Saxophone (A)'], ['T', 'Trumpet'], ['X', 'Saxophone (X)']]);
    const labels = show.performers.map((p) => show.sections.find((s) => s.id === p.section)!.letter + p.number).sort();
    expect(labels).toEqual(['A1', 'T1', 'T2', 'X1']);
  });
  it('keeps the set notes and reads measures out of them', () => {
    expect(show.sets[0].note).toBe('Opening set');
    expect(show.sets[1].note).toBe('Set 2\n\nmm. 1-2, 4 count MOVE');
    expect(show.sets.map((s) => s.measures)).toEqual([undefined, '1–2', '3']);
  });
  it('falls back to symbol names, and reads the hash from the field description', () => {
    const s = parse3dj(file([page(at(0, 0)), prop('')], { figures: false, hash: 6.25 }));
    expect(s.sections.map((x) => x.name)).toEqual(['Symbol A', 'Symbol T', 'Symbol X']);
    expect(s.hash).toBe('college');
    expect(parse3dj(file([page(at(0, 0)), prop('')], { hash: 3.75 })).hash).toBe('nfl');
  });
  it('recovers when a block stores a wrong length', () => {
    const bad = prop('Set 2 mm. 1-2'); bad.splice(4, 4, ...u32(bad.length - 8 - 5)); // claims 5 bytes fewer than it holds
    const s = parse3dj(file([page(at(0, 0)), prop('one'), page(at(1, 0)), bad, page(at(2, 0)), prop('three')]));
    expect(s.sets.map((x) => x.counts)).toEqual([0, 1, 1]);
  });
  it('explains files it cannot use', () => {
    expect(() => parse3dj(new TextEncoder().encode('{"format":"freeform-show"}').buffer)).toThrow(/isn't a Pyware 3D/);
    expect(() => parse3dj(file([page(at(0, 0)), page(at(1, 0))]))).toThrow(/no saved sets/);
  });
});
