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
  it('keeps text and field marks legible (WCAG contrast: text 4.5:1, lines and shapes 3:1)', () => {
    const lum = (h: string) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const P = PALETTE;
    for (const bg of [P.bg, P['bg-deep'], P.surface, P['surface-2']]) for (const fg of [P.text, P.gold, P.warn, P.danger, P.blue, P['green-line']]) expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(P.text, P.green)).toBeGreaterThanOrEqual(4.5); // primary buttons
    expect(ratio('#111111', P.gold)).toBeGreaterThanOrEqual(4.5); // pressed toggles, selected letters
    expect(ratio('#ffffff', P.turf)).toBeGreaterThanOrEqual(4.5); // letters and numbers on the field
    expect(ratio(P['bg-deep'], P.turf)).toBeGreaterThanOrEqual(3); // normal paths
    expect(ratio(P.warn, P['bg-deep'])).toBeGreaterThanOrEqual(3); // warning paths against their casing
    expect(ratio(P['step-red'], P['bg-deep'])).toBeGreaterThanOrEqual(3); // (as text on panels, steps use warn/danger: STEP_TEXT)
  });
});
