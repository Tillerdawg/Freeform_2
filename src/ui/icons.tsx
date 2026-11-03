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
export const IconSidebar = L('M2 3h12v10H2zM10 3v10'); // a window with a panel on its right: show or hide the sidebar
export const IconFit = L('M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4');
// Magnifying glasses for zooming the timeline (a plain + reads as "add counts").
export const IconZoomIn = L('M6.5 1.5a5 5 0 1 0 0 10a5 5 0 1 0 0-10M10.2 10.2 14.5 14.5M4.5 6.5h4M6.5 4.5v4');
export const IconZoomOut = L('M6.5 1.5a5 5 0 1 0 0 10a5 5 0 1 0 0-10M10.2 10.2 14.5 14.5M4.5 6.5h4');
export const IconGrip = S('M5 2h2v2H5zM9 2h2v2H9zM5 7h2v2H5zM9 7h2v2H9zM5 12h2v2H5zM9 12h2v2H9z'); // drag to reorder
