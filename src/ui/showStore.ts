// The show library and version history, in this browser's IndexedDB (see audioStore). The open show is also in
// localStorage (App's AUTOSAVE), written on every change; this copy follows a moment later.
import { parseShow, type Show } from '../engine/show';
import { versionDue, versionsToDrop } from '../engine/versions';
import { deleteAudio, run } from './audioStore';

/** The open show, in localStorage. Here, not in App, so the phone's performer view can read it without loading the editor. */
export const AUTOSAVE = 'freeform:autosave';

/** A kept show or version: the show as text, and enough to list it without reading it. */
export interface Entry { json: string; title: string; at: number; performers: number; sets: number }
export type Listed = Omit<Entry, 'json'> & { id: string };

const entry = (show: Show, at: number, json = JSON.stringify(show)): Entry => ({ json, title: show.title, at, performers: show.performers.length, sets: show.sets.length });
const range = (id: string) => IDBKeyRange.bound([id, 0], [id, Infinity]);
const versionTimes = (id: string) => run<IDBValidKey[]>('versions', 'readonly', (s) => s.getAllKeys(range(id))).then((ks) => ks.map((k) => (k as [string, number])[1]));

async function pruneVersions(id: string, times: number[], now: number) {
  for (const t of versionsToDrop(times, now)) await run('versions', 'readwrite', (s) => s.delete([id, t]));
}

/**
 * Keep the show (it must have an id) in the library. Before writing over the copy already kept, that copy becomes a
 * version if the last version is VERSION_EVERY older. False if the browser refused.
 */
export async function keepShow(show: Show, now = Date.now()): Promise<boolean> {
  try {
    const id = show.id!, json = JSON.stringify(show);
    const old = await run<Entry | undefined>('shows', 'readonly', (s) => s.get(id));
    if (old?.json === json) return true;
    if (old) {
      const times = await versionTimes(id);
      if (versionDue(old.at, times.length ? Math.max(...times) : undefined)) {
        await run('versions', 'readwrite', (s) => s.put(old, [id, old.at]));
        await pruneVersions(id, [...times, old.at], now);
      }
    }
    await run('shows', 'readwrite', (s) => s.put(entry(show, now, json), id));
    return true;
  } catch { return false; }
}

/** Keep the show as it is now as a version, whenever it was last kept (before a version is restored over it). */
export async function addVersion(show: Show, now = Date.now()): Promise<boolean> {
  try {
    const id = show.id!;
    await run('versions', 'readwrite', (s) => s.put(entry(show, now), [id, now]));
    await pruneVersions(id, await versionTimes(id), now);
    return true;
  } catch { return false; }
}

/** The library, most recently changed first. */
export async function listShows(): Promise<Listed[]> {
  const [keys, vals] = await Promise.all([run<IDBValidKey[]>('shows', 'readonly', (s) => s.getAllKeys()), run<Entry[]>('shows', 'readonly', (s) => s.getAll())]);
  return vals.map(({ json: _, ...e }, i) => ({ ...e, id: String(keys[i]) })).sort((a, b) => b.at - a.at);
}

/** A kept show, read like a file (throws if it no longer reads). */
export async function loadShow(id: string): Promise<Show> {
  const e = await run<Entry | undefined>('shows', 'readonly', (s) => s.get(id));
  if (!e) throw new Error('That show is no longer in this browser.');
  return { ...parseShow(e.json), id };
}

/** A show's versions, newest first. */
export async function listVersions(id: string): Promise<Entry[]> {
  const vals = await run<Entry[]>('versions', 'readonly', (s) => s.getAll(range(id)));
  return vals.sort((a, b) => b.at - a.at);
}

/** Take a show and its versions out of the library, and its recording and picture unless another kept show uses them. */
export async function forgetShow(id: string): Promise<void> {
  const gone = await loadShow(id).catch(() => null);
  await run('shows', 'readwrite', (s) => s.delete(id));
  await run('versions', 'readwrite', (s) => s.delete(range(id)));
  if (!gone) return;
  const others = await Promise.all((await listShows()).map((x) => loadShow(x.id).catch(() => null)));
  for (const blob of [gone.music?.audioId, gone.trace?.id]) {
    if (blob && !others.some((o) => o?.music?.audioId === blob || o?.trace?.id === blob)) await deleteAudio(blob);
  }
}
