// Playing out a score's repeats, endings, D.C., D.S., Fine, and Coda: the order its bars are heard in, the way
// MuseScore plays (and exports to MIDI) the same score. Bars are numbered in that order (Jason: playback order), so a
// set's Measures mean the same bars whether the score came in as MIDI, MusicXML, or a MuseScore file.
// The file readers (musicxml.ts) turn each format's marks into this one shape.

/** One written bar's repeat marks. Labels follow MuseScore's: 'segno', 'coda' (the To Coda mark), 'codab' (the Coda itself), 'fine'. */
export interface BarMarks {
  startRepeat?: boolean;
  /** An end repeat: how many times the section is played in all (2 = once more). */
  endRepeat?: number;
  /** The ending (volta) numbers this bar is under: [1] for a 1st ending, [1, 2] for "1., 2.". */
  endings?: number[];
  markers?: string[];
  /** A D.C. or D.S. at the end of this bar: back to `to` ('start' or a marker), play until `until` ('end' or a marker), then on at `continueAt`. */
  jump?: { to: string; until: string; continueAt?: string; playRepeats?: boolean };
}

const FINAL = Infinity; // the pass after a D.C. or D.S.: only the last ending is played

/**
 * The written bars (0-based) in the order they're heard. `max` caps the result, so a looping or broken set of marks
 * can't run forever; past it, the bars are played as written and `capped` is set.
 */
export function playbackOrder(marks: BarMarks[], max = 5000): { order: number[]; capped: boolean } {
  const n = marks.length;
  const written = Array.from({ length: n }, (_, i) => i);
  if (!marks.some((b) => b.startRepeat || b.endRepeat || b.endings?.length || b.jump)) return { order: written, capped: false };
  // Each run of bars under endings is one group; on the last pass (after a jump), only its highest ending plays.
  const lastEnding: boolean[] = new Array(n).fill(false);
  for (let i = 0; i < n; ) {
    if (!marks[i].endings?.length) { i++; continue; }
    let j = i;
    while (j < n && marks[j].endings?.length) j++;
    const top = Math.max(...marks.slice(i, j).flatMap((b) => b.endings!));
    for (let k = i; k < j; k++) lastEnding[k] = marks[k].endings!.includes(top);
    i = j;
  }
  const find = (label: string, from = 0) => {
    if (label === 'start') return 0;
    for (let k = from; k < n; k++) if (marks[k].markers?.includes(label)) return k;
    for (let k = 0; k < from; k++) if (marks[k].markers?.includes(label)) return k;
    return -1;
  };
  const order: number[] = [], usedJumps = new Set<number>();
  let i = 0, repeatStart = 0, pass = 1, back = false, inEnding = false;
  let jump: BarMarks['jump'] | undefined; // the D.C. or D.S. being followed
  const repeatsOn = () => !jump || !!jump.playRepeats;
  while (i < n) {
    if (order.length >= max) return { order: written, capped: true };
    const b = marks[i];
    if (b.startRepeat && !back && repeatsOn()) { repeatStart = i; pass = 1; }
    back = false;
    if (b.endings?.length) {
      inEnding = true;
      const plays = pass === FINAL ? lastEnding[i] : b.endings.includes(pass);
      if (!plays) { i++; continue; }
    } else if (inEnding) { // past the endings: a new section starts here
      inEnding = false;
      if (pass !== FINAL) { repeatStart = i; pass = 1; }
    }
    order.push(i);
    if (jump && jump.until !== 'end' && b.markers?.includes(jump.until)) { // Fine, or To Coda
      if (!jump.continueAt) break;
      const to = find(jump.continueAt, i + 1);
      if (to < 0) break;
      i = to; jump = undefined; pass = 1; repeatStart = to; back = true;
      continue;
    }
    if (b.endRepeat && repeatsOn() && pass !== FINAL) {
      if (pass < b.endRepeat) { pass++; i = repeatStart; back = true; inEnding = false; continue; }
      if (!inEnding) { pass = 1; repeatStart = i + 1; }
    }
    if (b.jump && !usedJumps.has(i)) {
      const to = find(b.jump.to);
      if (to >= 0) {
        usedJumps.add(i);
        jump = b.jump;
        pass = b.jump.playRepeats ? 1 : FINAL;
        repeatStart = to; i = to; back = !b.jump.playRepeats; inEnding = false;
        continue;
      }
    }
    i++;
  }
  return { order, capped: false };
}

/** "1", "1, 2", "1-3", "1., 2." → [1], [1, 2], [1, 2, 3], [1, 2]. */
export function endingNumbers(s: string | undefined): number[] {
  const out: number[] = [];
  for (const m of (s ?? '').matchAll(/(\d+)\s*(?:[-–]\s*(\d+))?/g)) {
    const a = +m[1], b = +(m[2] ?? m[1]);
    for (let k = a; k <= b && k - a < 20; k++) out.push(k);
  }
  return out;
}
