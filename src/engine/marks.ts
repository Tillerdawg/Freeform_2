// Page markup: notes, arrows and freehand drawing on one set's field. Positions are in steps, like performers.
import { distance, type Point } from './coords';

export type Mark =
  | { id: string; kind: 'text'; at: Point; text: string }
  | { id: string; kind: 'arrow'; from: Point; to: Point }
  | { id: string; kind: 'ink'; pts: Point[] };

/** Text size on the field, in steps (also used for hit testing). */
export const TEXT_STEPS = 1.6;

const segDist = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L)) : 0;
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
};

/** The topmost mark within `tol` steps of p, if any. Text is hit anywhere in its (approximate) box. */
export function hitMark(marks: Mark[], p: Point, tol: number): Mark | undefined {
  for (let k = marks.length - 1; k >= 0; k--) {
    const m = marks[k];
    if (m.kind === 'text') {
      const w = Math.max(1, m.text.length) * TEXT_STEPS * 0.55; // rough average glyph width
      if (Math.abs(p.x - m.at.x) <= w / 2 + tol && p.y >= m.at.y - tol && p.y <= m.at.y + TEXT_STEPS + tol) return m;
    } else if (m.kind === 'arrow') {
      if (segDist(p, m.from, m.to) <= tol) return m;
    } else if (m.pts.some((q, i) => (i ? segDist(p, m.pts[i - 1], q) : distance(p, q)) <= tol)) return m;
  }
  return undefined;
}

export function moveMark(m: Mark, dx: number, dy: number): Mark {
  const mv = (q: Point) => ({ x: q.x + dx, y: q.y + dy });
  return m.kind === 'text' ? { ...m, at: mv(m.at) } : m.kind === 'arrow' ? { ...m, from: mv(m.from), to: mv(m.to) } : { ...m, pts: m.pts.map(mv) };
}

/** Freehand: add a point only when it's moved far enough, so strokes stay light. */
export const addInk = (pts: Point[], p: Point, min = 0.25) => (pts.length && distance(pts.at(-1)!, p) < min ? pts : [...pts, p]);

/** Checks a mark read from a file (untrusted). */
export function validMark(m: unknown): m is Mark {
  const pt = (q: unknown) => !!q && Number.isFinite((q as Point).x) && Number.isFinite((q as Point).y);
  const x = m as Mark;
  if (!x || typeof x.id !== 'string') return false;
  if (x.kind === 'text') return pt(x.at) && typeof x.text === 'string';
  if (x.kind === 'arrow') return pt(x.from) && pt(x.to);
  if (x.kind === 'ink') return Array.isArray(x.pts) && x.pts.every(pt);
  return false;
}
