import { describe, expect, it } from 'vitest';
import { COURT, DEFAULT_FLOOR, HASHES, readout } from './coords';
import {
  nextRevision, revisionLabel,
  addPerformer, addSetAfter, advance, biggestStep, chainOrder, clearFtl, ftlTrail, moveSteps, normalizeFtl, flip, mirrorSides, moveSetTo, remapHash, rotateScale, setFtl, newShowId, parseShowFile, snapSelection, playRange, playPlan, label, locate, newShow, parseShow, placeInSet, positionsAt,
  removePerformers, renumberSets, scoreOrder, DEFAULT_SECTIONS, removeSet, setAt, setCounts, setStarts, totalCounts, xFrom, yFrom, insertSetAt, showLength, movementAt, movementOfSet, setFtlTurns,
  addSetHere, setCue, newPropSpot, setFtlSmooth, routeTurns, leaderDistance, setTiming, timingOf, fitTurn, setTurning, turnRoute, counterMarch, closeCalls, addProp, placeProp, propsAt, hitProp, removeProp, fieldOf, moveSegments, withShowId, withField, validField,
} from './show';

function twoSetShow() {
  let show = newShow();
  const trumpet = show.sections.find((s) => s.letter === 'T')!.id;
  const a = addPerformer(show, trumpet, { x: 0, y: 28 });
  show = addSetAfter(a.show, 0, 16);
  show = placeInSet(show, 1, { [a.id]: { x: -16, y: 28 } }); // 16 steps in 16 counts: 8-to-5
  return { show, id: a.id, trumpet };
}

describe('what a new show is written on', () => {
  it('starts on high school hashes, or on the field or floor asked for', () => {
    expect(fieldOf(newShow())).toBe('highSchool');
    expect(fieldOf(newShow(DEFAULT_SECTIONS, 'nfl'))).toBe('nfl');
    const court = newShow(DEFAULT_SECTIONS, COURT);
    expect(fieldOf(court)).toEqual(COURT);
    expect(court.surface).not.toBe(COURT); // its own copy
  });
  it('goes onto a floor and back outside, keeping its hashes for outside', () => {
    const show = newShow(DEFAULT_SECTIONS, 'college');
    const floor = withField(show, DEFAULT_FLOOR);
    expect(fieldOf(floor)).toEqual(DEFAULT_FLOOR);
    expect(floor.hash).toBe('college');
    const out = withField(floor, 'nfl');
    expect(fieldOf(out)).toBe('nfl');
    expect('surface' in out).toBe(false);
  });
  it('keeps a saved choice only if it makes sense', () => {
    expect(validField('college')).toBe('college');
    expect(validField(COURT)).toEqual(COURT);
    expect(validField({ kind: 'floor', w: 32, d: 21, extra: 1 })).toEqual({ kind: 'floor', w: 32, d: 21 });
    for (const bad of ['toString', 'grass', null, 3, {}, { kind: 'floor', w: 2, d: 20 }, { kind: 'floor', w: 20, d: 1e9 }, { kind: 'pool', w: 20, d: 20 }, { kind: 'court', w: NaN, d: 20 }])
      expect(validField(bad)).toBeNull();
  });
});

