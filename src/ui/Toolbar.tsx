import { createPortal } from 'react-dom';
import { IconFit, IconRedo, IconSidebar, IconTimeline, IconUndo } from './icons';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { addBezierSegment, addCurvePoint, cleanText, coilGap, placeInner, type Shape, type ShapeKind } from '../engine/shapes';
import { distance, fieldDepth } from '../engine/coords';
import {
  addProp, addSetHere, fieldOf, MAX_PROPS, removeProp, removeSet, setMarks, setStarts, chainOrder, clearFtl, closeCalls, setFtlSmooth, newId, counterMarch, flip, groupTurn, setFtlTurns, setTiming, setTurning, timingOf, label, mirrorSides, placeInSet, removePerformers, rotateScale, setFtl, setLabelSide, snapSelection,
  type LabelSide, type Show,
} from '../engine/show';
import { curveSides } from '../field/labels';
import { LabelCompass } from './LabelCompass';
import type { Snap, Tool } from './Sidebar';
import { NumberField } from './NumberField';
import { SetControls } from './Timeline';

export interface ToolbarProps {
  show: Show;
  setShow: (f: (s: Show) => Show) => void;
  onSet: number;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  section: string;
  setSection: (id: string) => void;
  snap: Snap;
  setSnap: (s: Snap) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFit: () => void;
  sidebar?: { open: boolean; toggle: () => void }; // the sidebar's show/hide button
  timeline?: { open: boolean; toggle: () => void }; // the timeline's show/hide button
  shape: Shape | null;
  startShape: (k: ShapeKind) => void;
  updateShape: (patch: Partial<Shape>) => void;
  endShape: () => void;
  openAdd?: number; // bumped by New: open the Add menu
  t: number;
  setT: (t: number) => void; // jump to a count (and stop playing)
  selectedProp: string | null;
  setSelectedProp: (id: string | null) => void;
  selectedMark: string | null;
  setSelectedMark: (id: string | null) => void;
  showSidebar: () => void;
}

/** Shape, its name, and its one-letter shortcut (pressed with 2 or more performers selected). */
export const SHAPES: [ShapeKind, string, string][] = [['line', 'Line', 'L'], ['arc', 'Arc', 'R'], ['curve', 'Curve', 'U'], ['bezier', 'Bézier', 'B'],
  ['circle', 'Circle', 'O'], ['polygon', 'Polygon', 'P'], ['star', 'Star', 'X'], ['spiral', 'Spiral', 'S'], ['block', 'Block', 'K'], ['text', 'Letters', 'W']];
const MARKUP: [Tool, string][] = [['text', 'Text (T)'], ['arrow', 'Arrow'], ['draw', 'Draw']];
const row: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 };
const help: React.CSSProperties = { margin: '6px 0 0', opacity: 0.75, fontSize: 12, whiteSpace: 'normal' };

/**
 * Drill-writing tools, in one row under the top bar. Fixed height and no wrapping (a taller row would resize, and
 * flash, the field); anything with options opens as a small panel below its button instead.
 */
