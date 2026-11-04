import { expect, it } from 'vitest';
import { sampleShow } from './sample';
import { moveSteps, parseShow } from './show';

it('the docs sample show is a valid show with the moves its screenshots need', () => {
  const s = sampleShow();
  expect(parseShow(JSON.stringify(s)).sets).toHaveLength(4); // stays loadable as the file format changes
  expect(s.performers).toHaveLength(47);
  expect(s.sets[2].ftl?.[0].turns).toHaveLength(1);
  const tiers = new Set(Object.values(moveSteps(s, 3)).map((m) => m.tier));
  expect(tiers.has('red')).toBe(true); // set 4 shows the step-size warnings
});
