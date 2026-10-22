import { expect, it } from 'vitest';
import { fitView, toScreen, toWorld } from './drawField';

it('screen <-> world round-trips, front sideline at the bottom', () => {
  const v = fitView(1000, 500);
  const p = { x: -20, y: 30 };
  const s = toScreen(v, p);
  const back = toWorld(v, s.x, s.y);
  expect(back.x).toBeCloseTo(p.x);
  expect(back.y).toBeCloseTo(p.y);
  expect(toScreen(v, { x: 0, y: 0 }).y).toBeGreaterThan(toScreen(v, { x: 0, y: 50 }).y);
  expect(toScreen(v, { x: -10, y: 0 }).x).toBeLessThan(toScreen(v, { x: 10, y: 0 }).x); // Side 1 on the left
});