export function Toolbar(p: ToolbarProps) {
  const { show, setShow, onSet, selected } = p;
  const ids = [...selected];
  const onASet = onSet >= 0, any = ids.length > 0 && onASet, many = ids.length > 1 && onASet;
  const [note, setNote] = useState(''); // feedback from the last action (mirror refused, stacked dots, straight line…)
  const [snapNote, setSnapNote] = useState('');
  useEffect(() => { setNote(''); setSnapNote(''); }, [selected]);
  const [deg, setDeg] = useState(15);
  const [pct, setPct] = useState(110);
  const [pivot, setPivot] = useState(''); // '' = the center; or a selected performer the group turns around (a gate turn)
  const turn = (d: number, k: number) => setShow((s) => rotateScale(s, onSet, ids, d, k, k, ids.includes(pivot) ? s.sets[onSet].pos[pivot] : undefined));
  const byName = [...ids].sort((a, b) => label(show, show.performers.find((x) => x.id === a)!).localeCompare(label(show, show.performers.find((x) => x.id === b)!), undefined, { numeric: true }));
  const mirror = (from: 1 | 2) => {
    try { const next = mirrorSides(show, onSet, ids, from); setShow(() => next); setNote(''); } // run here, not in the updater, so a refusal is caught
    catch (e) { setNote(e instanceof Error ? e.message : String(e)); }
  };
  const snapUnit = p.snap || 1; // Free snapping falls back to whole steps
  const snapSel = () => {
    const r = snapSelection(show, onSet, ids, snapUnit);
    setShow(() => r.show);
    setSnapNote(r.stacked.length ? `Now sharing a spot: ${r.stacked.join(', ')}. Move them apart or undo.` : '');
  };
  const pinCurve = (outside: boolean) => {
    const sides = curveSides(ids.map((id) => show.sets[onSet].pos[id]), outside);
    if (sides.every((x) => !x)) { setNote('These dots are in a straight line: pick a direction on the compass.'); return; }
    setShow((s) => ids.reduce((acc, id, k) => (sides[k] ? setLabelSide(acc, onSet, [id], sides[k]) : acc), s));
    setNote(sides.some((x) => !x) ? 'Dots on a straight stretch were left as they were.' : '');
  };
  const sides = any ? new Set(ids.map((id) => show.sets[onSet].labels?.[id] ?? '')) : new Set<string>();
  const markup = MARKUP.find(([t]) => t === p.tool);
  const needs = (ok: boolean, why: string) => (ok ? undefined : why);
  const pick = onASet ? 'Select performers first' : 'Scrub to a set first';
  const addLetter = p.tool === 'add' ? ` · ${show.sections.find((s) => s.id === p.section)?.letter ?? '?'}` : '';

  return (
    <>
    {/* Two fixed rows (Jason: one scrolling row hid tools): picking and deleting performers, with Undo at the end; then
        placing and moving them. */}
    <div className="toolbar" role="toolbar" aria-label="Performers">
      <div role="radiogroup" aria-label="Performer tool" style={{ display: 'inline-flex', gap: 4 }}>{/* separate buttons, like Delete (Jason) */}
        <button role="radio" aria-checked={p.tool === 'select'} onClick={() => p.setTool('select')} title="Select and move performers, markup, and props (V)">Select</button>
        <Menu label={<>Add{addLetter}</>} name={`Add${addLetter}`} openNow={p.openAdd}
          pressed={p.tool === 'add'} title="Add performers (A), a prop, or a set">
          {(close) => <AddPanel {...p} close={close} />}
        </Menu>
      </div>
      <DeleteButton {...p} />
      <span className="tb-sep" />
      <SetControls show={show} setShow={setShow} t={p.t} />

      {/* Pinned to the right edge: if the row is ever too narrow and scrolls sideways, Undo stays in reach. */}
      <span className="tb-pinned">
      <button onClick={p.onUndo} disabled={!p.canUndo} title="Undo (⌘Z / Ctrl+Z)" aria-label="Undo" className="icon"><IconUndo /></button>
      <button onClick={p.onRedo} disabled={!p.canRedo} title="Redo (⇧⌘Z / Ctrl+Y)" aria-label="Redo" className="icon"><IconRedo /></button>
      <button onClick={p.onFit} title="Fit: zoom out to the whole field" aria-label="Fit field" className="icon"><IconFit /></button>
      {p.timeline && <button onClick={p.timeline.toggle} aria-pressed={p.timeline.open} aria-label="Timeline" title={p.timeline.open ? 'Hide the timeline (more room for the field)' : 'Show the timeline (play, tempo, music, sets)'} className="icon"><IconTimeline /></button>}
      {p.sidebar && <button onClick={p.sidebar.toggle} aria-pressed={p.sidebar.open} aria-label="Sidebar" title={p.sidebar.open ? 'Hide the sidebar' : 'Show the sidebar (show, set notes, selection, sections, roster)'} className="icon"><IconSidebar /></button>}
      </span>
    </div>
    <div className="toolbar" role="toolbar" aria-label="Placement and movement">
      <label className="tb-field" title="Snap to grid: the grid performers stick to as you drag or add them">Snap<span className="tb-long"> to grid</span>
        <select value={p.snap} onChange={(e) => p.setSnap(Number(e.target.value) as Snap)}>
          <option value={1}>Whole</option>
          <option value={0.5}>Half</option>
          <option value={0}>Free</option>
        </select>
      </label>
      <button disabled={!any} onClick={snapSel}
        title={any ? `Round the selected performers onto ${snapUnit === 1 ? 'whole' : 'half'} steps (for dots left off the grid by a rotate, a shape, or an import)` : `Rounds selected performers onto the grid (${pick.toLowerCase()})`} aria-label="Apply the grid to selected performers">Apply</button>
      {snapNote && <span role="alert" className="tb-note" title={snapNote}>{snapNote}</span>}
      <span className="tb-sep" />
      {/* Markup (instructions on the page) is a separate kind of tool from placing performers. */}
      <Menu label={markup ? markup[1].replace(' (T)', '') : 'Markup'} pressed={!!markup} title="Notes, arrows, and drawing on this set's page">
        {(close) => MARKUP.map(([t, l]) => (
          <button key={t} role="menuitemradio" aria-checked={p.tool === t} onClick={() => { p.setTool(t); close(); }}>{l}</button>
        ))}
      </Menu>
      <span className="tb-sep" />

      <Menu label="Shape" disabled={needs(many, ids.length === 1 ? 'Select 2 or more performers' : pick)} keepOpen={!!p.shape} pressed={!!p.shape}
        title="Shape the selection into a line, arc, curve, Bézier, circle, polygon, star, spiral, block, or letters">
        {() => <ShapePanel {...p} />}
      </Menu>
      <Menu label="Transform" disabled={needs(any, pick)} title="Flip, mirror, rotate, or scale the selection">
        {() => <>
          <strong style={{ fontSize: 12, opacity: 0.8 }}>Mirror</strong>
          <button onClick={() => { setShow((s) => flip(s, onSet, ids, 'x')); setNote(''); }} title="Swap sides: Side 1 ↔ Side 2">Flip across the 50</button>
          <button onClick={() => { setShow((s) => flip(s, onSet, ids, 'y')); setNote(''); }} title="Swap front and back">Flip front ↔ back</button>
          {ids.length > 1 && <>
            <button onClick={() => mirror(1)} title="Side 2 performers take the mirror image of Side 1">Copy Side 1 → 2</button>
            <button onClick={() => mirror(2)} title="Side 1 performers take the mirror image of Side 2">Copy Side 2 → 1</button>
          </>}
          {ids.length > 1 && <>
            <strong style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Rotate &amp; scale</strong>
            <label style={{ fontSize: 12 }}>Around{' '}
              <select aria-label="Rotate around" value={ids.includes(pivot) ? pivot : ''} onChange={(e) => setPivot(e.target.value)}
                title="The point the group turns around: its center, or one performer's spot (a gate turn on the end of a line)">
                <option value="">The center</option>
                {byName.map((id) => <option key={id} value={id}>{label(show, show.performers.find((x) => x.id === id)!)}</option>)}
              </select>
            </label>
            <div style={{ ...row, marginTop: 0 }}>
              <NumberField aria-label="Rotation in degrees" min={1} max={180} integer value={deg} style={{ width: 52 }} onValue={setDeg} />°
              <button onClick={() => turn(deg, 1)} title="Rotate counterclockwise">↺</button>
              <button onClick={() => turn(-deg, 1)} title="Rotate clockwise">↻</button>
            </div>
            <div style={{ ...row, marginTop: 0 }}>
              <NumberField aria-label="Scale percent" min={101} max={400} integer value={pct} style={{ width: 52 }} onValue={setPct} />%
              <button onClick={() => turn(0, pct / 100)}>Expand</button>
              <button onClick={() => turn(0, 100 / pct)}>Contract</button>
            </div>
          </>}
          {note && <p role="alert" style={{ ...help, color: 'var(--danger)', opacity: 1 }}>{note}</p>}
        </>}
      </Menu>
      <Menu label="Path" disabled={needs(any && onSet > 0, onSet === 0 ? 'Set 1 has no move into it' : pick)}
        title="How the selected performers get to their spots in this set: straight, follow the leader, or a custom path">
        {(close) => <FtlPanel {...p} ids={ids} close={close} />}
      </Menu>
      <Menu label="Move" disabled={needs(onSet > 0, onSet === 0 ? 'Set 1 has no move into it' : 'Scrub to a set first')}
        title="The move into this set: when the selected performers step off, whether they turn, and anyone who comes too close">
        {() => <MovePanel {...p} ids={ids} />}
      </Menu>
      <Menu label="Labels" disabled={needs(any, pick)} title="Where the selected performers' labels sit in this set">
        {() => <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <LabelCompass value={sides.size === 1 ? ([...sides][0] as LabelSide | '') : 'mixed'} onPick={(side) => { setShow((s) => setLabelSide(s, onSet, ids, side)); setNote(''); }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch' }}>
              {ids.length > 2 && <>
                <button onClick={() => pinCurve(false)} title="Labels on the inside of the curve the dots form">Inside curve</button>
                <button onClick={() => pinCurve(true)} title="Labels on the outside of the curve the dots form">Outside curve</button>
              </>}
              <button aria-pressed={sides.size === 1 && sides.has('hidden')} onClick={() => { setShow((s) => setLabelSide(s, onSet, ids, 'hidden')); setNote(''); }}
                title="No label for these dots in this set">Hide</button>
            </div>
          </div>
          <p style={help}>Set {show.sets[onSet]?.name}. Center <strong>A</strong> = automatic: a free side, hidden when there's no room (zoom in to see it).</p>
          {note && <p role="status" style={help}>{note}</p>}
        </>}
      </Menu>
      <button disabled={!(any && onSet > 0)} onClick={() => setShow((s) => placeInSet(s, onSet, Object.fromEntries(ids.map((id) => [id, s.sets[onSet - 1].pos[id]]))))}
        title={onSet > 0 ? `Put the selected performers back where they were in set ${show.sets[onSet - 1].name} (Undo reverses it)` : onSet === 0 ? 'Set 1 has no set before it' : pick} aria-label={`Reset to set ${onSet > 0 ? show.sets[onSet - 1].name : '…'}`}>
        Reset<span className="tb-long-sm"> to set {onSet > 0 ? show.sets[onSet - 1].name : '…'}</span>
      </button>
    </div>
    </>
  );
}

/** "Are you sure?" before deleting performers (they leave every set). */
export function confirmDelete(show: Show, ids: string[]): boolean {
  const one = ids.length === 1 ? show.performers.find((x) => x.id === ids[0]) : undefined;
  const who = one ? `${label(show, one)}${one.name ? ` (${one.name})` : ''}` : `these ${ids.length} performers`;
  return confirm(`Are you sure you want to delete ${who}? ${one ? 'This performer is' : 'They are'} removed from every set. (Undo brings ${one ? 'it' : 'them'} back.)`);
}

/** A toolbar button that opens a small panel below it. Closes on a click elsewhere or Esc (unless `keepOpen`). */
export function Menu({ label, name, title, disabled, keepOpen, pressed, openNow, children }: {
  label: ReactNode; name?: string; title: string; disabled?: string; keepOpen?: boolean; pressed?: boolean; children: (close: () => void) => ReactNode;
  openNow?: number; // changing it (to more than 0) opens the panel, as if its button were clicked
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (openNow) setOpen(true); }, [openNow]);
  const ref = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null);
  const shown = !disabled && (open || !!keepOpen);
  // Placed against the window and rendered into <body>: inside the toolbar's sideways-scrolling row, iPad Safari clipped
  // it out of sight while its buttons still caught taps (a tap on the field picked the hidden first section).
  const [at, setAt] = useState<React.CSSProperties | null>(null);
  useLayoutEffect(() => {
    if (!shown) return;
    const r = ref.current!.getBoundingClientRect(), left = Math.max(8, Math.min(r.left, innerWidth - 352));
    // Near the bottom of the window (the timeline), open upward.
    setAt(r.bottom > innerHeight * 0.6 ? { left, bottom: innerHeight - r.top + 6 } : { left, top: r.bottom + 6 });
  }, [shown]);
  // The panel isn't next to its button in the page any more, so Tab wouldn't reach it: start in its first button.
  useEffect(() => { if (open && at) panel.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true }); }, [open, at]); // once placed: hidden buttons can't take focus
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { const t = e.target as Node; if (!ref.current?.contains(t) && !panel.current?.contains(t)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }; // Esc closes the panel only, not the selection
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} className="tb-menu">
      <button aria-haspopup="true" aria-expanded={shown} aria-pressed={pressed || undefined} disabled={!!disabled} aria-label={name}
        title={disabled ? `${title} (${disabled})` : title} onClick={() => setOpen(!open)}>
        {label} <span aria-hidden className="caret">▾</span>
      </button>
      {shown && createPortal(<div ref={panel} className="tb-menu-panel" role="menu" aria-label={name ?? String(label)} style={at ?? { visibility: 'hidden' }}>{children(() => setOpen(false))}</div>, document.body)}
    </div>
  );
}

