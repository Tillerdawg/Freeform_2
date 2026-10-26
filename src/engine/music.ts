// Music sync. The drill writer taps along with the recording, one tap per count, so the map follows the music
// exactly, rubato and fermatas included. taps[k] = seconds into the recording where count k falls (count 0 = set 1).
// Past the last tap, counts keep the pace of the last few taps.

export interface Music {
  name: string; // the audio file's name, to show and to ask for it again on another computer
  audioId: string; // where this browser keeps the audio (it isn't in the show file)
  taps: number[];
}

const MAX_TAPS = 20_000;

/** The recent pace (seconds per count), from the last few taps. */
const pace = (taps: number[]) => {
  const n = Math.min(4, taps.length - 1);
  return (taps[taps.length - 1] - taps[taps.length - 1 - n]) / n;
};

/** Seconds into the recording at count `c` (fractional counts fall between taps). Needs 2+ taps. */
export function timeAt(taps: number[], c: number): number {
  const last = taps.length - 1;
  if (c <= 0) return taps[0] + c * (taps[1] - taps[0]);
  if (c >= last) return taps[last] + (c - last) * pace(taps);
  const k = Math.floor(c);
  return taps[k] + (c - k) * (taps[k + 1] - taps[k]);
}

/** The count at `sec` seconds into the recording (the inverse of timeAt). Needs 2+ taps. */
export function countAt(taps: number[], sec: number): number {
  const last = taps.length - 1;
  if (sec <= taps[0]) return (sec - taps[0]) / (taps[1] - taps[0]);
  if (sec >= taps[last]) return last + (sec - taps[last]) / pace(taps);
  let lo = 0, hi = last; // taps[lo] <= sec < taps[hi]
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (taps[mid] <= sec) lo = mid; else hi = mid; }
  return lo + (sec - taps[lo]) / (taps[hi] - taps[lo]);
}

/** Music settings from a file: kept only if well formed (taps strictly increasing, within limits). */
export function validMusic(x: unknown): x is Music {
  const m = x as Music;
  return !!m && typeof m.name === 'string' && m.name.length <= 300 && typeof m.audioId === 'string' && /^[\w-]{1,64}$/.test(m.audioId)
    && Array.isArray(m.taps) && m.taps.length <= MAX_TAPS
    && m.taps.every((s, i) => Number.isFinite(s) && s >= 0 && (i === 0 || s > m.taps[i - 1]));
}

/** Enough taps to drive playback. */
export const synced = (m?: Music): m is Music => !!m && m.taps.length >= 2;
