// Touch gesture math for the performer view (kept pure so it can be tested without a touchscreen).
import type { Point } from '../engine/coords';
import type { View } from '../field/drawField';

export const ZOOM_MIN = 0.5, ZOOM_MAX = 5;

/** New zoom after a pinch: fingers now `dist` apart, started `startDist` apart at `startZoom`. */
export const pinchZoom = (startZoom: number, startDist: number, dist: number, max = ZOOM_MAX) =>
  Math.min(max, Math.max(ZOOM_MIN, startDist > 0 ? (startZoom * dist) / startDist : startZoom));

/**
 * Where the view's center (in steps) moves when a finger drags dx, dy screen pixels at `scale` px/step.
 * The content follows the finger; Facing front draws the field turned 180°, so directions flip.
 */
export function panCenter(center: Point, dx: number, dy: number, scale: number, facingFront: boolean): Point {
  const k = facingFront ? -1 : 1;
  return { x: center.x - (k * dx) / scale, y: center.y + (k * dy) / scale };
}

/**
 * The editor's two-finger gesture: pan and pinch together. `v` is the view when the second finger landed; `mid0` and
 * `mid` the fingers' midpoint then and now, `dist0` and `dist` how far apart (canvas px). The field point that was under
 * the fingers stays under them; the zoom stays within min..max (px per step).
 */
export function pinchView(v: View, mid0: Point, mid: Point, dist0: number, dist: number, min: number, max: number): View {
  const scale = Math.min(max, Math.max(min, dist0 > 0 ? (v.scale * dist) / dist0 : v.scale)), k = scale / v.scale;
  return { scale, ox: mid.x - (mid0.x - v.ox) * k, oy: mid.y - (mid0.y - v.oy) * k };
}
