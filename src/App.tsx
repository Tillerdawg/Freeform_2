import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readout, type Point } from './engine/coords';
import { emptyHistory, record, redo, undo } from './engine/history';
import { addInk, hitMark, moveMark, type Mark } from './engine/marks';
import { assign, fitShape, fitText, isControl, moveHandle, samplePath, slots, type Shape, type ShapeKind } from './engine/shapes';
import { colorOf,
  addPerformer, closeCalls, setFtlTurns, locate, label, mark, newId, setMarks, moveSegments, fieldOf,  hitProp, placeProp, propsAt, removeProp, normalizeFtl, snapPoint, playRange, newShow, parseShow, placeInSet, positionsAt, removePerformers,
  rotateScale, setAt, setStarts, withShowId, type Show,
  showLength,
} from './engine/show';
import { pinchView } from './perform/gestures';
import { coarse } from './perform/device';
import { HANDLE_PX, drawField, drawMarks, drawPerformers, drawProps, drawShape, fitView, toScreen, toWorld, type Path, type View } from './field/drawField';
import { frameDrag, selectionFrame } from './field/frame';
import { Sidebar, type Snap, type Tool } from './ui/Sidebar';
import { Timeline } from './ui/Timeline';
import { startingSections } from './ui/startingSections';
import { MusicMenu } from './ui/Music';
import { getAudio } from './ui/audioStore';
import { peaks } from './engine/music';
import { confirmDelete, Menu, SHAPES, Toolbar } from './ui/Toolbar';
import { parse3dj } from './engine/pyware';
import { usePlayback } from './ui/usePlayback';
import { clickWanted, setClickWanted, wakeClick } from './ui/click';
import { PrintDialog } from './print/Print';
import { ShareDialog } from './perform/ShareDialog';
import { PALETTE, useTheme } from './ui/palette';
import { ThemeButton } from './ui/ThemeButton';
import { RosterImport } from './ui/RosterImport';
import { sampleShow } from './engine/sample';

export const AUTOSAVE = 'freeform:autosave';
const GUIDE = './guide/'; // made from docs/HOW-TO.md when the site is built
const UNEXPORTED = 'freeform:unexported-since', SNOOZE = 'freeform:backup-later', DAY = 86_400_000, BACKUP_DAYS = 7;
const readTime = (k: string) => { try { const n = Number(localStorage.getItem(k)); return n > 0 ? n : null; } catch { return null; } };
const writeTime = (k: string, n: number | null) => { try { if (n) localStorage.setItem(k, String(n)); else localStorage.removeItem(k); } catch { /* storage blocked */ } };
const LOOK = 'freeform:section-view'; // which sections are dimmed or hidden in the editor

function loadAutosave(): Show {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(AUTOSAVE);
    if (raw) return withShowId(parseShow(raw)); // an older autosave gets its id now (the autosave keeps it)
  } catch {
    // Bad data: keep a copy before the fresh show's autosave overwrites it.
    try { if (raw) localStorage.setItem(`${AUTOSAVE}:unreadable`, raw); } catch { /* storage blocked */ }
  }
  return newShow(startingSections());
}

type Drag =
  | { kind: 'move'; start: Point; anchor: string; orig: Record<string, Point>; at: [number, number]; moved?: boolean; turns?: Point[] }
  | { kind: 'turn'; k: number }
  | { kind: 'box'; a: Point; b: Point; add: boolean }
  | { kind: 'pan'; x: number; y: number }
  | { kind: 'handle'; i: number }
  | { kind: 'mark'; id: string; start: Point; orig: Mark; at: [number, number]; moved?: boolean }
  | { kind: 'prop'; id: string; start: Point; orig: { x: number; y: number; angle: number }; at: [number, number]; moved?: boolean }
  | { kind: 'arrow'; id: string }
  | { kind: 'ink'; id: string }
  | { kind: 'frame'; mode: 'rotate' | 'scale'; c: Point; down: Point; orig: Show; ids: string[]; deg: number; kx: number; ky: number };

