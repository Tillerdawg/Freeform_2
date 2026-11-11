import { describe, expect, it } from 'vitest';
import { sampleShow } from '../engine/sample';
import { frontToBack, sideToSide } from '../engine/coords';
import { fieldOf } from '../engine/show';
import { myDots, paneFor } from './myDots';

describe('myDots', () => {
  const show = sampleShow(), me = show.performers[0].id;

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
