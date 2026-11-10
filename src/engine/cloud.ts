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
