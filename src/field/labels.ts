// Readable dot labels: each label takes the first side (above, below, right, left, then the diagonals) where it covers no other dot
// and no label already placed; if every side is taken it's hidden (zooming in spreads the dots and brings it back).
// A side pinned by the drill writer is the only side that label tries; it may cover a dot (a deliberate choice), but
// never another label, so text stays readable: if it would, it's hidden like any other.
// With `always` (printed charts, where you can't zoom), nobody's label is dropped: a label that doesn't fit beside its
// dot moves out, one label-height at a time (its own side first), and gets a leader line back to the dot, as in Pyware.

import type { Point } from '../engine/coords';
import type { LabelSide } from '../engine/show';

export interface LabelItem {
  x: number; y: number; // dot center, in the same units as w, h, r
  w: number; h: number; // label box
  r: number; // dot radius
  pin?: LabelSide;
  first?: boolean; // placed before the others (e.g. selected performers)
}

type Side = Exclude<LabelSide, 'hidden'>;
const AUTO: Side[] = ['above', 'below', 'right', 'left', 'above-right', 'above-left', 'below-right', 'below-left'];
/** Screen direction of each side (y down). */
const DIR: Record<Side, [number, number]> = {
  above: [0, -1], 'above-right': [1, -1], right: [1, 0], 'below-right': [1, 1],
  below: [0, 1], 'below-left': [-1, 1], left: [-1, 0], 'above-left': [-1, -1],
};
const TURNED: Record<Side, Side> = {
  above: 'below', 'above-right': 'below-left', right: 'left', 'below-right': 'above-left',
  below: 'above', 'below-left': 'above-right', left: 'right', 'above-left': 'below-right',
};
/** A side as it appears on a field turned around (Facing front): above becomes below, left becomes right. */
export const turned = (s: LabelSide): LabelSide => (s === 'hidden' ? s : TURNED[s]);

export type LabelSpot = { x: number; y: number; leader?: true };
const REACH = 8; // in always mode, how many label-heights out a label may move before it's drawn where it overlaps

/** Center of each label's box (leader: moved out, so draw a line to the dot), or null when it's hidden. Same order as `items`. */
export function placeLabels(items: LabelItem[], gap = 2, always = false): (LabelSpot | null)[] {
  const spot = (it: LabelItem, side: Side, out = 0) => {
    const [sx, sy] = DIR[side], d = (it.r + gap + out) * (sx && sy ? Math.SQRT1_2 : 1);
    return { x: it.x + sx * (d + it.w / 2), y: it.y + sy * (d + it.h / 2) };
  };
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  // shortcut: checks every dot and label (n² per frame); fine for a few hundred performers, add a grid beyond that.
  const clearOfLabels = (c: { x: number; y: number }, it: LabelItem) =>
    placed.every((p) => Math.abs(p.x - c.x) >= (p.w + it.w) / 2 || Math.abs(p.y - c.y) >= (p.h + it.h) / 2);
  const clear = (c: { x: number; y: number }, it: LabelItem, self: number) =>
    items.every((o, j) => j === self || Math.abs(o.x - c.x) >= o.r + it.w / 2 || Math.abs(o.y - c.y) >= o.r + it.h / 2) &&
    placed.every((p) => Math.abs(p.x - c.x) >= (p.w + it.w) / 2 || Math.abs(p.y - c.y) >= (p.h + it.h) / 2);

  const order = items.map((_, i) => i).sort((a, b) => rank(items[a]) - rank(items[b]) || a - b);
  const out: (LabelSpot | null)[] = items.map(() => null);
  for (const i of order) {
    const it = items[i];
    if (it.pin === 'hidden') continue;
    let c: LabelSpot | undefined = it.pin ? [spot(it, it.pin)].find((c) => clearOfLabels(c, it)) : AUTO.map((s) => spot(it, s)).find((c) => clear(c, it, i));
    if (!c && always) {
      const sides = it.pin ? [it.pin, ...AUTO.filter((s) => s !== it.pin)] : AUTO;
      c = sides.map((s) => spot(it, s)).find((q) => clear(q, it, i)); // another side, right beside the dot
      for (let k = 1; !c && k <= REACH; k++) {
        const far = sides.map((s) => spot(it, s, k * it.h)).find((q) => clear(q, it, i));
        if (far) c = { ...far, leader: true };
      }
      c ??= spot(it, it.pin ?? 'above'); // nowhere free: still shown, overlapping
    }
    if (!c) continue;
    out[i] = c;
    placed.push({ ...c, w: it.w, h: it.h });
  }
  return out;
}

