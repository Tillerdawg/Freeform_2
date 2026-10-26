// Transport icons drawn as SVG: emoji-capable symbols like ⏮ render as colored emoji on Apple devices
// while ▶ and ◀ don't, so text characters can't give a consistent set.
const S = (d: string) => () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={{ display: 'block' }}><path d={d} /></svg>
);

export const IconStart = S('M2 2h2v12H2zM15 2v12L9.5 8zM9.5 2v12L4 8z'); // back to the start
export const IconPrev = S('M3 2h2v12H3zM14 2v12L6 8z'); // one count back
export const IconPlay = S('M4 2l10 6-10 6z');
export const IconPause = S('M3 2h3.5v12H3zM9.5 2H13v12H9.5z');
export const IconNext = S('M11 2h2v12h-2zM2 2l8 6-8 6z'); // one count forward

// Toolbar icons, drawn as strokes: curved arrows for undo/redo, corner brackets for "fit the whole field".
const L = (d: string) => () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ display: 'block' }}><path d={d} /></svg>
);
export const IconUndo = L('M5.5 3.5 2.5 6.5l3 3M2.5 6.5h7a4 4 0 0 1 0 8H7');
export const IconRedo = L('M10.5 3.5l3 3-3 3M13.5 6.5h-7a4 4 0 0 0 0 8H9');
export const IconFit = L('M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4');
