// The app's languages: English, and Spanish (so far the phone's performer view and the front page). Strings are looked up
// by their English text, so the English stays readable in the code and every Spanish line is in one file (es.ts) for a
// Spanish-speaking director to check. FreeFORM follows the device's language until someone picks one.
import { ES } from './es';

export type Lang = 'en' | 'es';
export const LANG_KEY = 'freeform:lang';
const stored = (): Lang | null => { try { const v = localStorage.getItem(LANG_KEY); return v === 'en' || v === 'es' ? v : null; } catch { return null; } };
const device = (): Lang => (typeof navigator !== 'undefined' && /^es\b/i.test(navigator.language ?? '') ? 'es' : 'en');

export const lang: Lang = stored() ?? device();
if (typeof document !== 'undefined') document.documentElement.lang = lang;

/** Switch languages. Reloads, so everything on screen comes back in the new one. */
export function setLang(l: Lang) {
  try { localStorage.setItem(LANG_KEY, l); } catch { /* private window: this visit only */ }
  location.reload();
}

/** `en` in the current language, with {name} filled in from `vars`. A string not in es.ts yet stays English. */
export function tr(en: string, vars?: Record<string, string | number>, l: Lang = lang): string {
  let s = l === 'es' ? ES[en] ?? en : en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
