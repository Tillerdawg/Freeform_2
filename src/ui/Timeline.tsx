import { useRef } from 'react';
import { addSetAfter, biggestStep, locate, moveSetTo, removeSet, setAt, setCounts, setMeasures, playPlan, setStarts, totalCounts, type Show } from '../engine/show';
import { TIER_COLOR } from '../field/drawField';
import { fmtStep } from './format';
import { IconNext, IconPause, IconPlay, IconPrev, IconStart } from './icons';

interface Props {
  show: Show;
  setShow: (f: (s: Show) => Show) => void;
  t: number;
  setT: (t: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  bpm: number;
  setBpm: (n: number) => void;
  range: { from: string | null; to: string | null; loop: boolean };
  setRange: (r: { from: string | null; to: string | null; loop: boolean }) => void;
  span: [number, number];
  music?: React.ReactNode; // the Music menu, beside Tempo
}

/** One segment per move, width proportional to its counts; click or drag to scrub by whole counts. */
export function Timeline({ show, setShow, t, setT, playing, setPlaying, bpm, setBpm, range, setRange, span, music }: Props) {
  const total = totalCounts(show);
  const starts = setStarts(show);
  const { to, count } = locate(show, t);
  const onSet = setAt(show, t);

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!total) return;
    const r = e.currentTarget.getBoundingClientRect();
    setT(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * total));
  };

  const status = onSet >= 0
    ? `Set ${show.sets[onSet].name}`
    : `Set ${show.sets[to - 1].name} → ${show.sets[to].name} · count ${Math.floor(count)} of ${show.sets[to].counts}`;

  const strip = useRef<HTMLDivElement>(null);
  const setDrag = useRef<{ i: number; x0: number; from: number; perCount: number; moved: boolean } | null>(null);
  const fixedRow: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', height: 30, whiteSpace: 'nowrap', overflow: 'hidden' };
  return (
    <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #33443a' }}>
      {/* Every row has a fixed height: a panel that grows or shrinks would resize (and flash) the field. */}
      <div style={{ ...fixedRow, marginBottom: 4 }}>
        <button aria-label="Back to start" onClick={() => setT(0)}><IconStart /></button>
        <button aria-label="Previous count" onClick={() => setT(Math.max(0, Math.ceil(t) - 1))}><IconPrev /></button>
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(!playing)} disabled={!total || (!playing && !playPlan(t, span, total, range.loop))}
          title={!playing && t >= total ? 'End of the show: pick a set to play from there' : undefined}>{playing ? <IconPause /> : <IconPlay />}</button>
        <button aria-label="Next count" onClick={() => setT(Math.min(total, Math.floor(t) + 1))}><IconNext /></button>
        <label>
          Tempo <input type="number" min={20} max={300} value={bpm} onChange={(e) => setBpm(Number(e.target.value) || 120)} style={{ width: 56 }} /> bpm
        </label>
        {music}
        {show.sets.length > 1 && (
          <>
            <label>
              Play set{' '}
              <select aria-label="Play from set" value={range.from ?? ''} onChange={(e) => setRange({ ...range, from: e.target.value || null })}>
                <option value="">{show.sets[0].name} (start)</option>
                {show.sets.slice(1).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label>
              to{' '}
              <select aria-label="Play to set" value={range.to ?? ''} onChange={(e) => setRange({ ...range, to: e.target.value || null })}>
                <option value="">{show.sets.at(-1)!.name} (end)</option>
                {show.sets.slice(0, -1).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={range.loop} onChange={(e) => setRange({ ...range, loop: e.target.checked })} /> Loop</label>
          </>
        )}
        <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{status} · {Math.floor(t)} / {total} counts</span>
      </div>
      {/* Set buttons sit above the line where each set lands. */}
      {/* Click a set to go to it; drag it (not set 1) to land it on a different count. Its neighbors stay put. */}
      <div ref={strip} style={{ position: 'relative', height: 24 }}>
        {show.sets.map((s, i) => (
          <button key={s.id} aria-label={`Go to set ${s.name}`} title={i ? 'Click to go here; drag to change which count this set lands on' : undefined}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              // Fix the scale at the start: dragging the last set changes the show's length.
              setDrag.current = { i, x0: e.clientX, from: starts[i], perCount: (strip.current?.clientWidth ?? 1) / Math.max(1, total), moved: false };
            }}
            onPointerMove={(e) => {
              const d = setDrag.current;
              if (!d || d.i === 0) return;
              if (!d.moved && Math.abs(e.clientX - d.x0) < 4) return;
              d.moved = true;
              const next = moveSetTo(show, d.i, d.from + (e.clientX - d.x0) / d.perCount);
              setShow(() => next);
              setT(setStarts(next)[d.i]); // the playhead stays on the set, wherever it was allowed to land
            }}
            onPointerUp={() => {
              const d = setDrag.current;
              setDrag.current = null;
              if (d && !d.moved) setT(starts[i]);
            }}
            style={{ position: 'absolute', left: total ? `${(starts[i] / total) * 100}%` : 0, transform: total ? 'translateX(-50%)' : undefined,
              fontWeight: i === onSet ? 700 : 400, outline: i === onSet ? '2px solid #ffd166' : undefined, padding: '0 6px', minWidth: 24,
              cursor: i ? 'ew-resize' : 'pointer', touchAction: 'none' }}>
            {s.name}
          </button>
        ))}
      </div>
      {total === 0 ? (
        <div style={{ opacity: 0.7, fontSize: 14, height: 56, display: 'flex', alignItems: 'center' }}>Only one set so far. Add a set to create a move.</div>
      ) : (
        <div
          role="slider" aria-label="Show timeline in counts" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.floor(t)} tabIndex={0}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrub(e); }}
          onPointerMove={(e) => e.buttons && scrub(e)}
          style={{ position: 'relative', display: 'flex', height: 56, cursor: 'pointer', userSelect: 'none' }}
        >
          {/* Each move's box is exactly its share of the counts, so its yellow line (the set it starts from) sits under that set's button. */}
          {show.sets.slice(1).map((s, k) => {
            const i = k + 1;
            const big = biggestStep(show, i);
            return (
              <div key={s.id} style={{ flex: `0 0 ${(s.counts / total) * 100}%`, boxSizing: 'border-box', minWidth: 0, borderLeft: '2px solid #ffd166', background: i === to && onSet < 0 ? '#2c4a35' : '#24382b', overflow: 'hidden', padding: '2px 6px', fontSize: 12, whiteSpace: 'nowrap' }}>
                <div>{show.sets[i - 1].name} → {s.name} · {s.counts} cts{s.measures ? ` · m. ${s.measures}` : ''}{s.ftl?.length ? ' · FTL' : ''}</div>
                {big && <div style={{ color: TIER_COLOR[big.tier] === TIER_COLOR.ok ? '#cfe' : TIER_COLOR[big.tier] }}>max {fmtStep(big.per5)}</div>}
              </div>
            );
          })}
          {/* One tick per count; taller every 4 counts within a move. Clicking snaps to the nearest count. */}
          {Array.from({ length: total - 1 }, (_, k) => k + 1).filter((c) => !starts.includes(c)).map((c) => {
            const intoMove = c - starts[locate(show, c).to - 1];
            const here = Math.abs(t - c) < 1e-9;
            return (
              <div key={c} style={{
                position: 'absolute', bottom: 0, left: `${(c / total) * 100}%`, width: here ? 2 : 1, marginLeft: here ? -1 : 0,
                height: here ? 16 : intoMove % 4 === 0 ? 10 : 6, background: here ? '#fff' : 'rgba(255,255,255,0.5)', pointerEvents: 'none',
              }} />
            );
          })}
          {/* Dim what's outside the play range. */}
          {span[0] > 0 && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(span[0] / total) * 100}%`, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
          {span[1] < total && <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${((total - span[1]) / total) * 100}%`, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
          <div style={{ position: 'absolute', top: -4, bottom: -4, width: 2, background: '#fff', left: `${(t / total) * 100}%`, pointerEvents: 'none' }} />
        </div>
      )}
    </div>
  );
}

