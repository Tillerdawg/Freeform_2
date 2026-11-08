// The shows kept on a phone: a short list (Opener, Ballad, Drum Feature, Closer…) and which one is open.
import { parseHosted } from '../engine/share';
import { label, parseShow, type Show } from '../engine/show';

export const STAFF = 'staff';
export const MAX_SHOWS = 12;

/** `source`: the hosted link ("#load=…", with its key) a show came from, so the phone can pick up updates when online. */
export interface Saved { show: Show; me: string | null; facingFront: boolean; follow: boolean; source?: string; checked?: number } // checked: when a hosted show last reached its file
export interface Library { shows: Saved[]; current: number }

const toSaved = (s: Record<string, unknown>): Saved => ({
  show: parseShow(JSON.stringify(s.show)), me: typeof s.me === 'string' ? s.me : null, facingFront: !!s.facingFront, follow: s.follow !== false,
  source: typeof s.source === 'string' && parseHosted(s.source) ? s.source : undefined,
  ...(typeof s.checked === 'number' && s.checked > 0 ? { checked: s.checked } : {}),
});

/** The library from storage. A phone from before the library kept one show (the saved object itself); a show that no longer reads is skipped. */
export function readLibrary(raw: string | null): Library {
  try {
    const s = raw ? JSON.parse(raw) : null;
    const list: Record<string, unknown>[] = Array.isArray(s?.shows) ? s.shows : s?.show ? [s] : [];
    const shows = list.flatMap((x) => { try { return [toSaved(x)]; } catch { return []; } }).slice(0, MAX_SHOWS);
    const current = Number.isInteger(s?.current) ? Math.min(Math.max(0, s.current), shows.length - 1) : 0;
    return { shows, current: Math.max(0, current) };
  } catch { return { shows: [], current: 0 }; }
}

/**
 * Add an arriving show and open it. The same show again (the same hosted link, or a share link of the same show: the same
 * id, or for shows from before ids, the same title) is
 * replaced in place and keeps who I am. A new show starts on the performer with my label in the show I had open (B5 in
 * the Opener is B5 in the Ballad), or on Staff if I was staff. Past MAX_SHOWS, the oldest goes. Returns what was replaced
 * or dropped, so the phone can tidy their recordings.
 */
export function addShow(lib: Library, show: Show, source?: string): { lib: Library; replaced?: Saved; dropped?: Saved } {
  const same = (s: Show) => (s.id && show.id ? s.id === show.id : s.title === show.title);
  const at = lib.shows.findIndex((s) => (source ? s.source === source : !s.source && same(s.show)));
  const old = at >= 0 ? lib.shows[at] : undefined, cur = lib.shows[lib.current];
  const has = (id: string | null | undefined) => !!id && (id === STAFF || show.performers.some((p) => p.id === id));
  let me: string | null = null;
  if (old && has(old.me)) me = old.me;
  else if (cur?.me === STAFF) me = STAFF;
  else if (cur?.me) {
    const mine = cur.show.performers.find((p) => p.id === cur.me);
    me = (mine && show.performers.find((p) => label(show, p) === label(cur.show, mine))?.id) ?? null;
  }
  const like = old ?? cur;
  const entry: Saved = { show, me, facingFront: like?.facingFront ?? false, follow: like?.follow ?? true, ...(source ? { source } : {}) };
  if (old) return { lib: { shows: lib.shows.map((s, i) => (i === at ? entry : s)), current: at }, replaced: old };
  const shows = [...lib.shows, entry], dropped = shows.length > MAX_SHOWS ? shows.shift() : undefined;
  return { lib: { shows, current: shows.length - 1 }, dropped };
}

/** Take a show off the phone; the one open moves to a neighbor. */
export function removeShow(lib: Library, i: number): Library {
  const shows = lib.shows.filter((_, j) => j !== i);
  return { shows, current: Math.max(0, Math.min(lib.current > i ? lib.current - 1 : lib.current, shows.length - 1)) };
}
