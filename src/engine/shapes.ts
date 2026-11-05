// Shape tools: lay selected performers out along a line, arc, curve, circle, polygon, star, spiral, or block. All units are steps.
import { distance, type Point } from './coords';

export type ShapeKind = 'line' | 'arc' | 'curve' | 'bezier' | 'circle' | 'polygon' | 'star' | 'spiral' | 'block';
/**
 * Handles by kind: line [a, b]; arc [a, bend, b] (the arc passes through all three);
 * curve [p0..pn] (smooth curve through every point); circle [center, edge]; block [corner, opposite corner];
 * polygon [center, a corner]: `sides` equal sides; star [center, a point, an inside corner]: `sides` points; the inside
 * corner handle sets how far in the inside corners sit (kept on the corner by `placeInner`);
 * spiral [center, outer end]: `turns` coils, counterclockwise going out (clockwise when `turns` is negative);
 * bezier [anchor, control, control, anchor, control, control, anchor, ...]: cubic segments that pass through the
 * anchors and are pulled toward (not through) the controls.
 */
export interface Shape { kind: ShapeKind; handles: Point[]; interval: number | null; cols: number; turns?: number; sides?: number }

/** Distance between neighboring coils of a spiral, in steps. */
export const coilGap = (s: Shape) => distance(s.handles[0], s.handles[1]) / Math.max(0.25, Math.abs(s.turns ?? 2));

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Dense polyline approximating an open or closed path shape. */
export function samplePath(s: Shape): { pts: Point[]; closed: boolean } {
  const h = s.handles;
  if (s.kind === 'line') return { pts: [h[0], h[1]], closed: false };
  if (s.kind === 'circle') {
    const r = distance(h[0], h[1]);
    const a0 = Math.atan2(h[1].y - h[0].y, h[1].x - h[0].x);
    const n = 256;
    return { pts: Array.from({ length: n }, (_, i) => ({ x: h[0].x + r * Math.cos(a0 + (2 * Math.PI * i) / n), y: h[0].y + r * Math.sin(a0 + (2 * Math.PI * i) / n) })), closed: true };
  }
  if (s.kind === 'polygon' || s.kind === 'star') {
    // Just the corners: spots go evenly around the outline, starting on the corner under the second handle.
    const R = distance(h[0], h[1]), a0 = Math.atan2(h[1].y - h[0].y, h[1].x - h[0].x);
    const star = s.kind === 'star', n = Math.max(3, Math.round(s.sides ?? 5)) * (star ? 2 : 1);
    return { pts: Array.from({ length: n }, (_, i) => {
      const r = star && i % 2 ? distance(h[0], h[2]) : R, a = a0 + (2 * Math.PI * i) / n;
      return { x: h[0].x + r * Math.cos(a), y: h[0].y + r * Math.sin(a) };
    }), closed: true };
  }
  if (s.kind === 'spiral') {
    // Archimedean: the radius grows by the same amount every turn, so the coils stay evenly apart. Starts at the center.
    const R = distance(h[0], h[1]), turns = s.turns ?? 2, a1 = Math.atan2(h[1].y - h[0].y, h[1].x - h[0].x);
    const n = Math.ceil(128 * Math.max(1, Math.abs(turns)));
    return { pts: Array.from({ length: n + 1 }, (_, i) => {
      const u = i / n, a = a1 + 2 * Math.PI * turns * (u - 1);
      return { x: h[0].x + R * u * Math.cos(a), y: h[0].y + R * u * Math.sin(a) };
    }), closed: false };
  }
  if (s.kind === 'arc') {
    const [a, m, b] = h;
    const c = circumcenter(a, m, b);
    if (!c) return { pts: [a, b], closed: false }; // bend handle on the line: it's a straight line
    const ang = (p: Point) => Math.atan2(p.y - c.y, p.x - c.x);
    const r = distance(c, a), t0 = ang(a);
    // Sweep from a to b in whichever direction passes through the bend point.
    const ccw = (x: number) => ((x - t0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let sweep = ccw(ang(b));
    if (ccw(ang(m)) > sweep) sweep -= 2 * Math.PI;
    const n = 128;
    return { pts: Array.from({ length: n + 1 }, (_, i) => ({ x: c.x + r * Math.cos(t0 + (sweep * i) / n), y: c.y + r * Math.sin(t0 + (sweep * i) / n) })), closed: false };
  }
  if (s.kind === 'bezier') {
    const pts: Point[] = [];
    for (let k = 0; k + 3 < h.length; k += 3) {
      const [p0, p1, p2, p3] = h.slice(k, k + 4);
      for (let i = 0; i < 48; i++) {
        const t = i / 48, u = 1 - t;
        const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
        pts.push({ x: w[0] * p0.x + w[1] * p1.x + w[2] * p2.x + w[3] * p3.x, y: w[0] * p0.y + w[1] * p1.y + w[2] * p2.y + w[3] * p3.y });
      }
    }
    pts.push(h.at(-1)!);
    return { pts, closed: false };
  }
  // curve: Catmull-Rom spline through every handle
  const pts: Point[] = [];
  for (let i = 0; i < h.length - 1; i++) {
    const p0 = h[Math.max(0, i - 1)], p1 = h[i], p2 = h[i + 1], p3 = h[Math.min(h.length - 1, i + 2)];
    for (let k = 0; k < 32; k++) {
      const t = k / 32, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  pts.push(h.at(-1)!);
  return { pts, closed: false };
}

function circumcenter(a: Point, b: Point, c: Point): Point | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return null;
  const sq = (p: Point) => p.x * p.x + p.y * p.y;
  return {
    x: (sq(a) * (b.y - c.y) + sq(b) * (c.y - a.y) + sq(c) * (a.y - b.y)) / d,
    y: (sq(a) * (c.x - b.x) + sq(b) * (a.x - c.x) + sq(c) * (b.x - a.x)) / d,
  };
}

/** Point at arc length `s` along a polyline; past the end, keeps going straight along the last segment. */
function along(pts: Point[], cum: number[], s: number): Point {
  let i = 1;
  while (i < pts.length - 1 && cum[i] < s) i++;
  const seg = cum[i] - cum[i - 1];
  return seg === 0 ? pts[i] : lerp(pts[i - 1], pts[i], (s - cum[i - 1]) / seg);
}

/** The n spots of a shape, in order from its first handle. */
export function slots(s: Shape, n: number): Point[] {
  if (n <= 0) return [];
  if (s.kind === 'block') {
    const [a, b] = s.handles;
    const cols = Math.max(1, Math.min(n, Math.round(s.cols)));
    const rows = Math.ceil(n / cols);
    const sx = Math.sign(b.x - a.x) || 1, sy = Math.sign(b.y - a.y) || 1;
    const dx = s.interval != null ? s.interval * sx : cols > 1 ? (b.x - a.x) / (cols - 1) : 0;
    const dy = s.interval != null ? s.interval * sy : rows > 1 ? (b.y - a.y) / (rows - 1) : 0;
    return Array.from({ length: n }, (_, i) => ({ x: a.x + (i % cols) * dx, y: a.y + Math.floor(i / cols) * dy }));
  }
  const { pts, closed } = samplePath(s);
  if (s.kind === 'spiral') return spiralSlots(pts, n, s.interval);
  const ring = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < ring.length; i++) cum.push(cum[i - 1] + distance(ring[i - 1], ring[i]));
  const L = cum.at(-1)!;
  const gap = s.interval ?? (closed ? L / n : n > 1 ? L / (n - 1) : 0);
  const start = s.interval == null && !closed && n === 1 ? L / 2 : 0;
  return Array.from({ length: n }, (_, i) => along(ring, cum, start + i * gap));
}

/**
 * Spots `d` apart in a straight line (not along the curve), walking from pts[0]; past the end, straight on.
 * Returns the spots and how far along the path (in samples) the last one landed.
 */
function chordWalk(pts: Point[], n: number, d: number): { spots: Point[]; end: number } {
  const spots = [pts[0]];
  let i = 0, t = 0; // position: on segment i (pts[i] to pts[i+1]), fraction t
  while (spots.length < n) {
    const c = spots.at(-1)!;
    for (;;) {
      const a = pts[Math.min(i, pts.length - 2)], b = pts[Math.min(i + 1, pts.length - 1)];
      const last = i >= pts.length - 2;
      // Where the circle of radius d around c crosses this segment, at or after t (on the last one, past its end too).
      const ux = b.x - a.x, uy = b.y - a.y, wx = a.x - c.x, wy = a.y - c.y;
      const A = ux * ux + uy * uy, B = 2 * (ux * wx + uy * wy), C = wx * wx + wy * wy - d * d;
      const disc = B * B - 4 * A * C;
      const r = A && disc >= 0 ? (-B + Math.sqrt(disc)) / (2 * A) : NaN;
      if (r >= t && (r <= 1 || last)) { t = r; spots.push({ x: a.x + ux * r, y: a.y + uy * r }); break; }
      if (last) { spots.push(b); break; } // zero-length end: nowhere to go
      i++; t = 0;
    }
  }
  return { spots, end: i + t };
}

/**
 * A spiral's spots. Its center curls tighter than a performer's interval, so spacing is measured in a straight line,
 * performer to performer (what a drill writer means by an interval), not along the curve.
 */
function spiralSlots(pts: Point[], n: number, interval: number | null): Point[] {
  if (interval != null) return chordWalk(pts, n, interval).spots;
  if (n === 1) return [pts[0]];
  // Even: the interval whose last spot lands on the outer end. Bigger intervals land farther along.
  let lo = 0, hi = pts.slice(1).reduce((L, q, k) => L + distance(pts[k], q), 0) / (n - 1) * 2;
  for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (chordWalk(pts, n, mid).end < pts.length - 1) lo = mid; else hi = mid; }
  const spots = chordWalk(pts, n, lo).spots;
  spots[n - 1] = pts.at(-1)!;
  return spots;
}

/**
 * Least-total-travel assignment (Hungarian algorithm). Returns, for each performer i, the slot index it takes.
 * Requires slots.length >= from.length. Minimizing total distance also means no two paths cross.
 */
export function assign(from: Point[], to: Point[]): number[] {
  const n = from.length, m = to.length;
  if (n > m) throw new RangeError('more performers than spots');
  const cost = (i: number, j: number) => distance(from[i - 1], to[j - 1]);
  const u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0), p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(Infinity), used = new Array(m + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity, j1 = 0;
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue;
        const cur = cost(i0, j) - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const out = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j]) out[p[j] - 1] = j - 1;
  return out;
}

