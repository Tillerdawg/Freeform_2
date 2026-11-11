import { useSyncExternalStore } from 'react';

// FreeFORM's colors, one set for the whole app. The page styles use the same names as CSS variables (app/index.html and the front page,
// :root); canvas drawing (the field, the phone view) uses these values. palette.test.ts keeps the two in step and checks
// contrast: legible beats pretty (text 4.5:1, lines and shapes 3:1).
export const PALETTE = {
  bg: '#1d2a1f', // the page, panels, dialogs
  'bg-deep': '#182419', // toolbar strip, text boxes, overlays on the field; normal-step paths and the casing under warning paths
  surface: '#22302a', // blocks inside panels, timeline moves, pressed buttons
  'surface-2': '#2b3b2f', // buttons, the current move on the timeline
  line: '#33443a', // dividers and quiet borders
  'line-strong': '#44594a', // button, field and dialog borders
  muted: '#6b8270', // hover borders, empty swatches
  green: '#3d6b4a', // primary buttons
  'green-line': '#7cc08b', // primary button border, "done" messages
  text: '#e9f0ea',
  gold: '#ffd166', // selection, focus, pressed toggles, the playhead's set
  'gold-fill': '#ffd166', // pressed toggles' fill (gold in both modes)
  'on-gold': '#182419', // text on a pressed toggle (on gold-fill)
  warn: '#f5c518', // warnings, bigger steps
  'warn-line': '#5a4a1a', // border of a box asking for a decision
  danger: '#ff756b', // errors (a coral red: further from warn and green-line for red-green color blindness; palette.test.ts)
  'step-red': '#ff4d4d', // too-big steps on the field (with a dark casing)
  'danger-bg': '#5a2b2b',
  'danger-line': '#a04848',
  blue: '#5ad1ff', // shape guides, links
  turf: '#357842',
  floor: '#8a6a45', // an indoor floor or tarp, under white lines and labels
} as const;

export type PaletteName = keyof typeof PALETTE;
/** For inline styles: `css('surface')` → 'var(--surface)'. */
export const css = (name: PaletteName) => `var(--${name})`;

/**
 * Light mode: the same names for the panels, buttons and text (app/index.html and index.html, :root[data-theme=light]). The field itself
 * doesn't change: turf, yard lines, dots and paths keep PALETTE, so a show looks the same in both modes.
 */
export const LIGHT: Record<PaletteName, string> = {
  bg: '#eef3ef',
  'bg-deep': '#ffffff',
  surface: '#e3ebe5',
  'surface-2': '#d5e0d8',
  line: '#bfcdc3',
  'line-strong': '#8ea596',
  muted: '#5f7564',
  green: '#c4e3cc',
  'green-line': '#2a6e3b',
  text: '#14201a',
  gold: '#1d2a1f', // field dark for lines, rings and edges (Jason): thin gold is unreadable on white
  'gold-fill': '#ffd166', // pressed toggles stay real gold (Jason)
  'on-gold': '#14201a',
  warn: '#7a5200',
  'warn-line': '#c9a447',
  danger: '#bd1c3a',
  'step-red': '#c41e1e',
  'danger-bg': '#f6d5d3',
  'danger-line': '#c96a64',
  blue: '#075f85',
  turf: '#357842',
  floor: '#8a6a45',
};

/**
 * Shadows, the dimming behind dialogs, and see-through overlays: colors with transparency, kept apart from the hex palette
 * above. The page styles use them as CSS variables of the same names (the second :root blocks in app/index.html), with
 * two shadow sizes built on them: --raise (menus, notes, cards, a sidebar over the field) and --lift (dialogs, the phone's
 * sheet). Light mode's are softer: a black shadow at full strength looks like a smudge on a pale page.
 */
