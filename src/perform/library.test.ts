import { expect, it } from 'vitest';
import { addPerformer, newShow, type Show } from '../engine/show';
import { addShow, MAX_SHOWS, readLibrary, removeShow, STAFF } from './library';

const tune = (title: string): { show: Show; b5: string } => {
  let show: Show = { ...newShow(), title };
  const b = show.sections.find((s) => s.letter === 'B')!.id;
  let b5 = '';
  for (let k = 0; k < 5; k++) { const r = addPerformer(show, b, { x: k, y: 0 }); show = r.show; b5 = r.id; } // ids differ file to file
  return { show, b5 };
};

it('keeps several shows, opens the newest, and starts a new one on my label', () => {
  const opener = tune('Opener'), ballad = tune('Ballad');
  let lib = addShow({ shows: [], current: 0 }, opener.show).lib;
  lib = { ...lib, shows: [{ ...lib.shows[0], me: opener.b5 }] };
  lib = addShow(lib, ballad.show).lib;
  expect(lib.shows.map((s) => s.show.title)).toEqual(['Opener', 'Ballad']);
  expect(lib.current).toBe(1);
  expect(lib.shows[1].me).toBe(ballad.b5); // B5 in the Opener is B5 in the Ballad
});

it('replaces the same show in place and keeps who I am', () => {
  const opener = tune('Opener');
  let lib = addShow({ shows: [], current: 0 }, opener.show, '#load=a').lib;
  lib = addShow({ ...lib, shows: [{ ...lib.shows[0], me: opener.b5 }] }, tune('Ballad').show).lib;
  const r = addShow(lib, { ...opener.show, title: 'Opener (new)' }, '#load=a');
  expect(r.lib.shows.map((s) => s.show.title)).toEqual(['Opener (new)', 'Ballad']);
  expect([r.lib.current, r.lib.shows[0].me, r.replaced?.show.title]).toEqual([0, opener.b5, 'Opener']);
});

it('carries Staff over, drops the oldest past the limit, and removes a show', () => {
  let lib = addShow({ shows: [], current: 0 }, tune('1').show).lib;
  lib = { ...lib, shows: [{ ...lib.shows[0], me: STAFF }] };
  lib = addShow(lib, tune('2').show).lib;
  expect(lib.shows[1].me).toBe(STAFF);
  let dropped;
  for (let k = 3; k <= MAX_SHOWS + 1; k++) ({ lib, dropped } = addShow(lib, tune(String(k)).show));
  expect([lib.shows.length, lib.shows[0].show.title, dropped?.show.title]).toEqual([MAX_SHOWS, '2', '1']);
  const fewer = removeShow({ ...lib, current: 3 }, 1);
  expect([fewer.shows.length, fewer.current]).toEqual([MAX_SHOWS - 1, 2]); // the same show stays open
});

it('reads an older phone that kept one show, and skips one that no longer reads', () => {
  const { show } = tune('Opener');
  expect(readLibrary(JSON.stringify({ show, me: null, facingFront: true, follow: true })).shows.map((s) => [s.show.title, s.facingFront])).toEqual([['Opener', true]]);
  expect(readLibrary(JSON.stringify({ shows: [{ show }, { show: { nope: 1 } }], current: 5 }))).toMatchObject({ current: 0 });
  expect(readLibrary(JSON.stringify({ shows: [{ show }, { show: { nope: 1 } }], current: 5 })).shows).toHaveLength(1);
  expect(readLibrary(null)).toEqual({ shows: [], current: 0 });
});
