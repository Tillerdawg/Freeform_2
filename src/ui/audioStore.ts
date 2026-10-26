// The show's recording, kept in this browser (IndexedDB): audio is too big for the autosave or the show file.

const DB = 'freeform', STORE = 'audio';

function db(): Promise<IDBDatabase> {
  return new Promise((ok, fail) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(r.error);
  });
}

async function run<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((ok, fail) => {
    const req = f(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
}

export const putAudio = (id: string, file: Blob) => run('readwrite', (s) => s.put(file, id)).then(() => true, () => false);
export const getAudio = (id: string) => run<Blob | undefined>('readonly', (s) => s.get(id)).catch(() => undefined);
export const deleteAudio = (id: string) => run('readwrite', (s) => s.delete(id)).catch(() => undefined);