export const EFFECTS = {
  shadow: 'rgba(0,0,0,0.45)', // under menus, notes, cards, and a sidebar laid over the field
  'shadow-strong': 'rgba(0,0,0,0.55)', // under dialogs
  backdrop: 'rgba(0,0,0,0.55)', // dims the page behind a dialog
  dim: 'rgba(0,0,0,0.45)', // the timeline outside the play range
  overlay: 'rgba(24,36,25,0.88)', // a readout floating over the field (bg-deep, see-through)
} as const;
export type EffectName = keyof typeof EFFECTS;
export const EFFECTS_LIGHT: Record<EffectName, string> = {
  shadow: 'rgba(20,32,26,0.2)',
  'shadow-strong': 'rgba(20,32,26,0.3)',
  backdrop: 'rgba(20,32,26,0.4)',
  dim: 'rgba(20,32,26,0.2)',
  overlay: 'rgba(255,255,255,0.92)',
};

/**
 * The field's own ink, the same in both modes (drawField.ts's THEMES and INK, and the phone's field): pure white and
 * near-black for the most contrast on turf and on the white field, and see-through tints for the grid, the halos around
 * letters, and the phone's quieter dots. Paper (black on white) uses some of them too.
 */
export const FIELD = {
  white: '#ffffff',
  black: '#000000',
  ink: '#111111', // letters on the white field, and on a gold badge
  'paper-number': '#555555', // yard numbers on paper
  'guide-edge': '#0b2a36', // the dark edge of a blue shape handle on turf
  'grid-minor': 'rgba(255,255,255,0.15)', 'grid-major': 'rgba(255,255,255,0.32)', // on turf
  'grid-minor-white': 'rgba(0,0,0,0.12)', 'grid-major-white': 'rgba(0,0,0,0.28)', // on the white field
  'grid-minor-paper': 'rgba(0,0,0,0.07)', 'grid-major-paper': 'rgba(0,0,0,0.2)', // on paper
  halo: 'rgba(0,0,0,0.85)', 'halo-white': 'rgba(255,255,255,0.9)', // the edge around letters and labels
  'mark-halo': 'rgba(0,0,0,0.55)', 'mark-halo-white': 'rgba(255,255,255,0.8)', // around markup
  'mark-empty': 'rgba(255,255,255,0.5)', 'mark-empty-white': 'rgba(0,0,0,0.45)', // an empty text note's outline
  'guide-arm': 'rgba(90,209,255,0.7)', 'guide-arm-white': 'rgba(7,95,133,0.7)', // Bézier control arms (blue, see-through)
  quiet: 'rgba(255,255,255,0.6)', 'quiet-white': 'rgba(0,0,0,0.45)', // the phone: the rest of the band
  faint: 'rgba(255,255,255,0.45)', 'faint-white': 'rgba(0,0,0,0.35)', // the phone: dots too small for letters
  readout: 'rgba(24,36,25,0.85)', 'readout-track': 'rgba(255,255,255,0.35)', // the phone: the box behind a readout on the field, and its track
  'box-fill': 'rgba(255,209,102,0.12)', // a selection box or lasso being dragged (gold, faint)
} as const;

export type ThemeName = 'dark' | 'light';
export const THEME_KEY = 'freeform:theme';
// A choice made with the sun/moon button wins; until then, follow the device's own light or dark setting.
const stored = (): ThemeName | null => { try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; } };
const LIGHT_Q = '(prefers-color-scheme: light)';
const device = (): ThemeName => (typeof matchMedia !== 'undefined' && matchMedia(LIGHT_Q).matches ? 'light' : 'dark');
let theme: ThemeName = stored() ?? device();
const listeners = new Set<() => void>();
/** A panel color for canvas drawing (the space around the field, the waveform), in the current mode. */
export const chrome = (name: PaletteName) => (theme === 'light' ? LIGHT : PALETTE)[name];
function apply() {
  if (typeof document === 'undefined') return; // tests
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', chrome('bg'));
}
apply();
if (typeof matchMedia !== 'undefined') matchMedia(LIGHT_Q).addEventListener('change', () => { if (!stored()) { theme = device(); apply(); listeners.forEach((f) => f()); } });
export function setTheme(t: ThemeName) {
  theme = t; apply();
  try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode: this visit only */ }
  listeners.forEach((f) => f());
}
/** The current mode; a component using it redraws its canvas when the mode changes. */
export const useTheme = () => useSyncExternalStore((f) => { listeners.add(f); return () => { listeners.delete(f); }; }, () => theme);
