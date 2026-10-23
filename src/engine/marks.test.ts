import { describe, expect, it } from 'vitest';
import { addInk, hitMark, moveMark, validMark, type Mark } from './marks';
import { addPerformer, addSetAfter, newShow, parseShow, removePerformers, setCue, setMarks, setNote } from './show';

const text: Mark = { id: 'a', kind: 'text', at: { x: 0, y: 10 }, text: 'Horns up' };
const arrow: Mark = { id: 'b', kind: 'arrow', from: { x: -10, y: 20 }, to: { x: -10, y: 30 } };
const ink: Mark = { id: 'c', kind: 'ink', pts: [{ x: 20, y: 0 }, { x: 24, y: 4 }] };

describe('marks', () => {
  it('hit testing finds text by its box, arrows and ink by their lines, topmost first', () => {
    expect(hitMark([text], { x: 2, y: 11 }, 0.5)?.id).toBe('a');
    expect(hitMark([text], { x: 0, y: 15 }, 0.5)).toBeUndefined();
    expect(hitMark([arrow], { x: -10.3, y: 25 }, 0.5)?.id).toBe('b');
    expect(hitMark([ink], { x: 22, y: 2 }, 0.5)?.id).toBe('c');
    const on = { ...text, id: 'top' };
    expect(hitMark([text, on], { x: 0, y: 10.5 }, 0.5)?.id).toBe('top');
  });
  it('moving shifts every point', () => {
    expect(moveMark(arrow, 2, -1)).toEqual({ ...arrow, from: { x: -8, y: 19 }, to: { x: -8, y: 29 } });
    expect((moveMark(ink, 1, 1) as Extract<Mark, { kind: 'ink' }>).pts[1]).toEqual({ x: 25, y: 5 });
  });
  it('freehand skips points that barely moved', () => {
    expect(addInk(addInk([{ x: 0, y: 0 }], { x: 0.1, y: 0 }), { x: 1, y: 0 })).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
  });
  it('rejects malformed marks', () => {
    expect([text, arrow, ink].every(validMark)).toBe(true);
    expect(validMark({ id: 'x', kind: 'text', at: { x: 'no', y: 1 }, text: '' })).toBe(false);
    expect(validMark({ id: 'x', kind: 'laser' })).toBe(false);
  });
});

describe('page notes, cues, and files', () => {
  function show() {
    let s = newShow();
    const a = addPerformer(s, s.sections[0].id, { x: 0, y: 20 }); s = a.show;
    const b = addPerformer(s, s.sections[0].id, { x: 4, y: 20 }); s = b.show;
    return { s: addSetAfter(s, 0), a: a.id, b: b.id };
  }
  it('cues per performer per set; clearing and deleting a performer removes them', () => {
    const { s, a, b } = show();
    const c = setCue(s, 1, [a, b], 'Slide L');
    expect(c.sets[1].cues).toEqual({ [a]: 'Slide L', [b]: 'Slide L' });
    expect(c.sets[0].cues).toBeUndefined();
    expect(setCue(c, 1, [a], '').sets[1].cues).toEqual({ [b]: 'Slide L' });
    expect(removePerformers(c, new Set([b])).sets[1].cues).toEqual({ [a]: 'Slide L' });
  });
  it('markup, notes and cues survive a file round trip; bad ones are rejected', () => {
    const { s, a } = show();
    const full = setCue(setNote(setMarks(s, 1, () => [text, arrow, ink]), 1, 'Guard: flags'), 1, [a], 'Horns 45');
    expect(parseShow(JSON.stringify(full)).sets[1]).toEqual(full.sets[1]);
    const bad = JSON.parse(JSON.stringify(full));
    bad.sets[1].cues = { nobody: 'x' };
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/cues/);
    const badMark = JSON.parse(JSON.stringify(full));
    badMark.sets[1].marks.push({ id: 'z', kind: 'arrow', from: { x: 1 } });
    expect(() => parseShow(JSON.stringify(badMark))).toThrow(/markup/);
    expect(setMarks(full, 1, () => []).sets[1].marks).toBeUndefined();
  });
});
