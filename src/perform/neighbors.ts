// "Who's around me": the performers nearest my spot, and where they are relative to me in field terms.
import type { Point } from '../engine/coords';

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

const q = (v: number) => Math.round(Math.abs(v) * 4) / 4;
const steps = (v: number) => `${q(v)} step${q(v) === 1 ? '' : 's'}`;

/** e.g. "4 steps toward Side 1", "2 steps toward Side 2, 4 steps in front", "same spot". Front = toward the front sideline. */
export function describe(dx: number, dy: number): string {
  const parts: string[] = [];
  if (q(dx)) parts.push(`${steps(dx)} toward Side ${dx < 0 ? 1 : 2}`);
  if (q(dy)) parts.push(`${steps(dy)} ${dy < 0 ? 'in front' : 'behind'}`);
  return parts.join(', ') || 'same spot';
}
