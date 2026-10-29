// What goes on printed dot sheets and drill charts (pure data; layout is in Print.tsx).
import { frontToBack, sideToSide } from '../engine/coords';
import { label, setStarts, type Performer, type Show } from '../engine/show';

export const ROWS_PER_CARD = 24; // what fits a quarter-letter card at a readable size

export interface CardRow { set: string; counts: string; measures: string; side: string; front: string; cue: string }
export interface Card { label: string; name: string; section: string; part: number; parts: number; rows: CardRow[] }

/** Performers in section order, then by number. */
export function sortedPerformers(show: Show, ids?: Set<string>): Performer[] {
  const order = new Map(show.sections.map((s, i) => [s.id, i]));
  return show.performers
    .filter((p) => !ids || ids.has(p.id))
    .sort((a, b) => (order.get(a.section) ?? 0) - (order.get(b.section) ?? 0) || a.number - b.number);
}

/** One or more cards per performer (long shows continue onto another card). */
export function dotCards(show: Show, performers: Performer[]): Card[] {
  const cards: Card[] = [];
  for (const p of performers) {
    const rows: CardRow[] = show.sets.map((s, i) => ({
      set: s.name,
      counts: i === 0 ? '—' : String(s.counts),
      measures: s.measures ?? '',
      cue: s.cues?.[p.id] ?? '',
      side: sideToSide(s.pos[p.id].x),
      front: frontToBack(s.pos[p.id].y, show.hash),
    }));
    const parts = Math.max(1, Math.ceil(rows.length / ROWS_PER_CARD));
    const section = show.sections.find((s) => s.id === p.section)?.name ?? '';
    for (let k = 0; k < parts; k++) {
      cards.push({ label: label(show, p), name: p.name ?? '', section, part: k + 1, parts, rows: rows.slice(k * ROWS_PER_CARD, (k + 1) * ROWS_PER_CARD) });
    }
  }
  return cards;
}

/** Header for set i's chart, e.g. "Set 3 · 16 counts (counts 24–40)". */
export function chartTitle(show: Show, i: number): string {
  const s = show.sets[i];
  const m = s.measures ? ` · m. ${s.measures}` : '';
  if (i === 0) return `Set ${s.name} · opening set${m}`;
  const starts = setStarts(show);
  return `Set ${s.name} · ${s.counts} counts (counts ${starts[i - 1]}–${starts[i]})${m}`;
}

export const chunk = <T,>(xs: T[], n: number): T[][] => Array.from({ length: Math.ceil(xs.length / n) }, (_, k) => xs.slice(k * n, (k + 1) * n));

/** Only print a Measures column if the drill writer has entered any. */
export const hasMeasures = (show: Show) => show.sets.some((s) => s.measures);
