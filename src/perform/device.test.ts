import { expect, it } from 'vitest';
import { phoneSized } from './device';

it('phones get the performer view; iPads and an open iPhone Duo get the editor', () => {
  const phone = (sw: number, sh: number, ww = sw, wh = sh) => phoneSized(true, sw, sh, ww, wh);
  expect(phone(393, 852)).toBe(true); // iPhone 15
  expect(phone(852, 393)).toBe(true); // on its side
  expect(phone(440, 956)).toBe(true); // Pro Max
  expect(phone(744, 1133)).toBe(false); // iPad mini
  expect(phone(1133, 744)).toBe(false);
  // iPhone Duo (WebKit's sizes), whether or not its screen size follows the fold
  expect(phone(382, 618)).toBe(true); // closed
  expect(phone(669, 902, 382, 580)).toBe(true); // closed, screen still reporting the inner display
  expect(phone(669, 902, 594, 368)).toBe(true); // closed, on its side
  expect(phone(669, 902, 669, 867)).toBe(false); // open
  expect(phone(951, 620, 951, 585)).toBe(false); // open, on its side (Safari's bars showing)
  expect(phone(669, 902, 385, 571)).toBe(true); // open, two apps side by side
  expect(phone(744, 1133, 320, 1133)).toBe(true); // a narrow iPad Split View pane
  expect(phoneSized(false, 393, 852, 393, 852)).toBe(false); // no touch screen: a small desktop window keeps the editor
});