describe('show model', () => {
  it('gives every new show its own permanent id, kept in the file and checked when read', () => {
    const a = newShow(), b = newShow();
    expect(a.id).toMatch(/^[0-9a-f]{32}$/);
    expect(a.id).not.toBe(b.id);
    expect(parseShow(JSON.stringify(a)).id).toBe(a.id);
    const { id: _, ...old } = a;
    expect(parseShow(JSON.stringify(old)).id).toBeUndefined(); // older files still open
    expect(withShowId(old).id).toMatch(/^[0-9a-f]{32}$/);
    expect(withShowId(a)).toBe(a);
    expect(() => parseShow(JSON.stringify({ ...a, id: '<script>' }))).toThrow(/id/);
    expect(() => parseShow(JSON.stringify({ ...a, id: 7 }))).toThrow(/id/);
  });
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
  it('always starts where you are and goes forward', () => {
    expect(playPlan(20, [16, 24], 40, true)).toEqual({ from: 20, span: [16, 24], loop: true }); // inside the range: stop or loop there
    expect(playPlan(3, [16, 24], 40, true)).toEqual({ from: 3, span: [3, 40], loop: false }); // before it: play on, don't jump ahead
    expect(playPlan(24, [16, 24], 40, false)).toEqual({ from: 24, span: [24, 40], loop: false }); // at its end: keep going
    expect(playPlan(40, [0, 40], 40, false)).toBeNull(); // end of the show: nothing to play
    expect(playPlan(40, [0, 40], 40, true)).toBeNull();
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

describe('rotate and scale', () => {
  function build(spots: [number, number][]) {
    let show = newShow();
    const ids: string[] = [];
    for (const [x, y] of spots) { const r = addPerformer(show, show.sections[0].id, { x, y }); show = r.show; ids.push(r.id); }
    return { show, ids };
  }
  const at = (show: ReturnType<typeof newShow>, ids: string[]) => ids.map((id) => show.sets[0].pos[id]);
  it('rotates 90° counterclockwise around the selection center, exactly', () => {
    const { show, ids } = build([[0, 20], [8, 20]]); // a line on the hash, center (4, 20)
    expect(at(rotateScale(show, 0, ids, 90, 1), ids)).toEqual([{ x: 4, y: 16 }, { x: 4, y: 24 }]);
  });
  it('four 90° turns come back to the start; distances are kept', () => {
    const { show, ids } = build([[-10, 12], [3, 30], [7, 18]]);
    let s = show;
    for (let k = 0; k < 4; k++) s = rotateScale(s, 0, ids, 90, 1);
    expect(at(s, ids)).toEqual(at(show, ids));
    const r = at(rotateScale(show, 0, ids, 33, 1), ids), o = at(show, ids);
    expect(Math.hypot(r[0].x - r[1].x, r[0].y - r[1].y)).toBeCloseTo(Math.hypot(o[0].x - o[1].x, o[0].y - o[1].y), 9);
  });
  it('expand then contract by the same factor returns to the start', () => {
    const { show, ids } = build([[0, 20], [4, 20], [8, 24]]);
    const big = rotateScale(show, 0, ids, 0, 1.5);
    expect(at(big, ids)[0]).toEqual({ x: -2, y: 19 }); // 1.5x the distance from center (4, 22)
    const back = at(rotateScale(big, 0, ids, 0, 1 / 1.5), ids);
    back.forEach((p, k) => { expect(p.x).toBeCloseTo(at(show, ids)[k].x, 9); expect(p.y).toBeCloseTo(at(show, ids)[k].y, 9); });
  });
});

describe('snap selection to grid', () => {
  function build(spots: [number, number][]) {
    let show = newShow();
    const ids: string[] = [];
    for (const [x, y] of spots) { const r = addPerformer(show, show.sections[0].id, { x, y }); show = r.show; ids.push(r.id); }
    return { show, ids };
  }
  it('rounds to whole or half steps, only for the selection', () => {
    const { show, ids } = build([[2.3, 10.8], [-3.6, 4.25], [7.7, 7.7]]);
    const w = snapSelection(show, 0, ids.slice(0, 2), 1);
    expect(ids.map((id) => w.show.sets[0].pos[id])).toEqual([{ x: 2, y: 11 }, { x: -4, y: 4 }, { x: 7.7, y: 7.7 }]);
    expect(w.stacked).toEqual([]);
    const h = snapSelection(show, 0, ids, 0.5);
    expect(h.show.sets[0].pos[ids[0]]).toEqual({ x: 2.5, y: 11 });
  });
  it('reports performers that land on the same spot, including an unselected one already there', () => {
    const { show, ids } = build([[2.2, 5.1], [1.9, 4.8], [10, 10], [10.3, 9.8]]);
    const r = snapSelection(show, 0, [ids[0], ids[1], ids[3]], 1);
    expect(r.stacked).toEqual(['F1', 'F2', 'F3', 'F4']);
  });
});

describe('follow-the-leader (IDEA.md example through the show model)', () => {
  // Front hash, Side 1 40 to the 50: A on the 40, B split, C on the 45, D split, E on the 50.
  function idea() {
    let show = newShow();
    const ids: string[] = [];
    const h = HASHES.highSchool;
    for (const x of [-16, -12, -8, -4, 0]) { const r = addPerformer(show, show.sections[0].id, { x, y: h }); show = r.show; ids.push(r.id); }
    show = addSetAfter(show, 0, 16);
    return { show, ids, h };
  }
  it('default order chains from the leader to the nearest next performer', () => {
    const { show, ids } = idea();
    expect(chainOrder(show, 1, ids[0], [...ids].reverse())).toEqual(ids);
  });
  it('moving the leader 16 steps forward puts everyone on the Side 1 40, 4 steps apart', () => {
    let { show, ids, h } = idea();
    show = setFtl(show, 1, ids);
    show = normalizeFtl(placeInSet(show, 1, { [ids[0]]: { x: -16, y: h - 16 } }));
    ids.forEach((id, k) => {
      expect(show.sets[1].pos[id].x).toBeCloseTo(-16);
      expect(show.sets[1].pos[id].y).toBeCloseTo(h - 16 + 4 * k);
    });
    // Count 4: B reaches A's start and turns; count 8: E is halfway left.
    expect(positionsAt(show, 4)[ids[1]].x).toBeCloseTo(-16);
    expect(positionsAt(show, 4)[ids[1]].y).toBeCloseTo(h);
    expect(positionsAt(show, 8)[ids[4]].x).toBeCloseTo(-8);
    // Everyone marches 16 steps in 16 counts: 8-to-5, even E whose straight line is shorter.
    expect(Object.values(moveSteps(show, 1)).map((s) => s.per5)).toEqual([8, 8, 8, 8, 8]);
    expect(ftlTrail(show, 1, ids)[0]).toEqual({ x: -16, y: h - 16 });
  });
  it('followers update when the move start changes; a deleted member leaves the group', () => {
    let { show, ids, h } = idea();
    show = normalizeFtl(placeInSet(setFtl(show, 1, ids), 1, { [ids[0]]: { x: -16, y: h - 16 } }));
    show = normalizeFtl(placeInSet(show, 0, { [ids[4]]: { x: 4, y: h } })); // E starts 4 farther away
    // E starts 4 steps farther back along the trail, so it ends 4 steps short: on the hash, at B's starting spot.
    expect(show.sets[1].pos[ids[4]].y).toBeCloseTo(h);
    expect(show.sets[1].pos[ids[4]].x).toBeCloseTo(-12);
    const gone = normalizeFtl(removePerformers(show, new Set([ids[2]])));
    expect(gone.sets[1].ftl![0].order).toEqual([ids[0], ids[1], ids[3], ids[4]]);
  });
  it('a leader route with a turn: everyone follows the same corner, with even steps', () => {
    let { show, ids, h } = idea();
    // A marches 8 forward, then turns toward Side 1 for 8: 16 steps in 16 counts.
    show = normalizeFtl(placeInSet(setFtl(show, 1, ids), 1, { [ids[0]]: { x: -24, y: h - 8 } }));
    show = setFtlTurns(show, 1, ids[0], [{ x: -16, y: h - 8 }]);
    const end = show.sets[1].pos;
    expect([end[ids[1]].x, end[ids[1]].y]).toEqual([-20, h - 8]); // B is 4 behind A, already round the corner
    expect([end[ids[2]].x, end[ids[2]].y]).toEqual([-16, h - 8]); // C is on the corner
    expect(end[ids[3]].x).toBeCloseTo(-16); expect(end[ids[3]].y).toBeCloseTo(h - 4);
    expect(end[ids[4]].x).toBeCloseTo(-16); expect(end[ids[4]].y).toBeCloseTo(h); // E ends on A's start
    expect(positionsAt(show, 8)[ids[0]]).toEqual({ x: -16, y: h - 8 }); // the leader is on the corner at count 8
    expect(Object.values(moveSteps(show, 1)).map((s) => s.per5)).toEqual([8, 8, 8, 8, 8]);
    expect(ftlTrail(show, 1, ids).slice(0, 3)).toEqual([{ x: -24, y: h - 8 }, { x: -16, y: h - 8 }, { x: -16, y: h }]);
    expect(setFtl(show, 1, [ids[0], ids[2], ids[1], ids[3], ids[4]]).sets[1].ftl![0].turns).toHaveLength(1); // reordering keeps the route
    expect(setFtl(show, 1, [...ids].reverse()).sets[1].ftl![0].turns).toBeUndefined(); // a new leader starts straight
    expect(normalizeFtl(removePerformers(show, new Set([ids[0]]))).sets[1].ftl![0].turns).toBeUndefined(); // so does losing the leader
    expect(parseShow(JSON.stringify(show)).sets[1].ftl![0].turns).toEqual([{ x: -16, y: h - 8 }]);
    expect(() => parseShow(JSON.stringify({ ...show, sets: [show.sets[0], { ...show.sets[1], ftl: [{ order: ids, turns: [{ x: 'a' }] }] }] }))).toThrow(/follow-the-leader/);
    expect(setFtlTurns(show, 1, ids[0], []).sets[1].ftl![0].turns).toBeUndefined();
  });
  it('Copy Side 1 → 2 copies a follow-the-leader group and its turns to the partners', () => {
    let { show, ids, h } = idea();
    const twins: string[] = [];
    for (const x of [16, 12, 8, 4]) { const r = addPerformer(show, show.sections[0].id, { x, y: h }); show = r.show; twins.push(r.id); }
    // Side 1's group without E (on the 50, neither side): A leads 8 forward, then turns toward Side 1.
    const group = ids.slice(0, 4);
    show = setFtlTurns(normalizeFtl(placeInSet(setFtl(show, 1, group), 1, { [ids[0]]: { x: -24, y: h - 8 } })), 1, ids[0], [{ x: -16, y: h - 8 }]);
    const m = normalizeFtl(mirrorSides(show, 1, [...group, ...twins], 1));
    const copy = m.sets[1].ftl!.find((g) => g.order[0] === twins[0])!;
    expect(copy.order).toEqual(twins); // the partner of each member, in the same order
    expect(copy.turns).toEqual([{ x: 16, y: h - 8 }]);
    twins.forEach((id, k) => expect(m.sets[1].pos[id]).toEqual({ x: -m.sets[1].pos[group[k]].x, y: m.sets[1].pos[group[k]].y })); // a mirror image
    expect(m.sets[1].ftl).toHaveLength(2); // the original group is still there
    expect(m.sets[1].ftl!.find((g) => g.order[0] === ids[0])!.turns).toHaveLength(1); // with its turn
    expect(clearFtl(m, 1, twins).sets[1].ftl![0].turns).toHaveLength(1); // floating one group keeps the other's turns
  });
  it('turns move with the group when it is mirrored, rotated or scaled', () => {
    let { show, ids, h } = idea();
    show = setFtlTurns(normalizeFtl(placeInSet(setFtl(show, 1, ids), 1, { [ids[0]]: { x: -24, y: h - 8 } })), 1, ids[0], [{ x: -16, y: h - 8 }]);
    const across = normalizeFtl(flip(show, 1, ids, 'x'));
    expect(across.sets[1].ftl![0].turns).toEqual([{ x: 16, y: h - 8 }]);
    expect(across.sets[1].pos[ids[2]]).toEqual({ x: 16, y: h - 8 }); // C still on the (mirrored) corner
    // The group spans x -24..-16 and y h-8..h, so it turns about (-20, h-4): the corner (-16, h-8) goes to (-24, h).
    expect(rotateScale(show, 1, ids, 180, 1).sets[1].ftl![0].turns).toEqual([{ x: -24, y: h }]);
    expect(rotateScale(show, 1, ids, 0, 1, 3).sets[1].ftl![0].turns).toEqual([{ x: -16, y: h - 16 }]); // deeper only: three times as far front to back, same side to side
    expect(rotateScale(show, 1, ids, 0, 2).sets[1].ftl![0].turns).toEqual([{ x: -12, y: h - 12 }]); // twice as far from the center
    expect(flip(show, 1, [ids[1]], 'x').sets[1].ftl![0].turns).toEqual([{ x: -16, y: h - 8 }]); // only when the leader moves
  });
  it('clearing FTL leaves performers where they are and floats them', () => {
    let { show, ids, h } = idea();
    show = normalizeFtl(placeInSet(setFtl(show, 1, ids), 1, { [ids[0]]: { x: -16, y: h - 16 } }));
    const c = clearFtl(show, 1, ids);
    expect(c.sets[1].ftl).toBeUndefined();
    expect(c.sets[1].pos).toEqual(show.sets[1].pos);
  });
  it('a group survives a file round trip; a group naming a missing performer is rejected', () => {
    let { show, ids } = idea();
    show = setFtl(show, 1, ids);
    expect(parseShow(JSON.stringify(show)).sets[1].ftl).toEqual([{ order: ids }]);
    const bad = JSON.parse(JSON.stringify(show));
    bad.sets[1].ftl[0].order.push('nobody');
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/follow-the-leader/);
  });
});

describe('changing hash marks, keeping positions relative to the hashes', () => {
  function college(ys: number[]) {
    let show: ReturnType<typeof newShow> = { ...newShow(), hash: 'college' };
    const ids: string[] = [];
    for (const y of ys) { const r = addPerformer(show, show.sections[0].id, { x: 8, y }); show = r.show; ids.push(r.id); }
    return { show, ids };
  }
  it('hashes stay hashes, sidelines stay sidelines, zones stretch proportionally', () => {
    // College 32/20/32 -> high school 28/28/28.
    const { show, ids } = college([0, 16, 32, 42, 52, 84, 30]);
    const hs = remapHash(show, 'highSchool');
    expect(hs.hash).toBe('highSchool');
    expect(ids.map((id) => hs.sets[0].pos[id].y)).toEqual([0, 14, 28, 42, 56, 84, 26.25]);
    expect(hs.sets[0].pos[ids[0]].x).toBe(8);
  });
  it('a dot on the college front hash still reads "on Front Hash" in high school and NFL', () => {
    const { show, ids } = college([32]);
    expect(readout(remapHash(show, 'highSchool').sets[0].pos[ids[0]], 'highSchool')).toBe('On the Side 2 45, on Front Hash');
    expect(readout(remapHash(show, 'nfl').sets[0].pos[ids[0]], 'nfl')).toBe('On the Side 2 45, on Front Hash');
  });
  it('switching back restores the original spots', () => {
    const { show, ids } = college([5, 31, 44, 70]);
    const back = remapHash(remapHash(show, 'highSchool'), 'college');
    ids.forEach((id) => expect(back.sets[0].pos[id].y).toBeCloseTo(show.sets[0].pos[id].y, 9));
  });
});

describe('dragging a set to a new count', () => {
  // Sets at counts 0, 16, 24, 40.
  const show = addSetAfter(addSetAfter(addSetAfter(newShow(), 0, 16), 1, 8), 2, 16);
  it('trades counts between the moves into and out of it; other sets stay put', () => {
    const m = moveSetTo(show, 2, 28);
    expect(setStarts(m)).toEqual([0, 16, 28, 40]);
    expect(m.sets.map((s) => s.counts).slice(1)).toEqual([16, 12, 12]);
  });
  it('keeps at least 1 count on each side; rounds to whole counts', () => {
    expect(setStarts(moveSetTo(show, 2, 100))).toEqual([0, 16, 39, 40]);
    expect(setStarts(moveSetTo(show, 2, -5))).toEqual([0, 16, 17, 40]);
    expect(setStarts(moveSetTo(show, 1, 9.4))).toEqual([0, 9, 24, 40]);
  });
  it('the last set just lengthens or shortens the final move; set 1 never moves', () => {
    expect(setStarts(moveSetTo(show, 3, 48))).toEqual([0, 16, 24, 48]);
    expect(moveSetTo(show, 0, 5)).toBe(show);
  });
});

describe('pinned label sides', () => {
  it('pins, clears, survives a save, and rejects bad values from files', async () => {
    const { setLabelSide } = await import('./show');
    let s = newShow();
    const a = addPerformer(s, s.sections[0].id, { x: 0, y: 10 }); s = a.show;
    s = setLabelSide(s, 0, [a.id], 'left');
    expect(s.sets[0].labels).toEqual({ [a.id]: 'left' });
    expect(parseShow(JSON.stringify(s)).sets[0].labels).toEqual({ [a.id]: 'left' });
    expect(setLabelSide(s, 0, [a.id], null).sets[0].labels).toBeUndefined();
    const bad = JSON.parse(JSON.stringify(s)); bad.sets[0].labels[a.id] = 'sideways';
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/label/);
  });
});

describe('editing sections', () => {
  const setup = async () => {
    const { moveToSection, removeSection, duplicateLetters } = await import('./show');
    let s = newShow();
    const sax = s.sections.find((x) => x.letter === 'X')!.id, tpt = s.sections.find((x) => x.letter === 'T')!.id;
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) { const r = addPerformer(s, sax, { x: i * 2, y: 10 }); s = r.show; ids.push(r.id); }
    const t = addPerformer(s, tpt, { x: 0, y: 20 }); s = t.show;
    s = { ...s, sections: [...s.sections, { id: 'alto', name: 'Soprano Saxophone', letter: 'Z' }] };
    return { s, sax, tpt, ids, tptId: t.id, moveToSection, removeSection, duplicateLetters };
  };
  it('moves performers to a section, numbering them after its members', async () => {
    const { s, ids, tpt, tptId, moveToSection } = await setup();
    const m = moveToSection(s, [ids[2], ids[0]], tpt);
    const lab = (id: string) => label(m, m.performers.find((p) => p.id === id)!);
    expect([lab(tptId), lab(ids[0]), lab(ids[2]), lab(ids[1])]).toEqual(['T1', 'T2', 'T3', 'X2']); // old order X1, X3 → T2, T3
    expect(m.sets[0].pos[ids[0]]).toEqual(s.sets[0].pos[ids[0]]); // positions untouched
  });
  it('deletes a section, moving its performers or refusing', async () => {
    const { s, sax, removeSection } = await setup();
    expect(() => removeSection(s, sax)).toThrow(/Choose a section/);
    const r = removeSection(s, sax, 'alto');
    expect(r.sections.some((x) => x.id === sax)).toBe(false);
    expect(r.performers.filter((p) => p.section === 'alto').map((p) => p.number)).toEqual([1, 2, 3]);
    expect(removeSection(r, 'alto', sax === 'alto' ? undefined : r.sections[0].id).sections.length).toBe(r.sections.length - 1);
  });
  it('flags letters two sections share', async () => {
    const { s, duplicateLetters } = await setup();
    expect(duplicateLetters(s).size).toBe(0);
    expect([...duplicateLetters({ ...s, sections: [...s.sections, { id: 'z', name: 'Tenor', letter: 'x' }] })]).toEqual(['X']);
  });
});

describe('renumbering a section', () => {
  it('closes gaps, or numbers Side 1 to Side 2 (front to back on a tie) in a set', async () => {
    const { renumberSection } = await import('./show');
    let s = newShow();
    const x = s.sections.find((q) => q.letter === 'X')!.id;
    const spots = [{ x: 6, y: 10 }, { x: -4, y: 12 }, { x: -4, y: 8 }, { x: 0, y: 10.25 }]; // a slightly ragged rank at 10
    const ids: string[] = [];
    for (const at of spots) { const r = addPerformer(s, x, at); s = r.show; ids.push(r.id); }
    s = { ...s, performers: s.performers.map((p, i) => ({ ...p, number: [4, 9, 5, 7][i] })) };
    const num = (sh: typeof s) => ids.map((id) => sh.performers.find((p) => p.id === id)!.number);
    expect(num(renumberSection(s, x, 'number'))).toEqual([1, 4, 2, 3]); // 4,9,5,7 → order kept, gaps closed
    expect(num(renumberSection(s, x, 'field', 0))).toEqual([4, 2, 1, 3]); // x -4 (front one first), -4, 0, 6
    expect(num(renumberSection(s, x, 'ranks', 0))).toEqual([3, 4, 1, 2]); // y 8; then y 10 from Side 1 (x 0, 6); then y 12
  });
});

describe('starting section lists', () => {
  it("starts new shows with FreeFORM's list or a saved one, and rejects junk", async () => {
    const { validSectionList, DEFAULT_SECTIONS } = await import('./show');
    expect(newShow().sections.map((s) => s.letter).join('')).toBe(DEFAULT_SECTIONS.map((s) => s.letter).join(''));
    expect(newShow().sections.some((s) => /front ensemble/i.test(s.name))).toBe(false);
    const mine = [{ name: 'Piccolo', letter: 'Pc' }, { name: 'Horn', letter: 'H' }];
    expect(newShow(mine).sections.map((s) => s.name)).toEqual(['Piccolo', 'Horn']);
    expect(validSectionList(mine)).toEqual(mine);
    for (const bad of [null, [], 'x', [{ name: '', letter: 'A' }], [{ name: 'A' }], [{ name: 'A', letter: 3 }]]) expect(validSectionList(bad)).toBeNull();
  });
});

describe('section colors', () => {
  it('saves a section color, checks it on load, and carries it in starting lists', async () => {
    const { colorOf, validSectionList } = await import('./show');
    let s = newShow();
    const a = addPerformer(s, s.sections[0].id, { x: 0, y: 10 }); s = a.show;
    s = { ...s, sections: s.sections.map((x, i) => (i === 0 ? { ...x, color: '#3a7bd5' } : x)) };
    const back = parseShow(JSON.stringify(s));
    expect(colorOf(back, back.performers[0])).toBe('#3a7bd5');
    const bad = JSON.parse(JSON.stringify(s)); bad.sections[0].color = 'red; background:url(x)';
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/section/);
    expect(newShow([{ name: 'Flute', letter: 'F', color: '#ff0000' }]).sections[0].color).toBe('#ff0000');
    expect(validSectionList([{ name: 'Flute', letter: 'F', color: 'nope' }])).toBeNull();
  });
});

