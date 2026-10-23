import { describe, expect, it } from 'vitest';
import { decodeShow, encodeShow, fetchShow, hostedLink, loadUrl } from './share';
import { qrSvg } from './qr';
import { addPerformer, addSetAfter, newShow, placeInSet, setCue } from './show';

function band(n: number, sets: number) {
  let s = newShow();
  const ids: string[] = [];
  for (let k = 0; k < n; k++) { const r = addPerformer(s, s.sections[k % s.sections.length].id, { x: -40 + (k % 20) * 4, y: 10 + Math.floor(k / 20) * 4 }); s = r.show; ids.push(r.id); }
  for (let j = 1; j < sets; j++) {
    s = addSetAfter(s, j - 1, 16);
    s = placeInSet(s, j, Object.fromEntries(ids.map((id, k) => [id, { x: -40 + ((k + j) % 20) * 4 + Math.sin(j + k) / 3, y: 10 + Math.floor(k / 20) * 4 }])));
  }
  return { s, ids };
}

describe('share links', () => {
  it('round-trips a show (positions kept to 1/1000 step)', async () => {
    let { s, ids } = band(12, 4);
    s = setCue(s, 2, [ids[0]], 'Horns 45');
    const back = await decodeShow(await encodeShow(s));
    expect(back.sets[2].cues).toEqual({ [ids[0]]: 'Horns 45' });
    expect(back.sets[3].pos[ids[5]].x).toBeCloseTo(s.sets[3].pos[ids[5]].x, 3);
    expect(back.performers).toEqual(s.performers);
  });
  it('uses only URL-safe characters', async () => {
    expect(await encodeShow(band(5, 2).s)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it('a real-size show (150 performers, 40 sets) fits in a link', async () => {
    const code = await encodeShow(band(150, 40).s);
    console.log(`150 performers x 40 sets -> ${(code.length / 1024).toFixed(0)} KB link`);
    expect(code.length).toBeLessThan(400_000);
  });
  it('rejects damaged links and links that are not shows', async () => {
    await expect(decodeShow('not-a-real-link')).rejects.toThrow(/damaged/);
    const good = await encodeShow(band(3, 2).s);
    await expect(decodeShow(good.slice(0, good.length / 2))).rejects.toThrow();
  });
});

describe('hosted links', () => {
  const gist = 'https://gist.githubusercontent.com/someone/abc123/raw/opener.freeform.json';
  it('builds a short link to a hosted file and reads it back', () => {
    const link = hostedLink('https://example.org/Freeform_2/', gist);
    expect(link.length).toBeLessThan(200);
    expect(loadUrl(link.slice(link.indexOf('#')))).toBe(gist);
  });
  it('only accepts https addresses', () => {
    expect(() => hostedLink('x/', 'http://example.org/show.json')).toThrow(/https/);
    expect(() => hostedLink('x/', 'not a url')).toThrow();
    expect(loadUrl('#load=' + encodeURIComponent('javascript:alert(1)'))).toBeNull();
    expect(loadUrl('#show=abc')).toBeNull();
  });
  it('downloads and checks the file', async () => {
    const show = band(4, 2).s;
    const ok = (body: string, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch;
    expect((await fetchShow(gist, ok(JSON.stringify(show)))).show.performers).toEqual(show.performers);
    await expect(fetchShow(gist, ok('{"not":"a show"}'))).rejects.toThrow(/Not a valid Freeform show/);
    await expect(fetchShow(gist, ok('', 404))).rejects.toThrow(/404/);
    const down = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    await expect(fetchShow(gist, down)).rejects.toThrow(/allows other sites/);
  });
});

describe('QR codes', () => {
  it('fits short links and says when a link is too long', async () => {
    expect(qrSvg('https://tillerdawg.github.io/Freeform_2/#load=' + encodeURIComponent('https://gist.githubusercontent.com/a/b/raw/c.json'))).toMatch(/^<svg/);
    expect(qrSvg('x'.repeat(3500))).toBeNull();
    const big = await encodeShow(band(150, 40).s);
    expect(qrSvg('https://x/#show=' + big)).toBeNull();
  });
});
