import { expect, it } from 'vitest';
import { describe as where, nearest, yardLabel } from './neighbors';

it('finds the closest performers, nearest first, within range', () => {
  const pos = { me: { x: 0, y: 20 }, a: { x: -4, y: 20 }, b: { x: 2, y: 20 }, c: { x: 0, y: 26 }, far: { x: 30, y: 20 } };
  expect(nearest(pos, 'me').map((n) => n.id)).toEqual(['b', 'a', 'c']);
  expect(nearest(pos, 'me', 2).map((n) => n.id)).toEqual(['b', 'a']);
  expect(nearest(pos, 'nobody')).toEqual([]);
});

it('describes where a neighbor is in field directions', () => {
  expect(where(-4, 0)).toBe('4 steps toward Side 1');
  expect(where(2, -4)).toBe('2 steps toward Side 2, 4 steps in front');
  expect(where(0, 1)).toBe('1 step behind');
  expect(where(0.05, 0)).toBe('same spot');
  expect(where(-2.3, 0)).toBe('2.25 steps toward Side 1');
});

it('labels yard lines for the ruler', () => {
  expect([0, -8, 16, -72, 80].map(yardLabel)).toEqual(['50', 'S1 45', 'S2 40', 'S1 5', 'G']);
});