/** A starting shape fitted around the selected performers' current spots. */
export function fitShape(kind: ShapeKind, pts: Point[]): Shape {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(x1 - x0, y1 - y0, 2 * (pts.length - 1), 8); // at least 2 steps per performer
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (x1 - x0 < span) { x0 = cx - span / 2; x1 = cx + span / 2; }
  const P = (x: number, y: number) => ({ x: Math.round(x), y: Math.round(y) });
  const base = { interval: null, cols: Math.max(1, Math.ceil(Math.sqrt(pts.length))) };
  switch (kind) {
    case 'line': return { kind, handles: [P(x0, cy), P(x1, cy)], ...base };
    case 'arc': return { kind, handles: [P(x0, cy), P(cx, cy + span / 4), P(x1, cy)], ...base };
    case 'curve': return { kind, handles: [P(x0, cy), P(x0 + span / 3, cy + span / 6), P(x0 + (2 * span) / 3, cy - span / 6), P(x1, cy)], ...base };
    case 'bezier': return { kind, handles: [P(x0, cy), P(x0 + span / 3, cy + span / 3), P(x0 + (2 * span) / 3, cy - span / 3), P(x1, cy)], ...base };
    case 'circle': return { kind, handles: [P(cx, cy), P(cx + span / 2, cy)], ...base };
    case 'polygon': return { kind, handles: [P(cx, cy), P(cx, cy + span / 2)], ...base, sides: 5 }; // a corner straight up the field
    case 'star': return placeInner({ kind, handles: [P(cx, cy), P(cx, cy + span / 2)], ...base, sides: 5 }, 0.4 * (span / 2));
    case 'spiral': return { kind, handles: [P(cx, cy), P(cx + span / 2, cy)], ...base, turns: 2 };
    case 'block': {
      const c = base.cols, r = Math.ceil(pts.length / c);
      return { kind, handles: [P(cx - (c - 1), cy + (r - 1)), P(cx + (c - 1), cy - (r - 1))], ...base, interval: 2 };
    }
  }
}

