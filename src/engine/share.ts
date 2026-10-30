// Share links: the whole show packed into the link itself (compressed), so there's no server to run or pay for.
import { parseShow, withoutNames, type Show } from './show';

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
  // Names stay out of plain links (anyone with the link can read it); the encrypted hosted file keeps them.
  return toB64url(await pipe(new TextEncoder().encode(JSON.stringify(withoutNames(show), tidy)), new CompressionStream('deflate-raw')));
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
const MAX_BYTES = 40_000_000; // a show with its recording (a 4-minute mp3 is ~6 MB, ~8 MB as text)
const MAX_AUDIO = 25_000_000;

// Locked files: the show is encrypted in the browser (AES-GCM) before it's uploaded, and the key travels only in the
// link's "#" part, which browsers never send to any server. The host stores ciphertext; the link is the password.
const LOCKED = 'freeform-locked';
const KEY_RE = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url

const importKey = (key: string) => crypto.subtle.importKey('raw', fromB64url(key), 'AES-GCM', false, ['encrypt', 'decrypt']);

export const newKey = () => toB64url(crypto.getRandomValues(new Uint8Array(32)));

async function seal(bytes: Uint8Array<ArrayBuffer>, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // a fresh nonce for each part
  return { iv: toB64url(iv), data: toB64url(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes))) };
}

/**
 * The file to upload: the show compressed, then encrypted with `key`. Same key = same link, so phones pick up updates.
 * `audio`: the show's recording, encrypted with the same key, so phones can play along (the show's taps place the counts).
 */
export async function lockShow(show: Show, key: string, audio?: Blob): Promise<string> {
  const k = await importKey(key);
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(show, tidy)), new CompressionStream('deflate-raw'));
  const music = audio && show.music ? { ...(await seal(new Uint8Array(await audio.arrayBuffer()), k)), type: audio.type } : undefined;
  return JSON.stringify({ format: LOCKED, version: 1, ...(await seal(packed, k)), ...(music ? { audio: music } : {}) });
}

const AUDIO_TYPE = /^audio\/[\w.+-]{1,40}$/;

async function unlockShow(text: string, key: string | null): Promise<Hosted> {
  let f: { format?: unknown; iv?: unknown; data?: unknown; audio?: { iv?: unknown; data?: unknown; type?: unknown } };
  try { f = JSON.parse(text); } catch { return { show: parseShow(text) }; } // parseShow gives the usual "not a show file" message
  if (f?.format !== LOCKED) return { show: parseShow(text) }; // an unlocked show file still works
  if (!key) throw new Error('This link is missing its key. Ask for the link again.');
  if (typeof f.iv !== 'string' || typeof f.data !== 'string') throw new Error('That show file is damaged.');
  const k = await importKey(key);
  const open = async (iv: string, data: string) => {
    try { return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64url(iv) }, k, fromB64url(data))); } catch {
      throw new Error("This link's key doesn't open the show file. Ask for the link again.");
    }
  };
  const show = parseShow(new TextDecoder().decode(await pipe(await open(f.iv, f.data), new DecompressionStream('deflate-raw'))));
  const a = f.audio;
  if (a === undefined || !show.music) return { show };
  if (!a || typeof a.iv !== 'string' || typeof a.data !== 'string' || typeof a.type !== 'string' || !AUDIO_TYPE.test(a.type)) throw new Error('That show file is damaged.');
  const bytes = await open(a.iv, a.data);
  if (bytes.length > MAX_AUDIO) throw new Error('The recording in that file is too big.');
  return { show, audio: new Blob([bytes], { type: a.type }) };
}

/** A hosted show and, if the director included it, its recording. */
export interface Hosted { show: Show; audio?: Blob }

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

/** Download and unlock a hosted show (and its recording, if included). It comes from anywhere, so it's size-capped and checked like any file. */
export async function fetchHosted(hash: string, fetcher: typeof fetch = fetch): Promise<Hosted> {
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

export const fetchShow = (hash: string, fetcher: typeof fetch = fetch) => fetchHosted(hash, fetcher).then((r) => r.show);

/** The Freeform part ("#show=…" or "#load=…") of a pasted message or scanned QR code, or null. */
export function linkHash(text: string): string | null {
  const m = text.match(/#(show|load)=\S+/);
  return m ? m[0] : null;
}