describe('importing the wrong kind of file', () => {
  it('explains a locked copy instead of calling it invalid', () => {
    expect(() => parseShow('{"format":"freeform-locked","version":1,"iv":"x","data":"y"}')).toThrow(/locked copy made for a hosted link/);
  });
});

describe('flips and mirrors carry pinned label sides', () => {
  it('reflects pins with their dots', async () => {
    const { setLabelSide, mirrorSide } = await import('./show');
    expect(['above-left', 'right', 'below', 'hidden'].map((x) => mirrorSide(x as never, 'x'))).toEqual(['above-right', 'left', 'below', 'hidden']);
    expect(['above-left', 'right', 'below'].map((x) => mirrorSide(x as never, 'y'))).toEqual(['below-left', 'right', 'above']);
    let s = newShow();
    const a = addPerformer(s, s.sections[0].id, { x: -6, y: 10 }); s = a.show;
    const b = addPerformer(s, s.sections[0].id, { x: 6, y: 10 }); s = b.show;
    s = setLabelSide(s, 0, [a.id], 'above-left');
    expect(flip(s, 0, [a.id], 'x').sets[0].labels).toEqual({ [a.id]: 'above-right' });
    expect(flip(s, 0, [a.id], 'y').sets[0].labels).toEqual({ [a.id]: 'below-left' });
    const m = mirrorSides(s, 0, [a.id, b.id], 1);
    expect(m.sets[0].labels).toEqual({ [a.id]: 'above-left', [b.id]: 'above-right' }); // the Side 2 copy faces the other way
  });
});

