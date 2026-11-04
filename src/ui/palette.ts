import { useSyncExternalStore } from 'react';

// FreeFORM's colors, one set for the whole app. The page styles use the same names as CSS variables (index.html,
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
  danger: '#ff8080', // errors
  'step-red': '#ff4d4d', // too-big steps on the field (with a dark casing)
  'danger-bg': '#5a2b2b',
  'danger-line': '#a04848',
  blue: '#5ad1ff', // shape guides, links
  turf: '#357842',
} as const;

export type PaletteName = keyof typeof PALETTE;
/** For inline styles: `css('surface')` → 'var(--surface)'. */
export const css = (name: PaletteName) => `var(--${name})`;

/**
 * Light mode: the same names for the panels, buttons and text (index.html, :root[data-theme=light]). The field itself
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
  danger: '#b3261e',
  'step-red': '#c41e1e',
  'danger-bg': '#f6d5d3',
  'danger-line': '#c96a64',
  blue: '#075f85',
  turf: '#357842',
};

export type ThemeName = 'dark' | 'light';
const KEY = 'freeform:theme';
let theme: ThemeName = (() => { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } })();
const listeners = new Set<() => void>();
/** A panel color for canvas drawing (the space around the field, the waveform), in the current mode. */
export const chrome = (name: PaletteName) => (theme === 'light' ? LIGHT : PALETTE)[name];
function apply() {
  if (typeof document === 'undefined') return; // tests
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', chrome('bg'));
}
apply();
export function setTheme(t: ThemeName) {
  theme = t; apply();
  try { localStorage.setItem(KEY, t); } catch { /* private mode: this visit only */ }
  listeners.forEach((f) => f());
}
/** The current mode; a component using it redraws its canvas when the mode changes. */
export const useTheme = () => useSyncExternalStore((f) => { listeners.add(f); return () => { listeners.delete(f); }; }, () => theme);