function ShapePanel({ shape, startShape, updateShape, endShape }: ToolbarProps) {
  return (
    <>
      <div style={{ ...row, marginTop: 0 }} role="radiogroup" aria-label="Shape">
        {SHAPES.map(([k, l, key]) => (
          <button key={k} role="radio" aria-checked={shape?.kind === k} onClick={() => startShape(k)} title={`${l} (${key})`}>{l}</button>
        ))}
      </div>
      {shape && (
        <>
          {shape.kind === 'text' && (
            <div style={row}>
              <label>Spell <input aria-label="Letters to spell" value={shape.text ?? ''} maxLength={40} style={{ width: 140, textTransform: 'uppercase' }}
                onChange={(e) => updateShape({ text: e.target.value })} /></label>
            </div>
          )}
          {shape.kind !== 'text' && <div style={row}>
            <label><input type="radio" name="spacing" checked={shape.interval == null} onChange={() => updateShape({ interval: null })} /> Even</label>
            <label>
              <input type="radio" name="spacing" checked={shape.interval != null} onChange={() => updateShape({ interval: 2 })} /> Every{' '}
              <NumberField aria-label="Interval in steps" min={0.5} step={0.5} value={shape.interval ?? 2} style={{ width: 48 }}
                onValue={(n) => updateShape({ interval: n })} /> steps
            </label>
          </div>}
          {(shape.kind === 'polygon' || shape.kind === 'star') && (
            <div style={row}>
              <label>{shape.kind === 'star' ? 'Points' : 'Sides'} <NumberField aria-label={shape.kind === 'star' ? 'Points' : 'Sides'} min={3} max={12} integer
                value={shape.sides ?? 5} style={{ width: 48 }} onValue={(n) => updateShape(shape.kind === 'star' ? placeInner({ ...shape, sides: n }) : { sides: n })} /></label>
              {shape.kind === 'star' && <label title="How far in the inside corners sit, as a percent of the points' distance from the center">Inner{' '}
                <NumberField aria-label="Inner corners, percent" min={5} max={100} integer style={{ width: 48 }}
                  value={Math.round((distance(shape.handles[0], shape.handles[2]) / (distance(shape.handles[0], shape.handles[1]) || 1)) * 100)}
                  onValue={(n) => updateShape(placeInner(shape, (n / 100) * distance(shape.handles[0], shape.handles[1])))} />%</label>}
            </div>
          )}
          {shape.kind === 'spiral' && (
            <div style={row}>
              <label>Turns <NumberField aria-label="Turns" min={0.5} max={20} step={0.5} value={Math.abs(shape.turns ?? 2)} style={{ width: 48 }}
                onValue={(n) => updateShape({ turns: Math.sign(shape.turns ?? 2) * n })} /></label>
              <button onClick={() => updateShape({ turns: -(shape.turns ?? 2) })} title="Wind the spiral the other way">
                {(shape.turns ?? 2) > 0 ? '↺ Counterclockwise' : '↻ Clockwise'}</button>
            </div>
          )}
          {shape.kind === 'spiral' && coilGap(shape) < 2 && (
            <p role="alert" style={{ ...help, color: 'var(--danger)', opacity: 1 }}>
              The coils are only {Math.round(coilGap(shape) * 10) / 10} steps apart. Performers on neighboring coils will be too close: fewer turns or a bigger spiral.</p>
          )}
          {shape.kind === 'block' && (
            <div style={row}>
              <label>Columns <NumberField aria-label="Columns" min={1} integer value={shape.cols} style={{ width: 48 }}
                onValue={(n) => updateShape({ cols: n })} /></label>
            </div>
          )}
          <div style={row}>
            {shape.kind === 'curve' && <button onClick={() => updateShape(addCurvePoint(shape))}>+ Curve point</button>}
            {shape.kind === 'bezier' && <button onClick={() => updateShape(addBezierSegment(shape))}>+ Segment</button>}
            <button className="primary" onClick={endShape}>Done (Esc)</button>
          </div>
          <p style={help}>
            Drag the blue handles on the field. Performers keep their order along the shape.
            {(shape.kind === 'polygon' || shape.kind === 'star') && ` ${shape.kind === 'star' ? 'The middle handle is the center. Drag the point handle to size and turn the star, and the inside-corner handle to make the points longer or shorter.' : 'The first handle is the center; drag the corner handle to size and turn it.'} Performers go evenly around the outline, starting at the ${shape.kind === 'star' ? 'point' : 'corner'} handle.`}
            {shape.kind === 'spiral' && ' The first handle is the center; the second is the outer end. Intervals are measured performer to performer.'}
            {shape.kind === 'text' && ` The letters fill the box between the two handles. Capitals, numbers, and hyphens. Each letter reads best with about 8 to 12 performers${cleanText(shape.text ?? '').replace(/ /g, '').length ? ` (about ${8 * cleanText(shape.text ?? '').replace(/ /g, '').length} or more for this)` : ''}.`}
            {shape.kind === 'bezier' && ' Squares are points the curve passes through; circles pull the curve toward them. Hold Option (Alt) while dragging to move one handle by itself, e.g. to make a corner.'}
          </p>
        </>
      )}
    </>
  );
}

