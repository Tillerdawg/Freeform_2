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