describe('roster', () => {
  it('assigns, edits and clears the person on a dot, and checks names from files', async () => {
    const { setNames, parseShow, MAX_NAME } = await import('./show');
    let s = newShow();
    const a = addPerformer(s, s.sections[0].id, { x: 0, y: 10 }); s = a.show;
    s = setNames(s, { [a.id]: 'Pat Example' });
    expect(s.performers[0].name).toBe('Pat Example');
    expect(parseShow(JSON.stringify(s)).performers[0].name).toBe('Pat Example');
    s = setNames(s, { [a.id]: '  ' });
    expect('name' in s.performers[0]).toBe(false); // blank = no one
    const bad = { ...s, performers: [{ ...s.performers[0], name: 'x'.repeat(MAX_NAME + 1) }] };
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/performer/);
    expect(() => parseShow(JSON.stringify({ ...s, performers: [{ ...s.performers[0], name: 7 }] }))).toThrow(/performer/);
  });
});

describe('letters or dots', () => {
  it('marks a performer with the section letter and the number, or a dot with the full label', async () => {
    const { mark, parseShow } = await import('./show');
    let s = newShow();
    const sec = s.sections.find((x) => x.letter === 'P')!.id;
    s = addPerformer(s, sec, { x: 0, y: 10 }).show;
    expect(mark(s, s.performers[0])).toEqual({ glyph: 'P', label: '1' });
    expect(mark({ ...s, symbols: 'dots' }, s.performers[0])).toEqual({ label: 'P1' });
    expect(parseShow(JSON.stringify({ ...s, symbols: 'dots' })).symbols).toBe('dots');
    expect(() => parseShow(JSON.stringify({ ...s, symbols: 'stars' }))).toThrow(/symbols/);
  });
});

