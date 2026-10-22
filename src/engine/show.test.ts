import { describe, expect, it } from 'vitest';
import { readout } from './coords';
import {
  addPerformer, addSetAfter, biggestStep, label, locate, newShow, parseShow, placeInSet, positionsAt,
  removePerformers, removeSet, setAt, setCounts, setStarts, totalCounts, xFrom, yFrom,
} from './show';

function twoSetShow() {
  let show = newShow();
  const trumpet = show.sections.find((s) => s.letter === 'T')!.id;
  const a = addPerformer(show, trumpet, { x: 0, y: 28 });
  show = addSetAfter(a.show, 0, 16);
  show = placeInSet(show, 1, { [a.id]: { x: -16, y: 28 } }); // 16 steps in 16 counts: 8-to-5
  return { show, id: a.id, trumpet };
}

describe('show model', () => {
  it('numbers performers per section and labels them', () => {
    let { show, trumpet } = twoSetShow();
    show = addPerformer(show, trumpet, { x: 4, y: 28 }).show;
    expect(show.performers.map((p) => label(show, p))).toEqual(['T1', 'T2']);
  });
  it('new performers exist in every set; removal clears them everywhere', () => {
    const { show, id } = twoSetShow();
    expect(show.sets.every((s) => id in s.pos)).toBe(true);
    const gone = removePerformers(show, new Set([id]));
    expect(gone.performers).toEqual([]);
    expect(gone.sets.every((s) => !(id in s.pos))).toBe(true);
  });
  it('new set copies the previous set; never removes the last set', () => {
    const { show, id } = twoSetShow();
    const three = addSetAfter(show, 1);
    expect(three.sets.map((s) => s.name)).toEqual(['1', '2', '3']);
    expect(three.sets[2].pos[id]).toEqual({ x: -16, y: 28 });
    expect(removeSet(removeSet(removeSet(three, 2), 1), 0).sets).toHaveLength(1);
  });
  it('counts are whole and at least 1', () => {
    const { show } = twoSetShow();
    expect(setCounts(show, 1, 0).sets[1].counts).toBe(1);
    expect(setCounts(show, 1, 7.6).sets[1].counts).toBe(8);
  });
});

describe('timeline', () => {
  it('maps counts to sets and interpolates positions', () => {
    let { show, id } = twoSetShow();
    show = addSetAfter(show, 1, 8);
    expect(setStarts(show)).toEqual([0, 16, 24]);
    expect(totalCounts(show)).toBe(24);
    expect(locate(show, 4)).toEqual({ to: 1, f: 0.25, count: 4 });
    expect(positionsAt(show, 4)[id]).toEqual({ x: -4, y: 28 });
    expect(positionsAt(show, 16)[id]).toEqual({ x: -16, y: 28 });
    expect(setAt(show, 16)).toBe(1);
    expect(setAt(show, 10)).toBe(-1);
  });
  it('reports the biggest step in a move', () => {
    const { show } = twoSetShow();
    expect(biggestStep(show, 1)).toEqual({ per5: 8, tier: 'ok' });
    expect(biggestStep(setCounts(show, 1, 6), 1)!.tier).toBe('red');
  });
});

describe('exact coordinate entry round-trips through the readout', () => {
  const cases: [Parameters<typeof xFrom>, Parameters<typeof yFrom>, string][] = [
    [[2, 45, 2, 'outside'], ['Front Hash', 2, 'in front of', 'college'], '2 steps outside the Side 2 45, 2 steps in front of Front Hash'],
    [[1, 35, 3, 'inside'], ['Back Sideline', 5, 'in front of', 'highSchool'], '3 steps inside the Side 1 35, 5 steps in front of Back Sideline'],
    [[1, 50, 2, 'outside'], ['Back Hash', 0, 'on', 'nfl'], '2 steps outside the 50 on Side 1, on Back Hash'],
    [[2, 0, 0, 'on'], ['Front Sideline', 6, 'behind', 'highSchool'], 'On the Side 2 Goal Line, 6 steps behind Front Sideline'],
  ];
  for (const [x, y, text] of cases) it(text, () => expect(readout({ x: xFrom(...x), y: yFrom(...y) }, y[3])).toBe(text));
});

describe('file parsing', () => {
  it('round-trips a show', () => {
    const { show } = twoSetShow();
    expect(parseShow(JSON.stringify(show))).toEqual(show);
  });
  it('rejects non-shows and bad positions', () => {
    expect(() => parseShow('{"hello":1}')).toThrow(/format/);
    const { show, id } = twoSetShow();
    const broken = JSON.parse(JSON.stringify(show));
    broken.sets[0].pos[id] = { x: 'nope', y: 1 };
    expect(() => parseShow(JSON.stringify(broken))).toThrow(/position/);
  });
});
