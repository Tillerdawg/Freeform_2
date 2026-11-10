import { describe, expect, it } from 'vitest';
import { addPerformer, addSetAfter, newShow, parseShow, placeInSet, setCue, setMeasures, setTiming } from '../engine/show';
import { ROWS_PER_CARD, ROWS_PER_PAGE, chartTitle, chunk, dotCards, hasMeasures, sortedPerformers } from './docs';

function show3() {
  let s = newShow();
  const T = s.sections.find((x) => x.letter === 'T')!.id, F = s.sections.find((x) => x.letter === 'F')!.id;
  const t1 = addPerformer(s, T, { x: 10, y: 26 }); s = t1.show;
  const f1 = addPerformer(s, F, { x: -12, y: 28 }); s = f1.show;
  const t2 = addPerformer(s, T, { x: 0, y: 0 }); s = t2.show;
  s = addSetAfter(s, 0, 16);
  s = placeInSet(s, 1, { [t1.id]: { x: -20, y: 56 } });
  return { s, t1: t1.id, f1: f1.id, t2: t2.id };
}

describe('dot sheets', () => {
  it('orders performers by section, then number', () => {
    const { s } = show3();
    expect(sortedPerformers(s).map((p) => `${p.section === s.sections[0].id ? 'F' : 'T'}${p.number}`)).toEqual(['F1', 'T1', 'T2']);
  });
  it('one row per set, coordinate split into its two halves', () => {
    const { s, t1 } = show3();
    const [card] = dotCards(s, s.performers.filter((p) => p.id === t1));
    expect(card.label).toBe('T1');
    expect(card.name).toBe('');
    expect(card.section).toBe('Tuba');
    expect(card.rows).toEqual([
      { index: 0, set: '1', counts: '—', measures: '', side: '2 steps outside the Side 2 45', front: '2 steps in front of Front Hash', cue: '' },
      { index: 1, set: '2', counts: '16', measures: '', side: 'Splitting 35 and 40 on Side 1', front: 'On Back Hash', cue: '' },
    ]);
  });
  it('notes a delayed step-off', () => {
    const { s, t1 } = show3();
    const [card] = dotCards(setTiming(s, 1, [t1], 4, 8), s.performers.filter((p) => p.id === t1));
    expect(card.rows[1].cue).toBe('Hold 4, move 8, hold 4');
  });
  it('one per page holds more sets on a card', () => {
    let { s, t1 } = show3();
    for (let k = 0; k < ROWS_PER_CARD + 5; k++) s = addSetAfter(s, s.sets.length - 1, 8);
    expect(dotCards(s, s.performers.filter((p) => p.id === t1), ROWS_PER_PAGE).map((c) => c.rows.length)).toEqual([s.sets.length]);
    expect(dotCards(s, s.performers.filter((p) => p.id === t1), ROWS_PER_PAGE, [1, 2])[0].rows.map((r) => r.set)).toEqual([s.sets[1].name, s.sets[2].name]);
  });
  it('long shows continue onto more cards', () => {
    let { s, t1 } = show3();
    for (let k = 0; k < ROWS_PER_CARD + 5; k++) s = addSetAfter(s, s.sets.length - 1, 8);
    const cards = dotCards(s, s.performers.filter((p) => p.id === t1));
    expect(cards.map((c) => [c.part, c.parts, c.rows.length])).toEqual([[1, 2, ROWS_PER_CARD], [2, 2, s.sets.length - ROWS_PER_CARD]]);
  });
});

describe('charts', () => {
  it('titles give counts and where the set lands', () => {
    const { s } = show3();
    expect(chartTitle(s, 0)).toBe('Set 1 · opening set');
    expect(chartTitle(s, 1)).toBe('Set 2 · 16 counts (counts 0–16)');
  });
  it('chunks into pages', () => expect(chunk([1, 2, 3, 4, 5], 4)).toEqual([[1, 2, 3, 4], [5]]));
});

describe('measure numbers', () => {
  it('are typed per set, printed on cards and chart titles, and only when any exist', () => {
    let { s, t1 } = show3();
    expect(hasMeasures(s)).toBe(false);
    s = setMeasures(setMeasures(s, 0, '0'), 1, '1–4');
    expect(hasMeasures(s)).toBe(true);
    const [card] = dotCards(s, s.performers.filter((p) => p.id === t1));
    expect(card.rows.map((r) => r.measures)).toEqual(['0', '1–4']);
    expect(chartTitle(s, 1)).toBe('Set 2 · 16 counts (counts 0–16) · m. 1–4');
    expect(chartTitle(s, 0)).toBe('Set 1 · opening set · m. 0');
    const mv = { ...s, movements: [{ id: 'm', name: 'Opener', counts: 64 }] };
    expect(chartTitle(mv, 1)).toBe('Opener · Set 2 · 16 counts (counts 0–16) · m. 1–4');
    expect(setMeasures(s, 1, '').sets[1].measures).toBeUndefined();
  });
  it('survive a file round trip; non-text measures are rejected', () => {
    const { s } = show3();
    const m = setMeasures(s, 1, '9–12');
    expect(parseShow(JSON.stringify(m)).sets[1].measures).toBe('9–12');
    const bad = JSON.parse(JSON.stringify(m));
    bad.sets[1].measures = 12;
    expect(() => parseShow(JSON.stringify(bad))).toThrow(/measures/);
  });
});

it('cues print on the performer\'s own card only', () => {
  const { s, t1, t2 } = show3();
  const c = setCue(s, 1, [t1], 'Horns 45, slide L');
  const cards = dotCards(c, c.performers.filter((p) => p.id === t1 || p.id === t2));
  expect(cards[0].rows.map((r) => r.cue)).toEqual(['', 'Horns 45, slide L']);
  expect(cards[1].rows.map((r) => r.cue)).toEqual(['', '']);
});

it('fewer rows per page when each set gets a field picture, and each card knows its performer', async () => {
  const { ROWS_WITH_PICTURES } = await import('./docs');
  const { sampleShow } = await import('../engine/sample');
  const { addSetAfter } = await import('../engine/show');
  let s = sampleShow();
  for (let k = 0; k < ROWS_WITH_PICTURES; k++) s = addSetAfter(s, s.sets.length - 1, 8);
  const cards = dotCards(s, s.performers.slice(0, 1), ROWS_WITH_PICTURES);
  expect(cards.map((c) => c.rows.length)).toEqual([ROWS_WITH_PICTURES, s.sets.length - ROWS_WITH_PICTURES]);
  expect(cards.every((c) => c.id === s.performers[0].id)).toBe(true);
  expect(cards[1].rows[0].index).toBe(ROWS_WITH_PICTURES); // the row's set, for its picture
});
