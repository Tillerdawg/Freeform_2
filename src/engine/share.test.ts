import { describe, expect, it } from 'vitest';
import { decodeShow, encodeShow } from './share';
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
