import { describe, expect, it } from 'vitest';
import { practiceShow, sampleShow } from './sample';
import { reviewShow } from './review';
import { moveSteps, parseShow } from './show';

describe('the sample show', () => {
  const s = sampleShow();
  it('is a valid show with the moves its screenshots need', () => {
    expect(parseShow(JSON.stringify(s)).sets).toHaveLength(4); // stays loadable as the file format changes
    expect(s.performers).toHaveLength(47);
    expect(s.sets[2].ftl?.[0].turns).toHaveLength(1);
  });
  it('is finished: Review finds nothing', () => {
    expect(reviewShow(s)).toEqual([]);
  });
});

describe('the practice show', () => {
  const p = practiceShow();
  it('is the same drill with three problems left in, each explained where Review points', () => {
    expect(p.performers).toHaveLength(47);
    expect(new Set(reviewShow(p).map((x) => x.kind))).toEqual(new Set(['close', 'steps', 'unwritten']));
    const tiers = new Set(Object.values(moveSteps(p, 3)).map((m) => m.tier));
    expect(tiers.has('red')).toBe(true); // set 4 shows the step-size warnings
    for (const x of reviewShow(p)) expect(p.sets[x.set].note).toMatch(/^Practice:/);
  });
  it('names the performers its too-close note is about', () => {
    const names = new Set(reviewShow(p).filter((x) => x.kind === 'close').flatMap((x) => x.text.match(/^(\w+) and (\w+)/)!.slice(1)));
    for (const n of names) expect(p.sets[2].note).toContain(n);
  });
});
