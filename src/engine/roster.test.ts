import { describe, expect, it } from 'vitest';
import { applyRoster, parseTable, planRoster, sectionFor } from './roster';
import { addPerformer, label, newShow, setNames } from './show';

// Default sections: F Flute, K Clarinet, A Alto Saxophone, X Tenor Saxophone, P Trumpet, H Mellophone, N Trombone, ...
function band() {
  let s = newShow();
  const sec = (l: string) => s.sections.find((x) => x.letter === l)!.id;
  for (const [l, n] of [['P', 3], ['A', 2]] as const) for (let k = 0; k < n; k++) s = addPerformer(s, sec(l), { x: k * 2, y: 20 }).show;
  return { s, sec };
}
const labels = (s: ReturnType<typeof band>['s']) => Object.fromEntries(s.performers.map((p) => [label(s, p), p.name ?? '']));

describe('roster import', () => {
  it('reads Excel paste (tabs) and CSV with quotes', () => {
    expect(parseTable('Name\tInstrument\r\nPat Example\tTrumpet\r\n\r\n')).toEqual([['Name', 'Instrument'], ['Pat Example', 'Trumpet']]);
    expect(parseTable('﻿Last,First,Code\n"Example, Jr.",Pat,P1\n"Say ""Hi""",Lee,P2')).toEqual([['Last', 'First', 'Code'], ['Example, Jr.', 'Pat', 'P1'], ['Say "Hi"', 'Lee', 'P2']]);
    expect(parseTable('a;b;c\n1;2;3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });
  it('matches instruments to sections, abbreviations included', () => {
    const { s, sec } = band();
    expect(sectionFor(s, 'Tpt').id).toBe(sec('P'));
    expect(sectionFor(s, 'Alto Sax').id).toBe(sec('A'));
    expect(sectionFor(s, 'mello').id).toBe(sec('H'));
    expect(sectionFor(s, 'Euphonium').id).toBe(sec('E'));
    expect(sectionFor(s, 'Quads').id).toBe(sec('Q'));
    expect(sectionFor(s, 'P').id).toBe(sec('P')); // a letter
    expect(sectionFor(s, 'Sax').id).toBe(sec('A')); // a lone Sax defaults to alto
    expect(sectionFor(s, 'Tenor Sax').id).toBe(sec('X'));
    expect(sectionFor(s, 'Bari').id).toBe(sec('E'));
    expect(sectionFor(s, 'Bassoon').note).toMatch(/no section/);
  });
  it('names dots by code, fills a section by instrument, creates the rest, and skips what it cannot place', () => {
    const { s } = band();
    const named = setNames(s, { [s.performers[1].id]: 'Old Name' }); // P2
    const rows = parseTable([
      'Last Name\tFirst Name\tInstrument\tDot',
      'Example\tPat\tTrumpet\tP2', // names P2 (replacing)
      'Lee\tSam\tTrumpet\t', // first unnamed trumpet: P1
      'Kim\tAvery\tTrumpet\t', // next: P3
      'Diaz\tRo\tTrumpet\t', // trumpets full: new P4
      'Ng\tJo\tAlto Sax\tA7', // new A7
      'Fox\tMo\tBassoon\t', // no section
      'Dup\tLi\tTrumpet\tP2', // P2 again
      '\t\tTrumpet\tP9', // no name
    ].join('\n'));
    const plan = planRoster(named, rows);
    expect(plan.header).toBe(true);
    expect(plan.steps.map((x) => [x.row, x.kind, x.label ?? '', x.note ?? ''])).toEqual([
      [2, 'name', 'P2', 'replaces Old Name'], [3, 'name', 'P1', ''], [4, 'name', 'P3', ''], [5, 'new', 'P4', ''], [6, 'new', 'A7', ''],
      [7, 'skip', '', 'no section for "Bassoon": choose a section for Bassoon players, or leave them off'], [8, 'skip', 'P2', 'P2 is on an earlier row'], [9, 'skip', '', 'no name'],
    ]);
    const after = applyRoster(named, plan);
    expect(labels(after)).toEqual({ P1: 'Sam Lee', P2: 'Pat Example', P3: 'Avery Kim', A1: '', A2: '', P4: 'Ro Diaz', A7: 'Jo Ng' });
    const p4 = after.performers.find((p) => label(after, p) === 'P4')!;
    expect(after.sets.every((set) => set.pos[p4.id].y === 2)).toBe(true); // waiting on the front sideline in every set
    const a7 = after.performers.find((p) => label(after, p) === 'A7')!;
    expect([after.sets[0].pos[p4.id].x, after.sets[0].pos[a7.id].x]).toEqual([1, -1]); // centered on the 50: sections in order (A before P)
  });
  it('works out the columns without a header row', () => {
    const { s } = band();
    const plan = planRoster(s, parseTable('Pat Example,P1\nSam Lee,P3'));
    expect(plan.header).toBe(false);
    expect(plan.roles).toEqual(['name', 'code']);
    expect(plan.steps.map((x) => x.label)).toEqual(['P1', 'P3']);
  });
  it('asks what to do with an instrument that has no section, and follows the choice for all its rows', () => {
    const { s, sec } = band();
    const rows = parseTable('Name,Instrument,Dot\nBlake Example,Bassoon,\nRi Example,bassoon,\nJo Code,Bassoon,P9');
    const ask = planRoster(s, rows);
    expect(ask.unknown).toEqual([{ key: 'bassoon', instrument: 'Bassoon', rows: 2, note: 'no section for "Bassoon"' }]); // the coded row needs no choice
    expect(ask.steps.filter((x) => x.kind === 'skip').length).toBe(2);
    const baritone = planRoster(s, rows, undefined, { bassoon: sec('E') });
    expect(baritone.unknown[0].choice).toBe(sec('E'));
    expect(baritone.steps.slice(0, 2).map((x) => [x.kind, x.label])).toEqual([['new', 'E1'], ['new', 'E2']]);
    const off = planRoster(s, rows, undefined, { bassoon: 'skip' });
    expect(off.steps.slice(0, 2).map((x) => [x.kind, x.note])).toEqual([['skip', 'left off (your choice)'], ['skip', 'left off (your choice)']]);
  });
});