describe('even steps on count-by-count paths', () => {
  it('re-spaces each moving stretch evenly along its route, keeping holds and corners', async () => {
    const { evenPath } = await import('./show');
    const xs = (pts: { x: number; y: number }[]) => pts.map((p) => Math.round(p.x * 1000) / 1000);
    expect(xs(evenPath([0, 7, 7.5, 8].map((x) => ({ x, y: 0 }))))).toEqual([0, 2.667, 5.333, 8]); // a jump on count 1, evened out
    expect(xs(evenPath([0, 0, 6, 7, 8].map((x) => ({ x, y: 0 }))))).toEqual([0, 0, 2.667, 5.333, 8]); // hold 1 count, then even
    expect(xs(evenPath([0, 2, 4, 4, 4].map((x) => ({ x, y: 0 }))))).toEqual([0, 2, 4, 4, 4]); // move, then hold: unchanged
    // a corner (4 steps east, 4 steps north) with uneven counts: even 2-step counts that still turn the corner
    const corner = evenPath([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 4 }]);
    expect(corner).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  });
});

describe('count-first layout', () => {
  const withMovements = () => ({ ...twoSetShow().show, movements: [{ id: 'm1', name: 'Opener', counts: 48 }, { id: 'm2', name: 'Ballad', counts: 32 }] });
  it('the timeline runs to the movements\' total, past the written sets; performers hold there', () => {
    const show = withMovements();
    expect(totalCounts(show)).toBe(16);
    expect(showLength(show)).toBe(80);
    expect(positionsAt(show, 60)).toEqual(show.sets[1].pos); // not written yet: standing on the last set
    expect(movementAt(show, 47)?.name).toBe('Opener');
    expect(movementAt(show, 48)?.name).toBe('Ballad');
    const r = insertSetAt(show, 48).show; // a set hit on the Opener's last count belongs to the Opener
    expect(movementOfSet(r, 2)?.name).toBe('Opener');
    expect(movementOfSet(insertSetAt(r, 60).show, 3)?.name).toBe('Ballad');
    expect(playRange(show, null, null)).toEqual([0, 80]); // playing to the end includes the unwritten part
    expect(showLength(twoSetShow().show)).toBe(16); // no movements: the sets decide
  });
  it('adds a set at a count past the end, as a copy of the last set', () => {
    const show = withMovements();
    const r = insertSetAt(show, 40);
    expect(r.index).toBe(2);
    expect(setStarts(r.show)).toEqual([0, 16, 40]);
    expect(r.show.sets[2].pos).toEqual(show.sets[1].pos);
  });
  it('adds a set mid-move without moving any other set; it takes the spots at that count', () => {
    const { show, id } = twoSetShow();
    const r = insertSetAt(show, 4);
    expect(r.index).toBe(1);
    expect(r.show.sets.map((s) => s.name)).toEqual(['1', '1A', '2']); // a sub-set, as in Pyware
    expect(insertSetAt(r.show, 30).show.sets.at(-1)!.name).toBe('3');
    expect(setStarts(r.show)).toEqual([0, 4, 16]); // set 2 still lands on count 16
    expect(r.show.sets[1].pos[id]).toEqual({ x: -4, y: 28 }); // a quarter of the way
    expect(positionsAt(r.show, 10)).toEqual(positionsAt(show, 10)); // the drill looks the same
    expect(insertSetAt(show, 16).show).toBe(show); // a set is already there
    expect(insertSetAt(show, 0).show).toBe(show);
  });
  it('checks movements from files', () => {
    const show = withMovements();
    expect(parseShow(JSON.stringify(show)).movements).toHaveLength(2);
    expect(() => parseShow(JSON.stringify({ ...show, movements: [{ id: 'm', name: 'x', counts: 0 }] }))).toThrow(/movements/);
    expect(() => parseShow(JSON.stringify({ ...show, movements: [{ id: 'm', name: 'x', counts: 1.5 }] }))).toThrow(/movements/);
    expect(() => parseShow(JSON.stringify({ ...show, movements: 'lots' }))).toThrow(/movements/);
  });
});

describe('score order', () => {
  it('puts sections in score order, matching saxes before drums and unknown names last', () => {
    const names = ['Color Guard', 'Tuba', 'Quads', 'Alto Saxophone', 'Bass Drum', 'Twirlers', 'Flute', 'Tenor Sax', 'Snare Drum', 'Bass Clarinet', 'Mellophone', 'Trumpet', 'Drum Major', 'Pit'];
    expect(scoreOrder(names.map((name) => ({ name }))).map((s) => s.name)).toEqual(
      ['Flute', 'Bass Clarinet', 'Alto Saxophone', 'Tenor Sax', 'Trumpet', 'Mellophone', 'Tuba', 'Snare Drum', 'Quads', 'Bass Drum', 'Pit', 'Drum Major', 'Color Guard', 'Twirlers']);
  });
  it("leaves FreeFORM's starting list as it is", () => {
    expect(scoreOrder([...DEFAULT_SECTIONS])).toEqual([...DEFAULT_SECTIONS]);
  });
});

