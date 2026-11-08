import { expect, it } from 'vitest';
import { nextFocus } from './useDialog';

it('Tab wraps at the ends of a dialog and brings stray focus back in', () => {
  const [a, b, c] = [{}, {}, {}] as HTMLElement[], list = [a, b, c];
  expect(nextFocus(list, c, false)).toBe(a); // past the last: back to the first
  expect(nextFocus(list, a, true)).toBe(c); // Shift+Tab before the first: to the last
  expect(nextFocus(list, a, false)).toBeNull(); // in the middle: the browser's own Tab
  expect(nextFocus(list, null, false)).toBe(a);
  expect(nextFocus(list, {} as HTMLElement, true)).toBe(c); // focus outside the dialog
  expect(nextFocus([], a, false)).toBeNull();
});
