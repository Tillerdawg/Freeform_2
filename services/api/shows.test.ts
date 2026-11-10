import { describe, expect, it } from 'vitest';
import { checkLocked, day, hashToken, ID_RE, KEEP_DAYS, MAX_BYTES, newId, newToken, sameHash, stale } from './src/shows';

const locked = (extra: Record<string, unknown> = {}) => JSON.stringify({ format: 'freeform-locked', version: 1, iv: 'abc_-1', data: 'QUJD', ...extra });

describe('the upload service', () => {
  it('stores only locked FreeFORM show files', () => {
    expect(checkLocked(locked())).toBeNull();
    expect(checkLocked(locked({ audio: { iv: 'x', data: 'y', type: 'audio/mpeg' } }))).toBeNull();
    for (const bad of ['not json', '{}', JSON.stringify({ title: 'Opener', sets: [] }), locked({ version: 2 }), locked({ iv: 'has spaces' }),
      locked({ audio: { iv: 'x', data: 'y', type: 'text/html' } }), locked({ note: 'anything else' }), JSON.stringify({ format: 'freeform-locked', version: 1, iv: 'a' })])
      expect(checkLocked(bad), bad.slice(0, 40)).toMatch(/locked FreeFORM show file/);
    expect(checkLocked('x'.repeat(MAX_BYTES + 1))).toMatch(/too big/);
  });
  it('makes ids that can’t be guessed and tokens it keeps only a hash of', async () => {
    const a = newId(), b = newId();
    expect(a).toMatch(ID_RE); expect(a).not.toBe(b);
    const t = newToken(), h = await hashToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(sameHash(await hashToken(t), h)).toBe(true);
    expect(sameHash(await hashToken(newToken()), h)).toBe(false);
    expect(sameHash('abc', 'abcd')).toBe(false);
  });
  it('cleans up a show only after a year with no opens or updates', () => {
    const now = Date.UTC(2027, 10, 10), year = KEEP_DAYS * 86_400_000;
    expect(stale(now, now - year - 1)).toBe(true);
    expect(stale(now, now - year - 1, now - 5 * 86_400_000)).toBe(false); // opened last week
    expect(stale(now, now - 1000)).toBe(false);
    expect(day(Date.UTC(2026, 10, 10, 23))).toBe('2026-11-10');
  });
});
