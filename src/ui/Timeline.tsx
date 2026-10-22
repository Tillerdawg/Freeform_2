import { biggestStep, locate, setStarts, totalCounts, type Show } from '../engine/show';
import { TIER_COLOR } from '../field/drawField';
import { fmtStep } from './format';

interface Props {
  show: Show;
  t: number;
  setT: (t: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  bpm: number;
  setBpm: (n: number) => void;
}

/** One segment per move, width proportional to its counts; click or drag to scrub by whole counts. */
export function Timeline({ show, t, setT, playing, setPlaying, bpm, setBpm }: Props) {
  const total = totalCounts(show);
  const starts = setStarts(show);
  const { to, count } = locate(show, t);
  const onSet = starts.findIndex((s) => s === t);

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!total) return;
    const r = e.currentTarget.getBoundingClientRect();
    setT(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * total));
  };

  const status = onSet >= 0
    ? `Set ${show.sets[onSet].name}`
    : `Set ${show.sets[to - 1].name} → ${show.sets[to].name} · count ${Math.floor(count)} of ${show.sets[to].counts}`;

  return (
    <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #33443a' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button aria-label="Back to start" onClick={() => setT(0)}>⏮</button>
        <button aria-label="Previous count" onClick={() => setT(Math.max(0, Math.ceil(t) - 1))}>◀</button>
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(!playing)} disabled={!total}>{playing ? '⏸' : '▶'}</button>
        <button aria-label="Next count" onClick={() => setT(Math.min(total, Math.floor(t) + 1))}>▶︎|</button>
        <label>
          Tempo <input type="number" min={20} max={300} value={bpm} onChange={(e) => setBpm(Number(e.target.value) || 120)} style={{ width: 56 }} /> bpm
        </label>
        <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{status} · {Math.floor(t)} / {total} counts</span>
      </div>
      {total === 0 ? (
        <div style={{ opacity: 0.7, fontSize: 14 }}>Only one set so far. Add a set to create a move.</div>
      ) : (
        <div
          role="slider" aria-label="Show timeline in counts" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.floor(t)} tabIndex={0}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrub(e); }}
          onPointerMove={(e) => e.buttons && scrub(e)}
          style={{ position: 'relative', display: 'flex', height: 44, cursor: 'pointer', userSelect: 'none' }}
        >
          {show.sets.slice(1).map((s, k) => {
            const i = k + 1;
            const big = biggestStep(show, i);
            return (
              <div key={s.id} style={{ flex: s.counts, borderLeft: '2px solid #ffd166', background: i === to && onSet < 0 ? '#2c4a35' : '#24382b', overflow: 'hidden', padding: '2px 6px', fontSize: 12, whiteSpace: 'nowrap' }}>
                <div>{show.sets[i - 1].name} → {s.name} · {s.counts} cts</div>
                {big && <div style={{ color: TIER_COLOR[big.tier] === TIER_COLOR.ok ? '#cfe' : TIER_COLOR[big.tier] }}>max {fmtStep(big.per5)}</div>}
              </div>
            );
          })}
          <div style={{ position: 'absolute', top: -4, bottom: -4, width: 2, background: '#fff', left: `${(t / total) * 100}%`, pointerEvents: 'none' }} />
        </div>
      )}
    </div>
  );
}
