// What goes on printed dot sheets and drill charts (pure data; layout is in Print.tsx).
import { frontToBack, sideToSide } from '../engine/coords';
import { fieldOf, timingOf, label, movementOfSet, setStarts, type Performer, type Show } from '../engine/show';

export const ROWS_PER_CARD = 24; // what fits a quarter-letter card at a readable size
export const ROWS_PER_PAGE = 34; // one sheet per page, at a bigger size, with a notes column
export const ROWS_WITH_PICTURES = 12; // one sheet per page with a small field picture on every set's row

export interface CardRow { index: number; set: string; counts: string; measures: string; side: string; front: string; cue: string }
export interface Card { id: string; label: string; name: string; section: string; part: number; parts: number; rows: CardRow[] }

/** Performers in section order, then by number. */
export function sortedPerformers(show: Show, ids?: Set<string>): Performer[] {
  const order = new Map(show.sections.map((s, i) => [s.id, i]));
  return show.performers
    .filter((p) => !ids || ids.has(p.id))
    .sort((a, b) => (order.get(a.section) ?? 0) - (order.get(b.section) ?? 0) || a.number - b.number);
}

/** "Hold 4, move 12" for a delayed step-off into set i. */
function stepOff(show: Show, i: number, id: string): string {
  if (!i) return '';
  const n = show.sets[i].counts, t = timingOf(show.sets[i], id);
  return t.move < n ? `Hold ${t.wait}, move ${t.move}${n - t.wait - t.move ? `, hold ${n - t.wait - t.move}` : ''}` : '';
}

/** One or more cards per performer (long shows continue onto another card). */
export function dotCards(show: Show, performers: Performer[], perCard = ROWS_PER_CARD, sets: [number, number] = [0, show.sets.length - 1]): Card[] {
  const cards: Card[] = [];
  for (const p of performers) {
    const rows: CardRow[] = show.sets.map((s, i) => ({
      index: i,
      set: s.name,
      counts: i === 0 ? '—' : String(s.counts),
      measures: s.measures ?? '',
      cue: [stepOff(show, i, p.id), s.cues?.[p.id]].filter(Boolean).join(' · '),
      side: sideToSide(s.pos[p.id].x, fieldOf(show)),
      front: frontToBack(s.pos[p.id].y, fieldOf(show)),
    })).slice(sets[0], sets[1] + 1); // a rehearsal packet: just these sets
    const parts = Math.max(1, Math.ceil(rows.length / perCard));
    const section = show.sections.find((s) => s.id === p.section)?.name ?? '';
    for (let k = 0; k < parts; k++) {
      cards.push({ id: p.id, label: label(show, p), name: p.name ?? '', section, part: k + 1, parts, rows: rows.slice(k * perCard, (k + 1) * perCard) });
    }
  }
  return cards;
}

/** Header for set i's chart, e.g. "Set 3 · 16 counts (counts 24–40)". */
export function chartTitle(show: Show, i: number): string {
  const s = show.sets[i];
  const m = s.measures ? ` · m. ${s.measures}` : '';
  const mv = movementOfSet(show, i), pre = mv ? `${mv.name} · ` : ''; // a whole show in one file: which tune this chart is in
  if (i === 0) return `${pre}Set ${s.name} · opening set${m}`;
  const starts = setStarts(show);
  return `${pre}Set ${s.name} · ${s.counts} counts (counts ${starts[i - 1]}–${starts[i]})${m}`;
}

export const chunk = <T,>(xs: T[], n: number): T[][] => Array.from({ length: Math.ceil(xs.length / n) }, (_, k) => xs.slice(k * n, (k + 1) * n));

/** Only print a Measures column if the drill writer has entered any. */
export const hasMeasures = (show: Show) => show.sets.some((s) => s.measures);