/**
 * A star's inside-corner handle, put back on the inside corner just after the point handle, at distance `r` from the
 * center (default: where it is now). Used after anything that turns the star or changes its points.
 */
export function placeInner(s: Shape, r = distance(s.handles[0], s.handles[2] ?? s.handles[0])): Shape {
  const [c, tip] = s.handles, a = Math.atan2(tip.y - c.y, tip.x - c.x) + Math.PI / Math.max(3, Math.round(s.sides ?? 5));
  return { ...s, handles: [c, tip, { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) }] };
}

/** Adds a curve point in the middle of its longest segment. */
export function addCurvePoint(s: Shape): Shape {
  let k = 0, best = -1;
  for (let i = 0; i < s.handles.length - 1; i++) {
    const d = distance(s.handles[i], s.handles[i + 1]);
    if (d > best) { best = d; k = i; }
  }
  const handles = [...s.handles];
  handles.splice(k + 1, 0, lerp(s.handles[k], s.handles[k + 1], 0.5));
  return { ...s, handles };
}

/** Is handle k of a shape a Bézier control (pulls the curve) rather than a point it passes through? */
export const isControl = (s: Shape, k: number) => s.kind === 'bezier' && k % 3 !== 0;

/** Extends a Bézier with another segment. The joint starts smooth: its two controls are mirror images. */
export function addBezierSegment(s: Shape): Shape {
  const h = s.handles, a = h.at(-1)!, c = h.at(-2)!, prev = h.at(-4)!;
  const d = { x: a.x - prev.x, y: a.y - prev.y }; // continue in roughly the same direction and length
  const r = (p: Point) => ({ x: Math.round(p.x), y: Math.round(p.y) });
  return { ...s, handles: [...h, r({ x: 2 * a.x - c.x, y: 2 * a.y - c.y }), r({ x: a.x + (2 * d.x) / 3, y: a.y + (2 * d.y) / 3 }), r({ x: a.x + d.x, y: a.y + d.y })] };
}

