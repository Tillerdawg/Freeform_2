import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { addBezierSegment, addCurvePoint, type Shape, type ShapeKind } from '../engine/shapes';
import {
  chainOrder, clearFtl, flip, label, mirrorSides, removePerformers, rotateScale, setFtl, setLabelSide, snapSelection,
  type LabelSide, type Show,
} from '../engine/show';
import { curveSides } from '../field/labels';
import { LabelCompass } from './LabelCompass';
import type { Snap, Tool } from './Sidebar';

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
  shape: Shape | null;
  startShape: (k: ShapeKind) => void;
  updateShape: (patch: Partial<Shape>) => void;
  endShape: () => void;
}

const SHAPES: [ShapeKind, string][] = [['line', 'Line'], ['arc', 'Arc'], ['curve', 'Curve'], ['bezier', 'Bézier'], ['circle', 'Circle'], ['block', 'Block']];
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
  const turn = (d: number, k: number) => setShow((s) => rotateScale(s, onSet, ids, d, k));
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

  return (
    <div className="toolbar" role="toolbar" aria-label="Drill tools">
      <div className="seg" role="radiogroup" aria-label="Tool">
        <button role="radio" aria-checked={p.tool === 'select'} onClick={() => p.setTool('select')} title="Select and move (V)">Select</button>
        <button role="radio" aria-checked={p.tool === 'add'} onClick={() => p.setTool('add')} title="Click the field to add a performer (A)">Add</button>
        <Menu label={markup ? markup[1].replace(' (T)', '') : 'Markup'} pressed={!!markup} title="Notes, arrows and drawing on this set's page">
          {(close) => MARKUP.map(([t, l]) => (
            <button key={t} role="menuitemradio" aria-checked={p.tool === t} onClick={() => { p.setTool(t); close(); }}>{l}</button>
          ))}
        </Menu>
      </div>
      <label className="tb-field" title="Section for new performers">Section
        <select value={p.section} onChange={(e) => p.setSection(e.target.value)}>
          {show.sections.map((s) => <option key={s.id} value={s.id}>{s.letter} · {s.name}</option>)}
        </select>
      </label>
      <label className="tb-field" title="Grid that dragged and added performers snap to">Snap
        <select value={p.snap} onChange={(e) => p.setSnap(Number(e.target.value) as Snap)}>
          <option value={1}>Whole</option>
          <option value={0.5}>Half</option>
          <option value={0}>Free</option>
        </select>
      </label>
      <span className="tb-sep" />

      <Menu label="Shape" disabled={needs(many, ids.length === 1 ? 'Select 2 or more performers' : pick)} keepOpen={!!p.shape} pressed={!!p.shape}
        title="Shape the selection into a line, arc, curve, Bézier, circle or block">
        {() => <ShapePanel {...p} />}
      </Menu>
      <Menu label="Transform" disabled={needs(any, pick)} title="Flip, mirror, rotate, scale or snap the selection">
        {() => <>
          <strong style={{ fontSize: 12, opacity: 0.8 }}>Mirror</strong>
          <button onClick={() => { setShow((s) => flip(s, onSet, ids, 'x')); setNote(''); }} title="Swap sides: Side 1 ↔ Side 2">Flip across the 50</button>
          <button onClick={() => { setShow((s) => flip(s, onSet, ids, 'y')); setNote(''); }} title="Swap front and back">Flip front ↔ back</button>
          {ids.length > 1 && <>
            <button onClick={() => mirror(1)} title="Side 2 performers take the mirror image of Side 1">Copy Side 1 → 2</button>
            <button onClick={() => mirror(2)} title="Side 1 performers take the mirror image of Side 2">Copy Side 2 → 1</button>
          </>}
          {ids.length > 1 && <>
            <strong style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Rotate &amp; scale (around the center)</strong>
            <div style={{ ...row, marginTop: 0 }}>
              <input aria-label="Rotation in degrees" type="number" min={1} max={180} value={deg} style={{ width: 52 }}
                onChange={(e) => setDeg(Math.min(180, Math.max(1, Number(e.target.value) || 15)))} />°
              <button onClick={() => turn(deg, 1)} title="Rotate counterclockwise">↺</button>
              <button onClick={() => turn(-deg, 1)} title="Rotate clockwise">↻</button>
            </div>
            <div style={{ ...row, marginTop: 0 }}>
              <input aria-label="Scale percent" type="number" min={101} max={400} value={pct} style={{ width: 52 }}
                onChange={(e) => setPct(Math.min(400, Math.max(101, Number(e.target.value) || 110)))} />%
              <button onClick={() => turn(0, pct / 100)}>Expand</button>
              <button onClick={() => turn(0, 100 / pct)}>Contract</button>
            </div>
          </>}
          <strong style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Grid</strong>
          <button onClick={snapSel} title={`Round the selected performers to ${snapUnit === 1 ? 'whole' : 'half'} steps (the Snap setting)`}>Snap to grid ({snapUnit === 1 ? 'whole' : 'half'} steps)</button>
          {(note || snapNote) && <p role="alert" style={{ ...help, color: note ? '#ff8080' : '#f5c518', opacity: 1 }}>{note || snapNote}</p>}
        </>}
      </Menu>
      <Menu label="FTL" disabled={needs(ids.length > 1 && onSet > 0, onSet === 0 ? 'Set 1 has no move into it' : ids.length === 1 ? 'Select 2 or more performers' : pick)}
        title="Follow the leader: followers trace the leader's path in the move into this set">
        {() => <FtlPanel {...p} ids={ids} />}
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
      <button disabled={!ids.length} className="danger" onClick={() => { setShow((s) => removePerformers(s, selected)); p.setSelected(new Set()); }}
        title="Delete the selected performers from the whole show">Delete</button>

      <span style={{ marginLeft: 'auto' }} />
      <button onClick={p.onUndo} disabled={!p.canUndo} title="Undo (⌘Z / Ctrl+Z)">Undo</button>
      <button onClick={p.onRedo} disabled={!p.canRedo} title="Redo (⇧⌘Z / Ctrl+Y)">Redo</button>
      <button onClick={p.onFit} title="Zoom out to the whole field">Fit</button>
    </div>
  );
}

