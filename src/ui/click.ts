// A metronome click for playback at a tempo: short beeps scheduled on the audio clock, so they land evenly.
let ctx: AudioContext | null = null;

/** Make (or wake) the sound. Call from a tap or click: browsers only start sound after one. */
export function wakeClick() {
  try { ctx ??= new AudioContext(); if (ctx.state === 'suspended') void ctx.resume(); } catch { ctx = null; } // no Web Audio: no click
}

/** The audio clock, in seconds (clicks are timed on it, not on the screen's frames). */
export const audioTime = () => ctx?.currentTime ?? 0;

/** A click at audio time `when` (if it hasn't gone by); `accent` (where a set lands) is higher and louder. */
export function clickAt(when: number, accent: boolean) {
  if (!ctx || when < ctx.currentTime - 0.005) return;
  const at = Math.max(when, ctx.currentTime), osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.frequency.value = accent ? 1760 : 1100;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.6 : 0.35, at + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at); osc.stop(at + 0.06);
}

/**
 * Which counts to click on this frame: every whole count from `next` up to a little past `cur` (looking ahead `ahead`
 * counts, so each one is scheduled before it's due), with how far away each is in counts; counts already past are skipped. Returns the next count to
 * click after these. A jump back (a loop, or a scrub) starts over from where playback is.
 */
export function countsToClick(next: number, cur: number, ahead: number, end: number): { counts: { c: number; inCounts: number }[]; next: number } {
  if (cur < next - 1 - ahead - 1e-9) next = Math.ceil(cur); // further back than looking ahead explains: a jump back
  const counts: { c: number; inCounts: number }[] = [];
  for (; next <= cur + ahead && next <= end; next++) if (next >= cur - 0.05) counts.push({ c: next, inCounts: Math.max(0, next - cur) }); // a count already gone by (a slow frame) is skipped, not played late
  return { counts, next };
}

// Whether the click is on, kept in this browser (the editor and the performer view share it).
const KEY = 'freeform:click';
export const clickWanted = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const setClickWanted = (on: boolean) => { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* storage blocked */ } };
