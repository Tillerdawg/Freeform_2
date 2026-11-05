import { describe, expect, it } from 'vitest';
import { distance, type Point } from './coords';
import { addBezierSegment, addCurvePoint, assign, coilGap, fitShape, isControl, moveHandle, placeInner, samplePath, slots, cleanText, GLYPHS, textStrokes, type Shape } from './shapes';

const near = (p: Point, x: number, y: number) => { expect(p.x).toBeCloseTo(x, 4); expect(p.y).toBeCloseTo(y, 4); };
const S = (kind: Shape['kind'], handles: Point[], extra: Partial<Shape> = {}): Shape => ({ kind, handles, interval: null, cols: 3, ...extra });

describe('slots', () => {
  it('spiral: center to outer end, the same straight-line interval everywhere, even at the tight center', () => {
    const sp = S('spiral', [{ x: 0, y: 0 }, { x: 16, y: 0 }], { turns: 2 });
    const p = slots(sp, 20);
    near(p[0], 0, 0); near(p[19], 16, 0);
    const gaps = p.slice(1).map((q, i) => distance(p[i], q));
    gaps.forEach((g) => expect(g).toBeCloseTo(gaps[0], 2)); // straight-line intervals, even at the tight center
    expect(coilGap(sp)).toBe(8);
    // The radius grows steadily with the angle: halfway along the turns, halfway out.
    near(samplePath(sp).pts[128], 8, 0); // one whole turn in from the end: straight in toward the center
  });
  it('polygon: a square, one spot per corner and between them, evenly around', () => {
    const p = slots(S('polygon', [{ x: 0, y: 0 }, { x: 8, y: 0 }], { sides: 4 }), 8);
    near(p[0], 8, 0); near(p[2], 0, 8); near(p[4], -8, 0); near(p[6], 0, -8); near(p[1], 4, 4);
  });
  it('star: points at the outer handle, inside corners at the inner handle', () => {
    const star = placeInner(S('star', [{ x: 0, y: 0 }, { x: 0, y: 10 }], { sides: 5 }), 4);
    near(star.handles[2], -4 * Math.sin(Math.PI / 5), 4 * Math.cos(Math.PI / 5)); // on the first inside corner
    const { pts, closed } = samplePath(star);
    expect(closed).toBe(true); expect(pts).toHaveLength(10);
    pts.forEach((q, i) => expect(Math.hypot(q.x, q.y)).toBeCloseTo(i % 2 ? 4 : 10, 6));
    expect(slots(star, 10).map((q) => Math.round(Math.hypot(q.x, q.y)))).toEqual([10, 4, 10, 4, 10, 4, 10, 4, 10, 4]); // one per corner
  });
  it('star: dragging the inner handle sets only the inside depth; turning the star carries it along', () => {
    const star = placeInner(S('star', [{ x: 0, y: 0 }, { x: 0, y: 10 }], { sides: 5 }), 4);
    const deeper = moveHandle(star, 2, { x: 6, y: 0 }); // dragged off its corner: snaps back onto it, 6 out
    near(deeper.handles[2], -6 * Math.sin(Math.PI / 5), 6 * Math.cos(Math.PI / 5));
    const turned = moveHandle(star, 1, { x: 10, y: 0 }); // point now to the right: inner corner a fifth of a half turn on
    near(turned.handles[2], 4 * Math.cos(Math.PI / 5), 4 * Math.sin(Math.PI / 5));
    const moved = moveHandle(star, 0, { x: 2, y: 0 }); // moving the center keeps the inside depth
    expect(distance(moved.handles[0], moved.handles[2])).toBeCloseTo(4, 6);
  });
  it('spiral: a set interval, performer to performer, from the center', () => {
    const p = slots(S('spiral', [{ x: 0, y: 0 }, { x: 16, y: 0 }], { turns: 2, interval: 2 }), 30);
    near(p[0], 0, 0);
    p.slice(1).forEach((q, i) => expect(distance(p[i], q)).toBeCloseTo(2, 4));
  });
  it('spiral: negative turns wind the other way', () => {
    const ccw = samplePath(S('spiral', [{ x: 0, y: 0 }, { x: 8, y: 0 }], { turns: 1 })).pts[96];
    const cw = samplePath(S('spiral', [{ x: 0, y: 0 }, { x: 8, y: 0 }], { turns: -1 })).pts[96];
    expect(ccw.y).toBeLessThan(0); // three quarters out, a quarter turn before the end: below the center going counterclockwise
    expect(cw.y).toBeGreaterThan(0);
  });
  it('line: even spacing end to end', () => {
    const p = slots(S('line', [{ x: -16, y: 10 }, { x: 0, y: 10 }]), 5);
    p.forEach((q, i) => near(q, -16 + 4 * i, 10));
  });
  it('line: one performer sits in the middle', () => near(slots(S('line', [{ x: 0, y: 0 }, { x: 8, y: 0 }]), 1)[0], 4, 0));
  it('line: fixed interval from the first end, continuing past the far end', () => {
    const p = slots(S('line', [{ x: 0, y: 0 }, { x: 4, y: 0 }], { interval: 2 }), 4);
    [0, 2, 4, 6].forEach((x, i) => near(p[i], x, 0));
  });
  it('arc: passes through its three handles and spaces evenly by arc length', () => {
    // Half circle of radius 8 around (0,0): from (-8,0) over (0,8) to (8,0).
    const p = slots(S('arc', [{ x: -8, y: 0 }, { x: 0, y: 8 }, { x: 8, y: 0 }]), 3);
    near(p[0], -8, 0); near(p[1], 0, 8); near(p[2], 8, 0);
    const five = slots(S('arc', [{ x: -8, y: 0 }, { x: 0, y: 8 }, { x: 8, y: 0 }]), 5);
    const gaps = five.slice(1).map((q, i) => distance(five[i], q));
    gaps.forEach((g) => expect(g).toBeCloseTo(gaps[0], 2));
    five.forEach((q) => expect(Math.hypot(q.x, q.y)).toBeCloseTo(8, 2));
  });
  it('arc: bend handle on the line makes a straight line', () => {
    const p = slots(S('arc', [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 8, y: 0 }]), 3);
    near(p[1], 4, 0);
  });
  it('circle: n performers evenly around, starting at the edge handle', () => {
    const p = slots(S('circle', [{ x: 0, y: 0 }, { x: 8, y: 0 }]), 4);
    near(p[0], 8, 0); near(p[1], 0, 8); near(p[2], -8, 0); near(p[3], 0, -8);
  });
  it('curve: goes through every handle', () => {
    const h = [{ x: 0, y: 0 }, { x: 8, y: 4 }, { x: 16, y: 0 }];
    const p = slots(S('curve', h), 41);
    for (const q of h) expect(Math.min(...p.map((s) => distance(s, q)))).toBeLessThan(0.5);
  });
  it('block: rows x cols, interval from the first corner toward the other', () => {
    const p = slots(S('block', [{ x: 0, y: 10 }, { x: 4, y: 6 }], { interval: 2, cols: 3 }), 6);
    [[0, 10], [2, 10], [4, 10], [0, 8], [2, 8], [4, 8]].forEach(([x, y], i) => near(p[i], x, y));
  });
  it('block: even spacing fills the rectangle', () => {
    const p = slots(S('block', [{ x: 0, y: 0 }, { x: 8, y: 8 }], { cols: 3 }), 9);
    near(p[4], 4, 4); near(p[8], 8, 8);
  });
});

