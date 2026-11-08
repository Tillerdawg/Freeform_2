// The count-in before phone playback: a few clicks at the playing tempo, so a performer can step off with the drill.
import { timeAt } from '../engine/music';

export const COUNT_IN = 4;

/** Seconds per count for the count-in: the recording's pace at count `from` when playing with the music, else the tempo. */
export function countInBeat(bpm: number, taps: number[] | null, from: number): number {
  if (taps && taps.length >= 2) {
    const d = timeAt(taps, from + 1) - timeAt(taps, from);
    if (d > 0.15 && d < 3) return d; // a sane pace (20 to 400 bpm); otherwise the tempo box
  }
  return 60 / bpm;
}
