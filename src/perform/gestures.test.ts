import { expect, it } from 'vitest';
import { panCenter, pinchView, pinchZoom, ZOOM_MAX, ZOOM_MIN } from './gestures';
import { toWorld } from '../field/drawField';

it('pinch zoom follows the finger spread, within limits', () => {
  expect(pinchZoom(1, 100, 200)).toBe(2);
  expect(pinchZoom(2, 100, 50)).toBe(1);
  expect(pinchZoom(1, 100, 10000)).toBe(ZOOM_MAX);
  expect(pinchZoom(1, 100, 1)).toBe(ZOOM_MIN);
  expect(pinchZoom(1.5, 0, 80)).toBe(1.5);
  expect(pinchZoom(1, 100, 10000, 20)).toBe(20); // a view that starts zoomed further out may go further in
});

it('dragging moves the field with the finger, both ways round', () => {
  // 10 px/step: dragging right 20 px shows field 2 steps toward Side 1 (center moves -2).
  expect(panCenter({ x: 0, y: 42 }, 20, 0, 10, false)).toEqual({ x: -2, y: 42 });
  // Dragging down 30 px shows field 3 steps farther back (center moves +3).
  expect(panCenter({ x: 0, y: 42 }, 0, 30, 10, false)).toEqual({ x: 0, y: 45 });
  // Facing front, the same drags go the other way in field terms.
  expect(panCenter({ x: 0, y: 42 }, 20, 30, 10, true)).toEqual({ x: 2, y: 39 });
});

it('two fingers in the editor: the field point under them stays under them', () => {
  const v = { scale: 10, ox: 300, oy: 400 }, mid0 = { x: 520, y: 260 };
  const w0 = toWorld(v, mid0.x, mid0.y);
  const v1 = pinchView(v, mid0, { x: 480, y: 300 }, 100, 250, 2, 120); // spread and slide together
  expect(v1.scale).toBe(25);
  const w1 = toWorld(v1, 480, 300);
  expect(w1.x).toBeCloseTo(w0.x, 9);
  expect(w1.y).toBeCloseTo(w0.y, 9);
  expect(pinchView(v, mid0, { x: 530, y: 250 }, 100, 100, 2, 120)).toEqual({ scale: 10, ox: 310, oy: 390 }); // a plain pan
  expect(pinchView(v, mid0, mid0, 100, 10000, 2, 120).scale).toBe(120); // within limits
});
