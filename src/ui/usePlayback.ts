import { useEffect, useRef } from 'react';
import { countAt, timeAt } from '../engine/music';
import { advance, playPlan } from '../engine/show';

/**
 * Real-time playback: while `playing`, moves `t` (in counts) forward from where it is (see `playPlan`): at `bpm`, or,
 * with `music` (an audio element and its tapped counts), following the recording, which plays along.
 */
export function usePlayback(
  playing: boolean, setPlaying: (p: boolean) => void, t: number, setT: (t: number) => void,
  bpm: number, range: [number, number], loopRange: boolean, total: number,
  music?: { audio: HTMLAudioElement; taps: number[] } | null,
) {
  const tRef = useRef(t);
  tRef.current = t;
  useEffect(() => {
    if (!playing) return;
    const plan = playPlan(tRef.current, range, total, loopRange);
    if (!plan) { setPlaying(false); return; }
    const { span, loop } = plan;
    let cur = plan.from, last = performance.now(), raf = 0;
    if (music) {
      const { audio, taps } = music;
      const seek = (c: number) => { audio.currentTime = Math.max(0, timeAt(taps, c)); };
      seek(cur);
      audio.play().catch(() => setPlaying(false)); // e.g. the browser blocked sound
      const tick = () => {
        cur = countAt(taps, audio.currentTime);
        if (cur >= span[1] || audio.ended) {
          if (loop && span[1] > span[0]) { seek(span[0]); cur = span[0]; } else { setT(span[1]); setPlaying(false); return; }
        }
        setT(Math.max(span[0], cur));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(raf); audio.pause(); };
    }
    const tick = (now: number) => {
      const dt = Math.max(0, now - last) / 1000; // a frame timestamp can precede the start time; never step backward
      last = now;
      const r = advance(cur, (dt * bpm) / 60, span, loop);
      cur = r.t;
      setT(cur);
      if (r.done) setPlaying(false); else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, bpm, range, loopRange, total, music]); // eslint-disable-line react-hooks/exhaustive-deps
}