/** Follow-the-leader for the move into the current set. */
function FtlPanel({ show, setShow, onSet, ids, setTool, close }: ToolbarProps & { ids: string[]; close: () => void }) {
  const groups = show.sets[onSet].ftl ?? [];
  // The group this selection is exactly, if any; otherwise offer to make one.
  const current = groups.find((g) => g.order.length === ids.length && g.order.every((id) => ids.includes(id)));
  const name = (id: string) => label(show, show.performers.find((x) => x.id === id)!);
  const byLabel = [...ids].sort((a, b) => name(a).localeCompare(name(b), undefined, { numeric: true }));
  const inOther = ids.some((id) => groups.some((g) => g !== current && g.order.includes(id)));
  const kind = current ? (current.order.length > 1 ? 'ftl' : 'custom') : inOther ? 'mixed' : 'straight';
  const make = (leader: string) => setShow((s) => setFtl(s, onSet, chainOrder(s, onSet, leader, ids)));
  const [cmNote, setCmNote] = useState('');
  const cm = (order: string[], side: 'left' | 'right') => {
    try { const next = counterMarch(show, onSet, order, side); setShow(() => next); setCmNote(''); }
    catch (e) { setCmNote(e instanceof Error ? e.message : String(e)); }
  };
  const swap = (k: number, j: number) => {
    if (!current || j < 0 || j >= current.order.length) return;
    const order = [...current.order];
    [order[k], order[j]] = [order[j], order[k]];
    setShow((s) => setFtl(s, onSet, order));
  };
  return (
    <>
      <strong style={{ fontSize: 13 }}>Move into set {show.sets[onSet].name}</strong>
      {/* The selection's path: Straight (the default), Follow the leader (2 or more), or Custom (one performer's own points). */}
      <div style={{ ...row, marginTop: 4 }} role="radiogroup" aria-label="Path">
        <button role="radio" aria-checked={kind === 'straight'} onClick={() => setShow((s) => clearFtl(s, onSet, ids))} title="Each goes straight to their spot">Straight</button>
        <button role="radio" aria-checked={kind === 'ftl'} disabled={ids.length < 2} onClick={() => { if (kind !== 'ftl') make(byLabel[0]); }}
          title={ids.length < 2 ? 'Follow the leader (select 2 or more performers)' : 'The others march the leader\'s path, in order'}>Follow the leader</button>
        <button role="radio" aria-checked={kind === 'custom'} disabled={ids.length !== 1} onClick={() => { if (kind !== 'custom') { make(ids[0]); setTool('turn'); close(); } }}
          title={ids.length !== 1 ? 'A custom path (select one performer)' : 'Click the points they march through'}>Custom</button>
      </div>
      {!current ? (
        <p style={help}>{kind === 'mixed' ? 'Some of these are on a follow-the-leader or custom path. Straight puts them all back on straight lines.' : 'Each goes straight to their spot. Follow the leader: the others march the leader\'s path. Custom: click the points one performer marches through.'}
          {inOther && kind === 'mixed' && ' Follow the leader moves them all into one new group.'}</p>
      ) : (
        <>
          {current.order.length > 1 && <div style={row}>
            <label>Leader{' '}
              <select aria-label="FTL leader" value={current.order[0]} onChange={(e) => make(e.target.value)}>
                {byLabel.map((id) => <option key={id} value={id}>{name(id)}</option>)}
              </select>
            </label>
          </div>}
          {current.order.length > 1 && <ol aria-label="FTL order" style={{ margin: '6px 0 0', paddingLeft: 22, maxHeight: 220, overflowY: 'auto' }}>
            {current.order.map((id, k) => (
              <li key={id} style={{ marginBottom: 2 }}>
                {name(id)}{k === 0 ? ' (leader)' : ''}
                {k > 0 && (
                  <span style={{ marginLeft: 6 }}>
                    <button aria-label={`Move ${name(id)} earlier`} disabled={k === 1} onClick={() => swap(k, k - 1)}>↑</button>
                    <button aria-label={`Move ${name(id)} later`} disabled={k === current.order.length - 1} onClick={() => swap(k, k + 1)}>↓</button>
                  </span>
                )}
              </li>
            ))}
          </ol>}
          <div style={row}>
            <span>{current.order.length > 1 ? "Leader's route" : 'Route'}: {current.turns?.length ? `${current.turns.length} ${current.order.length > 1 ? 'turn' : 'point'}${current.turns.length > 1 ? 's' : ''}` : 'straight'}</span>
            <button onClick={() => { setTool('turn'); close(); }} title="Click the field for each turn, in marching order; Esc when done">{current.order.length > 1 ? 'Add turns' : 'Add points'}</button>
            {!!current.turns?.length && <>
              <button onClick={() => setShow((s) => setFtlTurns(s, onSet, current.order[0], current.turns!.slice(0, -1)))}>Remove last {current.order.length > 1 ? 'turn' : 'point'}</button>
              <button onClick={() => setShow((s) => setFtlTurns(s, onSet, current.order[0], []))}>Straight route</button>
            </>}
          </div>
          {!!current.turns?.length && <div style={row}>
            <label title="Round the corners: a curve that passes through every turn"><input type="checkbox" checked={!!current.smooth}
              onChange={(e) => setShow((s) => setFtlSmooth(s, onSet, current.order[0], e.target.checked))} /> Smooth (a curve through the {current.order.length > 1 ? 'turns' : 'points'})</label>
          </div>}
          {current.order.length > 1 && <div style={row}>
            <span>Counter-march</span>
            <button onClick={() => cm(current.order, 'left')} title="The leader turns left into the next lane and marches back past the file">Turn left</button>
            <button onClick={() => cm(current.order, 'right')} title="The leader turns right into the next lane and marches back past the file">Turn right</button>
          </div>}
          {cmNote && <p role="alert" style={{ ...help, color: 'var(--danger)', opacity: 1 }}>{cmNote}</p>}
          <p style={help}>{current.order.length > 1
            ? 'Move the leader to its end spot; the others follow its trail. For a route with corners, Add turns and click each turn on the field. Picking a new leader re-chains the order from it and starts a straight route.'
            : 'Drag the performer to their end spot. Add points and click the field at each point they march through; drag a point to move it. Smooth makes a curve through them. Straight goes back to a straight line.'}</p>
        </>
      )}
    </>
  );
}

