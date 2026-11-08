// Version history: which earlier copies of a show to keep. Times are milliseconds (Date.now()).

export const VERSION_EVERY = 10 * 60_000; // at most one automatic version per 10 minutes of editing
export const RECENT = 20; // the newest versions, kept whatever their age
export const DAILY_DAYS = 60; // and the last version of each day, this many days back

/** Whether the stored copy (saved at `storedAt`) should become a version before it's written over. */
export const versionDue = (storedAt: number, lastVersionAt: number | undefined) => lastVersionAt === undefined || storedAt - lastVersionAt >= VERSION_EVERY;

const day = (t: number) => new Date(t).toDateString(); // the director's own calendar day

/** The version times to delete: everything except the newest RECENT, and the newest of each day in the last DAILY_DAYS. */
export function versionsToDrop(times: number[], now: number): number[] {
  const newest = [...times].sort((a, b) => b - a);
  const keep = new Set(newest.slice(0, RECENT)), days = new Set<string>();
  for (const t of newest) {
    if (now - t > DAILY_DAYS * 86_400_000 || days.has(day(t))) continue;
    days.add(day(t)); keep.add(t);
  }
  return newest.filter((t) => !keep.has(t));
}