describe('least-travel assignment', () => {
  it('finds the optimum on a case greedy gets wrong', () => {
    // Greedy would send A to the closest spot (1), forcing B far away.
    const from = [{ x: 0, y: 0 }, { x: 2, y: 0 }];
    const to = [{ x: 1, y: 0 }, { x: -10, y: 0 }];
    expect(assign(from, to)).toEqual([1, 0]);
  });
  it('handles more spots than performers', () => {
    const r = assign([{ x: 10, y: 0 }], [{ x: 0, y: 0 }, { x: 9, y: 0 }, { x: 20, y: 0 }]);
    expect(r).toEqual([1]);
  });
  it('paths never cross (random trials)', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 40;
    const cross = (a: Point, b: Point, c: Point, d: Point) => {
      const o = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
      return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
    };
    for (let trial = 0; trial < 30; trial++) {
      const from = Array.from({ length: 8 }, () => ({ x: rnd(), y: rnd() }));
      const to = slots(S('arc', [{ x: 0, y: 0 }, { x: 20, y: 15 }, { x: 40, y: 0 }]), 8);
      const a = assign(from, to);
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) expect(cross(from[i], to[a[i]], from[j], to[a[j]])).toBe(false);
    }
  });
});

describe('helpers', () => {
  it('fitShape gives each kind the right number of handles and room for everyone', () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 1 }];
    expect(fitShape('line', pts).handles).toHaveLength(2);
    expect(fitShape('arc', pts).handles).toHaveLength(3);
    expect(fitShape('curve', pts).handles).toHaveLength(4);
    const line = fitShape('line', pts);
    expect(distance(line.handles[0], line.handles[1])).toBeGreaterThanOrEqual(4);
  });
  it('addCurvePoint splits the longest segment', () => {
    const s = addCurvePoint(S('curve', [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 12, y: 0 }]));
    expect(s.handles.map((p) => p.x)).toEqual([0, 2, 7, 12]);
  });
});