/** The move into the current set: delayed step-offs, turning moves, and performers who come too close. */
function MovePanel({ show, setShow, onSet, ids, setSelected }: ToolbarProps & { ids: string[] }) {
  const set = show.sets[onSet], n = set.counts;
  const name = (id: string) => label(show, show.performers.find((x) => x.id === id)!);
  const timings = ids.map((id) => timingOf(set, id));
  const same = timings.length > 0 && timings.every((x) => x.wait === timings[0].wait && x.move === timings[0].move);
  const [wait, setWait] = useState(same ? timings[0].wait : 0);
  const [move, setMove] = useState(same ? timings[0].move : n);
  const inFtl = ids.some((id) => set.ftl?.some((g) => g.order.includes(id)));
  const group = set.turning?.find((g) => g.length === ids.length && g.every((id) => ids.includes(id)));
  const fit = ids.length > 1 ? groupTurn(show, onSet, ids) : null;
  const [turnNote, setTurnNote] = useState('');
  const calls = closeCalls(show, onSet);
  const w = Math.min(Math.max(0, wait), n - 1), m = Math.min(Math.max(1, move), n - w);
  return (
    <>
      <strong style={{ fontSize: 13 }}>Move into set {set.name} · {n} counts</strong>
      {ids.length > 0 && <>
        <strong style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Step-off</strong>
        <div style={{ ...row, marginTop: 0 }}>
          Hold <NumberField aria-label="Counts to hold before stepping off" min={0} max={n - 1} integer value={wait} style={{ width: 48 }} onValue={setWait} />
          then move <NumberField aria-label="Counts to move" min={1} max={n} integer value={move} style={{ width: 48 }} onValue={setMove} />
          <button className="primary" onClick={() => setShow((s) => setTiming(s, onSet, ids, w, m))}>Apply</button>
        </div>
        <p style={help}>
          {same ? (timings[0].move === n ? 'Now: they move all the counts.' : `Now: hold ${timings[0].wait}, move ${timings[0].move}${n - timings[0].wait - timings[0].move ? `, hold ${n - timings[0].wait - timings[0].move}` : ''}.`) : 'Now: different step-offs.'}
          {' '}With these numbers: step off on count {w + 1}{n - w - m ? `, arrive on count ${w + m}, and hold ${n - w - m}` : ''}.
        </p>
        {!(same && timings[0].move === n) && <div style={{ ...row, marginTop: 0 }}>
          <button onClick={() => { setShow((s) => setTiming(s, onSet, ids, 0, n)); setWait(0); setMove(n); }}>Move all counts</button>
        </div>}
        {ids.length > 1 && <>
          <strong style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Route</strong>
          {inFtl ? <p style={{ ...help, marginTop: 0 }}>Some of these are on a follow-the-leader or custom path (see Path), which keeps its own route.</p>
            : group ? <div style={{ ...row, marginTop: 0 }}>
              <span>Turning {fit ? `${Math.round(Math.abs(fit.angle) * 180 / Math.PI)}° ${fit.angle > 0 ? 'counterclockwise' : 'clockwise'}` : '(they no longer turn)'}</span>
              <button onClick={() => setShow((s) => setTurning(s, onSet, ids, false))}>Straight instead</button>
            </div>
            : <div style={{ ...row, marginTop: 0 }}>
              <button onClick={() => { if (!fit) { setTurnNote(`They don't turn between set ${show.sets[onSet - 1].name} and set ${set.name}. Rotate them first (Transform, or the knob).`); return; } setTurnNote(''); setShow((s) => setTurning(s, onSet, ids, true)); }}
                title="March arcs around the turn that takes them from their old spots to their new ones, instead of straight lines">Turn as a group</button>
              {fit && <span style={{ fontSize: 12, opacity: 0.75 }}>{Math.round(Math.abs(fit.angle) * 180 / Math.PI)}° {fit.angle > 0 ? 'counterclockwise' : 'clockwise'}</span>}
            </div>}
          {turnNote && <p role="alert" style={{ ...help, color: 'var(--danger)', opacity: 1 }}>{turnNote}</p>}
        </>}
      </>}
      <strong style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Too close</strong>
      {!calls.length ? <p style={{ ...help, marginTop: 0 }}>No one comes within a step of anyone else in this move.</p> : <>
        <ul aria-label="Performers who come too close" style={{ margin: 0, paddingLeft: 18, maxHeight: 160, overflowY: 'auto' }}>
          {calls.slice(0, 20).map((c) => (
            <li key={`${c.a} ${c.b}`} style={{ marginBottom: 2 }}>
              {name(c.a)} and {name(c.b)}: {Math.round(c.d * 10) / 10} steps, count {c.count}{' '}
              <button onClick={() => setSelected(new Set([c.a, c.b]))}>Select</button>
            </li>
          ))}
        </ul>
        {calls.length > 20 && <p style={help}>And {calls.length - 20} more pairs.</p>}
      </>}
    </>
  );
}

