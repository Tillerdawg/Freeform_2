// The upload service's rules, pure so they're unit-tested (shows.test.ts): what a stored show file may be, the ids and
// edit tokens, and which shows are old enough to clean up.

export const MAX_BYTES = 24 * 1024 * 1024; // under Workers KV's 25 MiB per value: a show and a long recording fit
export const KEEP_DAYS = 365; // a show nobody has opened or updated for a year is deleted
const B64URL = /^[A-Za-z0-9_-]+$/;
const AUDIO_TYPE = /^audio\/[\w.+-]{1,40}$/;

/**
 * Only locked FreeFORM show files (encrypted in the director's browser) are stored: the right shape and nothing else,
 * so the service can't be used to host arbitrary files. It can't check what's inside: it can't decrypt them.
 */
export function checkLocked(text: string): string | null {
  if (text.length > MAX_BYTES) return 'That show is too big to publish (the limit is 24 MB). Try it without the music.';
  let f: Record<string, unknown>;
  try { f = JSON.parse(text); } catch { return 'That isn’t a locked FreeFORM show file.'; }
  if (!f || typeof f !== 'object' || f.format !== 'freeform-locked' || f.version !== 1) return 'That isn’t a locked FreeFORM show file.';
  const sealed = (x: unknown) => !!x && typeof x === 'object' && typeof (x as Record<string, unknown>).iv === 'string' && B64URL.test((x as Record<string, string>).iv)
    && typeof (x as Record<string, unknown>).data === 'string' && B64URL.test((x as Record<string, string>).data);
  if (!sealed(f)) return 'That isn’t a locked FreeFORM show file.';
  if (f.audio !== undefined && !(sealed(f.audio) && typeof (f.audio as Record<string, unknown>).type === 'string' && AUDIO_TYPE.test((f.audio as Record<string, string>).type))) return 'That isn’t a locked FreeFORM show file.';
  if (Object.keys(f).some((k) => !['format', 'version', 'iv', 'data', 'audio'].includes(k))) return 'That isn’t a locked FreeFORM show file.';
  return null;
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/** A show's id: 16 random bytes, so ids can't be guessed or listed. */
export const newId = () => b64url(crypto.getRandomValues(new Uint8Array(16)));
/** The secret the director's browser keeps to update or remove its show. Only its hash is stored. */
export const newToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
export const ID_RE = /^[A-Za-z0-9_-]{22}$/;

export async function hashToken(token: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
  return [...d].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Same length, every character compared, so the time taken doesn't hint at how much of a guess was right. */
export function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Whether a show last updated at `updated` and last opened at `seen` (ms, or undefined) has gone unused long enough to delete. */
export const stale = (now: number, updated: number, seen?: number) => now - Math.max(updated, seen ?? 0) > KEEP_DAYS * 86_400_000;

/** "2026-11-10": the day a show was opened, kept at most once a day (KV allows only so many writes). */
export const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
