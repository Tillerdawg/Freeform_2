// This browser's IndexedDB: the shows' recordings and tracing pictures ('audio', keyed by the id the show keeps), the
// show library ('shows', keyed by show id), and earlier versions ('versions', keyed by [show id, time]). Audio is too big
// for localStorage, and several shows with their versions would be too.

const DB = 'freeform';
export type Store = 'audio' | 'shows' | 'versions';

function db(): Promise<IDBDatabase> {
  return new Promise((ok, fail) => {
    const r = indexedDB.open(DB, 2);
    r.onupgradeneeded = () => { for (const s of ['audio', 'shows', 'versions']) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
    r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); ok(r.result); }; // let a newer version of the app upgrade it
    r.onerror = () => fail(r.error);
  });
}

export async function run<T>(store: Store, mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((ok, fail) => {
    const req = f(d.transaction(store, mode).objectStore(store));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
}

export const putAudio = (id: string, file: Blob) => run('audio', 'readwrite', (s) => s.put(file, id)).then(() => true, () => false);
export const getAudio = (id: string) => run<Blob | undefined>('audio', 'readonly', (s) => s.get(id)).catch(() => undefined);
export const deleteAudio = (id: string) => run('audio', 'readwrite', (s) => s.delete(id)).catch(() => undefined);
