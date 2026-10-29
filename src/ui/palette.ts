// Freeform's colors, one set for the whole app. The page styles use the same names as CSS variables (index.html,
// :root); canvas drawing (the field, the phone view) uses these values. palette.test.ts keeps the two in step.
export const PALETTE = {
  bg: '#1d2a1f', // the page, panels, dialogs; also normal-step paths on the field
  'bg-deep': '#182419', // toolbar strip, text boxes, overlays on the field
  surface: '#22302a', // blocks inside panels, timeline moves, pressed buttons
  'surface-2': '#2b3b2f', // buttons
  line: '#33443a', // dividers and quiet borders
  'line-strong': '#44594a', // button, field and dialog borders
  muted: '#6b8270', // hover borders, empty swatches
  green: '#3d6b4a', // primary buttons, the current move on the timeline
  'green-line': '#5d9b6c', // primary button border, "done" messages
  text: '#e9f0ea',
  gold: '#ffd166', // selection, focus, pressed toggles, the playhead's set
  warn: '#f5c518', // warnings, bigger steps
  'warn-line': '#5a4a1a', // border of a box asking for a decision
  danger: '#ff8080', // errors
  'danger-bg': '#5a2b2b',
  'danger-line': '#a04848',
  blue: '#5ad1ff', // shape guides, links
  turf: '#357842',
} as const;

export type PaletteName = keyof typeof PALETTE;
/** For inline styles: `css('surface')` → 'var(--surface)'. */
export const css = (name: PaletteName) => `var(--${name})`;
