import { PALETTE, useTheme } from '../ui/palette';
import { ThemeButton } from '../ui/ThemeButton';
// Performer / staff view: read-only playback of a shared show, centered on "my" dot. Built for phones (portrait).
import { useEffect, useMemo, useRef, useState } from 'react';
import { fieldDepth, readout, type Point } from '../engine/coords';
import { decodeShow, fetchHosted, LOAD_PREFIX, linkHash, parseHosted, SHARE_PREFIX } from '../engine/share';
import { Scanner } from './Scanner';
import { isPhone } from './device';
import { colorOf, fieldOf, propsAt, locate, mark, moveSteps, timingOf, parseShow, positionsAt, setAt, setStarts, showLength, type Show } from '../engine/show';
import { drawField, drawGlyph, drawLabels, drawMarks, drawPerformers, drawProps, fitView, STEP_TEXT, toScreen, type View } from '../field/drawField';
import { fmtStep } from '../ui/format';
import { usePlayback } from '../ui/usePlayback';
import { clickWanted, setClickWanted, wakeClick } from '../ui/click';
import { synced } from '../engine/music';
import { deleteAudio, getAudio, putAudio } from '../ui/audioStore';
import { IconNext, IconPause, IconPlay, IconPrev } from '../ui/icons';
import { nearest, yardLabel } from './neighbors';
import { panCenter, pinchZoom, ZOOM_MAX } from './gestures';
import { WhoPicker } from './WhoPicker';
import { NumberField } from '../ui/NumberField';
import { AUTOSAVE } from '../App';
import { addShow, readLibrary, removeShow, STAFF, type Library, type Saved } from './library';

/** "3:42 PM" today, "Nov 5" before that. */
const checkedAt = (ms: number) => new Date(ms).toDateString() === new Date().toDateString()
  ? new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric' });
const STORE = 'freeform:performer'; // separate from the editor's autosave, so opening a link never touches a director's work
const FOLLOW_STEPS = 36; // how much field fits across the screen when following a performer

const loadLib = (): Library => { try { return readLibrary(localStorage.getItem(STORE)); } catch { return { shows: [], current: 0 }; } };
const saveLib = (l: Library) => { try { localStorage.setItem(STORE, JSON.stringify(l)); } catch { /* private mode: nothing kept */ } };

/** The editor's Performer view: "#perform-editor=<performer id>" shows the editor's own show from that performer, kept off this device's saved show. */
export const PREVIEW = '#perform-editor';
function loadPreview(): Saved | null {
  if (!location.hash.startsWith(PREVIEW)) return null;
  try {
    const show = parseShow(localStorage.getItem(AUTOSAVE) ?? ''), id = decodeURIComponent(location.hash.slice(PREVIEW.length + 1));
    return { show, me: show.performers.some((p) => p.id === id) ? id : STAFF, facingFront: false, follow: true };
  } catch { return null; } // no readable show in the editor: the saved-show screen, as before
}

