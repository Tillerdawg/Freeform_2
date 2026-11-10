import { describe, expect, it } from 'vitest';
import { cloudUrl, publishCloud, unpublishCloud } from './cloud';

/** A stand-in for the service, answering like services/api does. */
function fakeService() {
  const shows = new Map<string, { body: string; token: string }>(), calls: string[] = [];
  let n = 0;
  const fetcher = (async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname, auth = String((init.headers as Record<string, string>)?.Authorization ?? '').replace('Bearer ', '');
    calls.push(`${init.method} ${path}`);
    const id = path.split('/')[2], s = id ? shows.get(id) : undefined;
    const res = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });
    if (init.method === 'POST') { const nid = `id${++n}`; shows.set(nid, { body: String(init.body), token: `tok${n}` }); return res(201, { id: nid, token: `tok${n}`, url: cloudUrl(nid) }); }
    if (!s) return res(404, { error: 'This show isn’t online anymore.' });
    if (auth !== s.token) return res(403, { error: 'This browser can’t change that show.' });
    if (init.method === 'PUT') { s.body = String(init.body); return res(200, { id }); }
    if (init.method === 'DELETE') { shows.delete(id); return res(204); }
    return res(405);
  }) as unknown as typeof fetch;
  return { shows, calls, fetcher };
}

describe('publishing through FreeFORM’s service', () => {
  it('publishes once, then updates at the same address (the link stays the same)', async () => {
    const svc = fakeService();
    const first = await publishCloud('v1', null, svc.fetcher);
    expect(first).toEqual({ id: 'id1', token: 'tok1', fresh: true });
    const again = await publishCloud('v2', first, svc.fetcher);
    expect(again).toEqual({ id: 'id1', token: 'tok1', fresh: false });
    expect(svc.shows.get('id1')!.body).toBe('v2');
    expect(cloudUrl('id1')).toBe('https://api.freeformdrill.org/shows/id1');
  });
  it('publishes anew when the old one is gone or isn’t this browser’s', async () => {
    const svc = fakeService();
    expect(await publishCloud('v', { id: 'cleaned-up', token: 'x' }, svc.fetcher)).toMatchObject({ id: 'id1', fresh: true });
    expect(await publishCloud('v', { id: 'id1', token: 'wrong' }, svc.fetcher)).toMatchObject({ id: 'id2', fresh: true });
  });
  it('removes a show, and says why when the service turns something down', async () => {
    const svc = fakeService();
    const c = await publishCloud('v', null, svc.fetcher);
    await unpublishCloud(c, svc.fetcher);
    expect(svc.shows.size).toBe(0);
    await unpublishCloud(c, svc.fetcher); // already gone: fine
    const tooBig = (async () => new Response(JSON.stringify({ error: 'That show is too big to publish.' }), { status: 413 })) as unknown as typeof fetch;
    await expect(publishCloud('v', null, tooBig)).rejects.toThrow('too big');
    const offline = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    await expect(publishCloud('v', null, offline)).rejects.toThrow("Couldn't reach FreeFORM's service");
  });
});

describe('moving publishing to another device', async () => {
  const { publishingCode, readPublishingCode, readPublishing } = await import('./cloud');
  const id = 'KFyp3kS7Vc6xYFo0dDPrGw', token = 'ju86AYRqJQaALlfmnqkRCIjpvXiY6wRRvO8ui9dzGiQ', key = 'a9JS5tRnpADy2UmXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  const link = `https://freeformdrill.org/app/#load=${encodeURIComponent(cloudUrl(id))}&key=${key}`;
  it('round-trips a publishing code, even wrapped by an email program', () => {
    const p = { link, cloud: { id, token }, show: { id: 'abc', title: 'Ballad' } };
    const code = publishingCode(p);
    expect(code.startsWith('FREEFORM-PUBLISHING-1.')).toBe(true);
    expect(readPublishingCode(`Here it is:\n${code.slice(0, 40)}\n${code.slice(40)}  `)).toEqual(p);
  });
  it('turns away anything that isn’t one, or a token for a different show', () => {
    expect(readPublishingCode('hello')).toBeNull();
    expect(readPublishingCode('FREEFORM-PUBLISHING-1.not-json')).toBeNull();
    expect(readPublishing({ link: 'https://evil.example/', cloud: { id, token } })).toBeNull();
    expect(readPublishing({ link, cloud: { id: 'BBBBBBBBBBBBBBBBBBBBBB', token } })).toBeNull(); // the token is for another show
    expect(readPublishing({ link })).toEqual({ link }); // a link on GitHub or self-hosted: no token to carry
  });
});
