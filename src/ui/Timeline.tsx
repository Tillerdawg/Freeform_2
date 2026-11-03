import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { peakBetween, timeAt } from '../engine/music';
import { PALETTE } from './palette';
import { addSetAfter, biggestStep, insertSetAt, locate, MAX_MOVEMENT, movementAt, movementOfSet, movementStarts, moveSetTo, newId, removeSet, setAt, setCounts, setMeasures, playPlan, setStarts, showLength, totalCounts, type Show } from '../engine/show';
import { Menu } from './Toolbar';
import { STEP_TEXT } from '../field/drawField';
import { fmtStep } from './format';
import { IconNext, IconPause, IconPlay, IconPrev, IconStart, IconZoomIn, IconZoomOut } from './icons';
import { coarse } from '../perform/device';

const TOUCH = coarse();
const ROW = TOUCH ? 46 : 22; // set-button rows: 44 px buttons on a touch screen
// Short touch screens (an open iPhone Duo on its side, 585 px tall): one row of set buttons, a one-line move track and a
// snug controls row, so the field gets about 70 px more. Buttons stay 44 px; close sets' buttons overlap (zoom spreads them).
const SHORT = '(pointer: coarse) and (max-height: 650px)';
const HOLD_MS = 400; // touch: hold a set button this long to pick it up; a swipe before then scrolls the timeline

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
  wave?: { peaks: Float32Array; taps: number[] }; // the recording's loudness (100 slices a second) and its tapped counts
}

