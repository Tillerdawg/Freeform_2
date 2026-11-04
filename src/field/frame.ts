import type { Point } from '../engine/coords';

/** The on-field rotate/scale frame around a selection: a padded box (corners scale), a knob above it (rotates). */
export type Frame = { c: Point; corners: Point[]; knob: Point; stem: Point };

/**
 * The frame around `pts` (world steps). Its center is the bounding-box center, the same one `rotateScale` turns around.
 * `pad` keeps the corners off the dots; `gap` lifts the knob above the top edge. During a drag, `deg`/`k` turn and
 * scale the frame with the performers.
 */
export function selectionFrame(pts: Point[], pad: number, gap: number, deg = 0, k = 1): Frame {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
  const c = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  const f = (p: Point) => { const dx = p.x - c.x, dy = p.y - c.y; return { x: c.x + k * (dx * cos - dy * sin), y: c.y + k * (dx * sin + dy * cos) }; };
  // World y grows toward the back sideline, which is the top of the screen.
  return { c, corners: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }].map(f), stem: f({ x: c.x, y: y1 }), knob: f({ x: c.x, y: y1 + gap }) };
}

/**
 * How far a frame drag has turned (degrees, counterclockwise as seen on screen, matching `rotateScale`) or scaled.
 * Rotation lands on whole degrees and pulls to multiples of 15° within 4°; scale lands on whole percents, pulled to 100%.
 */
export function frameDrag(mode: 'rotate' | 'scale', c: Point, down: Point, now: Point): { deg: number; k: number } {
  if (mode === 'rotate') {
    let d = ((Math.atan2(now.y - c.y, now.x - c.x) - Math.atan2(down.y - c.y, down.x - c.x)) * 180) / Math.PI;
    d = ((d % 360) + 540) % 360 - 180; // -180..180
    const m = Math.round(d / 15) * 15;
    return { deg: Math.abs(d - m) <= 4 ? m : Math.round(d), k: 1 };
  }
  const r0 = Math.hypot(down.x - c.x, down.y - c.y);
  const k = r0 ? Math.hypot(now.x - c.x, now.y - c.y) / r0 : 1;
  const pct = Math.min(1000, Math.max(10, Math.round(k * 100)));
  return { deg: 0, k: Math.abs(pct - 100) <= 3 ? 1 : pct / 100 };
}
