import { useEffect, useRef } from 'react';
import { advance, playStart } from '../engine/show';

/** Real-time playback: while `playing`, moves `t` (in counts) at `bpm` within `span`, stopping or looping at the end. */
export function usePlayback(
  playing: boolean, setPlaying: (p: boolean) => void, t: number, setT: (t: number) => void,
  bpm: number, span: [number, number], loop: boolean,
) {
  const tRef = useRef(t);
  tRef.current = t;
  useEffect(() => {
    if (!playing) return;
    let cur = playStart(tRef.current, span), last = performance.now(), raf = 0;
    setT(cur);
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
  }, [playing, bpm, span, loop]); // eslint-disable-line react-hooks/exhaustive-deps
}
