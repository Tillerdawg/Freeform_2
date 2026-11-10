// Publish to phones through FreeFORM's own service (services/api, api.freeformdrill.org): no account, no setup.
// What's uploaded is the locked show file, already encrypted in this browser; the key stays in the link (after the #),
// which browsers never send to any server. The service keeps an edit token so only this browser can update or remove it.

export const API = 'https://api.freeformdrill.org';
export interface CloudShow { id: string; token: string }

/** The address phones download a published show from. */
export const cloudUrl = (id: string) => `${API}/shows/${id}`;

async function call(path: string, init: RequestInit, fetcher: typeof fetch): Promise<Response> {
  try { return await fetcher(API + path, init); } catch { throw new Error("Couldn't reach FreeFORM's service. Check your connection and try again."); }
}
async function why(r: Response): Promise<string> {
  const msg = await r.json().then((j) => (typeof j?.error === 'string' ? j.error : ''), () => '');
  return msg || `FreeFORM's service said ${r.status}.`;
}

/**
 * Upload `locked` (from lockShow): a new show the first time, or an update when this browser published it before
 * (`prev`). If the service no longer has it or won't let this browser change it, it's published as a new show.
 * Returns the id and token to keep, and `fresh` when the address (and so the link) is new.
 */
export async function publishCloud(locked: string, prev: CloudShow | null, fetcher: typeof fetch = fetch): Promise<CloudShow & { fresh: boolean }> {
  const body = { body: locked, headers: { 'Content-Type': 'application/json' } };
  if (prev) {
    const r = await call(`/shows/${prev.id}`, { method: 'PUT', ...body, headers: { ...body.headers, Authorization: `Bearer ${prev.token}` } }, fetcher);
    if (r.ok) return { ...prev, fresh: false };
    if (r.status !== 404 && r.status !== 403) throw new Error(await why(r)); // gone (cleaned up or removed) or not ours: publish anew
  }
  const r = await call('/shows', { method: 'POST', ...body }, fetcher);
  if (!r.ok) throw new Error(await why(r));
  const j = await r.json();
  return { id: j.id, token: j.token, fresh: true };
}

/** Take a published show off the service: its link stops working (phones keep the copy they have). */
export async function unpublishCloud(c: CloudShow, fetcher: typeof fetch = fetch): Promise<void> {
  const r = await call(`/shows/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${c.token}` } }, fetcher);
  if (!r.ok && r.status !== 404) throw new Error(await why(r));
}

/**
 * Everything a browser needs to keep publishing a show to the same link: the link (with its key) and, for a show on
 * FreeFORM's service, its id and edit token. Carried by Full backup files and by a publishing code, so a director who
 * moves to a new computer mid-season keeps the link students already have. Like the link, it's a password.
 */
export interface Publishing { link: string; cloud?: CloudShow; show?: { id?: string; title?: string } }

const PREFIX = 'FREEFORM-PUBLISHING-1.';
const ID_RE = /^[A-Za-z0-9_-]{22}$/, TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const b64url = (t: string) => { let bin = ''; for (const b of new TextEncoder().encode(t)) bin += String.fromCharCode(b); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64url = (t: string) => new TextDecoder().decode(Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

/** Checked publishing info from a file or code (they come from outside), or null. The link must be a hosted (#load=) link with a key. */
export function readPublishing(x: unknown): Publishing | null {
  const p = x as Publishing;
  if (!p || typeof p !== 'object' || typeof p.link !== 'string' || p.link.length > 2000 || !/^(https:\/\/[^\s#]+|http:\/\/localhost(:\d+)?\/[^\s#]*)#load=[^\s&]+&key=[A-Za-z0-9_-]{43}$/.test(p.link)) return null; // the app's address (localhost while developing)
  const cloud = p.cloud && typeof p.cloud === 'object' && ID_RE.test(p.cloud.id) && TOKEN_RE.test(p.cloud.token) ? { id: p.cloud.id, token: p.cloud.token } : undefined;
  if (p.cloud !== undefined && !cloud) return null;
  if (cloud && !p.link.includes(encodeURIComponent(cloudUrl(cloud.id)))) return null; // the token must belong to the link's show
  const show = p.show && typeof p.show === 'object' ? { id: typeof p.show.id === 'string' ? p.show.id.slice(0, 64) : undefined, title: typeof p.show.title === 'string' ? p.show.title.slice(0, 200) : undefined } : undefined;
  return { link: p.link, ...(cloud ? { cloud } : {}), ...(show ? { show } : {}) };
}

/** The publishing code to copy to another device. */
export const publishingCode = (p: Publishing) => PREFIX + b64url(JSON.stringify(p));

/** A pasted publishing code (spaces and line breaks from an email are fine), or null if it isn't one. */
export function readPublishingCode(text: string): Publishing | null {
  const m = text.replace(/\s+/g, '').match(/FREEFORM-PUBLISHING-1\.([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try { return readPublishing(JSON.parse(unb64url(m[1]))); } catch { return null; }
}