describe('renumbering sets', () => {
  const named = (...names: string[]) => ({ ...newShow(), sets: names.map((name) => ({ id: name, name, counts: 8, pos: {} })) });
  it('closes the gap a deleted set leaves; sub-sets follow their set, lettered in order', () => {
    expect(renumberSets(named('1', '2', '3', '4', '5', '6', '8')).sets.map((s) => s.name)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(renumberSets(named('1', '2', '4', '4B', '4C', '6', '6A')).sets.map((s) => s.name)).toEqual(['1', '2', '3', '3A', '3B', '4', '4A']);
  });
  it('leaves a show already in order alone', () => {
    const s = named('1', '1A', '2', '3');
    expect(renumberSets(s)).toBe(s);
  });
});

describe('moves carry forward through holds', () => {
  const three = () => {
    let s = newShow();
    const r = addPerformer(s, s.sections[0].id, { x: 0, y: 20 }); s = r.show;
    s = addSetAfter(addSetAfter(addSetAfter(s, 0), 1), 2); // 4 sets, the performer standing on (0, 20) in all of them
    return { s, id: r.id };
  };
  it('a performer added in set 1 and moved in set 2 stays there in the sets after', () => {
    const { s, id } = three();
    const m = placeInSet(s, 1, { [id]: { x: 8, y: 20 } });
    expect(m.sets.map((x) => x.pos[id].x)).toEqual([0, 8, 8, 8]);
  });
  it('stops at the first set where they were placed somewhere else, and never touches earlier sets', () => {
    const { s, id } = three();
    const placed = placeInSet(s, 3, { [id]: { x: -10, y: 30 } }); // set 4 written already
    const m = placeInSet(placed, 1, { [id]: { x: 8, y: 20 } });
    expect(m.sets.map((x) => x.pos[id])).toEqual([{ x: 0, y: 20 }, { x: 8, y: 20 }, { x: 8, y: 20 }, { x: -10, y: 30 }]);
  });
  it('judges holds from where the edit began (a drag passing over a later spot leaves it alone)', () => {
    const { s, id } = three();
    const later = placeInSet(s, 2, { [id]: { x: 4, y: 20 } }); // set 3 elsewhere; set 4 holds from it
    const mid = placeInSet(later, 1, { [id]: { x: 4, y: 20 } }, later); // the drag passes over set 3's spot
    const end = placeInSet(mid, 1, { [id]: { x: 12, y: 20 } }, later);
    expect(end.sets.map((x) => x.pos[id].x)).toEqual([0, 12, 4, 4]);
  });
});

describe('delayed step-offs, turning moves, counter-march, close calls', () => {
  const line = (n: number, at: (k: number) => { x: number; y: number }) => {
    let show = newShow();
    const sec = show.sections[0].id, ids: string[] = [];
    for (let k = 0; k < n; k++) { const r = addPerformer(show, sec, at(k)); show = r.show; ids.push(r.id); }
    return { show: addSetAfter(show, 0, 16), ids };
  };

  it('holds, then moves in fewer counts, with one step size', () => {
    let { show, id } = twoSetShow(); // 16 steps in 16 counts
    show = setTiming(show, 1, [id], 4, 8); // hold 4, move 8, hold 4
    const x = (c: number) => positionsAt(show, c)[id].x;
    expect([x(0), x(4), x(8), x(12), x(16)]).toEqual([0, 0, -8, -16, -16]);
    expect(moveSteps(show, 1)[id].per5).toBeCloseTo(4); // 16 steps in 8 counts: a 4-to-5
    expect(setTiming(show, 1, [id], 0, 16).sets[1].timing).toBeUndefined(); // all counts again: cleared
  });

  it('keeps a timing inside the move when its counts are cut', () => {
    let { show, id } = twoSetShow();
    show = setCounts(setTiming(show, 1, [id], 8, 8), 1, 8);
    expect(timingOf(show.sets[1], id)).toEqual({ wait: 7, move: 1 });
    expect(positionsAt(show, 8)[id].x).toBe(-16);
  });

  it('finds the turn that carries a group to its new spots', () => {
    const fit = fitTurn([{ x: 0, y: 0 }, { x: 4, y: 0 }], [{ x: 0, y: 0 }, { x: 0, y: 4 }]);
    expect(fit!.angle).toBeCloseTo(Math.PI / 2);
    expect(fit!.center.x).toBeCloseTo(0); expect(fit!.center.y).toBeCloseTo(0);
    expect(fitTurn([{ x: 0, y: 0 }, { x: 4, y: 0 }], [{ x: 2, y: 2 }, { x: 6, y: 2 }])).toBeNull(); // just slides
  });

  it('gate-turns a line around its end on arcs, every step the same size', () => {
    let { show, ids } = line(3, (k) => ({ x: k * 4, y: 40 })); // a line on the 50 going toward Side 2
    show = rotateScale(show, 1, ids, 90, 1, 1, show.sets[1].pos[ids[0]]); // gate on the first performer
    expect(show.sets[1].pos[ids[2]]).toEqual({ x: 0, y: 48 });
    show = setTurning(show, 1, ids, true);
    const mid = positionsAt(show, 8)[ids[2]]; // halfway: 45° around, still 8 steps from the pivot
    expect(Math.hypot(mid.x, mid.y - 40)).toBeCloseTo(8, 1);
    expect(mid.x).toBeCloseTo(8 * Math.SQRT1_2, 1);
    expect(positionsAt(show, 8)[ids[0]]).toEqual({ x: 0, y: 40 }); // the pivot stands still
    // The outside end marches a quarter circle (4π steps), not the 11.3-step straight line.
    expect(moveSteps(show, 1)[ids[2]].per5).toBeCloseTo((8 * 16) / (4 * Math.PI), 1);
    const r = turnRoute({ x: 8, y: 40 }, { x: 0, y: 48 }, { x: 0, y: 40 }, Math.PI / 2, 16);
    const steps = r.slice(1).map((p, k) => Math.hypot(p.x - r[k].x, p.y - r[k].y));
    expect(Math.max(...steps) - Math.min(...steps)).toBeLessThan(1e-6);
    expect(setTurning(show, 1, ids, false).sets[1].turning).toBeUndefined();
  });

  it('catches a close call in the middle of a turn, between the counts it samples', () => {
    // A gate turn: the end marches a quarter circle (radius 10) in 2 counts. A performer standing just outside the arc,
    // 0.9 steps from it halfway between two half-count samples, is more than a step from the straight line between them.
    const ang = Math.PI / 16, r = 10.9;
    let { show, ids } = line(3, (k) => [{ x: 0, y: 30 }, { x: 10, y: 30 }, { x: r * Math.cos(ang), y: 30 + r * Math.sin(ang) }][k]);
    show = setCounts(placeInSet(show, 1, { [ids[1]]: { x: 0, y: 40 } }), 1, 2);
    show = setTurning(show, 1, [ids[0], ids[1]], true);
    const hit = closeCalls(show, 1).find((c) => [c.a, c.b].sort().join() === [ids[1], ids[2]].sort().join());
    expect(hit?.d).toBeLessThan(1);
    expect(hit?.d).toBeCloseTo(0.9, 1);
  });

  it('counter-marches a file into the next lane, reversed', () => {
    let { show, ids } = line(4, (k) => ({ x: 0, y: 40 - k * 2 })); // a file facing the back sideline, leader at the back
    show = counterMarch(show, 1, ids, 'right', 1);
    const end = show.sets[1].pos;
    expect(end[ids[0]].x).toBeCloseTo(1); expect(end[ids[0]].y).toBeCloseTo(34); // leader ends where the tail was, one lane over
    expect(end[ids[3]].x).toBeCloseTo(1); expect(end[ids[3]].y).toBeCloseTo(40); // the tail ends beside the old head
  });

  it('finds performers who come within a step of each other mid-move', () => {
    let { show, ids } = line(2, (k) => ({ x: k ? 8 : -8, y: 40 }));
    show = placeInSet(show, 1, { [ids[0]]: { x: 8, y: 42 }, [ids[1]]: { x: -8, y: 42 } }); // they swap and pass each other
    const calls = closeCalls(show, 1);
    expect(calls).toHaveLength(1);
    expect(calls[0].count).toBe(8);
    expect(closeCalls(show, 0)).toEqual([]);
  });

  it('catches a fast crossing that falls between half counts', () => {
    // Head-on at a 4-to-5-plus step: they meet on count 1.25 and are more than a step apart on every half count.
    let { show, ids } = line(2, (k) => ({ x: k ? 5 : -5, y: 40 }));
    show = { ...show, sets: show.sets.map((s, j) => (j === 1 ? { ...s, counts: 2 } : s)) };
    show = placeInSet(show, 1, { [ids[0]]: { x: 3, y: 40 }, [ids[1]]: { x: -3, y: 40 } });
    const calls = closeCalls(show, 1);
    expect(calls).toHaveLength(1);
    expect(calls[0].d).toBeCloseTo(0);
    expect(calls[0].count).toBe(1.25);
  });

  it('checks a big show quickly', () => {
    let { show, ids } = line(200, (k) => ({ x: (k % 20) * 2 - 20, y: 20 + Math.floor(k / 20) * 2 }));
    show = placeInSet(show, 1, Object.fromEntries(ids.map((id, k) => [id, { x: -((k % 20) * 2 - 20), y: 20 + Math.floor(k / 20) * 2 }])));
    const t0 = performance.now();
    closeCalls(show, 1);
    expect(performance.now() - t0).toBeLessThan(500);
  });

  it('reads and checks the revision number from files', () => {
    const { show } = twoSetShow();
    expect(parseShow(JSON.stringify({ ...show, revision: 6 })).revision).toBe(6);
    expect(() => parseShow(JSON.stringify({ ...show, revision: 0 }))).toThrow(/revision/);
    expect(() => parseShow(JSON.stringify({ ...show, revision: '6' }))).toThrow(/revision/);
  });

  it('turns away files whose ids or counts don\'t add up, instead of breaking later', () => {
    const { show, id } = twoSetShow();
    const j = () => JSON.parse(JSON.stringify(show));
    const orphan = j(); orphan.sets[1].pos.ghost = { x: 0, y: 30 };
    expect(() => parseShow(JSON.stringify(orphan))).toThrow(/isn't in the show/);
    const neg = j(); neg.sets[1].counts = -8;
    expect(() => parseShow(JSON.stringify(neg))).toThrow(/counts in set 2/);
    const zero = j(); zero.sets[1].counts = 0;
    expect(() => parseShow(JSON.stringify(zero))).toThrow(/counts in set 2/);
    const half = j(); half.sets[1].counts = 7.5;
    expect(() => parseShow(JSON.stringify(half))).toThrow(/counts/);
    const twins = j(); twins.performers.push({ ...twins.performers.find((p: { id: string }) => p.id === id) });
    expect(() => parseShow(JSON.stringify(twins))).toThrow(/same id/);
    const lost = j(); lost.performers[0].section = 'nowhere';
    expect(() => parseShow(JSON.stringify(lost))).toThrow(/section/);
    expect(parseShow(JSON.stringify(show)).sets).toHaveLength(show.sets.length);
  });

  it('says "+ changes" on paper when the drill changed after a revision went out', () => {
    const { show, id } = twoSetShow();
    expect(revisionLabel(show)).toBe('');
    const out = nextRevision(nextRevision(show));
    expect(out.revision).toBe(2);
    expect(revisionLabel(out)).toBe('rev 2');
    expect(revisionLabel({ ...out, dismissed: ['x'], stepLimit: 6 })).toBe('rev 2'); // not drill changes
    const edited = placeInSet(out, 1, { [id]: { x: 3, y: 30 } });
    expect(revisionLabel(edited)).toBe('rev 2 + changes');
    expect(revisionLabel(nextRevision(edited))).toBe('rev 3');
    const { revisionSig: _, ...older } = edited; // published before fingerprints
    expect(revisionLabel(older)).toBe('rev 2');
    expect(parseShow(JSON.stringify(out)).revisionSig).toBe(out.revisionSig);
    expect(() => parseShow(JSON.stringify({ ...out, revisionSig: '<script>' }))).toThrow(/fingerprint/);
  });

  it('reads and checks timing and turning from files, and forgets removed performers', () => {
    let { show, ids } = line(3, (k) => ({ x: k * 4, y: 40 }));
    show = setTurning(setTiming(show, 1, [ids[0]], 2, 8), 1, ids, true);
    expect(parseShow(JSON.stringify(show)).sets[1].timing).toEqual({ [ids[0]]: { wait: 2, move: 8 } });
    const bad = JSON.parse(JSON.stringify(show)); bad.sets[1].timing[ids[0]].move = 0;
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/timing/);
    const bad2 = JSON.parse(JSON.stringify(show)); bad2.sets[1].turning = [['nobody', ids[0]]];
    expect(() => parseShow(JSON.stringify(bad2))).toThrow(/turning/);
    const gone = removePerformers(show, new Set([ids[0], ids[1]]));
    expect(gone.sets[1].timing).toEqual({});
    expect(gone.sets[1].turning).toEqual([]);
  });
});

describe('facing and equipment (removed)', () => {
  it("turns an older file's facings and equipment into performer notes", () => {
    let { show, id } = twoSetShow();
    show = setCue(show, 1, [id], 'Slide L');
    const old = JSON.parse(JSON.stringify(show));
    old.sets[0].equipment = { [id]: 'flag' };
    old.sets[1].facing = { [id]: 'side2', ghost: 'back' }; // a performer who isn't in the set is skipped
    old.sets[1].equipment = { [id]: 'none' };
    const s = parseShow(JSON.stringify(old));
    expect(s.sets.map((x) => x.cues)).toEqual([{ [id]: 'Flag' }, { [id]: 'Face Side 2 · Put down equipment · Slide L' }]);
    expect('facing' in s.sets[1] || 'equipment' in s.sets[0]).toBe(false);
  });
});

describe('props', () => {
  it('has a spot in every set, moves through holds, and travels between sets', () => {
    let { show } = twoSetShow();
    show = addSetAfter(show, 1, 8);
    const r = addProp(show, 'Platform', 8, 4, false, { x: 0, y: 60 });
    show = placeProp(r.show, 1, r.id, { x: 16, y: 60, angle: 90 });
    expect(show.sets.map((s) => s.props![r.id].x)).toEqual([0, 16, 16]); // set 3 was holding, so it came along
    const mid = propsAt(show, 8)[r.id];
    expect(mid).toEqual({ x: 8, y: 60, angle: 45 });
    expect(hitProp(show, propsAt(show, 16), { x: 16, y: 63.5 })).toBe(r.id); // turned 90°: 8 deep now
    expect(hitProp(show, propsAt(show, 16), { x: 19, y: 60 })).toBeUndefined();
    expect(insertSetAt(show, 4).show.sets[1].props![r.id].x).toBe(4); // a sub-set mid-move takes the prop's spot then
    expect(propsAt(placeProp(show, 1, r.id, { x: 16, y: 60, angle: 350 }), 8)[r.id].angle).toBe(-5); // the short way round
    expect(parseShow(JSON.stringify(show)).props).toEqual([{ id: r.id, name: 'Platform', w: 8, h: 4 }]);
    const bad = JSON.parse(JSON.stringify(show)); bad.sets[1].props.nope = { x: 0, y: 0, angle: 0 };
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/props/);
    const gone = removeProp(show, r.id);
    expect(gone.props).toBeUndefined();
    expect(gone.sets.every((s) => !s.props)).toBe(true);
  });
});