export function Perform() {
  const [previewState, setPreviewState] = useState<Saved | null>(loadPreview); // the editor's show: never saved over this device's shows
  const preview = !!previewState;
  const [lib, setLibState] = useState<Library>(loadLib);
  const libRef = useRef(lib); libRef.current = lib; // for downloads that finish later
  const setLib = (l: Library) => { libRef.current = l; saveLib(l); setLibState(l); };
  const state = previewState ?? lib.shows[lib.current] ?? null;
  const theme = useTheme();
  const [error, setError] = useState('');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const dpr = window.devicePixelRatio || 1;

  const [notice, setNotice] = useState('');
  const [audioVer, setAudioVer] = useState(0); // bumped when a recording arrives, to (re)load it
  // The show's recording from a hosted file goes in this phone's storage (too big for localStorage), under the show's audio id.
  const keepAudio = async (show: Show, audio: Blob | undefined, prev: Show | undefined) => {
    if (!audio || !show.music) return;
    if (await putAudio(show.music.audioId, audio)) setAudioVer((v) => v + 1);
    const old = prev?.music?.audioId;
    if (old && old !== show.music.audioId) deleteAudio(old);
  };
  // A recording no show on the phone uses any more goes too.
  const dropAudio = (gone: Saved | undefined, l: Library) => {
    const id = gone?.show.music?.audioId;
    if (id && !l.shows.some((s) => s.show.music?.audioId === id)) deleteAudio(id);
  };
  // Keep a newly arrived show in the phone's list and open it (the same show again replaces itself; see addShow).
  const adopt = (show: Show, source: string | undefined, fresh: boolean, audio?: Blob) => {
    const r = addShow(libRef.current, show, source);
    setLib(r.lib); setError('');
    keepAudio(show, audio, r.replaced?.show);
    dropAudio(r.dropped, r.lib);
    if (fresh) setT(0);
  };
  // When this phone last reached a hosted show's file, so "do you have the latest?" has an answer on screen.
  const markChecked = (source: string) => { const l = libRef.current; setLib({ ...l, shows: l.shows.map((x) => (x.source === source ? { ...x, checked: Date.now() } : x)) }); };
  // Opening a hosted show: quietly check for a newer version when online. Offline, the saved copy is used.
  const checkHosted = () => {
    const saved = libRef.current.shows[libRef.current.current];
    if (!saved?.source || !navigator.onLine) return;
    // An unchanged file isn't downloaded again: the fetch revalidates (cache: 'no-cache'), and GitHub answers 304 for the same ETag.
    fetchHosted(saved.source).then(({ show, audio }) => {
      if (JSON.stringify(show) !== JSON.stringify(saved.show)) { adopt(show, saved.source, false, audio); setNotice(show.revision ? `Updated to revision ${show.revision}.` : 'Show updated.'); }
      else keepAudio(show, audio, saved.show); // same show; the recording may be new (added to the file later)
      markChecked(saved.source!);
    }).catch(() => { /* keep the saved copy */ });
  };
  const switchTo = (i: number) => { setLib({ ...libRef.current, current: i }); setT(0); setPlaying(false); setNotice(''); setError(''); checkHosted(); };
  const [adding, setAdding] = useState(false); // the paste-a-link / scan panel, to add another show
  const remove = (i: number) => {
    const l = removeShow(libRef.current, i);
    setLib(l); dropAudio(libRef.current.shows[i], l); setT(0); setPlaying(false);
  };

  // Opening a link: a share link carries the show; a hosted link (#load=) says where to download it.
  useEffect(() => {
    if (preview) return;
    const done = () => history.replaceState(null, '', location.pathname + '#perform');
    const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));
    if (location.hash.startsWith(SHARE_PREFIX)) {
      decodeShow(location.hash.slice(SHARE_PREFIX.length)).then((show) => { adopt(show, undefined, true); done(); }).catch(fail);
      return;
    }
    if (location.hash.startsWith(LOAD_PREFIX)) {
      const hash = location.hash;
      fetchHosted(hash).then((r) => { adopt(r.show, hash, true, r.audio); markChecked(hash); done(); }).catch(fail);
      return;
    }
    checkHosted();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<Saved>) => {
    if (preview) { setPreviewState((s) => s && { ...s, ...patch }); return; }
    const l = libRef.current;
    if (l.shows[l.current]) setLib({ ...l, shows: l.shows.map((s, i) => (i === l.current ? { ...s, ...patch } : s)) });
  };

  const show = state?.show;
  const starts = useMemo(() => (show ? setStarts(show) : [0]), [show]);
  const total = show ? showLength(show) : 0;
  // Practice a few sets over and over ("work 8–10 tonight"): set indexes, or null to play through the show.
  const [loop, setLoop] = useState<[number, number] | null>(null);
  const [picking, setPicking] = useState<[number, number] | null>(null); // the Loop panel's choice while it's open
  useEffect(() => { setLoop(null); setPicking(null); }, [lib.current, show?.sets.length]); // another show, or sets added or removed in an update
  const span = useMemo<[number, number]>(() => (loop ? [starts[loop[0]], starts[loop[1]]] : [0, total]), [loop, starts, total]);
  // Play with the recording when this phone has it and the show has tapped counts; "♪ Music" off goes back to Tempo.
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [useMusic, setUseMusic] = useState(true);
  const audioId = synced(show?.music) ? show!.music!.audioId : null;
  useEffect(() => {
    if (!audioId) { setAudio(null); return; }
    let url = '', live = true;
    getAudio(audioId).then((b) => { if (!live || !b) return; url = URL.createObjectURL(b); const a = new Audio(url); a.preload = 'auto'; setAudio(a); });
    return () => { live = false; setAudio((a) => { a?.pause(); return null; }); if (url) URL.revokeObjectURL(url); };
  }, [audioId, audioVer]);
  const music = useMemo(() => (audio && useMusic && show?.music ? { audio, taps: show.music.taps } : null), [audio, useMusic, show?.music]);
  const [clickOn, setClickOn] = useState(clickWanted);
  usePlayback(playing, setPlaying, t, setT, bpm, span, !!loop, total, music, clickOn && !music ? starts : null);

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
  // Landscape puts the view buttons atop the side column (over the field they covered its yard numbers).
  const LAND = 'screen and (orientation: landscape)';
  const [land, setLand] = useState(() => matchMedia(LAND).matches);
  useEffect(() => { const m = matchMedia(LAND), f = () => setLand(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const maxRef = useRef(ZOOM_MAX);
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
    // iOS Safari can hold back the second finger's pointer events while it decides whether a pinch is its own page zoom,
    // so pinch from touch events too (same absolute math, so getting both is harmless) and claim the gesture for the field.
    const gap = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    let start: { dist: number; zoom: number } | null = null;
    const down = (e: TouchEvent) => { if (e.touches.length === 2) { start = { dist: gap(e.touches), zoom: zoomRef.current }; e.preventDefault(); } };
    const move = (e: TouchEvent) => { if (e.touches.length === 2 && start) { e.preventDefault(); setZoom(pinchZoom(start.zoom, start.dist, gap(e.touches), maxRef.current)); } };
    const up = (e: TouchEvent) => { if (e.touches.length < 2) start = null; };
    c.addEventListener('touchstart', down, { passive: false });
    c.addEventListener('touchmove', move, { passive: false });
    c.addEventListener('touchend', up);
    c.addEventListener('touchcancel', up);
    return () => {
      c.removeEventListener('gesturestart', stop); c.removeEventListener('gesturechange', stop);
      c.removeEventListener('touchstart', down); c.removeEventListener('touchmove', move); c.removeEventListener('touchend', up); c.removeEventListener('touchcancel', up);
    };
  }, [!!show]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; setSize([c.width, c.height]); });
    ro.observe(c);
    return () => ro.disconnect();
  }, [dpr, !!show]);

  const me = state?.me && state.me !== STAFF ? show?.performers.find((p) => p.id === state.me) : undefined;
  // Both views zoom in as close as My view does at its max (the whole field starts much further out).
  const maxZoom = me && state?.follow ? ZOOM_MAX : size[0] ? (ZOOM_MAX * size[0]) / FOLLOW_STEPS / fitView(size[0], size[1], show ? fieldOf(show) : undefined).scale : ZOOM_MAX;
  maxRef.current = maxZoom;
  const positions = useMemo(() => (show ? positionsAt(show, t) : {}), [show, t]);
  const onSet = show ? (t > starts.at(-1)! ? show.sets.length - 1 : setAt(show, t)) : -1; // past the written sets: holding on the last one
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
      const scale = fitView(W, H, fieldOf(show)).scale * zoom;
      const mid = fieldDepth(fieldOf(show)) / 2; // `center` is kept relative to a football field's middle (42): an indoor floor's middle is elsewhere
      v = { scale, ox: W / 2 - center.x * scale, oy: H / 2 + (center.y - 42 + mid) * scale };
    }
    viewRef.current = v;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (state!.facingFront) ctx.setTransform(-1, 0, 0, -1, W, H); // turn the field around: front sideline at the top
    drawField(ctx, v, fieldOf(show));
    drawProps(ctx, v, show.props ?? [], propsAt(show, t), null, 'screen', 12 * dpr);
    if (onSet >= 0) drawMarks(ctx, v, show.sets[onSet].marks ?? [], 'screen');
    if (!me) {
      const shown = !playing; // labels would jump around as dots move
      drawPerformers(ctx, v, show.performers.filter((p) => positions[p.id]).map((p) => { const m = mark(show, p); return { id: p.id, label: shown ? m.label : '', glyph: m.glyph, at: positions[p.id], pin: onSet >= 0 ? show.sets[onSet].labels?.[p.id] : undefined, color: colorOf(show, p) }; }), new Set(), [], undefined, dpr);
    } else {
      const s = v.scale, letters = show.symbols !== 'dots', f = Math.max(11 * dpr, s * 1.1); // letter height, as in the staff view
      const drawMark = (q: Point, id: string, size: number, color: string, badge?: string) => drawGlyph(ctx, q, mark(show, show.performers.find((x) => x.id === id)!).glyph!, size, color, badge);
      const near = new Set(around.map((n) => n.id));
      for (const p of show.performers) {
        if (p.id === me.id || !positions[p.id]) continue;
        const q = toScreen(v, positions[p.id]);
        if (letters) { if (!near.has(p.id)) drawMark(q, p.id, f, 'rgba(255,255,255,0.6)'); continue; } // the rest of the band, quieter
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(3, s * 0.3), 0, Math.PI * 2); ctx.fill();
      }
      if (myPath.length) {
        ctx.setLineDash([s * 0.5, s * 0.35]);
        ctx.strokeStyle = PALETTE.gold; ctx.lineWidth = Math.max(2, s * 0.15);
        ctx.beginPath(); myPath.forEach((p, k) => { const q = toScreen(v, p); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.stroke();
        ctx.setLineDash([]);
        const end = toScreen(v, myPath.at(-1)!);
        ctx.strokeStyle = PALETTE.gold; ctx.lineWidth = Math.max(2, s * 0.12);
        ctx.beginPath(); ctx.arc(end.x, end.y, Math.max(6, s * 0.55), 0, Math.PI * 2); ctx.stroke();
      }
      const q = toScreen(v, positions[me.id]);
      if (letters) drawMark(q, me.id, Math.max(16 * dpr, s * 1.3), '#111', PALETTE.gold); // me: my letter on a gold badge
      else {
        ctx.fillStyle = PALETTE.gold; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, s * 0.15);
        ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(7, s * 0.6), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      // Neighbors: brighter, so "who I'm next to" stands out from the rest of the band.
      for (const n of around) {
        const nq = toScreen(v, positions[n.id]);
        if (letters) { drawMark(nq, n.id, f, PALETTE.text); continue; }
        ctx.fillStyle = PALETTE.text;
        ctx.beginPath(); ctx.arc(nq.x, nq.y, Math.max(4, s * 0.38), 0, Math.PI * 2); ctx.fill();
      }
      // Labels (upright either way, placed so they don't collide): mine first, then my nearest neighbors'. With letters, just the number.
      const text = (id: string) => mark(show, show.performers.find((x) => x.id === id)!).label;
      drawLabels(ctx, [
        { id: me.id, label: text(me.id), at: positions[me.id], first: true, px: 14 * dpr, color: '#fff' },
        ...(!playing ? around : []).map((n) => ({ id: n.id, label: text(n.id), at: positions[n.id] })),
      ], v, letters ? f * 0.55 : Math.max(7, s * 0.6), 12 * dpr, PALETTE.text, 'rgba(0,0,0,0.65)');
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (follow || zoom > 1) {
      // Zoomed in, the painted yard numbers are usually off screen: pin a yard-line ruler to the bottom edge.
      const band = 22 * dpr;
      ctx.fillStyle = 'rgba(24,36,25,0.85)';
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
  }, [show, size, positions, me, state, onSet, myPath, dpr, around, zoom, center, playing, t, theme]);

  if (!show) {
    return (
      <main className="perform-empty">
        <h1><img src={theme === 'light' ? './logo-light.svg' : './logo.svg'} alt="FreeFORM" style={{ width: 'min(280px, 100%)', display: 'block' }} /></h1>
        {error ? <p role="alert">{error}</p>
          : location.hash.startsWith(LOAD_PREFIX) ? <p>Downloading the show…</p>
          : <p>Open the show link your director sent you. It will be saved on this phone and work offline after that.</p>}
        <PasteLink />
        {!isPhone() && <p><a href="#" style={{ color: 'var(--blue)' }} onClick={(e) => { e.preventDefault(); toEditor(); }}>← Editor</a></p>}
      </main>
    );
  }

  const steps = me && hasNext ? moveSteps(show, next)[me.id] : null;
  const s = show.sets[cur], nx = hasNext ? show.sets[next] : null;
  const myCue = (i: number) => (me ? show.sets[i]?.cues?.[me.id] : undefined);
  const btn: React.CSSProperties = { fontSize: 18, minWidth: 44, minHeight: 40, display: 'grid', placeItems: 'center' };

  const toggles = (
      <div className="perform-toggles">
        <button aria-pressed={state!.facingFront} onClick={() => update({ facingFront: !state!.facingFront })}>{state!.facingFront ? 'Facing front' : 'Director view'}</button>
        {(zoom !== 1 || center.x !== 0 || center.y !== 42) && <button onClick={() => { setZoom(1); setCenter({ x: 0, y: 42 }); }}>Reset zoom</button>}
        {me && <button aria-pressed={state!.follow} onClick={() => { update({ follow: !state!.follow }); setZoom(1); setCenter({ x: 0, y: 42 }); }}>{state!.follow ? 'My view' : 'Whole field'}</button>}
        <ThemeButton />
      </div>
  );

  return (
    <div className="perform">
      <header className="perform-bar">
        <div className="perform-titlebar">
          <span className="perform-title">{error ? <span role="alert" title={error} style={{ color: 'var(--danger)' }}>{error} Showing your saved copy. </span>
            : notice ? <span role="status" style={{ color: 'var(--green-line)' }}>{notice} </span> : null}
            {preview ? show.title : (
              // The shows on this phone: pick one to open it (an Opener, a Ballad, a Closer…), or add or remove one.
              <select aria-label="Show" className="perform-shows" value={lib.current} onChange={(e) => {
                const v = e.target.value;
                if (v === 'add') setAdding(true);
                else if (v === 'remove') { if (confirm(`Remove "${show.title}" from this phone? You can open its link again later.`)) remove(lib.current); }
                else switchTo(Number(v));
              }}>
                {lib.shows.map((x, i) => <option key={i} value={i}>{x.show.title}</option>)}
                <option value="add">＋ Add a show…</option>
                <option value="remove">Remove this show…</option>
              </select>
            )}</span>
          {!isPhone() && <button onClick={toEditor} title="Back to the drill editor" style={{ fontSize: 14 }}>← Editor</button>}
        </div>
        {adding && <div className="perform-add" role="dialog" aria-label="Add a show"><span>Open another show's link, or paste it or scan its QR code here. It's added to this phone's list.</span><PasteLink /><button onClick={() => setAdding(false)}>Cancel</button></div>}
        <WhoPicker show={show} value={state!.me} staff={STAFF} onPick={(v) => { update({ me: v }); setZoom(1); setCenter({ x: 0, y: 42 }); }} />
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
              setZoom(pinchZoom(pinch.current.zoom, pinch.current.dist, Math.hypot(a.x - b.x, a.y - b.y), maxZoom));
            }
            // In My view the camera stays on my dot; elsewhere, dragging (one finger or two) moves around the field.
            if (!(me && state!.follow) && viewRef.current) {
              const share = touches.current.size; // two fingers each move half the drag
              setCenter((c) => panCenter(c, ((e.clientX - prev.x) * dpr) / share, ((e.clientY - prev.y) * dpr) / share, viewRef.current!.scale, state!.facingFront));
            }
          }}
          onPointerUp={(e) => { touches.current.delete(e.pointerId); if (touches.current.size < 2) pinch.current = null; }}
          onPointerCancel={(e) => { touches.current.delete(e.pointerId); pinch.current = null; }} />
        {!land && toggles}
      </div>
      <section className="perform-info" aria-live="off">
        {land && toggles}
        <div className="perform-set">
          <strong>Set {s.name}</strong>
          {cur > 0 && <span> · {s.counts} cts</span>}
          {s.measures && <span> · m. {s.measures}</span>}
          {onSet < 0 && <span> · count {Math.floor(count)} of {s.counts}</span>}
        </div>
        {(show.revision || state!.source) && <p className="perform-note">{show.revision ? `Revision ${show.revision}` : 'No revision number'}{state!.source && <> · {state!.checked ? `checked for updates ${checkedAt(state!.checked)}` : 'not checked for updates yet'}</>}</p>}
        {me ? (
          <>
            <p className="perform-coord"><span className="perform-k">{onSet >= 0 ? 'My spot' : 'Now'}</span> {readout(positions[me.id], fieldOf(show))}</p>
            {nx && (
              <p className="perform-coord">
                <span className="perform-k">Next: set {nx.name} in {nx.counts} cts{nx.measures ? ` (m. ${nx.measures})` : ''}</span>{' '}
                {readout(nx.pos[me.id], fieldOf(show))}
                {steps && <span style={{ color: STEP_TEXT[steps.tier] }}> · {fmtStep(steps.per5)}</span>}
                {(() => { const tm = timingOf(nx, me.id); return tm.move < nx.counts ? <span> · hold {tm.wait}, move {tm.move}{nx.counts - tm.wait - tm.move ? `, hold ${nx.counts - tm.wait - tm.move}` : ''}</span> : null; })()}
              </p>
            )}
            {myCue(cur) && <p className="perform-note"><span className="perform-k">My notes</span> {myCue(cur)}</p>}
          </>
        ) : state!.me === STAFF ? null : (
          <p className="perform-note">Pick who you are above to see your spot.</p>
        )}
        {s.note && <p className="perform-note"><span className="perform-k">Ensemble</span> {s.note}</p>}
      </section>
      <footer className="perform-controls">
        {picking && (
          <div className="perform-add" role="dialog" aria-label="Loop sets">
            <span>Practice a few sets over and over. Play starts on the first set and jumps back to it after the last one.</span>
            <span>Sets{' '}
              <select aria-label="Loop from set" value={picking[0]} onChange={(e) => { const v = Number(e.target.value); setPicking([v, Math.max(v + 1, picking[1])]); }} style={{ fontSize: 16 }}>
                {show.sets.slice(0, -1).map((x, i) => <option key={x.id} value={i}>{x.name}</option>)}
              </select>{' '}to{' '}
              <select aria-label="Loop to set" value={picking[1]} onChange={(e) => setPicking([picking[0], Number(e.target.value)])} style={{ fontSize: 16 }}>
                {show.sets.map((x, i) => (i > picking[0] ? <option key={x.id} value={i}>{x.name}</option> : null))}
              </select>
            </span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="primary" onClick={() => { const r: [number, number] = [picking[0], Math.max(picking[0] + 1, picking[1])]; setLoop(r); setPicking(null); setPlaying(false); setT(starts[r[0]]); }}>Loop these sets</button>
              {loop && <button onClick={() => { setLoop(null); setPicking(null); }}>Stop looping</button>}
              <button onClick={() => setPicking(null)}>Cancel</button>
            </span>
          </div>
        )}
        <div className="perform-sets" data-more={more} ref={setStrip} onScroll={checkMore} role="group" aria-label="Go to set">
          {show.sets.map((x, i) => (
            <button key={x.id} aria-pressed={i === onSet} onClick={() => { setPlaying(false); setT(starts[i]); }}>{x.name}</button>
          ))}
        </div>
        <input type="range" aria-label="Count" min={0} max={total} step={1} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} disabled={!total} />
        <div className="perform-buttons">
          <button style={btn} aria-label="Previous count" onClick={() => { setPlaying(false); setT(Math.max(0, Math.ceil(t) - 1)); }}><IconPrev /></button>
          <button style={btn} aria-label={playing ? 'Pause' : 'Play'} disabled={!total || (!playing && t >= total && !loop)} title={t >= total && !loop ? 'End of the show: tap set 1 (or another set) to play from there' : undefined} onClick={() => { if (!playing && loop && (t < span[0] || t >= span[1])) setT(span[0]); /* a loop plays from its first set */ if (!playing && music) music.audio.play().catch(() => {}); /* start sound inside the tap: phones only allow it there */ if (!playing && clickOn) wakeClick(); setPlaying(!playing); }}>{playing ? <IconPause /> : <IconPlay />}</button>
          <button style={btn} aria-label="Next count" onClick={() => { setPlaying(false); setT(Math.min(total, Math.floor(t) + 1)); }}><IconNext /></button>
          {audio && <button aria-pressed={useMusic} title={useMusic ? 'Playing with the music. Tap to use a tempo instead.' : 'Play with the music'} onClick={() => { setPlaying(false); setUseMusic(!useMusic); }} style={{ fontSize: 14, minHeight: 40 }}>♪ Music</button>}
          {!music && <label style={{ fontSize: 14 }}><NumberField aria-label="Tempo" min={20} max={300} integer value={bpm} onValue={setBpm} style={{ width: 52, fontSize: 16 }} /> bpm</label>}
          {show.sets.length > 1 && <button aria-pressed={!!loop} onClick={() => setPicking(loop ?? [Math.max(0, cur - 1), Math.min(show.sets.length - 1, Math.max(1, cur))])}
            title={loop ? `Looping sets ${show.sets[loop[0]].name} to ${show.sets[loop[1]].name}. Tap to change or stop.` : 'Practice a few sets over and over'} style={{ fontSize: 14, minHeight: 40 }}>
            {loop ? `Loop ${show.sets[loop[0]].name}–${show.sets[loop[1]].name}` : 'Loop'}</button>}
          {!music && <button aria-pressed={clickOn} title={clickOn ? 'A click on every count. Tap to turn it off.' : 'A click on every count while it plays'} onClick={() => { setClickOn(!clickOn); setClickWanted(!clickOn); if (!clickOn) wakeClick(); }} style={{ fontSize: 14, minHeight: 40 }}>Click</button>}
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
      {bad && <span role="alert" style={{ width: '100%', color: 'var(--danger)' }}>That doesn't look like a FreeFORM share link.</span>}
    </div>
  );
}
