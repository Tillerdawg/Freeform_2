import { expect, it } from 'vitest';
import guide from '../../docs/HOW-TO.md?raw';
import readme from '../../README.md?raw';

// The docs' pictures: every image the guide and README use exists, and every screenshot is used somewhere.
const shots = Object.keys(import.meta.glob('../../docs/img/*.png')).map((k) => k.replace('../../', ''));

it('docs and screenshots match', () => {
  const pics = (text: string, dir: string) => [...text.matchAll(/!\[[^\]]*\]\(([^)]+\.png)\)/g)].map((m) => dir + m[1]);
  const used = [...pics(guide, 'docs/'), ...pics(readme, '')];
  expect(used.filter((p) => !shots.includes(p))).toEqual([]);
  expect(shots.filter((f) => !used.includes(f))).toEqual([]);
  const heads = [...guide.matchAll(/^#{2,3} (.+)$/gm)].map((m) => m[1].toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-'));
  const anchors = [...guide.matchAll(/\]\(#([a-z0-9-]+)\)/g)].map((m) => m[1]);
  expect(anchors.filter((a) => !heads.includes(a))).toEqual([]); // the guide's contents links all land
});
