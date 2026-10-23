// Share links: the whole show packed into the link itself (compressed), so there's no server to run or pay for.
import { parseShow, type Show } from './show';

export const SHARE_PREFIX = '#show=';

const tidy = (_k: string, v: unknown) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v);

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

const toB64url = (b: Uint8Array) => {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

/** The part after "#show=": the show as compressed, URL-safe text. Positions keep 3 decimals (1/1000 step). */
export async function encodeShow(show: Show): Promise<string> {
  return toB64url(await pipe(new TextEncoder().encode(JSON.stringify(show, tidy)), new CompressionStream('deflate-raw')));
}

/** Unpack a share link's payload. Links come from anywhere, so the result goes through the same checks as a file. */
export async function decodeShow(payload: string): Promise<Show> {
  let text: string;
  try {
    text = new TextDecoder().decode(await pipe(fromB64url(payload), new DecompressionStream('deflate-raw')));
  } catch {
    throw new Error('This share link is damaged or incomplete. Ask for the link again.');
  }
  return parseShow(text);
}

// ---- Hosted links: for shows too big for a link or a QR code, the link points at a show file stored online.

export const LOAD_PREFIX = '#load=';
const MAX_BYTES = 10_000_000;

/** A short link that makes the performer view download the show from `fileUrl` (must be https). */
export function hostedLink(base: string, fileUrl: string): string {
  const u = new URL(fileUrl.trim()); // throws on garbage
  if (u.protocol !== 'https:') throw new Error('The show file address must start with https://');
  return base + LOAD_PREFIX + encodeURIComponent(u.href);
}

/** The show file address in a "#load=" hash, or null. */
export function loadUrl(hash: string): string | null {
  if (!hash.startsWith(LOAD_PREFIX)) return null;
  try {
    const u = new URL(decodeURIComponent(hash.slice(LOAD_PREFIX.length)));
    return u.protocol === 'https:' ? u.href : null;
  } catch { return null; }
}

/** Download a hosted show file. It comes from anywhere, so it's size-capped and checked like any file. */
export async function fetchShow(url: string, fetcher: typeof fetch = fetch): Promise<{ show: Show; text: string }> {
  let res: Response;
  try { res = await fetcher(url, { cache: 'no-cache' }); } catch {
    throw new Error("Couldn't download the show. Check your connection, or that the file allows other sites to read it.");
  }
  if (!res.ok) throw new Error(`Couldn't download the show (the server said ${res.status}).`);
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error('That file is too big to be a show.');
  return { show: parseShow(text), text };
}