describe('surfaces', () => {
  it('checks a floor in files, and flips front to back across its own depth', () => {
    let { show, id } = twoSetShow();
    show = { ...show, surface: { kind: 'floor', w: 30, d: 20 } };
    show = placeInSet(show, 1, { [id]: { x: 2, y: 5 } });
    expect(flip(show, 1, [id], 'y').sets[1].pos[id]).toEqual({ x: 2, y: 15 });
    expect(parseShow(JSON.stringify(show)).surface).toEqual({ kind: 'floor', w: 30, d: 20 });
    expect(() => parseShow(JSON.stringify({ ...show, surface: { kind: 'pool', w: 30, d: 20 } }))).toThrow(/surface/);
    expect(fieldOf(show)).toEqual(show.surface);
    expect(fieldOf({ ...show, surface: undefined })).toBe('highSchool');
  });
});

describe('equipment icons (removed)', () => {
  it('opens a show saved with them, with letters', () => {
    const { show } = twoSetShow();
    expect(parseShow(JSON.stringify({ ...show, symbols: 'icons' })).symbols).toBeUndefined();
  });
});

describe('paths for some performers', () => {
  it('leaves out the paths of performers not kept (dimmed or hidden sections)', () => {
    const { show, id } = twoSetShow();
    expect(moveSegments(show, 1)).toHaveLength(1);
    expect(moveSegments(show, 1, (x) => x !== id)).toEqual([]);
  });
});

