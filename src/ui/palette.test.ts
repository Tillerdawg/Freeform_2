import { describe, expect, it } from 'vitest';
import app from '../../app/index.html?raw';
import front from '../../index.html?raw';
import frontEs from '../../es/index.html?raw';
import { LIGHT, PALETTE } from './palette';

describe.each([['app/index.html', app], ['index.html (the front page)', front], ['es/index.html (the Spanish front page)', frontEs]])('one palette: %s', (_, html) => {
  it("the page's CSS variables are exactly the palette the canvas uses", () => {
    const root = html.match(/:root \{([^}]*)\}/)![1];
    const vars = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));
    expect(vars).toEqual(PALETTE);
    const light = html.match(/:root\[data-theme=light\] \{([^}]*)\}/)![1];
    expect(Object.fromEntries([...light.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]))).toEqual(LIGHT);
  });
  it('the page styles name colors from the palette, not loose hex values (print styles excepted)', () => {
    const end = html.indexOf('@media print');
    const screen = html.slice(html.indexOf(':root {'), end < 0 ? html.indexOf('</style>') : end);
    const loose = screen.replace(/:root \{[^}]*\}/, '').replace(/:root\[data-theme=light\] \{[^}]*\}/, '').match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
    expect(loose.filter((c: string) => !['#000', '#fff'].includes(c))).toEqual([]);
  });
  it('keeps text and field marks legible (WCAG contrast: text 4.5:1, lines and shapes 3:1)', () => {
    const lum = (h: string) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    for (const P of [PALETTE, LIGHT]) { // the panels, in both modes
      for (const bg of [P.bg, P['bg-deep'], P.surface, P['surface-2']]) for (const fg of [P.text, P.gold, P.warn, P.danger, P.blue, P['green-line']]) expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(P.text, P.green)).toBeGreaterThanOrEqual(4.5); // primary buttons
      expect(ratio(P['on-gold'], P['gold-fill'])).toBeGreaterThanOrEqual(4.5); // pressed toggles
      expect(ratio(P.gold, P['bg-deep'])).toBeGreaterThanOrEqual(3); // a pressed toggle's edge against the page
    }
    const P = PALETTE; // the field: the same in both modes
    expect(ratio('#111111', P.gold)).toBeGreaterThanOrEqual(4.5); // pressed toggles, selected letters
    expect(ratio('#ffffff', P.turf)).toBeGreaterThanOrEqual(4.5); // letters and numbers on the field
    expect(ratio(P['bg-deep'], P.turf)).toBeGreaterThanOrEqual(3); // normal paths
    expect(ratio('#ffffff', P.floor)).toBeGreaterThanOrEqual(4.5); // letters and numbers on an indoor floor
    expect(ratio(P['bg-deep'], P.floor)).toBeGreaterThanOrEqual(3); // normal paths on a floor
    expect(ratio(P.warn, P['bg-deep'])).toBeGreaterThanOrEqual(3); // warning paths against their casing
    expect(ratio(P['step-red'], P['bg-deep'])).toBeGreaterThanOrEqual(3); // (as text on panels, steps use warn/danger: STEP_TEXT)
  });
});

// Color blindness: about 1 in 12 boys can't tell some reds from greens. Color is never the only signal in FreeFORM (words, shapes,
// and underlines carry the meaning too), but colors that mean different things should still look different. These simulate the
// three common kinds (Machado, Oliveira & Fernandes 2009, full strength) and measure the difference (CIE76 ΔE: about 2 is
// barely visible, 10+ easy to see, 20+ clearly different). A pure red can't stay far from both green and yellow for everyone,
// so panel signals ask for 12 and lean on their words; field paths ask for 20.
describe('color blindness', () => {
  const SIM = {
    normal: null,
    protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
    tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
  } as const;
  const linear = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lab = (l: number[]) => {
    const X = (0.4124 * l[0] + 0.3576 * l[1] + 0.1805 * l[2]) / 0.95047, Y = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2], Z = (0.0193 * l[0] + 0.1192 * l[1] + 0.9505 * l[2]) / 1.08883;
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
  };
  const seen = (h: string, m: readonly (readonly number[])[] | null) => { const l = linear(h); return lab(m ? m.map((r) => Math.min(1, Math.max(0, r[0] * l[0] + r[1] * l[1] + r[2] * l[2]))) : l); };
  /** The smallest difference between two colors across normal vision and the three kinds of color blindness. */
  const apart = (a: string, b: string) => Math.min(...Object.values(SIM).map((m) => Math.hypot(...seen(a, m).map((v, i) => v - seen(b, m)[i]))));

  it.each([['dark', PALETTE], ['light', LIGHT]] as const)('keeps warnings, errors, and "done" apart on the panels (%s)', (_, P) => {
    expect(apart(P.warn, P.danger)).toBeGreaterThanOrEqual(12); // a bigger step vs. a too-big one (STEP_TEXT), Review's labels
    expect(apart(P['green-line'], P.danger)).toBeGreaterThanOrEqual(12); // "done" vs. an error
    expect(apart(P.text, P.warn)).toBeGreaterThanOrEqual(12); // a normal step vs. a bigger one
    expect(apart(P.text, P.danger)).toBeGreaterThanOrEqual(12);
  });
  it('keeps step paths on the field apart (the field is the same in both modes)', () => {
    expect(apart(PALETTE['bg-deep'], PALETTE.warn)).toBeGreaterThanOrEqual(20); // a normal path vs. a bigger-step one
    expect(apart(PALETTE.warn, PALETTE['step-red'])).toBeGreaterThanOrEqual(20); // bigger vs. too big (too big is also solid and thicker)
  });
});

