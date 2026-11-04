import { expect, it } from 'vitest';
import { frameDrag, selectionFrame } from './frame';

it('frames the selection around its bounding-box center, knob above the top edge', () => {
  const f = selectionFrame([{ x: 0, y: 0 }, { x: 8, y: 4 }], 1, 3);
  expect(f.c).toEqual({ x: 4, y: 2 });
  expect(f.corners).toEqual([{ x: -1, y: -1 }, { x: 9, y: -1 }, { x: 9, y: 5 }, { x: -1, y: 5 }]);
  expect(f.stem).toEqual({ x: 4, y: 5 });
  expect(f.knob).toEqual({ x: 4, y: 8 });
  // A single line of dots still gets a box to grab.
  expect(selectionFrame([{ x: 0, y: 0 }, { x: 8, y: 0 }], 1, 3).corners[2]).toEqual({ x: 9, y: 1 });
  // Turned a quarter counterclockwise, the knob points to the left.
  const r = selectionFrame([{ x: 0, y: 0 }, { x: 8, y: 4 }], 1, 3, 90);
  expect(r.knob.x).toBeCloseTo(-2); expect(r.knob.y).toBeCloseTo(2);
});

it('turns a drag into a rotation or a scale, pulled to round numbers', () => {
  const c = { x: 0, y: 0 };
  expect(frameDrag('rotate', c, { x: 0, y: 10 }, { x: -10, y: 0 }).deg).toBe(90); // up → left: counterclockwise
  expect(frameDrag('rotate', c, { x: 0, y: 10 }, { x: 10, y: 0 }).deg).toBe(-90);
  expect(frameDrag('rotate', c, { x: 0, y: 10 }, { x: -Math.sin(0.6), y: Math.cos(0.6) }).deg).toBe(34); // 34.4°
  expect(frameDrag('rotate', c, { x: 0, y: 10 }, { x: -Math.sin(0.8), y: Math.cos(0.8) }).deg).toBe(45); // 45.8° → 45
  expect(Math.abs(frameDrag('rotate', c, { x: 0, y: -10 }, { x: 0.01, y: 10 }).deg)).toBe(180); // wraps, never 360
  expect(frameDrag('scale', c, { x: 3, y: 4 }, { x: 6, y: 8 })).toEqual({ deg: 0, kx: 2, ky: 2 }); // diagonal: both
  expect(frameDrag('scale', c, { x: 3, y: 4 }, { x: 6, y: 4.1 })).toEqual({ deg: 0, kx: 2, ky: 1 }); // sideways: wider only
  expect(frameDrag('scale', c, { x: -3, y: -4 }, { x: -3, y: -6 })).toEqual({ deg: 0, kx: 1, ky: 1.5 }); // any corner works
  expect(frameDrag('scale', c, { x: 3, y: 4 }, { x: -1, y: 4 }).kx).toBe(0.1); // across the center: never flips
});
