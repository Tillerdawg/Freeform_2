import { describe, expect, it } from 'vitest';
import { distance, type Point } from './coords';
import { addCurvePoint, assign, fitShape, slots, type Shape } from './shapes';

const near = (p: Point, x: number, y: number) => { expect(p.x).toBeCloseTo(x, 4); expect(p.y).toBeCloseTo(y, 4); };
const S = (kind: Shape['kind'], handles: Point[], extra: Partial<Shape> = {}): Shape => ({ kind, handles, interval: null, cols: 3, ...extra });

describe('slots', () => {
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