/** A new section, made in the Add Performer(s) menu: name and letter, then it's the section being placed. */
function NewSection({ show, setShow, setSection, setTool, close }: ToolbarProps & { close: () => void }) {
  const [open, setOpen] = useState(false); // the name and letter boxes only after Create New Section (Jason)
  const [name, setName] = useState(''), [letter, setLetter] = useState('');
  const taken = show.sections.some((s) => s.letter.trim().toUpperCase() === letter.trim().toUpperCase());
  const add = () => {
    if (!name.trim() || !letter.trim()) return;
    const id = newId('s');
    setShow((sh) => ({ ...sh, sections: [...sh.sections, { id, name: name.trim(), letter: letter.trim() }] }));
    setSection(id); setTool('add'); close();
  };
  if (!open) return <button onClick={() => setOpen(true)} style={{ marginTop: 6 }}>Create New Section</button>;
  return (
    <>
      <strong style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>New section</strong>
      <div style={{ ...row, marginTop: 0 }}>
        <input aria-label="New section's name" placeholder="Name (Drum Major)" value={name} autoFocus maxLength={60} style={{ flex: 1, minWidth: 110 }}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <input aria-label="New section's letter" placeholder="Letter" value={letter} maxLength={3} style={{ width: 56, textAlign: 'center' }}
          onChange={(e) => setLetter(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button onClick={add} disabled={!name.trim() || !letter.trim()}>Add</button>
      </div>
      {taken && <p role="alert" style={{ ...help, color: 'var(--warn)', opacity: 1 }}>Another section already uses "{letter.trim()}": their labels would clash.</p>}
    </>
  );
}

/** Add ▾: performers (pick a section, or make one), a prop in the middle of the field, or a set. */
function AddPanel(p: ToolbarProps & { close: () => void }) {
  const { show, setShow, close } = p;
  const [at, setCount] = useState<number | null>(null);
  const props = show.props ?? [];
  const addSet = () => { const r = addSetHere(show, p.t, at); setShow(() => r.show); p.setT(r.t); p.setTool('select'); setCount(null); close(); }; // a set is one click, not a mode: back to Select (Jason)
  const prop = () => {
    const r = addProp(show, `Prop ${props.length + 1}`, 8, 8, false, { x: 0, y: fieldDepth(fieldOf(show)) / 2 }); // an 8 by 8 square in the middle (Jason)
    setShow(() => r.show); p.setSelected(new Set()); p.setSelectedMark(null); p.setSelectedProp(r.id); p.setTool('select'); p.showSidebar(); close();
  };
  return <>
    <div style={row}>
      <button onClick={addSet} title="A new set after this one, or at the count you type">Set</button>
      <label>at count <NumberField min={1} integer aria-label="At count" value={at ?? ''} placeholder="next" style={{ width: 56 }}
        onValue={(n) => setCount(n)} /></label>
    </div>
    <p style={help}>With no count, the new set goes right after this one (or where you clicked on the timeline).</p>
    <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--line)', margin: '8px 0 2px' }} />
    <strong style={{ fontSize: 12, opacity: 0.8 }}>Performers: which section?</strong>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>{/* two columns, so Prop stays in reach under a long list (Jason) */}
      {show.sections.map((s) => (
        <button key={s.id} role="menuitemradio" aria-checked={p.section === s.id} title={`${s.letter} · ${s.name}`}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}
          onClick={() => { p.setSection(s.id); p.setTool('add'); close(); }}>{s.letter} · {s.name}</button>
      ))}
    </div>
    <NewSection {...p} close={close} />
    <p style={help}>Then click the field to place each one. Sections are renamed, recolored, and deleted in the sidebar.</p>
    <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--line)', margin: '8px 0 2px' }} />
    <button onClick={prop} disabled={props.length >= MAX_PROPS} title="An 8 by 8 step square in the middle of the field: drag it into place, and size it in the sidebar">Prop</button>
  </>;
}

