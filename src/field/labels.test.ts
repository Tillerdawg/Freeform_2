import { describe, expect, it } from 'vitest';
import { placeLabels, type LabelItem } from './labels';

const dot = (x: number, y: number, extra: Partial<LabelItem> = {}): LabelItem => ({ x, y, w: 16, h: 10, r: 3, ...extra });
const rects = (items: LabelItem[], spots: ReturnType<typeof placeLabels>) =>
  spots.flatMap((s, i) => (s ? [{ ...s, w: items[i].w, h: items[i].h }] : []));
const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

describe('placeLabels', () => {
  it('puts a lone label above its dot', () => {
    expect(placeLabels([dot(100, 100)])).toEqual([{ x: 100, y: 100 - 3 - 2 - 5 }]);
  });
  it('never lets labels overlap each other or cover a dot, in a tight block', () => {
    const block: LabelItem[] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) block.push(dot(c * 14, r * 14));
    const spots = placeLabels(block);
    const placed = rects(block, spots);
    for (let a = 0; a < placed.length; a++) for (let b = a + 1; b < placed.length; b++) expect(overlap(placed[a], placed[b])).toBe(false);
    for (const p of placed) for (const d of block) expect(Math.abs(p.x - d.x) >= d.r + p.w / 2 || Math.abs(p.y - d.y) >= d.r + p.h / 2).toBe(true);
    expect(spots.some((s) => s === null)).toBe(true); // too tight for all of them: some wait for zoom
    expect(spots.filter(Boolean).length).toBeGreaterThan(4); // the edges still get labels
  });
  it('dodges to another side when above is taken', () => {
    const spots = placeLabels([dot(0, 0), dot(0, -12)]); // second dot sits right where the first label would go
    expect(spots[0]!.y).toBeGreaterThan(0); // first moved below
  });
  it('a pinned side never runs into another label', () => {
    const row = [0, 14, 28].map((x) => dot(x, 0, { pin: 'below' })); // labels 16 wide, dots 14 apart
    const spots = placeLabels(row);
    expect(spots[0]).not.toBeNull();
    expect(spots[1]).toBeNull();
    expect(spots[2]).not.toBeNull();
  });
  it('honors pinned sides, including hidden', () => {
    const spots = placeLabels([dot(0, 0, { pin: 'left' }), dot(50, 0, { pin: 'hidden' })]);
    expect(spots[0]).toEqual({ x: -3 - 2 - 8, y: 0 });
    expect(spots[1]).toBeNull();
  });
  it('places preferred labels first', () => {
    const items = [dot(0, 0), dot(0, -12, { first: true })];
    const spots = placeLabels(items);
    expect(spots[1]).toEqual({ x: 0, y: -12 - 10 }); // the preferred one keeps its spot above
  });
});
