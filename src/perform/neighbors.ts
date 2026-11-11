// "Who's around me": the performers nearest my spot, and where they are relative to me in field terms.
import type { Point } from '../engine/coords';
import { lang as current, tr, type Lang } from '../i18n';

export interface Neighbor { id: string; dx: number; dy: number; dist: number }

/** The `n` performers closest to `me` (within `within` steps), nearest first. */
export function nearest(pos: Record<string, Point>, me: string, n = 4, within = 10): Neighbor[] {
  const p = pos[me];
  if (!p) return [];
  return Object.entries(pos)
    .filter(([id]) => id !== me)
    .map(([id, q]) => ({ id, dx: q.x - p.x, dy: q.y - p.y, dist: Math.hypot(q.x - p.x, q.y - p.y) }))
    .filter((r) => r.dist <= within)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

/** Ruler label for the yard line at x steps from the 50 (multiples of 8): "50", "S1 40", "G" for goal lines. */
export function yardLabel(x: number, l: Lang = 'en'): string {
  const yd = 50 - Math.abs(x) / 1.6;
  if (yd === 50) return '50';
  if (yd === 0) return 'G';
  return `${l === 'es' ? 'L' : 'S'}${x < 0 ? 1 : 2} ${yd}`; // L: Lado
}

/** A step size in words a student knows: 8-to-5 is a normal step, fewer steps per 5 yards is a bigger step. */
export function stepWords(per5: number, l: Lang = current): string {
  const w = per5 === Infinity ? 'stand still' : per5 > 9 ? 'smaller step size than normal' : per5 >= 7 ? 'normal step size' : per5 >= 6 ? 'bigger step size than normal' : 'very big step size';
  return tr(w, undefined, l);
}

/** Which way a move ends up, for a performer facing the front: +y is toward the back sideline, +x toward Side 2 (their left). */
export function moveWords(from: Point, to: Point, l: Lang = current): string {
  const dx = to.x - from.x, dy = to.y - from.y;
  const counts = (a: number, b: number) => Math.abs(a) >= 0.5 && Math.abs(a) >= 0.3 * Math.abs(b); // a small sideways drift isn't worth saying
  const fb = counts(dy, dx) ? (dy > 0 ? 'back' : 'forward') : '', side = counts(dx, dy) ? (dx > 0 ? 'to your left' : 'to your right') : '';
  if (!fb && !side) return '';
  const way = fb && side ? `${fb} and ${side}` : fb || side; // one of eight phrases, so each has its own translation
  return tr('moving {way} (facing the front)', { way: tr(way, undefined, l) }, l);
}