/** One Delete for whatever is selected: performers, a prop, or markup; with nothing selected, the set you're on. */
function DeleteButton(p: ToolbarProps) {
  const { show, setShow, selected, onSet } = p;
  const ids = [...selected];
  let what: string, run: (() => void) | null;
  if (ids.length) {
    what = `the ${ids.length === 1 ? 'selected performer' : `${ids.length} selected performers`} from the whole show`;
    run = () => { if (!confirmDelete(show, ids)) return; setShow((s) => removePerformers(s, selected)); p.setSelected(new Set()); };
  } else if (p.selectedProp) {
    const name = show.props?.find((x) => x.id === p.selectedProp)?.name ?? 'prop';
    what = `the prop "${name}"`;
    run = () => { setShow((s) => removeProp(s, p.selectedProp!)); p.setSelectedProp(null); };
  } else if (p.selectedMark && onSet >= 0) {
    what = 'the selected markup';
    run = () => { setShow((s) => setMarks(s, onSet, (ms) => ms.filter((m) => m.id !== p.selectedMark))); p.setSelectedMark(null); };
  } else if (onSet >= 0 && show.sets.length > 1) {
    const name = show.sets[onSet].name;
    what = `set ${name} (nothing is selected)`;
    run = () => {
      if (!window.confirm(`Delete set ${name}? Performers will move straight from the set before it to the set after it.`)) return;
      const starts = setStarts(show);
      setShow((s) => removeSet(s, onSet)); p.setT(starts[Math.max(0, onSet - 1)]);
    };
  } else {
    what = onSet >= 0 ? 'nothing: a show needs at least one set' : 'nothing (scrub to a set, or select something)';
    run = null;
  }
  return <button disabled={!run} className="danger" onClick={() => run?.()} title={`Delete ${what}`} aria-label="Delete">Delete</button>;
}
