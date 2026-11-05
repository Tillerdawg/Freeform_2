import { expect, it } from 'vitest';
import { nearest, yardLabel } from './neighbors';

it('finds the closest performers, nearest first, within range', () => {
  const pos = { me: { x: 0, y: 20 }, a: { x: -4, y: 20 }, b: { x: 2, y: 20 }, c: { x: 0, y: 26 }, far: { x: 30, y: 20 } };
  expect(nearest(pos, 'me').map((n) => n.id)).toEqual(['b', 'a', 'c']);
  expect(nearest(pos, 'me', 2).map((n) => n.id)).toEqual(['b', 'a']);
  expect(nearest(pos, 'nobody')).toEqual([]);
});

it('labels yard lines for the ruler', () => {
  expect([0, -8, 16, -72, 80].map(yardLabel)).toEqual(['50', 'S1 45', 'S2 40', 'S1 5', 'G']);
});
