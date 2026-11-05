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

/** Ruler label for the yard line at x steps from the 50 (multiples of 8): "50", "S1 40", "G" for goal lines. */
export function yardLabel(x: number): string {
  const yd = 50 - Math.abs(x) / 1.6;
  if (yd === 50) return '50';
  if (yd === 0) return 'G';
  return `S${x < 0 ? 1 : 2} ${yd}`;
}
