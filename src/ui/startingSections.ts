import { DEFAULT_SECTIONS, validSectionList, type SectionList, type Show } from '../engine/show';

// A director's own starting section list, kept in this browser. New shows start with it instead of Freeform's.
const KEY = 'freeform:starting-sections';

export function startingSections(): SectionList {
  try { return validSectionList(JSON.parse(localStorage.getItem(KEY) ?? 'null')) ?? DEFAULT_SECTIONS; } catch { return DEFAULT_SECTIONS; }
}
export const hasOwnStartingSections = () => { try { return localStorage.getItem(KEY) !== null; } catch { return false; } };
/** Returns false if the browser won't store it. */
export function saveStartingSections(show: Show): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(show.sections.map(({ name, letter }) => ({ name, letter })))); return true; } catch { return false; }
}
export function clearStartingSections() { try { localStorage.removeItem(KEY); } catch { /* nothing stored */ } }