/** A toolbar button that opens a small panel below it. Closes on a click elsewhere or Esc (unless `keepOpen`). */
function Menu({ label, title, disabled, keepOpen, pressed, children }: {
  label: string; title: string; disabled?: string; keepOpen?: boolean; pressed?: boolean; children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shown = !disabled && (open || !!keepOpen);
  // Placed against the window, so the toolbar's sideways scrolling (narrow windows) can't clip the panel.
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!shown) return;
    const r = ref.current!.getBoundingClientRect();
    setAt({ left: Math.max(8, Math.min(r.left, innerWidth - 352)), top: r.bottom + 6 });
  }, [shown]);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }; // Esc closes the panel only, not the selection
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} className="tb-menu">
      <button aria-haspopup="true" aria-expanded={shown} aria-pressed={pressed || undefined} disabled={!!disabled}
        title={disabled ? `${title} (${disabled})` : title} onClick={() => setOpen(!open)}>
        {label} <span aria-hidden className="caret">▾</span>
      </button>
      {shown && <div className="tb-menu-panel" role="menu" aria-label={label} style={at ?? { visibility: 'hidden' }}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

function ShapePanel({ shape, startShape, updateShape, endShape }: ToolbarProps) {
  return (
    <>
      <div style={{ ...row, marginTop: 0 }} role="radiogroup" aria-label="Shape">
        {SHAPES.map(([k, l]) => (
          <button key={k} role="radio" aria-checked={shape?.kind === k} onClick={() => startShape(k)}>{l}</button>
        ))}
      </div>
      {shape && (
        <>
          <div style={row}>
            <label><input type="radio" name="spacing" checked={shape.interval == null} onChange={() => updateShape({ interval: null })} /> Even</label>
            <label>
              <input type="radio" name="spacing" checked={shape.interval != null} onChange={() => updateShape({ interval: 2 })} /> Every{' '}
              <input aria-label="Interval in steps" type="number" min={0.5} step={0.5} value={shape.interval ?? 2} style={{ width: 48 }}
                onChange={(e) => updateShape({ interval: Math.max(0.5, Number(e.target.value) || 2) })} /> steps
            </label>
          </div>
          {shape.kind === 'block' && (
            <div style={row}>
              <label>Columns <input aria-label="Columns" type="number" min={1} value={shape.cols} style={{ width: 48 }}
                onChange={(e) => updateShape({ cols: Math.max(1, Math.round(Number(e.target.value) || 1)) })} /></label>
            </div>
          )}
          <div style={row}>
            {shape.kind === 'curve' && <button onClick={() => updateShape(addCurvePoint(shape))}>+ Curve point</button>}
            {shape.kind === 'bezier' && <button onClick={() => updateShape(addBezierSegment(shape))}>+ Segment</button>}
            <button className="primary" onClick={endShape}>Done (Esc)</button>
          </div>
          <p style={help}>
            Drag the blue handles on the field. Performers keep their order along the shape.
            {shape.kind === 'bezier' && ' Squares are points the curve passes through; circles pull the curve toward them. Hold Option (Alt) while dragging to move one handle by itself, e.g. to make a corner.'}
          </p>
        </>
      )}
    </>
  );
}

/** Follow-the-leader for the move into the current set. */
function FtlPanel({ show, setShow, onSet, ids }: ToolbarProps & { ids: string[] }) {
  const groups = show.sets[onSet].ftl ?? [];
  // The group this selection is exactly, if any; otherwise offer to make one.
  const current = groups.find((g) => g.order.length === ids.length && g.order.every((id) => ids.includes(id)));
  const name = (id: string) => label(show, show.performers.find((x) => x.id === id)!);
  const byLabel = [...ids].sort((a, b) => name(a).localeCompare(name(b), undefined, { numeric: true }));
  const inOther = ids.some((id) => groups.some((g) => g !== current && g.order.includes(id)));
  const make = (leader: string) => setShow((s) => setFtl(s, onSet, chainOrder(s, onSet, leader, ids)));
  const swap = (k: number, j: number) => {
    if (!current || j < 0 || j >= current.order.length) return;
    const order = [...current.order];
    [order[k], order[j]] = [order[j], order[k]];
    setShow((s) => setFtl(s, onSet, order));
  };
  return (
    <>
      <strong style={{ fontSize: 13 }}>Move into set {show.sets[onSet].name}</strong>
      {!current ? (
        <>
          <div style={row}>
            <button className="primary" onClick={() => make(byLabel[0])}>Make FTL</button>
            <span style={{ opacity: 0.75, fontSize: 12 }}>Leader: {name(byLabel[0])}; you can change it after.</span>
          </div>
          {inOther && <p style={{ ...help, color: '#f5c518', opacity: 1 }}>Some of these are in another FTL group; they'll move to this one.</p>}
        </>
      ) : (
        <>
          <div style={row}>
            <label>Leader{' '}
              <select aria-label="FTL leader" value={current.order[0]} onChange={(e) => make(e.target.value)}>
                {byLabel.map((id) => <option key={id} value={id}>{name(id)}</option>)}
              </select>
            </label>
            <button onClick={() => setShow((s) => clearFtl(s, onSet, ids))} title="Back to a normal straight-line move">Float instead</button>
          </div>
          <ol aria-label="FTL order" style={{ margin: '6px 0 0', paddingLeft: 22, maxHeight: 220, overflowY: 'auto' }}>
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
          </ol>
          <p style={help}>Move the leader to its end spot; the others follow its trail. Picking a new leader re-chains the order from it.</p>
        </>
      )}
    </>
  );
}
