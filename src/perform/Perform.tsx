// Performer / staff view: read-only playback of a shared show, centered on "my" dot. Built for phones (portrait).
import { useEffect, useMemo, useRef, useState } from 'react';
import { readout, type Point } from '../engine/coords';
import { decodeShow, SHARE_PREFIX } from '../engine/share';
import { label, locate, moveSteps, parseShow, positionsAt, setAt, setStarts, type Show } from '../engine/show';
import { drawField, drawMarks, drawPerformers, fitView, TIER_COLOR, toScreen, type View } from '../field/drawField';
import { fmtStep } from '../ui/format';
import { usePlayback } from '../ui/usePlayback';
import { describe, nearest } from './neighbors';

const STORE = 'freeform:performer'; // separate from the editor's autosave, so opening a link never touches a director's work
const STAFF = 'staff';
const FOLLOW_STEPS = 36; // how much field fits across the screen when following a performer

interface Saved { show: Show; me: string | null; facingFront: boolean; follow: boolean }

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { show: parseShow(JSON.stringify(s.show)), me: s.me ?? null, facingFront: !!s.facingFront, follow: s.follow !== false };
  } catch { return null; }
}
const save = (s: Saved) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* private mode: nothing kept */ } };

export function Perform() {
  const [state, setState] = useState<Saved | null>(loadSaved);
  const [error, setError] = useState('');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const dpr = window.devicePixelRatio || 1;

  // Opening a share link: unpack it, keep it on this phone, and tidy the address bar.
  useEffect(() => {
    if (!location.hash.startsWith(SHARE_PREFIX)) return;
    decodeShow(location.hash.slice(SHARE_PREFIX.length))
      .then((show) => {
        const prev = loadSaved();
        const keepMe = prev?.me && (prev.me === STAFF || show.performers.some((p) => p.id === prev.me)) ? prev.me : null;
        const next = { show, me: keepMe, facingFront: prev?.facingFront ?? false, follow: prev?.follow ?? true };
        save(next); setState(next); setT(0); setError('');
        history.replaceState(null, '', location.pathname + '#perform');
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const update = (patch: Partial<Saved>) => setState((s) => { if (!s) return s; const n = { ...s, ...patch }; save(n); return n; });

  const show = state?.show;
  const starts = useMemo(() => (show ? setStarts(show) : [0]), [show]);
  const total = starts.at(-1)!;
  const span = useMemo<[number, number]>(() => [0, total], [total]);
  usePlayback(playing, setPlaying, t, setT, bpm, span, false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; setSize([c.width, c.height]); });
    ro.observe(c);
    return () => ro.disconnect();
  }, [dpr, !!show]);

  const me = state?.me && state.me !== STAFF ? show?.performers.find((p) => p.id === state.me) : undefined;
  const positions = useMemo(() => (show ? positionsAt(show, t) : {}), [show, t]);
  const onSet = show ? setAt(show, t) : -1;
  const { to, count } = show ? locate(show, t) : { to: 0, count: 0 };
  const cur = onSet >= 0 ? onSet : to;
  const next = onSet >= 0 ? onSet + 1 : to; // the set I'm heading to
  const hasNext = !!show && next < show.sets.length && (onSet < 0 || onSet + 1 < show.sets.length);

  const around = useMemo(() => (me ? nearest(positions, me.id) : []), [positions, me]);

  // My path into the next set, sampled count by count (so follow-the-leader trails come out right).
  const myPath = useMemo<Point[]>(() => {
    if (!show || !me || !hasNext) return [];
    const a = starts[next - 1], b = starts[next], n = Math.max(2, Math.ceil(b - a));
    return Array.from({ length: n + 1 }, (_, k) => positionsAt(show, a + ((b - a) * k) / n)[me.id]);
  }, [show, me, hasNext, next, starts]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !show || !size[0]) return;
    const ctx = c.getContext('2d')!;
    const [W, H] = size;
    const follow = !!me && state!.follow;
    let v: View = fitView(W, H);
    if (follow) {
      const p = positions[me!.id], scale = W / FOLLOW_STEPS;
      v = { scale, ox: W / 2 - p.x * scale, oy: H / 2 + p.y * scale };
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (state!.facingFront) ctx.setTransform(-1, 0, 0, -1, W, H); // turn the field around: front sideline at the top
    drawField(ctx, v, show.hash);
    if (onSet >= 0) drawMarks(ctx, v, show.sets[onSet].marks ?? [], 'screen');
    if (!me) {
      drawPerformers(ctx, v, show.performers.filter((p) => positions[p.id]).map((p) => ({ id: p.id, label: state!.facingFront ? '' : label(show, p), at: positions[p.id] })), new Set(), []);
    } else {
      const s = v.scale;
      for (const p of show.performers) {
        if (p.id === me.id || !positions[p.id]) continue;
        const q = toScreen(v, positions[p.id]);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(3, s * 0.3), 0, Math.PI * 2); ctx.fill();
      }
      if (myPath.length) {
        ctx.setLineDash([s * 0.5, s * 0.35]);
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = Math.max(2, s * 0.15);
        ctx.beginPath(); myPath.forEach((p, k) => { const q = toScreen(v, p); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.stroke();
        ctx.setLineDash([]);
        const end = toScreen(v, myPath.at(-1)!);
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = Math.max(2, s * 0.12);
        ctx.beginPath(); ctx.arc(end.x, end.y, Math.max(6, s * 0.55), 0, Math.PI * 2); ctx.stroke();
      }
      const q = toScreen(v, positions[me.id]);
      ctx.fillStyle = '#ffd166'; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, s * 0.15);
      ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(7, s * 0.6), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Neighbors: a brighter dot each, so "who I'm next to" stands out from the rest of the band.
      for (const n of around) {
        const nq = toScreen(v, positions[n.id]);
        ctx.fillStyle = '#e8f1ff';
        ctx.beginPath(); ctx.arc(nq.x, nq.y, Math.max(4, s * 0.38), 0, Math.PI * 2); ctx.fill();
      }
      // Labels stay upright either way: mine, plus my nearest neighbors'.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const flip = (pt: { x: number; y: number }) => (state!.facingFront ? { x: W - pt.x, y: H - pt.y } : pt);
      const tag = (text: string, at: { x: number; y: number }, px: number, color: string) => {
        ctx.font = `700 ${px * dpr}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.lineWidth = 4 * dpr; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.strokeText(text, at.x, at.y - 10 * dpr);
        ctx.fillStyle = color; ctx.fillText(text, at.x, at.y - 10 * dpr);
      };
      for (const n of around) {
        const nq = flip(toScreen(v, positions[n.id]));
        tag(label(show, show.performers.find((x) => x.id === n.id)!), nq, 12, '#e8f1ff');
      }
      tag(label(show, me), flip(q), 14, '#fff');
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [show, size, positions, me, state, onSet, myPath, dpr, around]);

  if (!show) {
    return (
      <main className="perform-empty">
        <h1>Freeform</h1>
        {error ? <p role="alert">{error}</p> : <p>Open the show link your director sent you. It will be saved on this phone and work offline after that.</p>}
      </main>
    );
  }

  const steps = me && hasNext ? moveSteps(show, next)[me.id] : null;
  const s = show.sets[cur], nx = hasNext ? show.sets[next] : null;
  const myCue = (i: number) => (me ? show.sets[i]?.cues?.[me.id] : undefined);
  const btn: React.CSSProperties = { fontSize: 18, minWidth: 44, minHeight: 40 };

  return (
    <div className="perform">
      <header className="perform-bar">
        <select aria-label="Who are you?" value={state!.me ?? ''} onChange={(e) => update({ me: e.target.value || null })} style={{ fontSize: 16, maxWidth: '55%' }}>
          <option value="">Who are you?</option>
          <option value={STAFF}>Staff (whole band)</option>
          {show.sections.map((sec) => {
            const ps = show.performers.filter((p) => p.section === sec.id).sort((a, b) => a.number - b.number);
            return ps.length ? <optgroup key={sec.id} label={sec.name}>{ps.map((p) => <option key={p.id} value={p.id}>{label(show, p)}</option>)}</optgroup> : null;
          })}
        </select>
        <span className="perform-title">{show.title}</span>
      </header>
      <div className="perform-field">
        <canvas ref={canvasRef} aria-label="Field" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
        <div className="perform-toggles">
          <button aria-pressed={state!.facingFront} onClick={() => update({ facingFront: !state!.facingFront })}>{state!.facingFront ? 'Facing front' : 'Director view'}</button>
          {me && <button aria-pressed={state!.follow} onClick={() => update({ follow: !state!.follow })}>{state!.follow ? 'Following me' : 'Whole field'}</button>}
        </div>
      </div>
      <section className="perform-info" aria-live="off">
        <div className="perform-set">
          <strong>Set {s.name}</strong>
          {cur > 0 && <span> · {s.counts} cts</span>}
          {s.measures && <span> · m. {s.measures}</span>}
          {onSet < 0 && <span> · count {Math.floor(count)} of {s.counts}</span>}
        </div>
        {me ? (
          <>
            <p className="perform-coord"><span className="perform-k">{onSet >= 0 ? 'My spot' : 'Now'}</span> {readout(positions[me.id], show.hash)}</p>
            {nx && (
              <p className="perform-coord">
                <span className="perform-k">Next: set {nx.name} in {nx.counts} cts{nx.measures ? ` (m. ${nx.measures})` : ''}</span>{' '}
                {readout(nx.pos[me.id], show.hash)}
                {steps && <span style={{ color: steps.tier === 'ok' ? '#cfe' : TIER_COLOR[steps.tier] }}> · {fmtStep(steps.per5)}</span>}
              </p>
            )}
            {around.length > 0 && (
              <div className="perform-note">
                <span className="perform-k">Around you</span>
                <ul className="perform-around">
                  {around.map((n) => (
                    <li key={n.id}><strong>{label(show, show.performers.find((x) => x.id === n.id)!)}</strong> · {describe(n.dx, n.dy)}</li>
                  ))}
                </ul>
              </div>
            )}
            {myCue(cur) && <p className="perform-note"><span className="perform-k">My notes</span> {myCue(cur)}</p>}
          </>
        ) : state!.me === STAFF ? null : (
          <p className="perform-note">Pick who you are above to see your spot.</p>
        )}
        {s.note && <p className="perform-note"><span className="perform-k">Ensemble</span> {s.note}</p>}
      </section>
      <footer className="perform-controls">
        <input type="range" aria-label="Count" min={0} max={total} step={1} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} disabled={!total} />
        <div className="perform-buttons">
          <button style={btn} aria-label="Previous count" onClick={() => { setPlaying(false); setT(Math.max(0, Math.ceil(t) - 1)); }}>◀</button>
          <button style={btn} aria-label={playing ? 'Pause' : 'Play'} disabled={!total} onClick={() => setPlaying(!playing)}>{playing ? '⏸' : '▶'}</button>
          <button style={btn} aria-label="Next count" onClick={() => { setPlaying(false); setT(Math.min(total, Math.floor(t) + 1)); }}>▶︎|</button>
          <select aria-label="Go to set" value={onSet >= 0 ? onSet : ''} onChange={(e) => { setPlaying(false); setT(starts[Number(e.target.value)]); }} style={{ fontSize: 16 }}>
            {onSet < 0 && <option value="">Set…</option>}
            {show.sets.map((x, i) => <option key={x.id} value={i}>Set {x.name}</option>)}
          </select>
          <label style={{ fontSize: 14 }}><input aria-label="Tempo" type="number" min={20} max={300} value={bpm} onChange={(e) => setBpm(Number(e.target.value) || 120)} style={{ width: 52, fontSize: 16 }} /> bpm</label>
        </div>
      </footer>
    </div>
  );
}
