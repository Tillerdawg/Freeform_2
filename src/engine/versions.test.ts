import { describe, expect, it } from 'vitest';
import { DAILY_DAYS, RECENT, VERSION_EVERY, versionDue, versionsToDrop } from './versions';

const noon = (daysAgo: number, now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12).getTime();

describe('versions', () => {
  it('takes a version at most every VERSION_EVERY', () => {
    expect(versionDue(1000, undefined)).toBe(true);
    expect(versionDue(VERSION_EVERY - 1, 0)).toBe(false);
    expect(versionDue(VERSION_EVERY, 0)).toBe(true);
  });
  it('keeps everything while there are few', () => {
    const now = Date.now();
    expect(versionsToDrop([now - 3, now - 2, now - 1], now)).toEqual([]);
  });
  it('keeps the newest RECENT, then one per day', () => {
    const now = new Date(2026, 10, 8, 18), t = now.getTime();
    const today = Array.from({ length: RECENT + 5 }, (_, i) => noon(0, now) - i * 60_000); // 25 today
    const yesterday = [noon(1, now), noon(1, now) - 60_000]; // two yesterday: keep the later one
    const drop = versionsToDrop([...today, ...yesterday], t);
    expect(drop).toEqual([...today.slice(RECENT), yesterday[1]]);
  });
  it('lets daily versions go after DAILY_DAYS', () => {
    const now = new Date(2026, 10, 8, 18), t = now.getTime();
    const recent = Array.from({ length: RECENT }, (_, i) => t - i * 1000);
    const old = noon(DAILY_DAYS + 1, now), kept = noon(DAILY_DAYS - 1, now);
    expect(versionsToDrop([...recent, old, kept], t)).toEqual([old]);
  });
});
