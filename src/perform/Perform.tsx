// Performer / staff view: read-only playback of a shared show, centered on "my" dot. Built for phones (portrait).
import { useEffect, useMemo, useRef, useState } from 'react';
import { readout, type Point } from '../engine/coords';
import { decodeShow, fetchShow, LOAD_PREFIX, linkHash, parseHosted, SHARE_PREFIX } from '../engine/share';
import { Scanner } from './Scanner';
import { isPhone } from './device';
import { label, locate, moveSteps, parseShow, positionsAt, setAt, setStarts, type Show } from '../engine/show';
import { drawField, drawMarks, drawPerformers, fitView, TIER_COLOR, toScreen, type View } from '../field/drawField';
import { fmtStep } from '../ui/format';
import { usePlayback } from '../ui/usePlayback';
import { IconNext, IconPause, IconPlay, IconPrev } from '../ui/icons';
import { describe, nearest, yardLabel } from './neighbors';
import { panCenter, pinchZoom } from './gestures';

const STORE = 'freeform:performer'; // separate from the editor's autosave, so opening a link never touches a director's work
const STAFF = 'staff';
const FOLLOW_STEPS = 36; // how much field fits across the screen when following a performer

/** `source`: the hosted link ("#load=…", with its key) a show came from, so the phone can pick up updates when online. */
interface Saved { show: Show; me: string | null; facingFront: boolean; follow: boolean; source?: string }

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { show: parseShow(JSON.stringify(s.show)), me: s.me ?? null, facingFront: !!s.facingFront, follow: s.follow !== false, source: typeof s.source === 'string' && parseHosted(s.source) ? s.source : undefined };
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

  const [notice, setNotice] = useState('');
  // Keep a newly arrived show on this phone; keep "who I am" if that performer is still in it.
  const adopt = (show: Show, source: string | undefined, fresh: boolean) => {
    const prev = loadSaved();
    const keepMe = prev?.me && (prev.me === STAFF || show.performers.some((p) => p.id === prev.me)) ? prev.me : null;
    const next = { show, me: keepMe, facingFront: prev?.facingFront ?? false, follow: prev?.follow ?? true, source };
    save(next); setState(next); setError('');
    if (fresh) setT(0);
  };

  // Opening a link: a share link carries the show; a hosted link (#load=) says where to download it.
  useEffect(() => {
    const done = () => history.replaceState(null, '', location.pathname + '#perform');
    const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));
    if (location.hash.startsWith(SHARE_PREFIX)) {
      decodeShow(location.hash.slice(SHARE_PREFIX.length)).then((show) => { adopt(show, undefined, true); done(); }).catch(fail);
      return;
    }
    if (location.hash.startsWith(LOAD_PREFIX)) {
      const hash = location.hash;
      fetchShow(hash).then((show) => { adopt(show, hash, true); done(); }).catch(fail);
      return;
    }
    // Reopening a hosted show: quietly check for a newer version when online. Offline, the saved copy is used.
    const saved = loadSaved();
    if (saved?.source && navigator.onLine) {
      fetchShow(saved.source).then((show) => {
        if (JSON.stringify(show) !== JSON.stringify(saved.show)) { adopt(show, saved.source, false); setNotice('Show updated.'); }
      }).catch(() => { /* keep the saved copy */ });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<Saved>) => setState((s) => { if (!s) return s; const n = { ...s, ...patch }; save(n); return n; });

  const show = state?.show;
  const starts = useMemo(() => (show ? setStarts(show) : [0]), [show]);
  const total = starts.at(-1)!;
  const span = useMemo<[number, number]>(() => [0, total], [total]);
  usePlayback(playing, setPlaying, t, setT, bpm, span, false, total);

  // Keep the screen awake while the show plays (where the browser allows it), so the phone doesn't dim mid-rep.
  useEffect(() => {
    if (!playing || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null, live = true;
    const grab = () => navigator.wakeLock.request('screen').then((l) => { if (live) lock = l; else l.release(); }).catch(() => { /* not allowed here */ });
    grab();
    const again = () => { if (document.visibilityState === 'visible') grab(); }; // the lock drops when the app is hidden
    document.addEventListener('visibilitychange', again);
    return () => { live = false; document.removeEventListener('visibilitychange', again); lock?.release(); };
  }, [playing]);

  // Pinch zoom (both views) and drag to look around (whole field). Not saved: switching views resets it.
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0, y: 42 });
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const viewRef = useRef<View | null>(null);
  // Older iOS Safari pinches the whole page with its own gesture events; keep the pinch on the field.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const stop = (e: Event) => e.preventDefault();
    c.addEventListener('gesturestart', stop);
    c.addEventListener('gesturechange', stop);
    return () => { c.removeEventListener('gesturestart', stop); c.removeEventListener('gesturechange', stop); };
  }, [!!show]); // eslint-disable-line react-hooks/exhaustive-deps

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
  // Keep the current set's button in view as playback moves along a long show.
  const setStrip = useRef<HTMLDivElement>(null);
  // Fade whichever edge of the set row has more sets past it, so it's clear the row scrolls.
  const [more, setMore] = useState('');
  const checkMore = () => {
    const e = setStrip.current;
    if (!e) return;
    const left = e.scrollLeft > 1, right = e.scrollLeft + e.clientWidth < e.scrollWidth - 1;
    setMore(left && right ? 'both' : left ? 'left' : right ? 'right' : '');
  };
  useEffect(() => {
    if (onSet >= 0) (setStrip.current?.children[onSet] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest', inline: 'center' });
    checkMore();
  }, [onSet, show]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { addEventListener('resize', checkMore); return () => removeEventListener('resize', checkMore); }, []);
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
    let v: View;
    if (follow) {
      const p = positions[me!.id], scale = (W / FOLLOW_STEPS) * zoom;
      v = { scale, ox: W / 2 - p.x * scale, oy: H / 2 + p.y * scale };
    } else {
      const scale = fitView(W, H).scale * zoom;
      v = { scale, ox: W / 2 - center.x * scale, oy: H / 2 + center.y * scale };
    }
    viewRef.current = v;
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
    if (follow || zoom > 1) {
      // Zoomed in, the painted yard numbers are usually off screen: pin a yard-line ruler to the bottom edge.
      const band = 22 * dpr;
      ctx.fillStyle = 'rgba(16,24,18,0.85)';
      ctx.fillRect(0, H - band, W, band);
      ctx.font = `700 ${12 * dpr}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let x = -80; x <= 80; x += 8) {
        const sx = toScreen(v, { x, y: 0 }).x, at = state!.facingFront ? W - sx : sx;
        if (at < -40 * dpr || at > W + 40 * dpr) continue;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(at - dpr, H - band, 2 * dpr, 5 * dpr); // tick where the line meets the ruler
        ctx.fillStyle = '#fff';
        ctx.fillText(yardLabel(x), at, H - band / 2 + 2 * dpr);
      }
    }
  }, [show, size, positions, me, state, onSet, myPath, dpr, around, zoom, center]);

  if (!show) {
    return (
      <main className="perform-empty">
        <h1>Freeform</h1>
        {error ? <p role="alert">{error}</p>
          : location.hash.startsWith(LOAD_PREFIX) ? <p>Downloading the show…</p>
          : <p>Open the show link your director sent you. It will be saved on this phone and work offline after that.</p>}
        <PasteLink />
        {!isPhone() && <p><a href="#" style={{ color: '#9cf' }} onClick={(e) => { e.preventDefault(); toEditor(); }}>← Editor</a></p>}
      </main>
    );
  }

  const steps = me && hasNext ? moveSteps(show, next)[me.id] : null;
  const s = show.sets[cur], nx = hasNext ? show.sets[next] : null;
  const myCue = (i: number) => (me ? show.sets[i]?.cues?.[me.id] : undefined);
  const btn: React.CSSProperties = { fontSize: 18, minWidth: 44, minHeight: 40, display: 'grid', placeItems: 'center' };

  return (
    <div className="perform">
      <header className="perform-bar">
        <select aria-label="Who are you?" value={state!.me ?? ''} onChange={(e) => { update({ me: e.target.value || null }); setZoom(1); setCenter({ x: 0, y: 42 }); }} style={{ fontSize: 16, maxWidth: '55%' }}>
          <option value="">Who are you?</option>
          <option value={STAFF}>Staff (whole band)</option>
          {show.sections.map((sec) => {
            const ps = show.performers.filter((p) => p.section === sec.id).sort((a, b) => a.number - b.number);
            return ps.length ? <optgroup key={sec.id} label={sec.name}>{ps.map((p) => <option key={p.id} value={p.id}>{label(show, p)}</option>)}</optgroup> : null;
          })}
        </select>
        <span className="perform-title">{error ? <span role="alert" title={error} style={{ color: '#f99' }}>{error} Showing your saved copy. </span>
          : notice ? <span role="status" style={{ color: '#9f9' }}>{notice} </span> : null}{show.title}</span>
        {!isPhone() && <button onClick={toEditor} title="Back to the drill editor" style={{ fontSize: 14 }}>← Editor</button>}
      </header>
      <div className="perform-field">
        <canvas ref={canvasRef} aria-label="Field" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (touches.current.size === 2) {
              const [a, b] = [...touches.current.values()];
              pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
            }
          }}
          onPointerMove={(e) => {
            const prev = touches.current.get(e.pointerId);
            if (!prev) return;
            touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (touches.current.size === 2 && pinch.current) {
              const [a, b] = [...touches.current.values()];
              setZoom(pinchZoom(pinch.current.zoom, pinch.current.dist, Math.hypot(a.x - b.x, a.y - b.y)));
            }
            // In My view the camera stays on my dot; elsewhere, dragging (one finger or two) moves around the field.
            if (!(me && state!.follow) && viewRef.current) {
              const share = touches.current.size; // two fingers each move half the drag
              setCenter((c) => panCenter(c, ((e.clientX - prev.x) * dpr) / share, ((e.clientY - prev.y) * dpr) / share, viewRef.current!.scale, state!.facingFront));
            }
          }}
          onPointerUp={(e) => { touches.current.delete(e.pointerId); if (touches.current.size < 2) pinch.current = null; }}
          onPointerCancel={(e) => { touches.current.delete(e.pointerId); pinch.current = null; }} />
        <div className="perform-toggles">
          <button aria-pressed={state!.facingFront} onClick={() => update({ facingFront: !state!.facingFront })}>{state!.facingFront ? 'Facing front' : 'Director view'}</button>
          {(zoom !== 1 || center.x !== 0 || center.y !== 42) && <button onClick={() => { setZoom(1); setCenter({ x: 0, y: 42 }); }}>Reset zoom</button>}
          {me && <button aria-pressed={state!.follow} onClick={() => { update({ follow: !state!.follow }); setZoom(1); setCenter({ x: 0, y: 42 }); }}>{state!.follow ? 'My view' : 'Whole field'}</button>}
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
        <details style={{ marginTop: 10, fontSize: 14 }}>
          <summary>Open a different show</summary>
          <PasteLink />
        </details>
      </section>
      <footer className="perform-controls">
        <div className="perform-sets" data-more={more} ref={setStrip} onScroll={checkMore} role="group" aria-label="Go to set">
          {show.sets.map((x, i) => (
            <button key={x.id} aria-pressed={i === onSet} onClick={() => { setPlaying(false); setT(starts[i]); }}>{x.name}</button>
          ))}
        </div>
        <input type="range" aria-label="Count" min={0} max={total} step={1} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} disabled={!total} />
        <div className="perform-buttons">
          <button style={btn} aria-label="Previous count" onClick={() => { setPlaying(false); setT(Math.max(0, Math.ceil(t) - 1)); }}><IconPrev /></button>
          <button style={btn} aria-label={playing ? 'Pause' : 'Play'} disabled={!total || (!playing && t >= total)} title={t >= total ? 'End of the show: tap set 1 (or another set) to play from there' : undefined} onClick={() => setPlaying(!playing)}>{playing ? <IconPause /> : <IconPlay />}</button>
          <button style={btn} aria-label="Next count" onClick={() => { setPlaying(false); setT(Math.min(total, Math.floor(t) + 1)); }}><IconNext /></button>
          <label style={{ fontSize: 14 }}><input aria-label="Tempo" type="number" min={20} max={300} value={bpm} onChange={(e) => setBpm(Number(e.target.value) || 120)} style={{ width: 52, fontSize: 16 }} /> bpm</label>
        </div>
      </footer>
    </div>
  );
}

const toEditor = () => { location.hash = ''; location.reload(); };

/** For the home-screen app, which has no address bar: paste a share link to open it here. */
function PasteLink() {
  const [text, setText] = useState('');
  const [bad, setBad] = useState(false);
  const open = () => {
    const hash = linkHash(text);
    if (!hash) { setBad(true); return; }
    location.hash = hash;
  };
  const [scan, setScan] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      <input aria-label="Paste a share link" placeholder="Paste a share link" value={text} onChange={(e) => { setText(e.target.value); setBad(false); }}
        style={{ flex: 1, minWidth: 180, fontSize: 16 }} />
      <button onClick={open} disabled={!text.trim()} style={{ fontSize: 16 }}>Open</button>
      {'mediaDevices' in navigator && <button onClick={() => setScan(true)} style={{ fontSize: 16 }}>Scan QR code</button>}
      {scan && <Scanner onClose={() => setScan(false)} />}
      {bad && <span role="alert" style={{ width: '100%', color: '#ff8080' }}>That doesn't look like a Freeform share link.</span>}
    </div>
  );
}