const rank = (it: LabelItem) => (it.first ? 0 : it.pin ? 1 : 2);

/**
 * Label sides pointing into (or out of) the curve each dot sits on: the circle through the dot and its two nearest
 * neighbors in the group gives the local center, so arcs, circles and S-curves all work. A dot whose neighbors are in a
 * straight line uses the circle that best fits the whole group. null = no curve there (a straight line).
 */
export function curveSides(pts: Point[], outside: boolean): (LabelSide | null)[] {
  const all = fitCircle(pts);
  return pts.map((p, i) => {
    const near = pts.map((q, j) => ({ j, d: Math.hypot(q.x - p.x, q.y - p.y) })).filter((n) => n.j !== i).sort((a, b) => a.d - b.d);
    const c = (near.length >= 2 && circleThrough(p, pts[near[0].j], pts[near[1].j])) || all;
    if (!c) return null;
    const vx = (c.x - p.x) * (outside ? -1 : 1), vy = (c.y - p.y) * (outside ? -1 : 1);
    if (!vx && !vy) return null;
    // Field y points to the back sideline (screen up), so "above" is +y. Snap to the nearest of 8 sides.
    const sides: Side[] = ['right', 'above-right', 'above', 'above-left', 'left', 'below-left', 'below', 'below-right'];
    return sides[(Math.round(Math.atan2(vy, vx) / (Math.PI / 4)) + 8) % 8];
  });
}

const STRAIGHT = 40; // a circle more than 40× wider than the dots it was fitted to is really a straight line

function circleThrough(a: Point, b: Point, c: Point): Point | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (!d) return null;
  const a2 = a.x ** 2 + a.y ** 2, b2 = b.x ** 2 + b.y ** 2, c2 = c.x ** 2 + c.y ** 2;
  const o = { x: (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d, y: (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d };
  const span = Math.max(Math.hypot(a.x - b.x, a.y - b.y), Math.hypot(a.x - c.x, a.y - c.y), Math.hypot(b.x - c.x, b.y - c.y));
  return Math.hypot(o.x - a.x, o.y - a.y) > STRAIGHT * span ? null : o;
}

/** Least-squares circle center (Kåsa fit), or null for too few points or a straight line. */
function fitCircle(pts: Point[]): Point | null {
  if (pts.length < 3) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length, my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  let suu = 0, svv = 0, suv = 0, suuu = 0, svvv = 0, suvv = 0, svuu = 0;
  for (const p of pts) {
    const u = p.x - mx, v = p.y - my;
    suu += u * u; svv += v * v; suv += u * v; suuu += u ** 3; svvv += v ** 3; suvv += u * v * v; svuu += v * u * u;
  }
  const det = suu * svv - suv * suv;
  if (Math.abs(det) < 1e-9) return null;
  const r1 = (suuu + suvv) / 2, r2 = (svvv + svuu) / 2;
  const o = { x: mx + (r1 * svv - r2 * suv) / det, y: my + (r2 * suu - r1 * suv) / det };
  const span = Math.max(...pts.map((p) => Math.hypot(p.x - mx, p.y - my))) * 2;
  return Math.hypot(o.x - pts[0].x, o.y - pts[0].y) > STRAIGHT * span ? null : o;
}
