// The phone's one line about its copy of the show: whether it works offline, which revision it is, and whether it's the
// latest. A student at rehearsal should be able to answer "do you have revision 6?" and "will this work with no signal?"
import { tr, type Lang } from '../i18n';

/** Where this phone stands with a hosted show's file: checking now, offline, the check failed, or null (last check worked). */
export type Check = 'checking' | 'offline' | 'failed' | null;

export interface StatusIn {
  /** The show and the app are both kept on this phone (storage worked, and the offline files are installed). */
  ready: boolean;
  /** This phone has the show's recording to play with. */
  music: boolean;
  revision?: number;
  /** The show came from a hosted link, so it can be checked for updates. */
  hosted: boolean;
  /** When this phone last reached the hosted file (ms), if ever. */
  checked?: number;
  check: Check;
  /** "3:42 PM" or "Nov 5", for `checked`. */
  when: (ms: number) => string;
  lang?: Lang;
}

/** The status line's parts, joined with " · " on screen. Empty when there's nothing worth saying. */
export function statusParts(s: StatusIn): string[] {
  const l = s.lang;
  const parts: string[] = [];
  if (s.ready) parts.push(s.music ? tr('Ready offline, with the music', undefined, l) : tr('Ready offline', undefined, l));
  if (s.revision || s.hosted) parts.push(s.revision ? tr('Revision {n}', { n: s.revision }, l) : tr('No revision number', undefined, l));
  if (!s.hosted) return parts;
  const last = s.checked ? tr('last checked {time}', { time: s.when(s.checked) }, l) : tr('never checked', undefined, l);
  if (s.check === 'checking') parts.push(tr('checking for updates…', undefined, l));
  else if (s.check === 'offline') parts.push(tr('Offline: using the copy on this phone ({last})', { last }, l));
  else if (s.check === 'failed') parts.push(tr("Couldn't check for updates: using the copy on this phone ({last})", { last }, l));
  else parts.push(s.checked ? tr('checked for updates {time}', { time: s.when(s.checked) }, l) : tr('not checked for updates yet', undefined, l));
  return parts;
}
