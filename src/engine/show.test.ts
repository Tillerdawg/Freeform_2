import { describe, expect, it } from 'vitest';
import { HASHES, readout } from './coords';
import {
  addPerformer, addSetAfter, advance, biggestStep, chainOrder, clearFtl, ftlTrail, moveSteps, normalizeFtl, flip, mirrorSides, moveSetTo, remapHash, rotateScale, setFtl, snapSelection, playRange, playPlan, label, locate, newShow, parseShow, placeInSet, positionsAt,
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
  it("starts new shows with Freeform's list or a saved one, and rejects junk", async () => {
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
