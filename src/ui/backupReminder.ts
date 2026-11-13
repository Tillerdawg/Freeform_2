export const DAY = 86_400_000;
export const BACKUP_AGE = 7 * DAY;
export const UNEXPORTED = 'freeform:unexported-since';
export const unexportedKey = (id?: string) => `${UNEXPORTED}:${id}`;

export function readTime(key: string): number | null {
  try {
    const time = Number(localStorage.getItem(key));
    return Number.isFinite(time) && time > 0 ? time : null;
  } catch {
    return null;
  }
}

export function writeTime(key: string, time: number | null) {
  try {
    if (time) localStorage.setItem(key, String(time));
    else localStorage.removeItem(key);
  } catch { /* storage blocked */ }
}

/** Shows with performers are due once their first change since a file save is over a week old. */
export function backupDue(performers: number, unexportedSince: number | null, now = Date.now()): boolean {
  return performers > 0 && unexportedSince !== null && now - unexportedSince > BACKUP_AGE;
}