describe('bezier', () => {
  const B = (h: Point[]) => S('bezier', h);
  it('passes through its anchors but not its controls', () => {
    const s = B([{ x: 0, y: 0 }, { x: 0, y: 12 }, { x: 16, y: 12 }, { x: 16, y: 0 }]);
    const { pts } = samplePath(s);
    near(pts[0], 0, 0); near(pts.at(-1)!, 16, 0);
    expect(Math.max(...pts.map((p) => p.y))).toBeCloseTo(9, 1); // pulled to 3/4 of the controls' height at the middle
    expect(isControl(s, 0)).toBe(false); expect(isControl(s, 1)).toBe(true); expect(isControl(s, 3)).toBe(false);
  });
  it('with controls on the line it is a straight line, evenly spaced', () => {
    const p = slots(B([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 12, y: 0 }, { x: 16, y: 0 }]), 5);
    p.forEach((q, i) => near(q, 4 * i, 0));
  });
  it('a new segment joins smoothly and ends on a new anchor', () => {
    const s = addBezierSegment(B([{ x: 0, y: 0 }, { x: 4, y: 6 }, { x: 12, y: 6 }, { x: 16, y: 0 }]));
    expect(s.handles).toHaveLength(7);
    const [c, a, c2] = [s.handles[2], s.handles[3], s.handles[4]];
    expect(c2).toEqual({ x: 2 * a.x - c.x, y: 2 * a.y - c.y }); // mirror: same tangent both sides of the joint
    expect(isControl(s, 6)).toBe(false);
  });
});

describe('bezier handle dragging', () => {
  // Two segments with a smooth joint at anchor 3, (16,0): controls at (12,0) and (20,0).
  const two = (): Shape => S('bezier', [{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 12, y: 0 }, { x: 16, y: 0 }, { x: 20, y: 0 }, { x: 28, y: 4 }, { x: 32, y: 0 }]);
  it('dragging a control at a smooth joint swings its partner opposite, keeping the partner length', () => {
    const s = moveHandle(two(), 2, { x: 16, y: -4 }); // straight below the anchor
    near(s.handles[4], 16, 4); // partner now straight above, still 4 away
  });
  it('a lopsided joint keeps the partner its own length', () => {
    const s = moveHandle(two(), 2, { x: 8, y: 0 }); // longer arm, same direction
    near(s.handles[4], 20, 0);
  });
  it('holding Option moves one control alone (makes a corner); a corner then stays a corner', () => {
    const corner = moveHandle(two(), 2, { x: 16, y: -4 }, true);
    near(corner.handles[4], 20, 0);
    const again = moveHandle(corner, 2, { x: 12, y: -4 });
    near(again.handles[4], 20, 0);
  });
  it('moving an anchor carries its controls; Option leaves them', () => {
    const s = moveHandle(two(), 3, { x: 16, y: 8 });
    near(s.handles[2], 12, 8); near(s.handles[4], 20, 8);
    const f = moveHandle(two(), 3, { x: 16, y: 8 }, true);
    near(f.handles[2], 12, 0);
  });
  it('other shapes just move the one handle', () => {
    const s = moveHandle(S('line', [{ x: 0, y: 0 }, { x: 8, y: 0 }]), 1, { x: 8, y: 4 });
    expect(s.handles).toEqual([{ x: 0, y: 0 }, { x: 8, y: 4 }]);
  });
});

describe('text shape', () => {
  const box = (text: string): Shape => ({ kind: 'text', handles: [{ x: 0, y: 20 }, { x: 18, y: 32 }], interval: null, cols: 1, text });
  it('spells the text inside its box, with the right number of spots', () => {
    const spots = slots(box('HI'), 30);
    expect(spots).toHaveLength(30);
    expect(spots.every((p) => p.x >= -1e-9 && p.x <= 18 + 1e-9 && p.y >= 20 - 1e-9 && p.y <= 32 + 1e-9)).toBe(true);
    // H's legs reach the top and bottom of the box.
    expect(spots.some((p) => Math.abs(p.x) < 1e-9 && Math.abs(p.y - 32) < 1e-9)).toBe(true);
    expect(spots.some((p) => Math.abs(p.x) < 1e-9 && Math.abs(p.y - 20) < 1e-9)).toBe(true);
  });
  it('keeps only what it can spell, and every glyph has strokes', () => {
    expect(cleanText('go  dawgs!')).toBe('GO DAWGS');
    for (const g of Object.values(GLYPHS)) expect(g.every((st) => st.length >= 2)).toBe(true);
    expect(textStrokes(box('A B')).length).toBe(3); // A has 2 strokes and B has 1; the space has none
  });
});
