// Touch gesture math for the performer view (kept pure so it can be tested without a touchscreen).
import type { Point } from '../engine/coords';

export const ZOOM_MIN = 0.5, ZOOM_MAX = 5;

/** New zoom after a pinch: fingers now `dist` apart, started `startDist` apart at `startZoom`. */
export const pinchZoom = (startZoom: number, startDist: number, dist: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, startDist > 0 ? (startZoom * dist) / startDist : startZoom));

/**
 * Where the view's center (in steps) moves when a finger drags dx, dy screen pixels at `scale` px/step.
 * The content follows the finger; Facing front draws the field turned 180°, so directions flip.
 */
export function panCenter(center: Point, dx: number, dy: number, scale: number, facingFront: boolean): Point {
  const k = facingFront ? -1 : 1;
  return { x: center.x - (k * dx) / scale, y: center.y + (k * dy) / scale };
}