const snapTo = snapPoint;

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [show, setShowRaw] = useState<Show>(loadAutosave);
  // Every edit goes through here so follow-the-leader followers always match their leader.
  const setShow = useCallback((f: Show | ((s: Show) => Show)) => setShowRaw((s) => normalizeFtl(typeof f === 'function' ? f(s) : f)), []);
  const [t, setT] = useState(0);
  const [view, setView] = useState<View | null>(null);
  const theme = useTheme();
  const [hover, setHover] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<Tool>('select');
  const [section, setSection] = useState(() => show.sections[0]?.id);
  // A deleted section can't take new performers: fall back to one that exists.
  useEffect(() => { if (!show.sections.some((x) => x.id === section)) setSection(show.sections[0]?.id ?? ''); }, [show.sections, section]);
  const [snap, setSnap] = useState<Snap>(1);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [range, setRange] = useState<{ from: string | null; to: string | null; loop: boolean }>({ from: null, to: null, loop: false });
  // Shape being edited: performers in slot order (order[k] takes slot k), in the set it was started in.
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [selectedProp, setSelectedProp] = useState<string | null>(null); // a prop picked on the field or in the sidebar
  const [shapeEdit, setShapeEdit] = useState<{ shape: Shape; order: string[]; set: number; base: Show } | null>(null); // base: the show before this shape began
  const [fileError, setFileError] = useState('');
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [box, setBox] = useState<[Point, Point]>();
  const drag = useRef<Drag | null>(null);
  // Sidebar: beside the field on a wide window; on a narrow one (an iPad in portrait, Split View), or a short touch screen
  // (an open iPhone Duo on its side, 585 px tall), hidden until asked for, then over the field's right side, so opening
  // it doesn't resize (and refit) the field.
  const NARROW = '(max-width: 899px), (pointer: coarse) and (max-height: 650px)';
  const [narrow, setNarrow] = useState(() => matchMedia(NARROW).matches);
  useEffect(() => { const m = matchMedia(NARROW), f = () => setNarrow(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  const [sideChoice, setSideChoice] = useState<boolean | null>(null); // null: the default for this width
  useEffect(() => setSideChoice(null), [narrow]);
  const sideOpen = sideChoice ?? !narrow;
  const [timelineOpen, setTimelineOpen] = useState(true); // hide it for more field while writing (a tablet)
  const [adding, setAdding] = useState(false); // tap adds to the selection (shift-click without a keyboard)
  // Fingers on the field (canvas px). Two fingers pan and pinch; what the first one started is undone (atDown).
  const touches = useRef(new Map<number, Point>());
  const pinch = useRef<{ v: View; mid: Point; dist: number } | null>(null);
  // Once an Apple Pencil (or any pen) touches the field, fingers only pan and zoom (two fingers), and a resting palm does nothing.
  const penSeen = useRef(false);
  const atDown = useRef<{ show: Show; selected: Set<string>; mark: string | null; shape: typeof shapeEdit } | null>(null);
  const [hist, setHist] = useState(emptyHistory<Show>);
  const lastShow = useRef(show);
  const boundary = useRef(true); // a click/tap or shortcut happened since the last change
  const fromHistory = useRef(false);
  const dpr = window.devicePixelRatio || 1;

  const starts = useMemo(() => setStarts(show), [show]);
  const total = showLength(show); // through any part not written yet (count-first)
  const onSet = setAt(show, t);
  const positions = useMemo(() => positionsAt(show, t), [show, t]);

  // Keep t valid when sets or counts change.
  useEffect(() => { if (t > total) setT(total); }, [t, total]);

  // Autosave. If the browser refuses (storage full, private mode), say so: the work exists only in this tab until exported.
  const [saveFailed, setSaveFailed] = useState<'no' | 'yes' | 'seen'>('no');
  useEffect(() => {
    try { localStorage.setItem(AUTOSAVE, JSON.stringify(show)); setSaveFailed('no'); } catch { setSaveFailed((f) => (f === 'seen' ? f : 'yes')); }
  }, [show]);

  // Backups: the show lives only in this browser, so after BACKUP_DAYS of changes that haven't been exported, a notice
  // asks for an Export. "Later" asks again in a day.
  const firstShow = useRef(show);
  const [unexported, setUnexported] = useState(() => readTime(UNEXPORTED));
  const [snooze, setSnooze] = useState(() => readTime(SNOOZE));
  useEffect(() => { if (show !== firstShow.current && !unexported) { const now = Date.now(); writeTime(UNEXPORTED, now); setUnexported(now); } }, [show]); // eslint-disable-line react-hooks/exhaustive-deps
  const backedUp = () => { writeTime(UNEXPORTED, null); setUnexported(null); };
  const remindBackup = !!unexported && show.performers.length > 0 && Date.now() - unexported > BACKUP_DAYS * DAY && Date.now() > (snooze ?? 0);
  // Import, New, and the sample all replace the one show this browser keeps: offer an Export first if it has unexported changes.
  const [pending, setPending] = useState<{ what: string; go: () => void } | null>(null);
  const guard = (what: string, go: () => void) => { if (unexported && show.performers.length) setPending({ what, go }); else go(); };
  /** Put a whole new show in place (a file, a blank show, the sample): it counts as backed up until it's changed. */
  const replaceShow = (s0: Show) => {
    const s = normalizeFtl(s0); // done here, not by setShow, so the show kept as "first" is the very one shown
    setShowRaw(s); setT(0); setSelected(new Set()); setSection(s.sections[0]?.id ?? '');
    firstShow.current = s; backedUp(); fileHandle.current = null; // a different show: ⌘S mustn't write over the last one's file
  };
  const fileHandle = useRef<FileSystemFileHandle | null>(null); // where Save last put this show (Chrome, Edge), for ⌘S

  // A short message over the field about what just happened (a jump to a close call, an edit refused mid-move). It goes away when the playhead moves.
  const [notice, setNotice] = useState<{ text: string; t: number } | null>(null);
  const previewing = () => { const { to, count } = locate(show, t); return `Previewing count ${Math.floor(count)} of ${show.sets[to].counts} into set ${show.sets[to].name}`; };
  const [roster, setRoster] = useState(false);

  // Every show change becomes (or merges into) an undo step, except undo/redo themselves.
  useEffect(() => {
    if (show === lastShow.current) return;
    const prev = lastShow.current, at = performance.now(), b = boundary.current; // read now: the updater runs later
    const holding = !!drag.current && drag.current.kind !== 'pan' && drag.current.kind !== 'box';
    if (fromHistory.current) fromHistory.current = false;
    else setHist((h) => record(h, prev, at, b, holding));
    boundary.current = false;
    lastShow.current = show;
    setSelected((sel) => (sel.size && [...sel].some((id) => !show.performers.some((p) => p.id === id))
      ? new Set([...sel].filter((id) => show.performers.some((p) => p.id === id))) : sel));
  }, [show]);

  useEffect(() => {
    const mark = () => { boundary.current = true; };
    window.addEventListener('pointerdown', mark, true);
    return () => window.removeEventListener('pointerdown', mark, true);
  }, []);

  const step = (dir: 'undo' | 'redo') => {
    const r = (dir === 'undo' ? undo : redo)(hist, show);
    if (!r) return;
    setShapeEdit(null);
    fromHistory.current = true;
    setPlaying(false);
    setHist(r.h);
    setShow(r.state);
  };

  const span = useMemo(() => playRange(show, range.from, range.to), [show, range.from, range.to]);
  // The show's recording, from this browser's store; playback follows it once counts are tapped.
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioTick, setAudioTick] = useState(0); // bumped when a recording is (re)loaded
  const [useMusic, setUseMusic] = useState(true);
  const [wave, setWave] = useState<Float32Array | null>(null);
  const audioId = show.music?.audioId;
  useEffect(() => {
    if (!audioId) { setAudio(null); return; }
    let url = '', gone = false;
    getAudio(audioId).then((blob) => {
      if (gone) return;
      if (!blob) { setAudio(null); return; }
      url = URL.createObjectURL(blob);
      setAudio(new Audio(url));
      // The waveform for the timeline: decoded once per recording (a few seconds of work for a long show, off the main path).
      blob.arrayBuffer().then((b) => new AudioContext().decodeAudioData(b)).then((d) => {
        if (!gone) setWave(peaks(Array.from({ length: d.numberOfChannels }, (_, c) => d.getChannelData(c)), d.sampleRate));
      }).catch(() => { /* no waveform: the timeline works without it */ });
    });
    return () => { gone = true; if (url) URL.revokeObjectURL(url); setWave(null); };
  }, [audioId, audioTick]);
  // The picture to trace under the field, from this browser's store.
  const [trace, setTrace] = useState<ImageBitmap | null>(null);
  const [traceTick, setTraceTick] = useState(0); // bumped when a picture is added
  const traceId = show.trace?.id;
  useEffect(() => {
    let gone = false;
    if (!traceId) { setTrace(null); return; }
    getAudio(traceId).then((blob) => (blob ? createImageBitmap(blob) : null)).then((b) => { if (!gone) setTrace(b); }).catch(() => { if (!gone) setTrace(null); });
    return () => { gone = true; };
  }, [traceId, traceTick]);
  const taps = show.music?.taps;
  const clock = useMemo(() => (audio && useMusic && taps && taps.length >= 2 ? { audio, taps } : null), [audio, useMusic, taps]);
  const [clickOn, setClickOn] = useState(clickWanted);
  usePlayback(playing, setPlaying, t, setT, bpm, span, range.loop, showLength(show), clock, clickOn && !clock ? starts : null); // with the recording, the music is the click

  const showRef = useRef(show); showRef.current = show; // for the resize observer, which outlives renders
  const fieldKey = JSON.stringify(fieldOf(show));
  useEffect(() => { const c = canvasRef.current; if (c?.width) setView(fitView(c.width, c.height, fieldOf(showRef.current))); }, [fieldKey]); // a new surface: fit it
  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      setView(fitView(c.width, c.height, fieldOf(showRef.current)));
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [dpr]);

  // Sections dimmed or hidden in the editor (a view setting kept in this browser, not in the show): sectionId → 'dim' | 'hide'.
  const [look, setLookRaw] = useState<Record<string, 'dim' | 'hide'>>(() => { try { return JSON.parse(localStorage.getItem(LOOK) ?? '{}') ?? {}; } catch { return {}; } });
  const setLook = (l: Record<string, 'dim' | 'hide'>) => { setLookRaw(l); try { localStorage.setItem(LOOK, JSON.stringify(l)); } catch { /* storage blocked */ } };
  const faded = useMemo(() => new Map(show.performers.flatMap((p) => (look[p.section] ? [[p.id, look[p.section]] as const] : []))), [show.performers, look]);
  useEffect(() => { if (selected.size && [...selected].some((id) => faded.has(id))) setSelected(new Set([...selected].filter((id) => !faded.has(id)))); }, [faded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Copy and paste spots: the selected performers' spots in one set, put back on the same performers in another.
  const [clip, setClip] = useState<Record<string, Point> | null>(null);
  const copySpots = () => { if (onSet >= 0 && selected.size) setClip(Object.fromEntries([...selected].flatMap((id) => (show.sets[onSet].pos[id] ? [[id, show.sets[onSet].pos[id]]] : [])))); };
  const pasteSpots = () => {
    if (!clip || onSet < 0) return;
    const moves = Object.fromEntries(Object.entries(clip).filter(([id]) => show.sets[onSet].pos[id]));
    setShapeEdit(null); // a shape still open would put them back on its spots
    setShow((s) => placeInSet(s, onSet, moves));
    setSelected(new Set(Object.keys(moves)));
  };

  // Paths into the current set, colored by step size. Mid-move, the move being made (so FTL trails show there too).
  const pathSet = onSet >= 0 ? onSet : t < starts.at(-1)! ? locate(show, t).to : -1;
  const paths: Path[] = useMemo(() => (pathSet < 1 ? [] : moveSegments(show, pathSet, (id) => !faded.has(id))), [show, pathSet, faded]);
  // The FTL group the selection is, exactly, in the move into this set (where Add turns puts the leader's turning points).
  const ftlGroup = onSet > 0 ? show.sets[onSet].ftl?.find((g) => g.order.length === selected.size && g.order.every((id) => selected.has(id))) : undefined;
  useEffect(() => { if (tool === 'turn' && !ftlGroup) setTool('select'); }, [tool, ftlGroup]);

  // The rotate/scale frame around a selection of 2+ in Select: drag a corner to scale, the knob above it to rotate.
  const framing = tool === 'select' && onSet >= 0 && selected.size >= 2 && !shapeEdit && !playing && !!view;
  const frameNow = () => {
    if (!framing) return null;
    const d = drag.current?.kind === 'frame' ? drag.current : null; // mid-drag: the frame as it was, turned along
    const pos = (d ? d.orig : show).sets[onSet].pos;
    const pts = [...selected].flatMap((id) => (pos[id] ? [pos[id]] : []));
    if (pts.length < 2) return null;
    const px = (coarse() ? 2 : 1) * dpr / view!.scale; // one CSS pixel (two on touch screens) in steps
    return selectionFrame(pts, 12 * px, 22 * px, d?.deg, d?.kx, d?.ky);
  };

  useEffect(() => {
    if (!view) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    drawField(ctx, view, fieldOf(show));
    if (trace && show.trace) { // under everything else, see-through
      const tr = show.trace, h = (tr.w * trace.height) / trace.width, tl = toScreen(view, { x: tr.x - tr.w / 2, y: tr.y + h / 2 });
      ctx.save(); ctx.globalAlpha = tr.opacity; ctx.drawImage(trace, tl.x, tl.y, tr.w * view.scale, h * view.scale); ctx.restore();
    }
    drawProps(ctx, view, show.props ?? [], propsAt(show, t), selectedProp, 'screen', 12 * dpr);
    const pins = onSet >= 0 ? show.sets[onSet].labels : undefined;
    const shown = !playing; // labels jump around as dots move; selected performers keep theirs either way
    const dots = show.performers.filter((p) => positions[p.id] && faded.get(p.id) !== 'hide').map((p) => { const m = mark(show, p), dim = faded.has(p.id); return { id: p.id, dim, label: (shown || selected.has(p.id)) && !dim ? m.label : '', glyph: m.glyph, at: positions[p.id], pin: pins?.[p.id], color: colorOf(show, p) }; });
    if (onSet >= 0) drawMarks(ctx, view, show.sets[onSet].marks ?? [], 'screen', selectedMark);
    drawPerformers(ctx, view, dots, selected, paths, box, dpr);
    if (ftlGroup?.turns) drawShape(ctx, view, [], false, ftlGroup.turns); // the selected FTL group's turns: drag to move
    const fr = frameNow();
    if (fr) drawShape(ctx, view, fr.corners, true, [...fr.corners, fr.knob], [false, false, false, false, true], [[fr.stem, fr.knob]]);
    if (shapeEdit) {
      const sh = shapeEdit.shape;
      const [a, b] = sh.handles;
      const guide = sh.kind === 'block' || sh.kind === 'text'
        ? { pts: [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }], closed: true }
        : samplePath(sh);
      const h = sh.handles;
      const arms: [Point, Point][] = sh.kind === 'bezier'
        ? h.flatMap((p, k) => (k % 3 === 1 ? [[h[k - 1], p] as [Point, Point]] : k % 3 === 2 ? [[h[k + 1], p] as [Point, Point]] : []))
        : [];
      drawShape(ctx, view, guide.pts, guide.closed, h, h.map((_, k) => isControl(sh, k)), arms);
    }
  }, [view, show, positions, selected, paths, box, shapeEdit, onSet, selectedMark, selectedProp, playing, t, theme, tool, trace, faded]);

  // Empty text notes are removed as soon as they're not the one being edited (no timing to get wrong).
  useEffect(() => {
    if (show.sets.some((st) => st.marks?.some((m) => m.kind === 'text' && !m.text.trim() && m.id !== selectedMark))) {
      setShow((sh) => ({ ...sh, sets: sh.sets.map((st, i) => {
        const keep = st.marks?.filter((m) => !(m.kind === 'text' && !m.text.trim() && m.id !== selectedMark));
        return keep && keep.length !== st.marks!.length ? (setMarks(sh, i, () => keep).sets[i]) : st;
      }) }));
    }
  }, [selectedMark, show, setShow]);
  useEffect(() => { setSelectedMark(null); }, [onSet]);
  useEffect(() => { if (selectedProp && !show.props?.some((x) => x.id === selectedProp)) setSelectedProp(null); }, [show, selectedProp]);

  // Leaving the set (scrubbing, undo, deleting performers) ends shape editing.
  useEffect(() => {
    if (shapeEdit && (onSet !== shapeEdit.set || shapeEdit.order.some((id) => !show.performers.some((p) => p.id === id)))) setShapeEdit(null);
  }, [onSet, show, shapeEdit]);

  /** Lay the shape's performers onto its spots in the current set. */
  const applyShape = (shape: Shape, order: string[], base: Show) => {
    const spots = slots(shape, order.length);
    setShow((s) => placeInSet(s, onSet, Object.fromEntries(order.map((id, k) => [id, spots[k]])), base));
  };

  const startShape = (kind: ShapeKind) => {
    if (onSet < 0 || selected.size < 2) return;
    const ids = [...selected];
    const here = ids.map((id) => show.sets[onSet].pos[id]);
    // Least total travel measured from where the move starts (the previous set), so the move's paths never cross.
    const origin = ids.map((id) => show.sets[Math.max(0, onSet - 1)].pos[id] ?? show.sets[onSet].pos[id]);
    const prev = shapeEdit && shapeEdit.shape.kind === kind ? shapeEdit.shape : null;
    const shape = prev ?? fitShape(kind, here);
    const slotOf = assign(origin, slots(shape, ids.length));
    const order: string[] = [];
    ids.forEach((id, i) => { order[slotOf[i]] = id; });
    const base = shapeEdit?.set === onSet ? shapeEdit.base : show; // switching shapes keeps the show from before the first one
    setShapeEdit({ shape, order, set: onSet, base });
    applyShape(shape, order, base);
  };

  const updateShape = (patch: Partial<Shape>) => {
    if (!shapeEdit) return;
    const shape = patch.text !== undefined ? fitText({ ...shapeEdit.shape, ...patch }) : { ...shapeEdit.shape, ...patch };
    let order = shapeEdit.order;
    if (patch.text !== undefined) { // new letters, new spots: deal them out again by least travel
      const s0 = shapeEdit.base, i = shapeEdit.set, ids = order.filter(Boolean);
      const slotOf = assign(ids.map((id) => s0.sets[Math.max(0, i - 1)].pos[id] ?? s0.sets[i].pos[id]), slots(shape, ids.length));
      order = []; ids.forEach((id, k) => { order[slotOf[k]] = id; });
    }
    setShapeEdit({ ...shapeEdit, shape, order });
    applyShape(shape, order, shapeEdit.base);
  };

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

  const fit = () => { const c = canvasRef.current!; setView(fitView(c.width, c.height, fieldOf(show))); };
  /** Zoom around the middle of the field's window, within the wheel's limits. */
  const zoomBy = (k: number) => setView((v) => {
    if (!v) return v;
    const c = canvasRef.current!, sx = c.width / 2, sy = c.height / 2;
    const scale = Math.min(Math.max(v.scale * k, 2 * dpr), 120 * dpr), r = scale / v.scale;
    return { scale, ox: sx - (sx - v.ox) * r, oy: sy - (sy - v.oy) * r };
  });

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      // ⌘S / Ctrl+S, even while typing: save to the file chosen last time, or ask where. Never the browser's "save page".
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveRef.current(true); return; }
      if (printing || document.querySelector('[role=dialog]') || el.closest('input, select, textarea')) return; // text fields keep the browser's own undo
      if (e.defaultPrevented) return; // a control used the key itself (arrows reordering sections)
      boundary.current = true;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); step(e.shiftKey ? 'redo' : 'undo'); }
      else if (mod && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); step('redo'); }
      else if (mod && (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '_')) { e.preventDefault(); zoomBy(e.key === '-' || e.key === '_' ? 1 / 1.25 : 1.25); } // the field, not the page
      else if (mod && e.key === '0') { e.preventDefault(); fit(); }
      else if (mod && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); setSelected(new Set(show.performers.filter((p) => !faded.has(p.id)).map((p) => p.id))); }
      else if (mod && (e.key === 'c' || e.key === 'C') && selected.size && onSet >= 0) { e.preventDefault(); copySpots(); }
      else if (mod && (e.key === 'v' || e.key === 'V') && clip && onSet >= 0) { e.preventDefault(); pasteSpots(); }
      else if (mod) return; // leave other shortcuts to the browser
      else if (e.key === ' ') { e.preventDefault(); if (clickOn) wakeClick(); setPlaying((p) => !p); } // sound starts only inside a key press or tap
      else if (e.key.startsWith('Arrow') && selected.size && onSet >= 0 && !playing) {
        // Nudge the selection: 1 step, Shift 4 steps, Option/Alt half a step. Up is up on the screen.
        e.preventDefault();
        const n = e.shiftKey ? 4 : e.altKey ? 0.5 : 1;
        const dx = e.key === 'ArrowRight' ? n : e.key === 'ArrowLeft' ? -n : 0, dy = e.key === 'ArrowUp' ? n : e.key === 'ArrowDown' ? -n : 0;
        const pos = show.sets[onSet].pos, by = (q: Point) => ({ x: q.x + dx, y: q.y + dy });
        const moves = Object.fromEntries([...selected].flatMap((id) => (pos[id] ? [[id, by(pos[id])]] : [])));
        const group = ftlGroup?.turns ? ftlGroup : undefined; // a whole FTL group brings its leader's turns along, as when dragged
        setShapeEdit(null); // a shape still open would put them back on its spots
        setShow((s) => { const m = placeInSet(s, onSet, moves); return group ? setFtlTurns(m, onSet, group.order[0], group.turns!.map(by)) : m; });
      }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setT((x) => Math.min(total, Math.floor(x) + 1)); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setT((x) => Math.max(0, Math.ceil(x) - 1)); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedProp) { setShow((s) => removeProp(s, selectedProp)); setSelectedProp(null); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMark && onSet >= 0) {
        setShow((s) => setMarks(s, onSet, (ms) => ms.filter((m) => m.id !== selectedMark))); setSelectedMark(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.size) {
        if (!confirmDelete(show, [...selected])) return;
        setShow((s) => removePerformers(s, selected)); setSelected(new Set());
      } else if (e.key === 'Escape') { if (tool !== 'select') setTool('select'); /* any other tool (Add, Text, Arrow, Draw, turns): back to Select */ else if (shapeEdit) setShapeEdit(null); else { setSelected(new Set()); setSelectedMark(null); setSelectedProp(null); } }
      else if (e.key === 'v' || e.key === 'V') setTool('select');
      else if (e.key === 'a' || e.key === 'A') setTool('add');
      else if (e.key === 't' || e.key === 'T') setTool('text');
      else if (e.key === 'f' || e.key === 'F') fit();
      else {
        const sh = SHAPES.find(([, , key]) => key === e.key.toUpperCase());
        if (sh) startShape(sh[0]); // does nothing without 2 or more performers selected in a set
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, total, hist, show, shapeEdit, printing, selectedMark, selectedProp, onSet, tool, playing, view, clip, faded, clickOn]);

  const world = (e: React.PointerEvent) => toWorld(view!, e.nativeEvent.offsetX * dpr, e.nativeEvent.offsetY * dpr);

  const hit = (p: Point, touch = false) => {
    const r = Math.max(0.7, ((touch ? 22 : 10) * dpr) / view!.scale); // at least ~10px to grab when zoomed out (a 44px circle for a finger)
    let best: string | undefined, bd = r;
    for (const [id, q] of Object.entries(positions)) {
      if (faded.has(id)) continue; // dimmed and hidden sections can't be picked
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d <= bd) { bd = d; best = id; }
    }
    return best;
  };

  const fingers = () => {
    const [a, b] = [...touches.current.values()];
    return { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.hypot(a.x - b.x, a.y - b.y) };
  };
  // A second finger: take back whatever the first one started (a dot added, a drag, a box), then pan and zoom instead.
  const cancelGesture = () => {
    const a = atDown.current;
    drag.current = null; atDown.current = null; setBox(undefined);
    if (!a) return;
    // Put the show back exactly as it was when that finger came down. (Not Undo: if the finger's change isn't in the
    // history yet, Undo would take back the change before it, like a performer just placed with the Pencil.)
    if (show !== a.show) {
      setHist((h) => (h.past.at(-1) === a.show ? { ...h, past: h.past.slice(0, -1) } : h));
      lastShow.current = a.show; // not a new change to record
      setShowRaw(a.show);
    }
    setSelected(a.selected); setSelectedMark(a.mark); setShapeEdit(a.shape);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!view) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const touch = e.pointerType === 'touch';
    if (e.pointerType === 'pen') penSeen.current = true;
    if (touch) {
      touches.current.set(e.pointerId, { x: e.nativeEvent.offsetX * dpr, y: e.nativeEvent.offsetY * dpr });
      if (touches.current.size >= 2) {
        if (!penSeen.current) cancelGesture(); // with a Pencil, fingers never started anything (and the Pencil's work stays)
        if (!pinch.current) pinch.current = { v: view, ...fingers() };
        return;
      }
      if (penSeen.current) return; // Pencil in use: one finger or a resting palm does nothing; the Pencil edits
    }
    atDown.current = { show, selected, mark: selectedMark, shape: shapeEdit };
    const add = e.shiftKey || adding;
    if (e.button === 1 || e.button === 2) { drag.current = { kind: 'pan', x: e.clientX, y: e.clientY }; return; }
    const p = world(e);
    const grab = Math.max(HANDLE_PX * 1.5, touch ? 22 : 0) * dpr; // a handle's reach: 44px across for a finger
    if (shapeEdit) {
      const r = grab;
      const i = shapeEdit.shape.handles.findIndex((h) => {
        const q = toScreen(view, h);
        return Math.abs(q.x - e.nativeEvent.offsetX * dpr) <= r && Math.abs(q.y - e.nativeEvent.offsetY * dpr) <= r;
      });
      if (i >= 0) { drag.current = { kind: 'handle', i }; return; }
      setShapeEdit(null); // clicking elsewhere finishes the shape
    }
    // A selected FTL group's turns have handles: grab one to move that turn (in Select or Add turns).
    if (ftlGroup?.turns && (tool === 'select' || tool === 'turn')) {
      const r = grab;
      const k = ftlGroup.turns.findIndex((h) => { const q = toScreen(view, h); return Math.abs(q.x - e.nativeEvent.offsetX * dpr) <= r && Math.abs(q.y - e.nativeEvent.offsetY * dpr) <= r; });
      if (k >= 0) { drag.current = { kind: 'turn', k }; return; }
    }
    const fr = frameNow();
    if (fr) {
      const near = (h: Point) => { const q = toScreen(view, h); return Math.abs(q.x - e.nativeEvent.offsetX * dpr) <= grab && Math.abs(q.y - e.nativeEvent.offsetY * dpr) <= grab; };
      const mode = near(fr.knob) ? 'rotate' : fr.corners.some(near) ? 'scale' : null;
      if (mode) { drag.current = { kind: 'frame', mode, c: fr.c, down: p, orig: show, ids: [...selected], deg: 0, kx: 1, ky: 1 }; return; }
    }
    if ((tool === 'text' || tool === 'arrow' || tool === 'draw') && onSet >= 0) {
      e.preventDefault(); // keep the click from pulling focus off the note's text box
      const id = newId('m');
      const q = tool === 'text' ? snapTo(p, snap) : p;
      const mark: Mark = tool === 'text' ? { id, kind: 'text', at: q, text: '' }
        : tool === 'arrow' ? { id, kind: 'arrow', from: snapTo(p, snap), to: snapTo(p, snap) }
        : { id, kind: 'ink', pts: [p] };
      setShow((s) => setMarks(s, onSet, (ms) => [...ms, mark]));
      setSelected(new Set());
      setSelectedMark(id);
      if (tool !== 'text') drag.current = { kind: tool === 'arrow' ? 'arrow' : 'ink', id };
      return;
    }
    if (tool === 'turn') {
      if (ftlGroup) setShow((s) => setFtlTurns(s, onSet, ftlGroup.order[0], [...(ftlGroup.turns ?? []), snapTo(p, snap)]));
      return;
    }
    if (tool === 'add') {
      if (onSet < 0 && t <= starts.at(-1)!) setNotice({ text: `${previewing()}. Click a set's button to add performers there.`, t });
      if (!section || onSet < 0) return; // mid-move: select only, no edits
      const r = addPerformer(show, section, snapTo(p, snap));
      setShow(r.show);
      setSelected(new Set([r.id]));
      return;
    }
    const id = hit(p, touch);
    if (id) {
      setSelectedMark(null); setSelectedProp(null);
      let sel = selected;
      if (add) {
        sel = new Set(selected);
        if (sel.has(id)) sel.delete(id); else sel.add(id);
      } else if (!selected.has(id)) sel = new Set([id]);
      setSelected(sel);
      if (onSet < 0 && t <= starts.at(-1)!) setNotice({ text: `${previewing()}. Click a set's button to move performers there.`, t });
      if (sel.has(id) && onSet >= 0) {
        const orig = Object.fromEntries([...sel].map((k) => [k, show.sets[onSet].pos[k]]));
        // Dragging a whole FTL group brings its leader's turns along.
        const group = onSet > 0 ? show.sets[onSet].ftl?.find((g) => g.turns && g.order.length === sel.size && g.order.every((k) => sel.has(k))) : undefined;
        drag.current = { kind: 'move', start: p, anchor: id, orig, at: [e.clientX, e.clientY], turns: group?.turns };
      }
    } else {
      const m = onSet >= 0 ? hitMark(show.sets[onSet].marks ?? [], p, Math.max(0.5, ((touch ? 16 : 6) * dpr) / view.scale)) : undefined;
      if (m) {
        setSelected(new Set());
        setSelectedMark(m.id);
        drag.current = { kind: 'mark', id: m.id, start: p, orig: m, at: [e.clientX, e.clientY] };
        setSelectedProp(null);
        return;
      }
      setSelectedMark(null);
      const pr = onSet >= 0 && !add ? hitProp(show, show.sets[onSet].props ?? {}, p, Math.max(0.3, ((touch ? 12 : 4) * dpr) / view.scale)) : undefined;
      if (pr) { // a prop: select and drag it (performers on top of it are hit first)
        setSelected(new Set()); setSelectedProp(pr);
        drag.current = { kind: 'prop', id: pr, start: p, orig: show.sets[onSet].props![pr], at: [e.clientX, e.clientY] };
        return;
      }
      setSelectedProp(null);
      drag.current = { kind: 'box', a: p, b: p, add };
      if (!add) setSelected(new Set());
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!view) return;
    if (touches.current.has(e.pointerId)) {
      touches.current.set(e.pointerId, { x: e.nativeEvent.offsetX * dpr, y: e.nativeEvent.offsetY * dpr });
      if (touches.current.size >= 2 && pinch.current) {
        const f = fingers(), g = pinch.current;
        setView(pinchView(g.v, g.mid, f.mid, g.dist, f.dist, 2 * dpr, 120 * dpr)); // the same limits as the wheel
        return;
      }
      if (penSeen.current) return; // a lone finger or palm while the Pencil is in use
    }
    const p = world(e);
    setHover(readout(p, fieldOf(show)));
    const d = drag.current;
    if (!d) return;
    // A click isn't a drag: nothing moves (or snaps to the grid) until the pointer has really traveled.
    if ((d.kind === 'move' || d.kind === 'mark' || d.kind === 'prop') && !d.moved) {
      if (Math.hypot(e.clientX - d.at[0], e.clientY - d.at[1]) < 4) return;
      d.moved = true;
    }
    if (d.kind === 'pan') {
      const dx = (e.clientX - d.x) * dpr, dy = (e.clientY - d.y) * dpr;
      drag.current = { ...d, x: e.clientX, y: e.clientY };
      setView({ ...view, ox: view.ox + dx, oy: view.oy + dy });
    } else if (d.kind === 'box') {
      drag.current = { ...d, b: p };
      setBox([d.a, p]);
    } else if (d.kind === 'mark') {
      const q = snapTo({ x: p.x - d.start.x, y: p.y - d.start.y }, d.orig.kind === 'ink' ? 0 : snap);
      setShow((s) => setMarks(s, onSet, (ms) => ms.map((m) => (m.id === d.id ? moveMark(d.orig, q.x, q.y) : m))));
    } else if (d.kind === 'prop') {
      const q = snapTo({ x: d.orig.x + p.x - d.start.x, y: d.orig.y + p.y - d.start.y }, snap);
      if (d.moved) setHover(`${show.props?.find((x) => x.id === d.id)?.name ?? 'Prop'} center: ${readout(q, fieldOf(show))}`); // the prop's center, not the pointer
      setShow((s) => placeProp(s, onSet, d.id, { ...d.orig, ...q }, atDown.current?.show));
    } else if (d.kind === 'arrow') {
      setShow((s) => setMarks(s, onSet, (ms) => ms.map((m) => (m.id === d.id && m.kind === 'arrow' ? { ...m, to: snapTo(p, snap) } : m))));
    } else if (d.kind === 'ink') {
      setShow((s) => setMarks(s, onSet, (ms) => ms.map((m) => (m.id === d.id && m.kind === 'ink' ? { ...m, pts: addInk(m.pts, p) } : m))));
    } else if (d.kind === 'turn') {
      if (!ftlGroup?.turns) return;
      const q = snapTo(p, snap), leader = ftlGroup.order[0], turns = ftlGroup.turns.map((x, k) => (k === d.k ? q : x));
      setShow((s) => setFtlTurns(s, onSet, leader, turns));
    } else if (d.kind === 'frame') {
      const { deg, kx, ky } = frameDrag(d.mode, d.c, d.down, p);
      Object.assign(d, { deg, kx, ky });
      setShow(() => rotateScale(d.orig, onSet, d.ids, deg, kx, ky));
      setHover(d.mode === 'rotate' ? `Rotate ${Math.abs(deg)}° ${deg > 0 ? 'counterclockwise' : deg < 0 ? 'clockwise' : ''}` : `Side to side ${Math.round(kx * 100)}% · front to back ${Math.round(ky * 100)}%`);
    } else if (d.kind === 'handle') {
      if (!shapeEdit) return;
      updateShape(moveHandle(shapeEdit.shape, d.i, snapTo(p, snap), e.altKey)); // Option/Alt: move this handle alone
    } else {
      // Snap the grabbed performer; the rest of the selection keeps its shape.
      const a0 = d.orig[d.anchor];
      const a1 = snapTo({ x: a0.x + p.x - d.start.x, y: a0.y + p.y - d.start.y }, snap);
      const dx = a1.x - a0.x, dy = a1.y - a0.y;
      if (d.moved) setHover(`${label(show, show.performers.find((x) => x.id === d.anchor)!)}: ${readout(a1, fieldOf(show))}`); // where the grabbed performer lands, not the pointer
      const moves = Object.fromEntries(Object.entries(d.orig).map(([k, q]) => [k, { x: q.x + dx, y: q.y + dy }]));
      const leader = d.turns && ftlGroup?.order[0];
      setShow((s) => { const m = placeInSet(s, onSet, moves, atDown.current?.show); return leader ? setFtlTurns(m, onSet, leader, d.turns!.map((q) => ({ x: q.x + dx, y: q.y + dy }))) : m; });
    }
  };

  const liftFinger = (e: React.PointerEvent) => {
    touches.current.delete(e.pointerId);
    if (touches.current.size < 2) pinch.current = null; // the finger left behind does nothing until it lifts
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const finger = touches.current.has(e.pointerId);
    liftFinger(e);
    if (finger && penSeen.current) return; // fingers only pan and zoom: what's under way belongs to the Pencil
    // Apply the release point too: a fast release can arrive without a final pointermove, landing the drag short.
    if (drag.current && drag.current.kind !== 'pan') onPointerMove(e);
    atDown.current = null; // after the last move: it still needs the show from when the drag began
    const d = drag.current;
    drag.current = null;
    if (d?.kind === 'arrow' || d?.kind === 'ink') {
      setShow((s) => setMarks(s, onSet, (ms) => ms.filter((m) => m.id !== d.id ||
        (m.kind === 'arrow' ? m.from.x !== m.to.x || m.from.y !== m.to.y : m.kind !== 'ink' || m.pts.length > 1))));
    }
    if (d?.kind === 'box') {
      const [x0, x1] = [Math.min(d.a.x, d.b.x), Math.max(d.a.x, d.b.x)];
      const [y0, y1] = [Math.min(d.a.y, d.b.y), Math.max(d.a.y, d.b.y)];
      const inside = Object.entries(positions).filter(([id, q]) => !faded.has(id) && q.x >= x0 && q.x <= x1 && q.y >= y0 && q.y <= y1).map(([k]) => k);
      setSelected(new Set([...(d.add ? selected : []), ...inside]));
      setBox(undefined);
    }
  };

  /**
   * Save the show as a .freeform file where the user chooses: a Save dialog where the browser has one (Chrome, Edge),
   * the share sheet on a tablet or phone (Save to Files), otherwise a download. True once it's saved, false if cancelled.
   * `inPlace` (Save, ⌘S): write to the file this show was last saved to, without asking, when there is one. Save As passes false.
   * shortcut: the file is remembered only until the page closes; after a reload the first ⌘S asks again (keeping it needs IndexedDB and a permission prompt).
   */
  const saveTo = async (inPlace: boolean): Promise<boolean> => {
    const name = `${show.title.replace(/[^\w\- ]+/g, '').trim() || 'show'}.freeform`;
    const blob = new Blob([JSON.stringify(show, null, 2)], { type: 'application/octet-stream' }); // not JSON's type: Safari would add ".json"
    const file = new File([blob], name, { type: blob.type });
    const pick = (window as { showSaveFilePicker?: (o: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
    try {
      if (inPlace && fileHandle.current) {
        const h = fileHandle.current, w = await h.createWritable();
        await w.write(blob); await w.close();
        setNotice({ text: `Saved to ${h.name}.`, t });
      } else if (pick) {
        const h = await pick({ suggestedName: name, types: [{ description: 'FreeFORM show', accept: { 'application/octet-stream': ['.freeform'] } }] });
        const w = await h.createWritable();
        await w.write(blob); await w.close();
        fileHandle.current = h;
      } else if (coarse() && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) { setFileError(`Couldn't save: ${err instanceof Error ? err.message : String(err)}`); fileHandle.current = null; }
      return false;
    }
    backedUp(); setFileError('');
    return true;
  };
  const save = () => saveTo(true), saveAs = () => saveTo(false);
  const saveRef = useRef(saveTo); saveRef.current = saveTo; // the key handler's copy is only refreshed on some changes; this one is always current

  const open = async (f: File) => {
    try {
      const s = /\.3dj$/i.test(f.name) ? parse3dj(await f.arrayBuffer(), f.name.replace(/\.3dj$/i, '')) : parseShow(await f.text());
      replaceShow(withShowId(s)); setFileError(''); // what's open is the file itself (an older file or a .3dj gets an id)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : String(err));
    }
  };

  const freshNow = () => {
    replaceShow(newShow(startingSections())); // nothing to back up yet
    setTool('add'); setOpenAdd((n) => n + 1); // a blank field: straight to placing performers (Jason)
  };
  const fresh = () => {
    if (unexported && show.performers.length) setPending({ what: 'Starting a new show', go: freshNow });
    else if (!show.performers.length || confirm('Start a new show? (You can Undo this.)')) freshNow();
  };
  const [openAdd, setOpenAdd] = useState(0);
  // The docs' demo show, to look around in before writing one.
  const trySample = () => guard('Opening the sample show', () => { replaceShow(sampleShow()); setTool('select'); }); // in the main bundle: the offline cache only keeps files the page links
  // A close call on the timeline: go to the count where the closest pair is nearest and select them.
  const showCloseCall = (i: number) => {
    const all = closeCalls(show, i), c = all[0];
    if (!c) return;
    const name = (id: string) => label(show, show.performers.find((x) => x.id === id)!), at = starts[i - 1] + c.count;
    setPlaying(false); setT(at); setSelected(new Set([c.a, c.b])); setSelectedMark(null); setSelectedProp(null);
    setNotice({ t: at, text: `${name(c.a)} and ${name(c.b)}: ${Math.round(c.d * 10) / 10} steps apart on count ${c.count} into set ${show.sets[i].name}.${all.length > 1 ? ` ${all.length - 1} more ${all.length === 2 ? 'pair' : 'pairs'}: see Move in set ${show.sets[i].name}.` : ''}` });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Fixed height, no wrapping: nothing up here may resize the field (a canvas resize clears it, which flashes). */}
      {/* The logo, a hint, and the theme button; the hint gives up space first. */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '0 12px', height: coarse() ? 56 : 40, flexShrink: 0, whiteSpace: 'nowrap', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' }}>
        {/* The small logo; just the curve when the window is narrow. */}
        <span className="tb-long-sm" style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
          <picture><source media="(max-width: 1000px)" srcSet={theme === 'light' ? './mark-light.svg' : './mark.svg'} />
            <img src={theme === 'light' ? './logo-small-light.svg' : './logo-small.svg'} alt="FreeFORM" style={{ height: coarse() ? 30 : 24, display: 'block' }} /></picture>
        </span>
        <span style={{ flex: '1 1 0', fontSize: 12, opacity: tool === 'turn' ? 1 : 0.7, color: tool === 'turn' ? 'var(--gold)' : undefined, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{tool === 'turn' ? (coarse() ? "Tap the field for each of the leader's turns, in marching order · then tap Select" : "Click the field for each of the leader's turns, in marching order · Esc when done")
          : coarse() ? 'Two fingers: drag to move around, pinch to zoom' : 'Scroll to pan · pinch or ⌘/Ctrl+scroll to zoom · right-drag pans'}</span>
        <span style={{ flex: 'none' }}>
          <Menu label="Help" title="The how-to guide, and a sample show to look around in">{(close) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
              <button onClick={() => { close(); window.open(GUIDE, '_blank', 'noopener'); }} title="The step-by-step guide, with pictures (opens in a new tab)">How-to guide</button>
              <button onClick={() => { close(); trySample(); }} title="Open the 47-performer sample show (offers to save your show to a file first if it has changes you haven't saved)">Try the sample show</button>
            </div>
          )}</Menu>
        </span>
        <span style={{ flex: 'none' }}><ThemeButton /></span>
      </div>
      <Toolbar openAdd={openAdd} t={t} setT={(x) => { setPlaying(false); setT(x); }} selectedProp={selectedProp} setSelectedProp={setSelectedProp}
        selectedMark={selectedMark} setSelectedMark={setSelectedMark} showSidebar={() => setSideChoice(true)} show={show} setShow={setShow} onSet={onSet} selected={selected} setSelected={setSelected} tool={tool} setTool={setTool}
        section={section} setSection={setSection} snap={snap} setSnap={setSnap}
        onUndo={() => step('undo')} onRedo={() => step('redo')} canUndo={!!hist.past.length} canRedo={!!hist.future.length}
        onFit={fit} sidebar={{ open: sideOpen, toggle: () => setSideChoice(!sideOpen) }}
        timeline={{ open: timelineOpen, toggle: () => setTimelineOpen(!timelineOpen) }}
        shape={shapeEdit?.shape ?? null} startShape={startShape} updateShape={updateShape} endShape={() => setShapeEdit(null)} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: tool === 'add' ? 'copy' : tool === 'text' ? 'text' : tool === 'select' ? 'default' : 'crosshair' }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => { // the system took the touch (an edge swipe, or iPadOS when fingers join a Pencil)
            const finger = touches.current.has(e.pointerId);
            liftFinger(e);
            if (e.pointerType === 'pen') { drag.current = null; atDown.current = null; setBox(undefined); } // keep what the Pencil did
            else if (!(finger && penSeen.current)) cancelGesture();
          }}
          onPointerLeave={() => setHover('')}
        />
        {show.performers.length === 0 && !pending && (
          <div className="backup-note" role="group" aria-label="Start a show">
            <span><strong>Start your show.</strong> Place performers on the field, bring in a roster from Excel, or look around a finished sample first.</span>
            <button className="primary" onClick={() => { setTool('add'); setOpenAdd((n) => n + 1); }}>Place performers</button>
            <button onClick={() => setRoster(true)}>Import a roster…</button>
            <button onClick={trySample}>Try the sample show</button>
          </div>
        )}
        {pending && (
          <div role="alert" className="backup-note">
            <span>"{show.title || 'This show'}" has changes you haven't saved to a file. {pending.what} replaces it in this browser (Undo brings it back until you close the page).</span>
            <button className="primary" onClick={async () => { const go = pending.go; if (await save()) { setPending(null); go(); } }}>Save, then continue</button>
            <button onClick={() => { const go = pending.go; setPending(null); go(); }}>Continue without saving</button>
            <button onClick={() => setPending(null)}>Cancel</button>
          </div>
        )}
        {saveFailed === 'yes' && !pending && (
          <div role="alert" className="backup-note">
            <span>This browser didn't save your latest changes (its storage is full or turned off). Save it to a file now so you don't lose them.</span>
            <button className="primary" onClick={save}>Save now</button>
            <button onClick={() => setSaveFailed('seen')}>OK</button>
          </div>
        )}
        {remindBackup && !pending && saveFailed !== 'yes' && (
          <div role="alert" className="backup-note">
            <span>This show is saved only in this browser, and you haven't saved it to a file since {new Date(unexported!).toLocaleDateString()}. Save a copy to keep it safe.</span>
            <button className="primary" onClick={save}>Save</button>
            <button onClick={() => { const n = Date.now() + DAY; writeTime(SNOOZE, n); setSnooze(n); }}>Later</button>
          </div>
        )}
        {/* Floats over the field so its changing length can't move the layout. */}
        {(notice?.t === t || hover) && (
          <div role={notice?.t === t ? 'status' : undefined} style={{ position: 'absolute', left: 8, bottom: 8, maxWidth: 'calc(100% - 16px)', padding: '4px 8px', borderRadius: 4,
            background: 'rgba(24,36,25,0.85)', color: PALETTE.text, fontSize: 14, fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}>{notice?.t === t ? notice.text : hover}</div>
        )}
        </div>
        {/* Hidden, not unmounted, like the sidebar: its zoom and menus survive. */}
        <div style={timelineOpen ? undefined : { display: 'none' }}>
        <Timeline click={{ on: clickOn, set: (on) => { setClickOn(on); setClickWanted(on); if (on) wakeClick(); } }} wave={wave && show.music && show.music.taps.length >= 2 ? { peaks: wave, taps: show.music.taps } : undefined} show={show} setShow={setShow} t={t} setT={(x) => { setPlaying(false); setT(x); }} playing={playing} setPlaying={setPlaying} bpm={bpm} setBpm={setBpm}
          range={range} setRange={setRange} span={span} onCloseCall={showCloseCall}
          music={<MusicMenu show={show} setShow={setShow} audio={audio} onAudio={() => setAudioTick((n) => n + 1)} useMusic={useMusic} setUseMusic={setUseMusic} />} />
        </div>
      </div>
      {/* Hidden, not unmounted: open panels and drafts survive closing it. */}
      <div style={!sideOpen ? { display: 'none' } : narrow ? { position: 'absolute', top: 0, right: 0, bottom: 0, maxWidth: '100%', zIndex: 10, display: 'flex',
        background: 'var(--bg)', boxShadow: '-6px 0 16px rgba(0,0,0,0.45)' } : { display: 'flex' }}>
      <Sidebar
        show={show} setShow={setShow} t={t} setT={(x) => { setPlaying(false); setT(x); }} onSet={onSet}
        selected={selected} setSelected={setSelected} tool={tool} setTool={setTool}
        section={section} setSection={setSection} snap={snap} setSnap={setSnap} starts={starts}
        onNew={fresh} onOpen={() => guard('Importing another show', () => fileRef.current?.click())} onSave={save} onSaveAs={saveAs} onPrint={() => setPrinting(true)} onShare={() => setSharing(true)} fileError={fileError}
        selectedMark={selectedMark} setSelectedMark={setSelectedMark} adding={adding} setAdding={setAdding}
        look={look} setLook={setLook}
        clip={clip ? Object.keys(clip).length : 0} onCopy={copySpots} onPaste={pasteSpots} selectedProp={selectedProp} setSelectedProp={setSelectedProp} onTrace={() => setTraceTick((n) => n + 1)}
        onUndo={() => step('undo')} onRedo={() => step('redo')} canUndo={!!hist.past.length} canRedo={!!hist.future.length}
        onFit={fit} shape={shapeEdit?.shape ?? null} startShape={startShape} updateShape={updateShape} endShape={() => setShapeEdit(null)}
      />
      </div>
      </div>
      {sharing && <ShareDialog show={show} onClose={() => setSharing(false)} setRevision={(n) => setShow((s) => ({ ...s, revision: n }))} />}
      {roster && <RosterImport show={show} setShow={setShow} onClose={() => setRoster(false)} />}
      {printing && <PrintDialog show={show} selected={selected} onClose={() => setPrinting(false)} />}
      <input ref={fileRef} type="file" accept=".freeform,.json,application/json,.3dj" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) open(f); e.target.value = ''; }} />
    </div>
  );
}
