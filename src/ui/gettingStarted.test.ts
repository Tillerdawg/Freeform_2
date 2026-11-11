import { describe, expect, it } from 'vitest';
import { bandMessage, gettingStarted, sendSteps } from './gettingStarted';
import { addPerformer, addSetAfter, newShow, placeInSet } from '../engine/show';

const done = (steps: { id: string; done: boolean }[]) => steps.filter((s) => s.done).map((s) => s.id);

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
  it('needs a real move before Play and Review count, and a clean Review; it ends there (sending is its own checklist)', () => {
    let show = newShow();
    const r = addPerformer(show, show.sections[0].id, { x: 0, y: 30 }); show = addSetAfter(r.show, 0, 16);
    expect(done(gettingStarted(show, { played: true, reviewed: true }, 0))).not.toContain('play'); // nobody moved yet
    show = placeInSet(show, 1, { [r.id]: { x: 8, y: 30 } });
    expect(done(gettingStarted(show, { played: true, reviewed: true }, 2))).not.toContain('review');
    expect(gettingStarted(show, {}, 2)[4].hint).toMatch(/2 problems/);
    expect(done(gettingStarted(show, { played: true, reviewed: true }, 0))).toEqual(['performers', 'set', 'move', 'play', 'review']);
  });
});

describe('send it to your band', () => {
  it('checks Review, then Share, the message, and the rehearsal tip', () => {
    const show = newShow();
    expect(done(sendSteps(show, {}, 3))).toEqual([]);
    expect(sendSteps(show, {}, 3)[0].hint).toMatch(/3 problems/);
    expect(done(sendSteps(show, {}, 0))).toEqual(['review']);
    expect(done(sendSteps({ ...show, revision: 2 }, {}, 0))).toEqual(['review', 'share']); // published counts as shared
    expect(done(sendSteps(show, { shared: true, copied: true, rehearsal: true }, 0))).toEqual(['review', 'share', 'message', 'rehearsal']);
  });
  it('writes a message with the link (or where to paste it) and the student guide in both languages', () => {
    const m = bandMessage('Opener', 'https://freeformdrill.org/app/#load=x');
    expect(m).toContain('Opener in FreeFORM: https://freeformdrill.org/app/#load=x');
    expect(m).toContain('https://freeformdrill.org/students/');
    expect(m).toContain('https://freeformdrill.org/es/students/');
    expect(bandMessage('', null)).toContain('(paste the link from Share here)');
  });
});
