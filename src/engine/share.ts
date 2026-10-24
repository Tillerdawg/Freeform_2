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

// Locked files: the show is encrypted in the browser (AES-GCM) before it's uploaded, and the key travels only in the
// link's "#" part, which browsers never send to any server. The host stores ciphertext; the link is the password.
const LOCKED = 'freeform-locked';
const KEY_RE = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url

const importKey = (key: string) => crypto.subtle.importKey('raw', fromB64url(key), 'AES-GCM', false, ['encrypt', 'decrypt']);

export const newKey = () => toB64url(crypto.getRandomValues(new Uint8Array(32)));

/** The file to upload: the show compressed, then encrypted with `key`. Same key = same link, so phones pick up updates. */
export async function lockShow(show: Show, key: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(show, tidy)), new CompressionStream('deflate-raw'));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importKey(key), packed));
  return JSON.stringify({ format: LOCKED, version: 1, iv: toB64url(iv), data: toB64url(data) });
}

async function unlockShow(text: string, key: string | null): Promise<Show> {
  let f: { format?: unknown; iv?: unknown; data?: unknown };
  try { f = JSON.parse(text); } catch { return parseShow(text); } // parseShow gives the usual "not a show file" message
  if (f?.format !== LOCKED) return parseShow(text); // an unlocked show file still works
  if (!key) throw new Error('This link is missing its key. Ask for the link again.');
  if (typeof f.iv !== 'string' || typeof f.data !== 'string') throw new Error('That show file is damaged.');
  let packed: Uint8Array<ArrayBuffer>;
  try {
    packed = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64url(f.iv) }, await importKey(key), fromB64url(f.data)));
  } catch {
    throw new Error("This link's key doesn't open the show file. Ask for the link again.");
  }
  return parseShow(new TextDecoder().decode(await pipe(packed, new DecompressionStream('deflate-raw'))));
}

/** A short link that makes the performer view download the show file at `fileUrl` (https) and unlock it with `key`. */
export function hostedLink(base: string, fileUrl: string, key: string): string {
  const u = new URL(fileUrl.trim()); // throws on garbage
  if (u.protocol !== 'https:') throw new Error('The show file address must start with https://');
  if (!KEY_RE.test(key)) throw new Error('Bad key.');
  return base + LOAD_PREFIX + encodeURIComponent(u.href) + '&key=' + key;
}

/** The file address and key in a "#load=…" hash (key null for an unlocked file), or null if it isn't one. */
export function parseHosted(hash: string): { url: string; key: string | null } | null {
  if (!hash.startsWith(LOAD_PREFIX)) return null;
  const [enc, ...rest] = hash.slice(LOAD_PREFIX.length).split('&'); // encodeURIComponent leaves no raw "&" in the address
  const key = rest.find((x) => x.startsWith('key='))?.slice(4) ?? null;
  if (key !== null && !KEY_RE.test(key)) return null;
  try {
    const u = new URL(decodeURIComponent(enc));
    return u.protocol === 'https:' ? { url: u.href, key } : null;
  } catch { return null; }
}

/** Download and unlock a hosted show. It comes from anywhere, so it's size-capped and checked like any file. */
export async function fetchShow(hash: string, fetcher: typeof fetch = fetch): Promise<Show> {
  const h = parseHosted(hash);
  if (!h) throw new Error('This link is damaged or incomplete. Ask for the link again.');
  let res: Response;
  try { res = await fetcher(h.url, { cache: 'no-cache' }); } catch {
    throw new Error("Couldn't download the show. Check your connection, or that the file allows other sites to read it.");
  }
  if (!res.ok) throw new Error(`Couldn't download the show (the server said ${res.status}).`);
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error('That file is too big to be a show.');
  return unlockShow(text, h.key);
}

/** The Freeform part ("#show=…" or "#load=…") of a pasted message or scanned QR code, or null. */
export function linkHash(text: string): string | null {
  const m = text.match(/#(show|load)=\S+/);
  return m ? m[0] : null;
}
