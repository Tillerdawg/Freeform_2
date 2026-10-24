import { describe, expect, it } from 'vitest';
import { decodeShow, encodeShow, fetchShow, hostedLink, linkHash, lockShow, newKey, parseHosted } from './share';
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
  const key = newKey();
  const hashOf = (link: string) => link.slice(link.indexOf('#'));
  const serve = (body: string, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch;
  it('builds a short link to a hosted file and reads it back', () => {
    const link = hostedLink('https://example.org/Freeform_2/', gist, key);
    expect(link.length).toBeLessThan(250);
    expect(parseHosted(hashOf(link))).toEqual({ url: gist, key });
    expect(parseHosted('#load=' + encodeURIComponent(gist))).toEqual({ url: gist, key: null });
  });
  it('only accepts https addresses and real keys', () => {
    expect(() => hostedLink('x/', 'http://example.org/show.json', key)).toThrow(/https/);
    expect(() => hostedLink('x/', 'not a url', key)).toThrow();
    expect(() => hostedLink('x/', gist, 'short')).toThrow();
    expect(parseHosted('#load=' + encodeURIComponent('javascript:alert(1)'))).toBeNull();
    expect(parseHosted('#load=' + encodeURIComponent(gist) + '&key=nope')).toBeNull();
    expect(parseHosted('#show=abc')).toBeNull();
  });
  it('locks the show so the file alone reveals nothing, and the link opens it', async () => {
    const show = band(4, 2).s;
    const file = await lockShow(show, key);
    expect(file).not.toContain(show.title);
    expect(file).not.toContain('performers');
    const link = hashOf(hostedLink('x/', gist, key));
    expect((await fetchShow(link, serve(file))).performers).toEqual(show.performers);
    expect(await lockShow(show, key)).not.toBe(file); // fresh nonce every time, same key
    await expect(fetchShow(hashOf(hostedLink('x/', gist, newKey())), serve(file))).rejects.toThrow(/key doesn't open/);
    await expect(fetchShow('#load=' + encodeURIComponent(gist), serve(file))).rejects.toThrow(/missing its key/);
    const tampered = JSON.stringify({ ...JSON.parse(file), data: JSON.parse(file).data.replace(/^./, (c: string) => (c === 'A' ? 'B' : 'A')) });
    await expect(fetchShow(link, serve(tampered))).rejects.toThrow(/key doesn't open/);
  });
  it('downloads and checks the file', async () => {
    const show = band(4, 2).s;
    const link = '#load=' + encodeURIComponent(gist);
    expect((await fetchShow(link, serve(JSON.stringify(show)))).performers).toEqual(show.performers); // unlocked files still open
    await expect(fetchShow(link, serve('{"not":"a show"}'))).rejects.toThrow(/Not a valid Freeform show/);
    await expect(fetchShow(link, serve('', 404))).rejects.toThrow(/404/);
    const down = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    await expect(fetchShow(link, down)).rejects.toThrow(/allows other sites/);
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

describe('finding a link in text', () => {
  it('pulls the Freeform part out of a message or QR code', () => {
    expect(linkHash('Drill is up! https://x.io/app/#load=https%3A%2F%2Fg.io%2Fs.json see you')).toBe('#load=https%3A%2F%2Fg.io%2Fs.json');
    expect(linkHash('https://x.io/#show=abc_-123')).toBe('#show=abc_-123');
    expect(linkHash('https://example.com/menu')).toBeNull();
    expect(linkHash('#perform')).toBeNull();
  });
});
