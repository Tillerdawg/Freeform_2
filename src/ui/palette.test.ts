import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import { PALETTE } from './palette';

describe('one palette', () => {
  it("index.html's CSS variables are exactly the palette the canvas uses", () => {
    const root = html.match(/:root \{([^}]*)\}/)![1];
    const vars = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));
    expect(vars).toEqual(PALETTE);
  });
  it('the page styles name colors from the palette, not loose hex values (print styles excepted)', () => {
    const screen = html.slice(html.indexOf(':root {'), html.indexOf('@media print'));
    const loose = screen.replace(/:root \{[^}]*\}/, '').match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
    expect(loose.filter((c: string) => !['#000', '#fff'].includes(c))).toEqual([]);
  });
});
