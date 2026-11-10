// What goes in an exported video (pure: no drawing or encoding; that's in src/ui/VideoExport.tsx).
import { timeAt, countAt } from './music';
import { locate, movementAt, setAt, setStarts, type Show } from './show';

export const FPS = 30;
export const TAIL = 1.5; // seconds the last set holds at the end, so the video doesn't stop on the landing count

/**
 * The frames of a video of sets `from` to `to` (indexes), as a count position for each frame, and where the music
 * starts and how long it runs. With `taps` (the recording's tapped counts) the drill follows the recording, rubato
 * and all; without, it moves at `bpm`.
 */
export function videoFrames(show: Show, from: number, to: number, bpm: number, taps?: number[] | null, fps = FPS): { counts: number[]; start: number; seconds: number } {
  const starts = setStarts(show), a = starts[from], b = starts[to];
  const sec = taps ? (c: number) => timeAt(taps, c) : (c: number) => ((c - a) * 60) / bpm;
  const start = sec(a), moving = Math.max(0, sec(b) - start), seconds = moving + TAIL;
  const n = Math.round(seconds * fps);
  const counts = Array.from({ length: n }, (_, k) => {
    const s = k / fps;
    if (s >= moving) return b; // holding on the last set
    return Math.min(b, Math.max(a, taps ? countAt(taps, start + s) : a + (s * bpm) / 60));
  });
  return { counts, start: taps ? start : 0, seconds };
}

/** The corner of each frame: the show's title and the piece ("Opener"), then where the drill is ("Set 3", or "Set 2 → 3 · count 6 of 16"). */
export function videoCaption(show: Show, t: number): { title: string; place: string } {
  const at = setAt(show, t), mv = movementAt(show, at > 0 ? t - 0.5 : t);
  const title = [show.title || 'Untitled show', mv?.name].filter(Boolean).join(' · ');
  if (at >= 0) return { title, place: `Set ${show.sets[at].name}` };
  const { to, count } = locate(show, t);
  return { title, place: `Set ${show.sets[to - 1].name} → ${show.sets[to].name} · count ${Math.floor(count) + 1} of ${show.sets[to].counts}` };
}