describe('a route for one performer', () => {
  it('marches one performer along their own turns, smoothed into a curve if wanted, at one step size', () => {
    let { show, id } = twoSetShow(); // 16 steps toward Side 1 in 16 counts
    show = setFtlTurns(setFtl(show, 1, [id]), 1, id, [{ x: -8, y: 36 }]); // out and back: a corner
    expect(positionsAt(show, 8)[id].x).toBeCloseTo(-8);
    expect(positionsAt(show, 8)[id].y).toBeCloseTo(36);
    expect(show.sets[1].ftl).toHaveLength(1);
    const corner = leaderDistance(show, 1, show.sets[1].ftl![0]);
    expect(corner).toBeCloseTo(2 * Math.hypot(8, 8));
    show = setFtlSmooth(show, 1, id, true);
    const curve = routeTurns(show.sets[1].ftl![0], { x: 0, y: 28 }, { x: -16, y: 28 });
    expect(curve.some((p) => Math.abs(p.x + 8) < 1e-9 && Math.abs(p.y - 36) < 1e-9)).toBe(true); // passes through the turn
    expect(curve.length).toBeGreaterThan(8);
    const steps = Array.from({ length: 16 }, (_, k) => { const p = positionsAt(show, k), q = positionsAt(show, k + 1); return Math.hypot(q[id].x - p[id].x, q[id].y - p[id].y); });
    expect(Math.max(...steps) - Math.min(...steps)).toBeLessThan(0.15); // even steps along the curve
    expect(parseShow(JSON.stringify(show)).sets[1].ftl![0].smooth).toBe(true);
    expect(positionsAt(setFtlTurns(show, 1, id, []), 8)[id]).toEqual({ x: -8, y: 28 }); // no turns: a straight move again
  });
});

describe('adding a set from where you are', () => {
  it('adds 16 counts after the set you are on, or a set right at a count mid-move or typed', () => {
    const { show } = twoSetShow(); // sets at counts 0 and 16
    let r = addSetHere(show, 0);
    expect([r.show.sets.length, r.t, setStarts(r.show).join()]).toEqual([3, 16, '0,16,32']); // after set 1: the old set 2 moves along
    r = addSetHere(show, 6);
    expect([r.t, r.show.sets[1].name, setStarts(r.show).join()]).toEqual([6, '1A', '0,6,16']); // mid-move: a sub-set on count 6
    r = addSetHere(show, 16, 24);
    expect([r.t, setStarts(r.show).join()]).toEqual([24, '0,16,24']); // a typed count past the end
    expect(addSetHere(show, 16, 0).show).toBe(show); // not a count: nothing
  });
});

it('steps a new prop 2 right and 2 down past props already in the middle', () => {
  let show = newShow();
  const mid = newPropSpot(show);
  show = addProp(show, 'A', 8, 8, false, mid).show;
  expect(newPropSpot(show)).toEqual({ x: mid.x + 2, y: mid.y - 2 });
  show = addProp(show, 'B', 8, 8, false, newPropSpot(show)).show;
  expect(newPropSpot(show)).toEqual({ x: mid.x + 4, y: mid.y - 4 });
});

describe('show id and full backups', () => {
  it('keeps a well-formed id and refuses a strange one', () => {
    const id = newShowId();
    expect(id).not.toBe(newShowId());
    expect(parseShow(JSON.stringify({ ...newShow(), id })).id).toBe(id);
    expect(() => parseShow(JSON.stringify({ ...newShow(), id: '<script>' }))).toThrow(/id/);
    expect(() => parseShow(JSON.stringify({ ...newShow(), id: 5 }))).toThrow(/id/);
  });
  const full = { ...newShow(), music: { name: 'a.mp3', audioId: 'a1', taps: [] }, trace: { id: 't1', x: 0, y: 0, w: 10, opacity: 0.5 } };
  it('reads the attached recording and picture, and takes them off the show', () => {
    const r = parseShowFile(JSON.stringify({ ...full, attached: { audio: { type: 'audio/mpeg', data: btoa('abc') }, picture: { type: 'image/png', data: btoa('xy') } } }));
    expect(r.audio).toEqual({ type: 'audio/mpeg', data: btoa('abc') });
    expect(r.picture?.type).toBe('image/png');
    expect('attached' in r.show).toBe(false);
    expect('attached' in parseShow(JSON.stringify({ ...full, attached: { audio: { type: 'audio/mpeg', data: btoa('abc') } } }))).toBe(false);
  });
  it('refuses a bad attachment', () => {
    const bad = (attached: unknown, show: object = full) => () => parseShowFile(JSON.stringify({ ...show, attached }));
    expect(bad({ audio: { type: 'text/html', data: btoa('abc') } })).toThrow(/attached/);
    expect(bad({ picture: { type: 'image/png', data: 'not base64!' } })).toThrow(/attached/);
    expect(bad({ audio: { type: 'audio/mpeg', data: btoa('abc') } }, newShow())).toThrow(/attached/); // no music to attach it to
    expect(bad({ audio: { type: 'audio/mpeg', data: 'A'.repeat(40_000_000) } })).toThrow(/attached/);
    expect(bad('x')).toThrow(/attached/);
  });
});

describe('snapping to the grid', () => {
  it('rounds to whole, half, or quarter steps, and leaves Free alone', async () => {
    const { snapPoint } = await import('./show');
    const p = { x: 1.13, y: 2.6 };
    expect(snapPoint(p, 1)).toEqual({ x: 1, y: 3 });
    expect(snapPoint(p, 0.5)).toEqual({ x: 1, y: 2.5 });
    expect(snapPoint(p, 0.25)).toEqual({ x: 1.25, y: 2.5 });
    expect(snapPoint(p, 0)).toEqual(p);
  });
});