/** Is the Bézier joint at anchor k smooth (its two controls on a straight line through it)? */
function smoothAt(h: Point[], k: number): boolean {
  const a = h[k], c1 = h[k - 1], c2 = h[k + 1];
  if (!c1 || !c2) return false;
  const u = { x: c1.x - a.x, y: c1.y - a.y }, w = { x: c2.x - a.x, y: c2.y - a.y };
  const lu = Math.hypot(u.x, u.y), lw = Math.hypot(w.x, w.y);
  if (!lu || !lw) return true; // a control sitting on its anchor doesn't make a corner
  return (u.x * w.x + u.y * w.y) / (lu * lw) < -0.9995; // pointing opposite ways, within about 2°
}

/**
 * Move handle k to p. For a Bézier (unless `free`, i.e. Option/Alt held): a smooth joint stays smooth (the other
 * control swings to stay opposite, keeping its own length), and an anchor carries its two controls with it.
 */
export function moveHandle(s: Shape, k: number, p: Point, free = false): Shape {
  const h = [...s.handles];
  if (s.kind === 'star') { // the inside-corner handle only sets a distance; it stays on its corner as the star turns
    const r = distance(k === 2 ? p : s.handles[2], s.handles[0]); // moving the center or the point keeps the inside depth
    h[k] = p;
    return placeInner({ ...s, handles: h }, r);
  }
  if (s.kind !== 'bezier' || free) { h[k] = p; return { ...s, handles: h }; }
  if (k % 3 === 0) {
    const dx = p.x - h[k].x, dy = p.y - h[k].y;
    for (const j of [k - 1, k + 1]) if (h[j]) h[j] = { x: h[j].x + dx, y: h[j].y + dy };
    h[k] = p;
    return { ...s, handles: h };
  }
  const anchor = k % 3 === 1 ? k - 1 : k + 1, partner = k % 3 === 1 ? k - 2 : k + 2;
  const keep = h[partner] && smoothAt(h, anchor);
  h[k] = p;
  if (keep) {
    const a = h[anchor], len = Math.hypot(h[partner].x - a.x, h[partner].y - a.y);
    const d = { x: a.x - p.x, y: a.y - p.y }, ld = Math.hypot(d.x, d.y);
    if (ld) h[partner] = { x: a.x + (d.x / ld) * len, y: a.y + (d.y / ld) * len };
  }
  return { ...s, handles: h };
}
