import { useEffect, useRef } from 'react';
import { advance, playPlan } from '../engine/show';

/** Real-time playback: while `playing`, moves `t` (in counts) forward at `bpm` from where it is (see `playPlan`). */
export function usePlayback(
  playing: boolean, setPlaying: (p: boolean) => void, t: number, setT: (t: number) => void,
  bpm: number, range: [number, number], loopRange: boolean, total: number,
) {
  const tRef = useRef(t);
  tRef.current = t;
  useEffect(() => {
    if (!playing) return;
    const plan = playPlan(tRef.current, range, total, loopRange);
    if (!plan) { setPlaying(false); return; }
    const { span, loop } = plan;
    let cur = plan.from, last = performance.now(), raf = 0;
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
  }, [playing, bpm, range, loopRange, total]); // eslint-disable-line react-hooks/exhaustive-deps
}
