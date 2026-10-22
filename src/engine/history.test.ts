import { expect, it } from 'vitest';
import { emptyHistory, record, redo, undo } from './history';

it('a drag (continuous changes) is one step; separate clicks are separate steps', () => {
  let h = emptyHistory<string>();
  h = record(h, 'A', 0, true); // click starts a drag: A -> B
  h = record(h, 'B', 16, false); // B -> C, same drag
  h = record(h, 'C', 32, false); // C -> D, same drag
  expect(h.past).toEqual(['A']);
  h = record(h, 'D', 40, true); // a new click, even right away
  expect(h.past).toEqual(['A', 'D']);
  h = record(h, 'E', 2000, false); // typing after a pause
  expect(h.past).toEqual(['A', 'D', 'E']);
});

it('undo and redo walk back and forth; a new change clears redo', () => {
  let h = record(record(emptyHistory<string>(), 'A', 0, true), 'B', 1000, true); // A -> B -> C
  const u1 = undo(h, 'C')!;
  expect(u1.state).toBe('B');
  const u2 = undo(u1.h, 'B')!;
  expect(u2.state).toBe('A');
  expect(undo(u2.h, 'A')).toBeNull();
  const r1 = redo(u2.h, 'A')!;
  expect(r1.state).toBe('B');
  h = record(r1.h, 'B', 5000, true); // B -> X
  expect(h.future).toEqual([]);
  expect(redo(h, 'X')).toBeNull();
});

it('an edit right after undo is its own step, not merged', () => {
  const u = undo(record(emptyHistory<string>(), 'A', 0, true), 'B')!;
  const h = record(u.h, 'A', 10, false);
  expect(h.past).toEqual(['A']);
});

it('a held drag stays one step even with long pauses, including right after an undo', () => {
  const u = undo(record(emptyHistory<string>(), 'A', 0, true), 'B')!; // lastAt reset by undo
  let h = record(u.h, 'A', 100, true, true); // drag starts: A -> P
  h = record(h, 'P', 5000, false, true); // after a long pause, still held
  h = record(h, 'Q', 9000, false, true);
  expect(h.past).toEqual(['A']);
});
