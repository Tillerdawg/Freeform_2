// Where the sidebar and timeline sit (sidebar left or right, timeline top or bottom), and a white field instead of green, kept in this browser.
const KEY = { sideLeft: 'freeform:sidebar-left', timelineTop: 'freeform:timeline-top', whiteField: 'freeform:white-field' } as const;
export type LayoutPref = keyof typeof KEY;
export const layoutPref = (k: LayoutPref) => { try { return localStorage.getItem(KEY[k]) === '1'; } catch { return false; } };
export const setLayoutPref = (k: LayoutPref, on: boolean) => { try { if (on) localStorage.setItem(KEY[k], '1'); else localStorage.removeItem(KEY[k]); } catch { /* storage blocked: this visit only */ } };
