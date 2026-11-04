import { expect, it } from 'vitest';
import { readNumber } from './NumberField';

it('reads typed numbers, waiting while the box is empty, unfinished, or out of range', () => {
  const tempo = { min: 20, max: 300, integer: true };
  expect(readNumber('90', tempo)).toBe(90);
  expect(readNumber('', tempo)).toBeNull(); // cleared to retype: no snapping back to a default
  expect(readNumber('9', tempo)).toBeNull(); // on the way to 90
  expect(readNumber('400', tempo)).toBeNull();
  expect(readNumber('120.6', tempo)).toBe(121);
  expect(readNumber('1', { min: 101, max: 400 })).toBeNull(); // typing 150 into the scale box starts with 1
  expect(readNumber('2.75', { min: 0 })).toBe(2.75);
  expect(readNumber('-', { min: 0 })).toBeNull();
});