/** The current set's controls (shown in the top bar). Mid-move, "current" is the set being moved into. */
export function SetControls({ show, setShow, t, setT }: { show: Show; setShow: (f: (s: Show) => Show) => void; t: number; setT: (t: number) => void }) {
  const starts = setStarts(show);
  const onSet = setAt(show, t);
  const cur = onSet >= 0 ? onSet : locate(show, t).to;
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <strong>Set {show.sets[cur].name}</strong>
      <label>Counts{' '}
        <input type="number" min={1} aria-label="Counts" disabled={cur === 0} title={cur === 0 ? 'The opening set has no move into it' : undefined}
          value={cur === 0 ? '' : show.sets[cur].counts} style={{ width: 46 }}
          onChange={(e) => setShow((s) => setCounts(s, cur, Number(e.target.value)))} />
      </label>
      <label>Measures{' '}
        <input aria-label="Measures" placeholder={cur > 0 ? 'e.g. 9–12' : 'e.g. 0 or 1'} value={show.sets[cur].measures ?? ''} style={{ width: 64 }}
          onChange={(e) => setShow((s) => setMeasures(s, cur, e.target.value))} />
      </label>
      <button onClick={() => { setShow((s) => addSetAfter(s, cur)); setT(starts[cur] + 16); }} title="Add a new set after this one (16 counts)">+ Add set</button>
      <button disabled={show.sets.length < 2} onClick={() => { setShow((s) => removeSet(s, cur)); setT(starts[Math.max(0, cur - 1)]); }}>Delete set</button>
    </div>
  );
}
