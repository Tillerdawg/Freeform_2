import { expect, it } from 'vitest';
import { nearest, yardLabel } from './neighbors';

it('finds the closest performers, nearest first, within range', () => {
  const pos = { me: { x: 0, y: 20 }, a: { x: -4, y: 20 }, b: { x: 2, y: 20 }, c: { x: 0, y: 26 }, far: { x: 30, y: 20 } };
  expect(nearest(pos, 'me').map((n) => n.id)).toEqual(['b', 'a', 'c']);
  expect(nearest(pos, 'me', 2).map((n) => n.id)).toEqual(['b', 'a']);
  expect(nearest(pos, 'nobody')).toEqual([]);
});

it('labels yard lines for the ruler', () => {
  expect([0, -8, 16, -72, 80].map((x) => yardLabel(x))).toEqual(['50', 'S1 45', 'S2 40', 'S1 5', 'G']);
});

it('says a step size in plain words', async () => {
  const { stepWords } = await import('./neighbors');
  expect([Infinity, 16, 8, 7, 6.5, 5.3].map((x) => stepWords(x, "en"))).toEqual(['stand still', 'smaller step size than normal', 'normal step size', 'normal step size', 'bigger step size than normal', 'very big step size']);
});

it('says which way a move ends up, facing the front', async () => {
  const { moveWords } = await import('./neighbors');
  expect(moveWords({ x: 0, y: 20 }, { x: 0, y: 36 })).toBe('moving back (facing the front)');
  expect(moveWords({ x: 0, y: 20 }, { x: -8, y: 12 })).toBe('moving forward and to your right (facing the front)');
  expect(moveWords({ x: 0, y: 20 }, { x: 16, y: 21 })).toBe('moving to your left (facing the front)'); // a 1-step drift on a 16-step slide
  expect(moveWords({ x: 0, y: 20 }, { x: 0.25, y: 20 })).toBe('');
});