/** One segment per move, width proportional to its counts; click or drag to scrub by whole counts. */
export function Timeline({ show, setShow, t, setT, playing, setPlaying, bpm, setBpm, range, setRange, span, music, wave }: Props) {
  const total = showLength(show); // the timeline runs through any part not written yet (count-first)
  const written = totalCounts(show);
  const starts = setStarts(show);
  const { to, count } = locate(show, t);
  const onSet = setAt(show, t);
  const past = t > written; // in the part not written yet: performers hold on the last set

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!total) return;
    const r = e.currentTarget.getBoundingClientRect();
    setT(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * total));
  };

  const mv = onSet >= 0 ? movementOfSet(show, onSet) : movementAt(show, t);
  const status = (mv ? `${mv.name} · ` : '') + (onSet >= 0 ? `Set ${show.sets[onSet].name}`
    : past ? `After set ${show.sets.at(-1)!.name} · not written yet`
    : `Set ${show.sets[to - 1].name} → ${show.sets[to].name} · count ${Math.floor(count)} of ${show.sets[to].counts}`);

  const strip = useRef<HTMLDivElement>(null);
  const [short, setShort] = useState(() => matchMedia(SHORT).matches);
  useEffect(() => { const m = matchMedia(SHORT), f = () => setShort(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  // Set buttons in two fixed rows (the panel never changes height): each starts at its set's line and takes the top
  // row unless it would overlap the button before it there. Widths are measured after drawing (names and bold vary).
  // `pad` keeps room past the timeline's last count, so a button near the end still starts at its line (time order).
  const [rows, setRows] = useState<number[]>([]);
  const [pad, setPad] = useState(0);
  // Zoom: pixels per count, or null to fit the window. A long piece starts zoomed in enough to read, and scrolls.
  const [viewW, setViewW] = useState(0);
  const [ppc, setPpc] = useState<number | null | 'auto'>('auto');
  const outer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fitPpc = total ? viewW / total : 1;
  const perCount = ppc === 'auto' ? (fitPpc < 4 ? 6 : null) : ppc; // under 4 px a count, start at 6 (sets and ticks readable)
  const fullW = perCount && total ? Math.max(viewW, Math.round(total * perCount)) : viewW;
  const zoom = (k: number) => setPpc(() => { const next = (perCount ?? fitPpc) * k; return next <= fitPpc * 1.01 ? null : Math.min(60, next); });
  // Scroll sideways with the mouse wheel too (trackpads already swipe sideways), and pan with a right-drag, as on the field.
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      e.preventDefault(); el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  const panFrom = useRef<{ x: number; left: number } | null>(null);
  // Keep the playhead in view when it moves (playing, or a set picked elsewhere); scrolling by hand doesn't move it.
  useEffect(() => {
    const el = outer.current;
    if (!el || !total || el.scrollWidth <= el.clientWidth) return;
    const x = (t / total) * (fullW - pad);
    if (x < el.scrollLeft + 24 || x > el.scrollLeft + el.clientWidth - 48) el.scrollLeft = x - el.clientWidth * 0.3;
  }, [t, fullW, pad, total]);
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el || !total || !fullW) return;
    const ws = [...el.querySelectorAll('button')].map((b) => b.offsetWidth);
    let p = 0; // the smallest room at the end that fits every button starting at its line
    for (let k = 0; k < 3; k++) p = Math.max(0, ...ws.map((w, i) => (starts[i] / total) * (fullW - p) + w - (fullW - p)));
    p = Math.ceil(p);
    const W = fullW - p, ends = [-Infinity, -Infinity];
    const next = ws.map((w, i) => {
      const x = (starts[i] / total) * W;
      const r = short ? 0 : x >= ends[0] + 2 ? 0 : x >= ends[1] + 2 ? 1 : ends[0] <= ends[1] ? 0 : 1; // three packed together: the emptier row
      ends[r] = x + w;
      return r;
    });
    if (next.join() !== rows.join()) setRows(next);
    if (p !== pad) setPad(p);
  });
  // left: the 2px line centered on the count.
  const box = (from: number, counts: number): React.CSSProperties => ({ position: 'absolute', top: 0, bottom: 0, left: `calc(${(from / total) * 100}% - 1px)`, width: `${(counts / total) * 100}%`,
    boxSizing: 'border-box', borderLeft: '2px solid var(--gold)', overflow: 'hidden', fontSize: 12, whiteSpace: 'nowrap' });
  const setDrag = useRef<{ i: number; x0: number; from: number; perCount: number; moved: boolean; touch?: { left: number; armed: boolean; scrolled: boolean; timer: number } } | null>(null);
  const [held, setHeld] = useState<number | null>(null); // the set button a finger has picked up
  const dropSet = () => { const d = setDrag.current; if (d?.touch) clearTimeout(d.touch.timer); setDrag.current = null; setHeld(null); return d; };
  const fixedRow: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', height: TOUCH ? (short ? 44 : 48) : 30, whiteSpace: 'nowrap', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' };
  return (
    <div style={{ padding: `${short ? 4 : 8}px 12px 12px`, borderTop: '1px solid var(--line)' }}>
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
        <Movements show={show} setShow={setShow} />
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
        <span title={`${status} · ${Math.floor(t)} / ${total} counts`} style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis' }}>{status} · {Math.floor(t)} / {total} counts</span>
      </div>
      {/* Set buttons sit above the line where each set lands. */}
      {/* Click a set to go to it; drag it (not set 1) to land it on a different count. Its neighbors stay put. */}
      <div style={{ display: 'flex', gap: 6 }}>
      <div ref={outer} style={{ overflowX: 'scroll', overflowY: 'hidden', flex: 1, minWidth: 0 }} // always a scroll bar, so the height never changes
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => { if (e.button === 2) { e.currentTarget.setPointerCapture(e.pointerId); panFrom.current = { x: e.clientX, left: e.currentTarget.scrollLeft }; } }}
        onPointerMove={(e) => { if (panFrom.current) e.currentTarget.scrollLeft = panFrom.current.left - (e.clientX - panFrom.current.x); }}
        onPointerUp={() => { panFrom.current = null; }}>
      <div style={{ width: fullW || undefined }}>
      <div ref={strip} style={{ position: 'relative', height: (short ? 1 : 2) * ROW, marginRight: pad }}>
        {/* Each set's line runs up to its button. Behind the buttons. */}
        {total > 0 && show.sets.map((s, i) => (
          <div key={s.id} style={{ position: 'absolute', left: `calc(${(starts[i] / total) * 100}% - 1px)`, top: (rows[i] ?? 0) * ROW + ROW - 2, bottom: 0, width: 2, background: 'var(--gold)', pointerEvents: 'none' }} />
        ))}
        {show.sets.map((s, i) => (
          <button key={s.id} aria-label={`Go to set ${s.name}`} title={i ? (TOUCH ? 'Tap to go here; touch and hold, then drag, to change which count this set lands on' : 'Click to go here; drag to change which count this set lands on') : undefined}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              // Fix the scale at the start: dragging the last set changes the show's length.
              const d: NonNullable<typeof setDrag.current> = { i, x0: e.clientX, from: starts[i], perCount: (strip.current?.clientWidth ?? 1) / Math.max(1, total), moved: false };
              if (e.pointerType === 'touch') // a finger picks a set up only after a hold, so swiping across the buttons scrolls
                d.touch = { left: outer.current?.scrollLeft ?? 0, armed: false, scrolled: false,
                  timer: window.setTimeout(() => { if (i && !d.touch!.scrolled) { d.touch!.armed = true; setHeld(i); } }, HOLD_MS) };
              setDrag.current = d;
            }}
            onPointerMove={(e) => {
              const d = setDrag.current;
              if (d?.touch && !d.touch.armed) {
                if (!d.touch.scrolled && Math.abs(e.clientX - d.x0) < 8) return;
                d.touch.scrolled = true;
                clearTimeout(d.touch.timer);
                if (outer.current) outer.current.scrollLeft = d.touch.left - (e.clientX - d.x0);
                return;
              }
              if (!d || d.i === 0) return;
              if (!d.moved && Math.abs(e.clientX - d.x0) < 4) return;
              d.moved = true;
              const next = moveSetTo(show, d.i, d.from + (e.clientX - d.x0) / d.perCount);
              setShow(() => next);
              setT(setStarts(next)[d.i]); // the playhead stays on the set, wherever it was allowed to land
            }}
            onPointerUp={() => {
              const d = dropSet();
              if (d && !d.moved && !d.touch?.scrolled) setT(starts[i]);
            }}
            onPointerCancel={dropSet}
            // The button starts at its set's line (its left edge on the line).
            style={{ position: 'absolute', zIndex: i === onSet ? 2 : 1, top: (rows[i] ?? 0) * ROW, height: ROW - 2, minHeight: 0, left: total ? `calc(${(starts[i] / total) * 100}% - 1px)` : 0,
              fontWeight: i === onSet ? 700 : 400, boxShadow: i === onSet ? 'inset 0 0 0 2px var(--gold)' : undefined, // inside the edge: the scroll strip clips anything outside it
              ...(held === i ? { background: 'var(--gold)', color: 'var(--bg-deep)', transform: 'scale(1.1)', zIndex: 2 } : {}), padding: '0 6px', minWidth: TOUCH ? 44 : 24, lineHeight: '18px',
              cursor: i ? 'ew-resize' : 'pointer', touchAction: 'none' }}>
            {s.name}
          </button>
        ))}
      </div>
      {total === 0 ? (
        <div style={{ opacity: 0.7, fontSize: 14, height: short ? 40 : 56, display: 'flex', alignItems: 'center' }}>Only one set so far. Add a set to create a move, or set the show's length in Movements.</div>
      ) : (
        <div
          role="slider" aria-label="Show timeline in counts" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.floor(t)} tabIndex={0}
          onPointerDown={(e) => { if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); scrub(e); }}
          onPointerMove={(e) => e.buttons === 1 && scrub(e)}
          style={{ position: 'relative', height: short ? 40 : 56, cursor: 'pointer', userSelect: 'none', marginRight: pad }}
        >
          {/* Each move's box is placed at its counts exactly, like the set buttons above, so its yellow line (the set it starts
              from) sits under that set's button. Padding goes inside: a box narrower than its padding (a 1-count move) would
              otherwise grow and push every later box off its count. */}
          {show.sets.slice(1).map((s, k) => {
            const i = k + 1;
            const big = biggestStep(show, i);
            return (
              <div key={s.id} style={{ ...box(starts[i - 1], s.counts), background: i === to && onSet < 0 && !past ? 'var(--surface-2)' : 'var(--surface)', boxShadow: i === to && onSet < 0 && !past ? 'inset 0 -3px 0 var(--gold)' : undefined }}>
                <div style={{ padding: '2px 6px' }}>
                  <div>{show.sets[i - 1].name} → {s.name} · {s.counts} cts{s.measures ? ` · m. ${s.measures}` : ''}{s.ftl?.length ? ' · FTL' : ''}
                    {big && short && <span style={{ color: STEP_TEXT[big.tier] }}> · max {fmtStep(big.per5)}</span>}</div>
                  {big && !short && <div style={{ color: STEP_TEXT[big.tier] }}>max {fmtStep(big.per5)}</div>}
                </div>
              </div>
            );
          })}
          {written < total && (
            <div title="Not written yet: click a count, then + Add set" style={{ ...box(written, total - written), color: 'var(--text)',
              background: 'repeating-linear-gradient(135deg, var(--bg-deep) 0 6px, var(--bg) 6px 12px)', boxShadow: past ? 'inset 0 -3px 0 var(--gold)' : undefined }}>
              <div style={{ padding: '2px 6px' }}>Not written yet · counts {written + 1}–{total}</div>
            </div>
          )}
          {/* Where each movement starts: a dashed line (after the first) and its name, below the moves' own text. */}
          {movementStarts(show).map((c, k) => {
            const m = show.movements![k], end = (k + 1 < show.movements!.length ? movementStarts(show)[k + 1] : total);
            return (
              <div key={m.id} title={m.name} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(c / total) * 100}%`, width: `${((end - c) / total) * 100}%`, borderLeft: k ? '2px dashed var(--blue)' : undefined, pointerEvents: 'none' }}>
                <span style={{ position: 'absolute', top: short ? 22 : 35, left: 4, maxWidth: 'calc(100% - 8px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'var(--bg-deep)', padding: '0 3px' }}>{m.name}</span>
              </div>
            );
          })}
          {wave && <Wave wave={wave} total={total} />}
          {/* One tick per count; taller every 4 counts within a move. Clicking snaps to the nearest count. */}
          {Array.from({ length: total - 1 }, (_, k) => k + 1).filter((c) => !starts.includes(c)).map((c) => {
            const intoMove = c > written ? c - written : c - starts[locate(show, c).to - 1];
            const here = Math.abs(t - c) < 1e-9;
            return (
              <div key={c} style={{
                position: 'absolute', bottom: 0, left: `${(c / total) * 100}%`, width: here ? 2 : 1, marginLeft: here ? -1 : 0,
                height: here ? 16 : intoMove % 4 === 0 ? 10 : 6, background: here ? '#fff' : 'rgba(255,255,255,0.5)', pointerEvents: 'none',
                boxShadow: wave ? '0 0 0 1px var(--bg-deep)' : undefined, // a dark edge keeps ticks readable over the waveform
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
      </div>
        {total > 0 && <div style={short ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, flex: 'none', alignContent: 'center' } // two across: as tall as the slim track
          : { display: 'flex', flexDirection: 'column', flex: 'none', gap: 2, justifyContent: 'center' }} role="group" aria-label="Timeline zoom">
          <button aria-label="Zoom the timeline out" title="Zoom the timeline out" disabled={!perCount} onClick={() => zoom(1 / 1.5)}><IconZoomOut /></button>
          <button aria-label="Zoom the timeline in" title="Zoom the timeline in (then scroll, or right-drag, to move along)" disabled={(perCount ?? fitPpc) >= 60} onClick={() => zoom(1.5)}><IconZoomIn /></button>
          <button aria-label="Fit the whole show" title="Fit the whole show in the timeline" disabled={!perCount || fullW <= viewW} onClick={() => setPpc(null)} style={short ? { gridColumn: '1 / -1' } : undefined}>Fit</button>
        </div>}
      </div>
    </div>
  );
}

/** The current set's controls (shown in the top bar). Mid-move, "current" is the set being moved into. */
export function SetControls({ show, setShow, t, setT }: { show: Show; setShow: (f: (s: Show) => Show) => void; t: number; setT: (t: number) => void }) {
  const starts = setStarts(show);
  const onSet = setAt(show, t);
  const cur = onSet >= 0 ? onSet : locate(show, t).to;
  const [at, setAtCount] = useState('');
  // Count-first: a typed count, or the playhead when it's between sets or past them, gets a set right there (other sets stay put).
  const target = at.trim() ? Number(at) : onSet < 0 ? Math.round(t) : null;
  const add = () => {
    if (target === null) { setShow((s) => addSetAfter(s, cur)); setT(starts[cur] + 16); return; }
    if (!Number.isFinite(target) || target < 1) return;
    let landed = 0;
    setShow((s) => { const r = insertSetAt(s, target); landed = setStarts(r.show)[r.index]; return r.show; });
    setT(landed || Math.round(target)); setAtCount('');
  };
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <strong>Set {show.sets[cur].name}</strong>
      <label>Counts{' '}
        <input type="number" min={1} aria-label="Counts" disabled={cur === 0} title={cur === 0 ? 'The opening set has no move into it' : undefined}
          value={cur === 0 ? '' : show.sets[cur].counts} style={{ width: 46 }}
          onChange={(e) => setShow((s) => setCounts(s, cur, Number(e.target.value)))} />
      </label>
      <label>Measures{' '}
        <input aria-label="Measures" placeholder={cur > 0 ? 'e.g. 9–12' : 'e.g. 1–4'} value={show.sets[cur].measures ?? ''} style={{ width: 64 }}
          onChange={(e) => setShow((s) => setMeasures(s, cur, e.target.value))} />
      </label>
      <button onClick={add} title={target === null ? 'Add a new set after this one (16 counts; later sets move along). Or type a count to add a set there.' : `Add a set landing on count ${target}; every other set stays where it is`}>+ Add set</button>
      <label>at count{' '}
        <input type="number" min={1} aria-label="Add set at count" placeholder={onSet < 0 ? String(Math.round(t)) : ''} value={at} style={{ width: 52 }}
          onChange={(e) => setAtCount(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
      </label>
      <button disabled={show.sets.length < 2} onClick={() => { setShow((s) => removeSet(s, cur)); setT(starts[Math.max(0, cur - 1)]); }}>Delete set</button>
    </div>
  );
}

/** The show's music in named stretches, typed up front (count-first). The timeline runs to their total. */
function Movements({ show, setShow }: { show: Show; setShow: (f: (s: Show) => Show) => void }) {
  const list = show.movements ?? [];
  const edit = (f: (m: NonNullable<Show['movements']>) => NonNullable<Show['movements']>) =>
    setShow((s) => { const m = f(s.movements ?? []); if (m.length) return { ...s, movements: m }; const { movements: _, ...rest } = s; return rest; });
  const total = list.reduce((n, m) => n + m.counts, 0), written = totalCounts(show);
  return (
    <Menu label={list.length ? `Movements (${total} cts)` : 'Movements'} title="Set the show's length in counts up front, one movement per tune">
      {() => <>
        <p style={{ margin: 0, fontSize: 12, maxWidth: 300, whiteSpace: 'normal' }}>Type each tune's total counts. The timeline runs to the total, so you can add sets at any count, in any order (+ Add set, at count).</p>
        {list.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input aria-label={`Movement ${i + 1} name`} value={m.name} maxLength={100} style={{ width: 120 }}
              onChange={(e) => edit((l) => l.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))} />
            <input aria-label={`Movement ${i + 1} counts`} type="number" min={1} value={m.counts} style={{ width: 64 }}
              onChange={(e) => { const n = Math.round(Number(e.target.value)); if (n >= 1 && n <= MAX_MOVEMENT) edit((l) => l.map((x) => (x.id === m.id ? { ...x, counts: n } : x))); }} /> cts
            <button aria-label={`Remove movement ${m.name}`} onClick={() => edit((l) => l.filter((x) => x.id !== m.id))}>×</button>
          </div>
        ))}
        <button onClick={() => edit((l) => [...l, { id: newId('mv'), name: l.length ? `Movement ${l.length + 1}` : show.title || 'Movement 1', counts: l.length ? 64 : Math.max(written, 64) }])}>+ Add movement</button>
        {list.length > 0 && <p style={{ margin: 0, fontSize: 12 }}>Total {total} counts · {written} written{written > total ? ` (the sets run ${written - total} past the total)` : ''}</p>}
      </>}
    </Menu>
  );
}

/**
 * The recording's waveform along the bottom of the timeline, under the count ticks. Each pixel covers its counts'
 * stretch of the recording (through the tapped counts), so loud and quiet passages line up with the counts.
 */
function Wave({ wave, total }: { wave: NonNullable<Props['wave']>; total: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => setW(c.clientWidth));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = ref.current!, dpr = window.devicePixelRatio || 1, H = 22;
    c.width = Math.min(16384, Math.round(w * dpr)); c.height = H * dpr; // canvases have a size limit; a zoomed-in timeline is stretched
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = PALETTE['green-line'];
    const mid = c.height / 2;
    for (let x = 0; x < c.width; x++) {
      const c0 = (x / c.width) * total, c1 = ((x + 1) / c.width) * total;
      const v = peakBetween(wave.peaks, 100, timeAt(wave.taps, c0), timeAt(wave.taps, c1));
      const h = Math.max(dpr * 0.5, v * mid);
      ctx.fillRect(x, mid - h, 1, h * 2);
    }
  }, [w, wave, total]);
  return <canvas ref={ref} aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 22, pointerEvents: 'none', opacity: 0.75 }} />; // 3.8:1 or more on every timeline background
}
