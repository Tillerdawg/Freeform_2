import { describe, expect, it } from 'vitest';
import { curveSides, placeLabels, type LabelItem } from './labels';

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

describe('curveSides', () => {
  const arc = (cx: number, cy: number, r: number, from: number, to: number, n: number) =>
    Array.from({ length: n }, (_, i) => { const a = from + ((to - from) * i) / (n - 1); return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; });
  it('points labels into and out of a company front arc (center toward the front)', () => {
    const pts = arc(0, 10, 16, Math.PI / 4, (3 * Math.PI) / 4, 7); // arc bowing toward the back, center below it
    expect(curveSides(pts, false)[3]).toBe('below'); // the middle dot's inside is toward the center
    expect(curveSides(pts, true)[3]).toBe('above');
    expect(curveSides(pts, false)[0]).toBe('below-left'); // the Side 2 end of the arc: center is down and to Side 1
    expect(curveSides(pts, true)[6]).toBe('above-left');
  });
  it('works around a full circle', () => {
    const pts = arc(0, 40, 10, 0, (2 * Math.PI * 7) / 8, 8);
    expect(curveSides(pts, false)).toEqual(['left', 'below-left', 'below', 'below-right', 'right', 'above-right', 'above', 'above-left']);
  });
  it('follows each half of an S-curve', () => {
    const pts = [...arc(0, 0, 8, Math.PI, 0, 7), ...arc(16, 0, 8, Math.PI, 2 * Math.PI, 7).slice(1)]; // hump up, then dip down
    const sides = curveSides(pts, false);
    expect(sides[3]).toBe('below'); // top of the first hump: center below
    expect(sides[9]).toBe('above'); // bottom of the dip: center above
  });
  it('gives null for a straight line', () => {
    expect(curveSides([0, 2, 4, 6].map((x) => ({ x, y: 10 })), false)).toEqual([null, null, null, null]);
  });
});

describe('labels on printed charts (always shown)', () => {
  it('moves a label that cannot fit out from its dot, with a leader, instead of hiding it', () => {
    // A tight 3×3 block: the middle dot has no free side right beside it.
    const block = [-1, 0, 1].flatMap((gx) => [-1, 0, 1].map((gy) => ({ x: gx * 20, y: gy * 20, w: 30, h: 12, r: 5 })));
    const screen = placeLabels(block, 2);
    expect(screen.some((s) => s === null)).toBe(true); // on screen, some hide (zoom brings them back)
    const paper = placeLabels(block, 2, true);
    expect(paper.every((s) => s !== null)).toBe(true);
    expect(paper.some((s) => s?.leader)).toBe(true);
    // a label that fits beside its dot has no leader, and a pinned side still wins when it fits
    expect(placeLabels([{ x: 0, y: 0, w: 30, h: 12, r: 5, pin: 'below' }], 2, true)[0]).toEqual({ x: 0, y: 13 });
  });
});
