// A performer's own dot sheet, for the phone's My dots list: one row per set, like the printed card.
import { frontToBack, sideToSide, type StepTier } from '../engine/coords';
import { fieldOf, moveSteps, timingOf, type Show } from '../engine/show';

export interface DotRow {
  index: number;
  set: string;
  counts: number | null; // counts in the move into this set (none for set 1)
  measures: string;
  side: string;
  front: string;
  steps: { per5: number; tier: StepTier } | null; // step size into this set (none for set 1, or standing still)
  hold: { wait: number; move: number; after: number } | null; // a delayed or early step-off; null when moving every count
  cue: string; // my notes for this set
  note: string; // the ensemble's notes for this set
}

/** One row per set for performer `id`, in the phone's language. */
export function myDots(show: Show, id: string, lang: 'en' | 'es' = 'en'): DotRow[] {
  const f = fieldOf(show);
  return show.sets.map((s, i) => {
    const p = s.pos[id];
    const st = i ? moveSteps(show, i)[id] : undefined;
    const tm = i ? timingOf(s, id) : null;
    return {
      index: i,
      set: s.name,
      counts: i ? s.counts : null,
      measures: s.measures ?? '',
      side: p ? sideToSide(p.x, f, lang) : '',
      front: p ? frontToBack(p.y, f, lang) : '',
      steps: st && st.per5 !== Infinity && st.per5 > 0 ? st : null,
      hold: tm && tm.move < s.counts ? { wait: tm.wait, move: tm.move, after: s.counts - tm.wait - tm.move } : null,
      cue: s.cues?.[id] ?? '',
      note: s.note ?? '',
    };
  });
}

/** Which view a phone shows: staff always get the field; otherwise the switch wins, then the phone's orientation. */
export function paneFor(staff: boolean, chosen: 'dots' | 'field' | null, portrait: boolean): 'dots' | 'field' {
  if (staff) return 'field';
  return chosen ?? (portrait ? 'dots' : 'field');
}
