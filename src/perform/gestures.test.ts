import { expect, it } from 'vitest';
import { panCenter, pinchZoom, ZOOM_MAX, ZOOM_MIN } from './gestures';

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
