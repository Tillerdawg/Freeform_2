import { describe, expect, it } from 'vitest';
import { insidePolygon, stepSize } from './coords';
import { dismissIssues, issueKey, newlyStraight, restoreIssues, reviewShow, splitDismissed } from './review';
import { addPerformer, addSetAfter, brokenPaths, closeCalls, closeCallsMemo, newShow, overLimit, parseShow, placeInSet, setCounts, type Show } from './show';

/** Two trumpets 16 steps apart, then a 16-count move: T1 marches 16 steps (8-to-5), T2 holds. */
function show2() {
  let show = newShow();
  const sec = show.sections[0].id;
  const a = addPerformer(show, sec, { x: 0, y: 28 }); show = a.show;
  const b = addPerformer(show, sec, { x: 16, y: 28 }); show = b.show;
  show = placeInSet(addSetAfter(show, 0, 16), 1, { [a.id]: { x: -16, y: 28 } });
  return { show, a: a.id, b: b.id };
}

describe('step limit', () => {
  it('is a 4-to-5 by default and can be set per show', () => {
    expect(stepSize(16, 8).tier).toBe('yellow'); // a 4-to-5 is the limit itself, not over it
    expect(stepSize(16, 7).tier).toBe('red');
    expect(stepSize(16, 16, 8).tier).toBe('ok');
    expect(stepSize(16, 15, 8).tier).toBe('red'); // a strict 8-to-5 limit: any step bigger than standard
    const { show, a } = show2();
    expect(overLimit(show, 1)).toEqual([]);
    expect(overLimit({ ...show, stepLimit: 8 }, 1)).toEqual([]);
    expect(overLimit(setCounts({ ...show, stepLimit: 8 }, 1, 15), 1)).toEqual([a]);
  });
  it('is checked when a show is opened', () => {
    const { show } = show2();
    expect(parseShow(JSON.stringify({ ...show, stepLimit: 6 })).stepLimit).toBe(6);
    for (const bad of [0, 1, 9, 'x', null]) expect(() => parseShow(JSON.stringify({ ...show, stepLimit: bad }))).toThrow(/step limit/);
  });
});

describe('imported paths that no longer fit', () => {
  it('are found once an end moves, and fit again when it moves back', () => {
    const { show, a } = show2();
    const path = Array.from({ length: 17 }, (_, k) => ({ x: -k, y: 28 + (k > 0 && k < 16 ? 1 : 0) }));
    const withPath: Show = { ...show, sets: show.sets.map((s, i) => (i === 1 ? { ...s, paths: { [a]: path } } : s)) };
    expect(brokenPaths(withPath, 1)).toEqual([]);
    const moved = placeInSet(withPath, 1, { [a]: { x: -15, y: 28 } });
    expect(brokenPaths(moved, 1)).toEqual([a]);
    expect(brokenPaths(placeInSet(moved, 1, { [a]: { x: -16, y: 28 } }), 1)).toEqual([]);
    expect(brokenPaths(setCounts(withPath, 1, 8), 1)).toEqual([a]);
    expect(newlyStraight(withPath, moved)).toEqual([{ set: 1, ids: [a] }]);
    expect(newlyStraight(moved, placeInSet(moved, 1, { [a]: { x: -14, y: 28 } }))).toEqual([]); // already straight: said once
    expect(newlyStraight(withPath, { ...withPath, title: 'x' })).toEqual([]);
  });
});

describe('whole-show review', () => {
  it('is empty for a clean show', () => expect(reviewShow(show2().show)).toEqual([]));
  it('lists big steps, close calls, straightened paths, missing spots, and counts not written, each with where to go', () => {
    const { show: s0, a, b } = show2();
    let show = setCounts(s0, 1, 4); // 16 steps in 4 counts: a 2-to-5
    show = placeInSet(show, 1, { [b]: { x: -16.5, y: 28 } }); // T2 passes T1 and ends half a step from it
    show = { ...show, movements: [{ id: 'm', name: 'Opener', counts: 32 }] };
    show = { ...show, sets: show.sets.map((s, i) => (i === 1 ? { ...s, paths: { [a]: [{ x: 9, y: 9 }] } } : s)) }; // doesn't fit
    const extra = addPerformer(show, show.sections[0].id, { x: 30, y: 10 }); // in every set; then take its spot out of set 2
    show = { ...extra.show, sets: extra.show.sets.map((s, i) => (i === 1 ? { ...s, pos: Object.fromEntries(Object.entries(s.pos).filter(([id]) => id !== extra.id)) } : s)) };
    const issues = reviewShow(show);
    expect(issues.map((x) => x.kind)).toEqual(['missing', 'close', 'steps', 'straight', 'unwritten']);
    const [missing, close, steps, straight, unwritten] = issues;
    expect(missing).toMatchObject({ set: 1, t: 4, ids: [extra.id] });
    expect(close).toMatchObject({ set: 1, ids: [a, b].sort() });
    expect(close.text).toMatch(/^F1 and F2 [\d.]+ steps apart on count [\d.]+$/); // T2 passes T1 on the way
    expect(steps).toMatchObject({ set: 1, t: 4 });
    expect(steps.ids.sort()).toEqual([a, b].sort());
    expect(steps.text).toMatch(/^2 performers over the 4-to-5 limit \(biggest 1-to-5\): F1, F2$/);
    expect(straight).toMatchObject({ set: 1, ids: [a] });
    expect(unwritten).toMatchObject({ t: 4, ids: [], text: "Counts 5 to 32 aren't written yet" });
  });
  it('keeps close calls per move until that move changes', () => {
    const { show } = show2();
    expect(closeCallsMemo(show, 1)).toBe(closeCallsMemo(show, 1));
    expect(closeCallsMemo(show, 1)).toEqual(closeCalls(show, 1));
    expect(closeCallsMemo(setCounts(show, 1, 8), 1)).not.toBe(closeCallsMemo(show, 1));
  });
});

