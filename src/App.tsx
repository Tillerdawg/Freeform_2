import { useEffect, useMemo, useRef, useState } from 'react';
import { readout, type Point } from './engine/coords';
import {
  addPerformer, label, moveSteps, newShow, parseShow, placeInSet, positionsAt, removePerformers,
  setAt, setStarts, type Show,
} from './engine/show';
import { drawField, drawPerformers, fitView, toWorld, type Path, type View } from './field/drawField';
import { Sidebar, type Snap, type Tool } from './ui/Sidebar';
import { Timeline } from './ui/Timeline';

export const AUTOSAVE = 'freeform:autosave';

function loadAutosave(): Show {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(AUTOSAVE);
    if (raw) return parseShow(raw);
  } catch {
    // Bad data: keep a copy before the fresh show's autosave overwrites it.
    try { if (raw) localStorage.setItem(`${AUTOSAVE}:unreadable`, raw); } catch { /* storage blocked */ }
  }
  return newShow();
}

type Drag =
  | { kind: 'move'; start: Point; anchor: string; orig: Record<string, Point> }
  | { kind: 'box'; a: Point; b: Point; add: boolean }
  | { kind: 'pan'; x: number; y: number };

const snapTo = (p: Point, snap: Snap): Point =>
  snap ? { x: Math.round(p.x / snap) * snap, y: Math.round(p.y / snap) * snap } : p;

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState<Show>(loadAutosave);
  const [t, setT] = useState(0);
  const [view, setView] = useState<View | null>(null);
  const [hover, setHover] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<Tool>('select');
  const [section, setSection] = useState(() => show.sections.find((s) => s.letter === 'T')?.id ?? show.sections[0]?.id);
  const [snap, setSnap] = useState<Snap>(1);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [fileError, setFileError] = useState('');
  const [box, setBox] = useState<[Point, Point]>();
  const drag = useRef<Drag | null>(null);
  const dpr = window.devicePixelRatio || 1;

  const starts = useMemo(() => setStarts(show), [show]);
  const total = starts.at(-1)!;
  const onSet = setAt(show, t);
  const positions = useMemo(() => positionsAt(show, t), [show, t]);

  // Keep t valid when sets or counts change.
  useEffect(() => { if (t > total) setT(total); }, [t, total]);

  useEffect(() => {
    try { localStorage.setItem(AUTOSAVE, JSON.stringify(show)); } catch { /* private mode: no autosave */ }
  }, [show]);

  // Playback in real time at the chosen tempo.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now(), raf = 0;
    const tick = (now: number) => {
      const dt = Math.max(0, now - last) / 1000; // a frame timestamp can precede the start time; never step backward
      last = now;
      let done = false;
      setT((cur) => {
        const next = Math.min(total, cur + (dt * bpm) / 60);
        done = next >= total;
        return next;
      });
      if (done) setPlaying(false); else raf = requestAnimationFrame(tick);
    };
    setT((cur) => (cur >= total ? 0 : cur));
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, bpm, total]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      setView(fitView(c.width, c.height));
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [dpr]);

  // Paths into the current set, colored by step size.
  const paths: Path[] = useMemo(() => {
    if (onSet < 1) return [];
    const steps = moveSteps(show, onSet);
    const a = show.sets[onSet - 1].pos, b = show.sets[onSet].pos;
    return Object.keys(b).filter((id) => a[id] && (a[id].x !== b[id].x || a[id].y !== b[id].y))
      .map((id) => ({ from: a[id], to: b[id], tier: steps[id].tier }));
  }, [show, onSet]);

  useEffect(() => {
    if (!view) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    drawField(ctx, view, show.hash);
    const dots = show.performers.filter((p) => positions[p.id]).map((p) => ({ id: p.id, label: label(show, p), at: positions[p.id] }));
    drawPerformers(ctx, view, dots, selected, paths, box);
  }, [view, show, positions, selected, paths, box]);

  // Trackpad/mouse wheel pans; pinch or ctrl+wheel zooms around the cursor.
  useEffect(() => {
    const c = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const sx = e.offsetX * dpr, sy = e.offsetY * dpr;
      setView((v) => {
        if (!v) return v;
        if (!e.ctrlKey && !e.metaKey) return { ...v, ox: v.ox - e.deltaX * dpr, oy: v.oy - e.deltaY * dpr };
        const scale = Math.min(Math.max(v.scale * Math.exp(-e.deltaY * 0.01), 2 * dpr), 120 * dpr);
        const k = scale / v.scale;
        return { scale, ox: sx - (sx - v.ox) * k, oy: sy - (sy - v.oy) * k };
      });
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [dpr]);

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, select, textarea')) return;
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setT((x) => Math.min(total, Math.floor(x) + 1)); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setT((x) => Math.max(0, Math.ceil(x) - 1)); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.size) {
        setShow((s) => removePerformers(s, selected)); setSelected(new Set());
      } else if (e.key === 'Escape') setSelected(new Set());
      else if (e.key === 'v' || e.key === 'V') setTool('select');
      else if (e.key === 'a' || e.key === 'A') setTool('add');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, total]);

  const world = (e: React.PointerEvent) => toWorld(view!, e.nativeEvent.offsetX * dpr, e.nativeEvent.offsetY * dpr);

  const hit = (p: Point) => {
    const r = Math.max(0.7, (10 * dpr) / view!.scale); // at least ~10px to grab when zoomed out
    let best: string | undefined, bd = r;
    for (const [id, q] of Object.entries(positions)) {
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d <= bd) { bd = d; best = id; }
    }
    return best;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!view) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.button === 1 || e.button === 2) { drag.current = { kind: 'pan', x: e.clientX, y: e.clientY }; return; }
    const p = world(e);
    if (tool === 'add') {
      if (!section || onSet < 0) return; // mid-move: select only, no edits
      const r = addPerformer(show, section, snapTo(p, snap));
      setShow(r.show);
      setSelected(new Set([r.id]));
      return;
    }
    const id = hit(p);
    if (id) {
      let sel = selected;
      if (e.shiftKey) {
        sel = new Set(selected);
        if (sel.has(id)) sel.delete(id); else sel.add(id);
      } else if (!selected.has(id)) sel = new Set([id]);
      setSelected(sel);
      if (sel.has(id) && onSet >= 0) {
        const orig = Object.fromEntries([...sel].map((k) => [k, show.sets[onSet].pos[k]]));
        drag.current = { kind: 'move', start: p, anchor: id, orig };
      }
    } else {
      drag.current = { kind: 'box', a: p, b: p, add: e.shiftKey };
      if (!e.shiftKey) setSelected(new Set());
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!view) return;
    const p = world(e);
    setHover(readout(p, show.hash));
    const d = drag.current;
    if (!d) return;
    if (d.kind === 'pan') {
      const dx = (e.clientX - d.x) * dpr, dy = (e.clientY - d.y) * dpr;
      drag.current = { ...d, x: e.clientX, y: e.clientY };
      setView({ ...view, ox: view.ox + dx, oy: view.oy + dy });
    } else if (d.kind === 'box') {
      drag.current = { ...d, b: p };
      setBox([d.a, p]);
    } else {
      // Snap the grabbed performer; the rest of the selection keeps its shape.
      const a0 = d.orig[d.anchor];
      const a1 = snapTo({ x: a0.x + p.x - d.start.x, y: a0.y + p.y - d.start.y }, snap);
      const dx = a1.x - a0.x, dy = a1.y - a0.y;
      const moves = Object.fromEntries(Object.entries(d.orig).map(([k, q]) => [k, { x: q.x + dx, y: q.y + dy }]));
      setShow((s) => placeInSet(s, onSet, moves));
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.kind === 'box') {
      const [x0, x1] = [Math.min(d.a.x, d.b.x), Math.max(d.a.x, d.b.x)];
      const [y0, y1] = [Math.min(d.a.y, d.b.y), Math.max(d.a.y, d.b.y)];
      const inside = Object.entries(positions).filter(([, q]) => q.x >= x0 && q.x <= x1 && q.y >= y0 && q.y <= y1).map(([k]) => k);
      setSelected(new Set([...(d.add ? selected : []), ...inside]));
      setBox(undefined);
    }
  };

  const save = () => {
    const blob = new Blob([JSON.stringify(show, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${show.title.replace(/[^\w\- ]+/g, '').trim() || 'show'}.freeform.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const open = async (f: File) => {
    try {
      const s = parseShow(await f.text());
      setShow(s); setT(0); setSelected(new Set()); setFileError('');
      setSection(s.sections[0]?.id ?? '');
    } catch (err) {
      setFileError(err instanceof Error ? err.message : String(err));
    }
  };

  const fresh = () => {
    if (show.performers.length && !confirm('Start a new show? Unsaved changes to this one will be lost.')) return;
    const s = newShow();
    setShow(s); setT(0); setSelected(new Set()); setSection(s.sections.find((x) => x.letter === 'T')?.id ?? s.sections[0].id);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 16px' }}>
          <strong>Freeform</strong>
          <button onClick={() => { const c = canvasRef.current!; setView(fitView(c.width, c.height)); }}>Fit field</button>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Scroll to pan · pinch or ⌘/Ctrl+scroll to zoom · right-drag pans</span>
          <span aria-live="polite" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{hover}</span>
        </div>
        <canvas
          ref={canvasRef}
          style={{ flex: 1, width: '100%', minHeight: 0, touchAction: 'none', cursor: tool === 'add' ? 'copy' : 'default' }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHover('')}
        />
        <Timeline show={show} t={t} setT={(x) => { setPlaying(false); setT(x); }} playing={playing} setPlaying={setPlaying} bpm={bpm} setBpm={setBpm} />
      </div>
      <Sidebar
        show={show} setShow={setShow} t={t} setT={(x) => { setPlaying(false); setT(x); }} onSet={onSet}
        selected={selected} setSelected={setSelected} tool={tool} setTool={setTool}
        section={section} setSection={setSection} snap={snap} setSnap={setSnap} starts={starts}
        onNew={fresh} onOpen={() => fileRef.current?.click()} onSave={save} fileError={fileError}
      />
      <input ref={fileRef} type="file" accept=".json,application/json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) open(f); e.target.value = ''; }} />
    </div>
  );
}
