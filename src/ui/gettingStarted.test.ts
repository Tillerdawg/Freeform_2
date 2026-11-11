import { describe, expect, it } from 'vitest';
import { gettingStarted } from './gettingStarted';
import { addPerformer, addSetAfter, newShow, placeInSet } from '../engine/show';

const done = (steps: ReturnType<typeof gettingStarted>) => steps.filter((s) => s.done).map((s) => s.id);

describe('the getting-started checklist', () => {
  it('starts with nothing done on a blank show', () => {
    expect(done(gettingStarted(newShow(), {}, 0))).toEqual([]);
  });
  it('ticks off steps from the show itself', () => {
    let show = newShow();
    const r = addPerformer(show, show.sections[0].id, { x: 0, y: 30 }); show = r.show;
    expect(done(gettingStarted(show, {}, 0))).toEqual(['performers']);
    show = addSetAfter(show, 0, 16);
    expect(done(gettingStarted(show, {}, 0))).toEqual(['performers', 'set']);
    show = placeInSet(show, 1, { [r.id]: { x: 8, y: 30 } });
    expect(done(gettingStarted(show, {}, 0))).toEqual(['performers', 'set', 'move']);
  });
  it('needs a real move before Play and Review count, and a clean Review', () => {
    let show = newShow();
    const r = addPerformer(show, show.sections[0].id, { x: 0, y: 30 }); show = addSetAfter(r.show, 0, 16);
    expect(done(gettingStarted(show, { played: true, reviewed: true }, 0))).not.toContain('play'); // nobody moved yet
    show = placeInSet(show, 1, { [r.id]: { x: 8, y: 30 } });
    expect(done(gettingStarted(show, { played: true, reviewed: true }, 2))).not.toContain('review');
    expect(gettingStarted(show, {}, 2)[4].hint).toMatch(/2 problems/);
    expect(done(gettingStarted(show, { played: true, reviewed: true, shared: true }, 0))).toEqual(['performers', 'set', 'move', 'play', 'review', 'share']);
  });
  it('counts a published show as shared', () => {
    expect(done(gettingStarted({ ...newShow(), revision: 1 }, {}, 0))).toEqual(['share']);
  });
});
