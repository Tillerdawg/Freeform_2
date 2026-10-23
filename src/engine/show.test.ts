import { describe, expect, it } from 'vitest';
import { readout } from './coords';
import {
  addPerformer, addSetAfter, advance, biggestStep, flip, mirrorSides, playRange, playStart, label, locate, newShow, parseShow, placeInSet, positionsAt,
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
    [[2, 50, 1.5, 'outside'], ['Front Hash', 3, 'behind', 'college'], '1.5 steps outside the 50 on Side 2, 3 steps behind Front Hash'],
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
    const badName = JSON.parse(JSON.stringify(show));
    badName.sets[0].name = { broken: true };
    expect(() => parseShow(JSON.stringify(badName))).toThrow(/set/);
  });
});

describe('range playback', () => {
  // Sets at counts 0, 16, 24, 40.
  const show = setCounts(addSetAfter(addSetAfter(addSetAfter(newShow(), 0, 16), 1, 8), 2, 16), 3, 16);
  const id = (i: number) => show.sets[i].id;
  it('maps set ids to a count range; missing ids fall back to the ends; order does not matter', () => {
    expect(playRange(show, null, null)).toEqual([0, 40]);
    expect(playRange(show, id(1), id(2))).toEqual([16, 24]);
    expect(playRange(show, id(2), id(1))).toEqual([16, 24]);
    expect(playRange(show, 'gone', id(2))).toEqual([0, 24]);
  });
  it('starts inside the range, or jumps to its start', () => {
    expect(playStart(20, [16, 24])).toBe(20);
    expect(playStart(24, [16, 24])).toBe(16); // at the end: replay
    expect(playStart(3, [16, 24])).toBe(16);
  });
  it('stops at the range end, or wraps when looping', () => {
    expect(advance(20, 2, [16, 24], false)).toEqual({ t: 22, done: false });
    expect(advance(23, 2, [16, 24], false)).toEqual({ t: 24, done: true });
    expect(advance(23, 2, [16, 24], true)).toEqual({ t: 17, done: false });
    expect(advance(16, 1, [16, 16], true)).toEqual({ t: 16, done: true }); // single-set range
  });
});

describe('mirroring', () => {
  function build(spots: [number, number][]) {
    let show = newShow();
    const ids: string[] = [];
    for (const [x, y] of spots) { const r = addPerformer(show, show.sections[0].id, { x, y }); show = r.show; ids.push(r.id); }
    return { show: addSetAfter(show, 0), ids };
  }
  it('flips across the 50 and front to back', () => {
    const { show, ids } = build([[-10, 20], [4, 30]]);
    const fx = flip(show, 1, ids, 'x');
    expect(ids.map((id) => fx.sets[1].pos[id])).toEqual([{ x: 10, y: 20 }, { x: -4, y: 30 }]);
    const fy = flip(show, 1, ids, 'y');
    expect(ids.map((id) => fy.sets[1].pos[id])).toEqual([{ x: -10, y: 64 }, { x: 4, y: 54 }]);
    expect(flip(fx, 1, ids, 'x').sets[1].pos).toEqual(show.sets[1].pos);
  });
  it('mirrors Side 1 onto Side 2, pairing by least travel, ignoring anyone on the 50', () => {
    // Side 1 form: (-16, 10) and (-8, 40). Side 2 performers start near (20, 38) and (6, 12).
    const { show, ids } = build([[-16, 10], [-8, 40], [20, 38], [6, 12], [0, 50]]);
    const m = mirrorSides(show, 1, ids, 1);
    const p = (k: number) => m.sets[1].pos[ids[k]];
    expect(p(0)).toEqual({ x: -16, y: 10 }); // source untouched
    expect(p(2)).toEqual({ x: 8, y: 40 }); // (20,38) is nearer the mirrored (8,40)
    expect(p(3)).toEqual({ x: 16, y: 10 });
    expect(p(4)).toEqual({ x: 0, y: 50 }); // on the 50: left alone
  });
  it('refuses uneven sides with a clear message', () => {
    const { show, ids } = build([[-16, 10], [-8, 40], [20, 38]]);
    expect(() => mirrorSides(show, 1, ids, 1)).toThrow(/Side 1: 2, Side 2: 1/);
  });
});
