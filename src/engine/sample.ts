// The demo show the docs' screenshots are taken from (scripts/screenshots.mjs). Original drill, invented names.
import type { Point } from './coords';
import { assign } from './shapes';
import {
  addProp, placeProp, addPerformer, addSetAfter, newShow, normalizeFtl, placeInSet, setCue, setFtl, setFtlTurns, setMarks, setMeasures, setNames, setNote,
  type Show,
} from './show';

const FIRST = ['Ava', 'Ben', 'Cara', 'Dev', 'Ella', 'Finn', 'Gia', 'Hugo', 'Iris', 'Jude', 'Kai', 'Lena', 'Max', 'Nia', 'Owen', 'Pia'];
const LAST = ['Adams', 'Brooks', 'Chen', 'Diaz', 'Evans', 'Foster', 'Garcia', 'Hayes', 'Ito', 'Jones', 'Kim', 'Lopez', 'Moore', 'Nash', 'Ortiz', 'Patel', 'Reed'];

/** 47 performers, 4 sets: a block, an arc, a company front (guard follow-the-leader with a turn), and a too-fast move. */
export function sampleShow(): Show {
  let show: Show = { ...newShow(), title: 'Sample Show', movements: [{ id: 'mv-opener', name: 'Opener', counts: 64 }] };
  const sec = (letter: string) => show.sections.find((s) => s.letter === letter)!.id;
  const add = (letter: string, n: number) => Array.from({ length: n }, () => {
    const r = addPerformer(show, sec(letter), { x: 0, y: 0 });
    show = r.show;
    return r.id;
  });
  const winds = [...add('F', 4), ...add('K', 4), ...add('A', 4), ...add('P', 6), ...add('H', 4), ...add('N', 4), ...add('E', 2), ...add('T', 2)];
  const battery = [...add('S', 4), ...add('Q', 1), ...add('B', 4), ...add('C', 2)];
  const guard = add('G', 6);
  const all = [...winds, ...battery, ...guard];
  show = setNames(show, Object.fromEntries(all.map((id, k) => [id, `${FIRST[k % FIRST.length]} ${LAST[(k * 7) % LAST.length]}`])));
  for (let i = 0; i < 3; i++) show = addSetAfter(show, i, i === 2 ? 8 : 16);

  const at = (ids: string[], f: (k: number) => Point) => Object.fromEntries(ids.map((id, k) => [id, f(k)]));
  // Who goes to which spot: least total travel from where they are, as the Shape tools do (no crossing paths).
  const near = (i: number, ids: string[], pts: Point[]) => { const slot = assign(ids.map((id) => show.sets[i - 1].pos[id]), pts); return at(ids, (k) => pts[slot[k]]); };
  const block = Array.from({ length: 30 }, (_, k) => ({ x: -10 + (k % 6) * 4, y: 48 - Math.floor(k / 6) * 4 })); // 6 wide, 5 deep, 4-step intervals

  // Set 1: winds in a block between the hashes, battery behind, guard in front.
  show = placeInSet(show, 0, { ...at(winds, (k) => block[k]), ...at(battery, (k) => ({ x: -10 + 2 * k, y: 56 })), ...at(guard, (k) => ({ x: -20 + 8 * k, y: 22 })) });
  // Set 2: an arc opening to the audience; guard spreads across the front.
  const arc = Array.from({ length: 30 }, (_, k) => { const a = ((15 + (150 * k) / 29) * Math.PI) / 180; return { x: Math.round(22 * Math.cos(a) * 4) / 4, y: Math.round((22 + 22 * Math.sin(a)) * 4) / 4 }; });
  show = placeInSet(show, 1, { ...near(1, winds, arc), ...at(battery, (k) => ({ x: -15 + 3 * k, y: 52 })), ...at(guard, (k) => ({ x: -20 + 8 * k, y: 14 })) });
  show = setMeasures(show, 1, '1–4');
  show = setNote(show, 1, 'Horns up on count 13. Guard: flags up on 9.');
  show = setMarks(show, 1, () => [
    { id: 'm-note', kind: 'text', at: { x: 0, y: 6 }, text: 'Horns up ct. 13' },
    { id: 'm-arrow', kind: 'arrow', from: { x: 22, y: 10 }, to: { x: 30, y: 10 } },
  ]);
  show = setCue(show, 1, [winds[12]], 'Bell to the 50 on 13');
  show = setCue(show, 0, guard, 'Flag'); // flags for the opener
  show = setCue(show, 1, guard, 'Face Side 2'); // the guard turns to Side 2, ready for its follow-the-leader into set 3
  // Set 3: company front on the front hash; the guard follows its leader toward Side 2, turning upfield at the 30.
  const lead = guard[5];
  show = placeInSet(show, 2, { ...near(2, winds, Array.from({ length: 30 }, (_, k) => ({ x: -29 + 2 * k, y: 28 }))), ...at(battery, (k) => ({ x: -10 + 2 * k, y: 36 })), [lead]: { x: 32, y: 24 } });
  show = normalizeFtl(setFtlTurns(normalizeFtl(setFtl(show, 2, [lead, ...guard.slice(0, 5).reverse()])), 2, lead, [{ x: 32, y: 14 }]));
  show = setMeasures(show, 2, '5–8');
  // Set 4: back into the block in only 8 counts, too fast on purpose so the step-size warnings show.
  show = placeInSet(show, 3, { ...near(3, winds, block), ...at(battery, (k) => ({ x: -10 + 2 * k, y: 54 })) }); // battery back behind the block
  show = setMeasures(show, 3, '9–10');
  // A platform behind the battery that rolls toward Side 2 and turns for set 3.
  const stage = addProp(show, 'Platform', 12, 4, false, { x: 0, y: 66 });
  show = placeProp(stage.show, 2, stage.id, { x: 24, y: 66, angle: 90 });
  return show;
}