describe('lasso', () => {
  const l = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 5, y: 3 }, { x: 0, y: 10 }]; // a notch cut into the top
  it('picks points inside a freeform outline, not in its notches', () => {
    expect(insidePolygon({ x: 2, y: 2 }, l)).toBe(true);
    expect(insidePolygon({ x: 9, y: 8 }, l)).toBe(true);
    expect(insidePolygon({ x: 5, y: 8 }, l)).toBe(false); // in the notch
    expect(insidePolygon({ x: 11, y: 5 }, l)).toBe(false);
    expect(insidePolygon({ x: 1, y: 1 }, l.slice(0, 2))).toBe(false); // a line has no inside
  });
});

describe('dismissing a warning', () => {
  it('hides it, is saved with the show, and comes back when the problem changes', () => {
    const { show: s0, a, b } = show2();
    const over = setCounts(s0, 1, 4); // T1: a 2-to-5, over the limit
    const x = reviewShow(over).find((i) => i.kind === 'steps')!;
    const show = { ...over, dismissed: [issueKey(over, x)] };
    expect(splitDismissed(show, reviewShow(show)).open.some((i) => i.kind === 'steps')).toBe(false);
    expect(splitDismissed(show, reviewShow(show)).dismissed).toHaveLength(1);
    expect(parseShow(JSON.stringify(show)).dismissed).toEqual(show.dismissed);
    const both = placeInSet(show, 1, { [b]: { x: 32, y: 28 } }); // now T2 is over too: a new warning
    expect(splitDismissed(both, reviewShow(both)).open.find((i) => i.kind === 'steps')?.ids.sort()).toEqual([a, b].sort());
  });
});

describe('a dismissed warning that gets worse', () => {
  it('comes back when the move gets harder, and stays dismissed when it gets easier', () => {
    const { show: s0 } = show2();
    const over = setCounts(s0, 1, 4); // a 2-to-5
    const x = reviewShow(over).find((i) => i.kind === 'steps')!;
    expect(x.m).toBe(2);
    const show = { ...over, dismissed: [issueKey(over, x)] };
    const worse = setCounts(show, 1, 2); // a 1-to-5
    expect(splitDismissed(worse, reviewShow(worse)).open.some((i) => i.kind === 'steps')).toBe(true);
    const easier = setCounts(show, 1, 6); // a 3-to-5, still over the limit
    expect(splitDismissed(easier, reviewShow(easier)).open.some((i) => i.kind === 'steps')).toBe(false);
    // dismissing it again at the worse size replaces the old key, and bringing it back clears it
    const wx = reviewShow(worse).find((i) => i.kind === 'steps')!, again = dismissIssues(worse, reviewShow(worse), [issueKey(worse, wx)]);
    expect(again.dismissed).toEqual([issueKey(worse, wx)]);
    expect(restoreIssues(easier, [issueKey(easier, reviewShow(easier).find((i) => i.kind === 'steps')!)]).dismissed).toBeUndefined();
  });

  it('keeps dismissals saved before severity was part of the key', () => {
    const { show: s0 } = show2();
    const over = setCounts(s0, 1, 2);
    const x = reviewShow(over).find((i) => i.kind === 'steps')!;
    const old = { ...over, dismissed: [issueKey(over, x).split('@')[0]] };
    expect(splitDismissed(old, reviewShow(old)).open.some((i) => i.kind === 'steps')).toBe(false);
  });
});

describe('dismissing and bringing back several at once', () => {
  it('dismisses the chosen ones, drops keys for problems that are gone, and brings back some or all', () => {
    const { show: s0 } = show2();
    const show = { ...setCounts(s0, 1, 4), movements: [{ id: 'm', name: 'Opener', counts: 64 }] }; // a big step, and counts not written
    const all = reviewShow(show), keys = all.map((x) => issueKey(show, x));
    expect(keys).toHaveLength(2);
    const d = dismissIssues({ ...show, dismissed: ['close:gone:x,y'] }, all, keys);
    expect(d.dismissed!.sort()).toEqual([...keys].sort()); // the stale key is gone
    const one = restoreIssues(d, [keys[0]]);
    expect(splitDismissed(one, reviewShow(one)).open.map((x) => issueKey(one, x))).toEqual([keys[0]]);
    expect(restoreIssues(d, keys).dismissed).toBeUndefined();
  });
});
