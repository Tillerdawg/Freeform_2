import { describe, expect, it } from 'vitest';
import { sampleShow } from '../engine/sample';
import { frontToBack, sideToSide } from '../engine/coords';
import { fieldOf, label, routeBends } from '../engine/show';
import { myDots, paneFor } from './myDots';

describe('myDots', () => {
  const show = sampleShow(), me = show.performers[0].id;

  it("says when a route isn't a straight line, instead of a straight-line direction", () => {
    const g6 = show.performers.find((p) => label(show, p) === 'G6')!.id; // a drawn path into set 3: sideways, then upfield
    expect(routeBends(show, 2, g6)).toBe(true);
    expect(myDots(show, g6)[2].way).toBe('not a straight line (watch the move), ending up back and to your left (facing the front)');
    expect(myDots(show, g6, 'es')[2].way).toMatch(/^no es en línea recta/);
    expect(myDots(show, g6)[1].way).toBe('moving forward (facing the front)'); // straight moves read as before
    expect(myDots(show, g6).map((r) => r.bends)).toEqual(show.sets.map((_, i) => i === 2)); // only set 3 offers Watch
  });

  it('has one row per set, with the same coordinates as the printed dot sheet', () => {
    const rows = myDots(show, me);
    expect(rows.map((r) => r.set)).toEqual(show.sets.map((s) => s.name));
    rows.forEach((r, i) => {
      const p = show.sets[i].pos[me];
      expect(r.side).toBe(sideToSide(p.x, fieldOf(show)));
      expect(r.front).toBe(frontToBack(p.y, fieldOf(show)));
    });
  });

  it('gives set 1 no counts, step size, or step-off', () => {
    const [first, second] = myDots(show, me);
    expect(first.counts).toBeNull();
    expect(first.steps).toBeNull();
    expect(first.hold).toBeNull();
    expect(second.counts).toBe(show.sets[1].counts);
  });

  it('notes a delayed step-off as hold, move, hold', () => {
    const s = { ...show, sets: show.sets.map((x, i) => (i === 1 ? { ...x, counts: 16, timing: { [me]: { wait: 4, move: 8 } } } : x)) };
    expect(myDots(s, me)[1].hold).toEqual({ wait: 4, move: 8, after: 4 });
  });

  it('marks a set with no travel as a hold, with no step size or step-off', () => {
    const s = { ...show, sets: show.sets.map((x, i) => (i === 2 ? { ...x, pos: { ...x.pos, [me]: show.sets[1].pos[me] }, timing: { [me]: { wait: 4, move: 8 } } } : x)) };
    const r = myDots(s, me)[2];
    expect(r.held).toBe(true);
    expect(r.steps).toBeNull();
    expect(r.hold).toBeNull();
    expect(myDots(s, me)[1].held).toBe(false);
    expect(myDots(s, me)[0].held).toBe(false); // set 1 has no move into it
  });

  it('carries my notes and the ensemble notes', () => {
    const s = { ...show, sets: show.sets.map((x, i) => (i === 2 ? { ...x, note: 'Flags up on 9', cues: { [me]: 'Horns up on 13' } } : x)) };
    const r = myDots(s, me)[2];
    expect(r.cue).toBe('Horns up on 13');
    expect(r.note).toBe('Flags up on 9');
  });

  it('speaks Spanish', () => {
    const p = show.sets[0].pos[me];
    expect(myDots(show, me, 'es')[0].side).toBe(sideToSide(p.x, fieldOf(show), 'es'));
  });
});

describe('paneFor', () => {
  it('follows the phone: upright lists my dots, sideways shows the field', () => {
    expect(paneFor(false, null, true)).toBe('dots');
    expect(paneFor(false, null, false)).toBe('field');
  });
  it('lets the switch win (a phone locked upright can still see the field)', () => {
    expect(paneFor(false, 'field', true)).toBe('field');
    expect(paneFor(false, 'dots', false)).toBe('dots');
  });
  it('always shows staff the field', () => {
    expect(paneFor(true, null, true)).toBe('field');
    expect(paneFor(true, 'dots', true)).toBe('field');
  });
});
