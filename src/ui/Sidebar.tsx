import { useEffect, useState } from 'react';
import { readout, type HashPreset } from '../engine/coords';
import { addCurvePoint, type Shape, type ShapeKind } from '../engine/shapes';
import {
  addSetAfter, flip, label, locate, mirrorSides, newId, placeInSet, rotateScale, positionsAt, removePerformers, removeSet, setCounts, xFrom, yFrom,
  type FrontDir, type FrontRef, type Show, type SideDir,
} from '../engine/show';

export type Tool = 'select' | 'add';
export type Snap = 1 | 0.5 | 0;

interface Props {
  show: Show;
  setShow: (f: (s: Show) => Show) => void;
  t: number;
  setT: (t: number) => void;
  onSet: number;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  section: string;
  setSection: (id: string) => void;
  snap: Snap;
  setSnap: (s: Snap) => void;
  starts: number[];
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  fileError: string;
  shape: Shape | null;
  startShape: (k: ShapeKind) => void;
  updateShape: (patch: Partial<Shape>) => void;
  endShape: () => void;
}

const SHAPES: [ShapeKind, string][] = [['line', 'Line'], ['arc', 'Arc'], ['curve', 'Curve'], ['circle', 'Circle'], ['block', 'Block']];

const PRESETS: [HashPreset, string][] = [['highSchool', 'High school'], ['college', 'College / DCI'], ['nfl', 'NFL']];
const LINES = [50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0];
const box: React.CSSProperties = { borderTop: '1px solid #33443a', padding: '10px 0' };
const row: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 };

export function Sidebar(p: Props) {
  const { show, setShow, onSet, selected } = p;
  const cur = onSet >= 0 ? onSet : locate(show, p.t).to;
  const one = selected.size === 1 ? show.performers.find((x) => selected.has(x.id)) : undefined;
  const [mirrorError, setMirrorError] = useState('');
  useEffect(() => setMirrorError(''), [selected]);
  const [deg, setDeg] = useState(15);
  const [pct, setPct] = useState(110);
  const turn = (d: number, k: number) => setShow((s) => rotateScale(s, onSet, ids, d, k));
  const ids = [...selected];
  const mirror = (from: 1 | 2) => {
    try {
      const next = mirrorSides(show, onSet, ids, from); // run here, not in the updater, so a refusal is caught
      setShow(() => next);
      setMirrorError('');
    }
    catch (e) { setMirrorError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <aside style={{ width: 300, padding: '8px 14px', overflowY: 'auto', borderLeft: '1px solid #33443a', fontSize: 14 }}>
      <div style={row}>
        <button onClick={p.onNew}>New</button>
        <button onClick={p.onOpen}>Open…</button>
        <button onClick={p.onSave}>Save</button>
      </div>
      {p.fileError && <div role="alert" style={{ color: '#ff8080', marginTop: 6 }}>{p.fileError}</div>}
      <div style={{ ...row, marginBottom: 10 }}>
        <input aria-label="Show title" value={show.title} onChange={(e) => setShow((s) => ({ ...s, title: e.target.value }))} style={{ flex: 1 }} />
        <select aria-label="Hashes" value={show.hash} onChange={(e) => setShow((s) => ({ ...s, hash: e.target.value as HashPreset }))}>
          {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      <section style={box}>
        <strong>Tools</strong>
        <div style={row} role="radiogroup" aria-label="Tool">
          {(['select', 'add'] as Tool[]).map((t) => (
            <button key={t} role="radio" aria-checked={p.tool === t} onClick={() => p.setTool(t)}
              style={{ fontWeight: p.tool === t ? 700 : 400, outline: p.tool === t ? '2px solid #ffd166' : undefined }}>
              {t === 'select' ? 'Select / move (V)' : 'Add performer (A)'}
            </button>
          ))}
        </div>
        <div style={row}>
          <label>Section{' '}
            <select value={p.section} onChange={(e) => p.setSection(e.target.value)}>
              {show.sections.map((s) => <option key={s.id} value={s.id}>{s.letter} · {s.name}</option>)}
            </select>
          </label>
        </div>
        <div style={row}>
          <label>Snap{' '}
            <select value={p.snap} onChange={(e) => p.setSnap(Number(e.target.value) as Snap)}>
              <option value={1}>Whole steps</option>
              <option value={0.5}>Half steps</option>
              <option value={0}>Free</option>
            </select>
          </label>
        </div>
        {onSet < 0 && <p style={{ color: '#f5c518', margin: '6px 0 0' }}>Mid-move: you can select, but scrub to a set to move or add.</p>}
      </section>

      <section style={box}>
        <strong>Set {show.sets[cur].name}</strong>
        <div style={row}>
          {cur > 0 && (
            <label>Counts in{' '}
              <input type="number" min={1} value={show.sets[cur].counts} style={{ width: 56 }}
                onChange={(e) => setShow((s) => setCounts(s, cur, Number(e.target.value)))} />
            </label>
          )}
          <button onClick={() => { setShow((s) => addSetAfter(s, cur)); p.setT(p.starts[cur] + 16); }}>+ Set after</button>
          <button disabled={show.sets.length < 2} onClick={() => { setShow((s) => removeSet(s, cur)); p.setT(p.starts[Math.max(0, cur - 1)]); }}>Delete set</button>
        </div>
        <div style={row}>
          {show.sets.map((s, i) => (
            <button key={s.id} onClick={() => p.setT(p.starts[i])} style={{ fontWeight: i === onSet ? 700 : 400 }}>{s.name}</button>
          ))}
        </div>
      </section>

      <section style={box}>
        <strong>Selection</strong>
        {selected.size === 0 && <p style={{ opacity: 0.7, margin: '6px 0 0' }}>Click a performer, shift-click to add, or drag a box.</p>}
        {selected.size > 1 && <p style={{ margin: '6px 0 0' }}>{selected.size} performers selected</p>}
        {selected.size > 0 && onSet >= 0 && (
          <fieldset style={{ marginTop: 10, border: '1px solid #33443a' }}>
            <legend>Mirror</legend>
            <div style={row}>
              <button onClick={() => { setShow((s) => flip(s, onSet, ids, 'x')); setMirrorError(''); }} title="Swap sides: Side 1 ↔ Side 2">Flip across the 50</button>
              <button onClick={() => { setShow((s) => flip(s, onSet, ids, 'y')); setMirrorError(''); }} title="Swap front and back">Flip front ↔ back</button>
            </div>
            {selected.size > 1 && (
              <div style={row}>
                <button onClick={() => mirror(1)} title="Side 2 performers take the mirror image of Side 1">Copy Side 1 → 2</button>
                <button onClick={() => mirror(2)} title="Side 1 performers take the mirror image of Side 2">Copy Side 2 → 1</button>
              </div>
            )}
            {mirrorError && <div role="alert" style={{ color: '#ff8080', marginTop: 6 }}>{mirrorError}</div>}
          </fieldset>
        )}
        {selected.size > 1 && onSet >= 0 && (
          <fieldset style={{ marginTop: 10, border: '1px solid #33443a' }}>
            <legend>Rotate &amp; scale</legend>
            <div style={row}>
              <input aria-label="Rotation in degrees" type="number" min={1} max={180} value={deg} style={{ width: 52 }}
                onChange={(e) => setDeg(Math.min(180, Math.max(1, Number(e.target.value) || 15)))} />°
              <button onClick={() => turn(deg, 1)} title="Rotate counterclockwise">↺</button>
              <button onClick={() => turn(-deg, 1)} title="Rotate clockwise">↻</button>
            </div>
            <div style={row}>
              <input aria-label="Scale percent" type="number" min={101} max={400} value={pct} style={{ width: 52 }}
                onChange={(e) => setPct(Math.min(400, Math.max(101, Number(e.target.value) || 110)))} />%
              <button onClick={() => turn(0, pct / 100)}>Expand</button>
              <button onClick={() => turn(0, 100 / pct)}>Contract</button>
            </div>
          </fieldset>
        )}
        {selected.size > 1 && onSet >= 0 && <ShapePanel {...p} />}
        {selected.size > 0 && (
          <div style={row}>
            <button onClick={() => { setShow((s) => removePerformers(s, selected)); p.setSelected(new Set()); }}>Delete performer{selected.size > 1 ? 's' : ''}</button>
          </div>
        )}
        {one && (
          <>
            {onSet < 0 && (
              <p style={{ margin: '8px 0 4px' }}>
                <strong>{label(show, one)}</strong> at count {Math.round(locate(show, p.t).count * 100) / 100} of move into set {show.sets[cur].name}:<br />
                {readout(positionsAt(show, p.t)[one.id], show.hash)}
              </p>
            )}
            <p style={{ margin: '8px 0 4px' }}><strong>{label(show, one)}</strong> — coordinates by set</p>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {show.sets.map((s, i) => (
                <li key={s.id} value={Number(s.name) || undefined} style={{ fontWeight: i === onSet ? 700 : 400, marginBottom: 2 }}>
                  {readout(s.pos[one.id], show.hash)}
                </li>
              ))}
            </ol>
            {onSet >= 0 && <CoordEntry onPlace={(x, y) => setShow((s) => placeInSet(s, onSet, { [one.id]: { x, y: y(s.hash) } }))} />}
          </>
        )}
      </section>

      <details style={box}>
        <summary><strong>Sections</strong></summary>
        {show.sections.map((s, i) => (
          <div key={s.id} style={row}>
            <input aria-label="Section letter" value={s.letter} style={{ width: 36 }}
              onChange={(e) => setShow((sh) => ({ ...sh, sections: sh.sections.map((x, j) => (j === i ? { ...x, letter: e.target.value } : x)) }))} />
            <input aria-label="Section name" value={s.name} style={{ flex: 1 }}
              onChange={(e) => setShow((sh) => ({ ...sh, sections: sh.sections.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))} />
          </div>
        ))}
        <div style={row}>
          <button onClick={() => setShow((sh) => ({ ...sh, sections: [...sh.sections, { id: newId('s'), name: 'New section', letter: '?' }] }))}>+ Section</button>
        </div>
      </details>
    </aside>
  );
}

/** Type an exact coordinate, e.g. 2 steps outside the Side 2 45, 4 steps behind Front Hash. */
function CoordEntry({ onPlace }: { onPlace: (x: number, y: (h: HashPreset) => number) => void }) {
  const [side, setSide] = useState<1 | 2>(1);
  const [line, setLine] = useState(50);
  const [xs, setXs] = useState(0);
  const [xd, setXd] = useState<SideDir>('on');
  const [ref, setRef] = useState<FrontRef>('Front Hash');
  const [ys, setYs] = useState(0);
  const [yd, setYd] = useState<FrontDir>('on');
  const num = (v: string) => Math.max(0, Number(v) || 0);
  return (
    <fieldset style={{ marginTop: 10, border: '1px solid #33443a' }}>
      <legend>Place exactly (this set)</legend>
      <div style={row}>
        <input aria-label="Side-to-side steps" type="number" min={0} step={0.25} value={xs} onChange={(e) => setXs(num(e.target.value))} style={{ width: 52 }} />
        <select aria-label="Inside or outside" value={xd} onChange={(e) => setXd(e.target.value as SideDir)}>
          <option value="on">on</option><option value="inside">inside</option><option value="outside">outside</option>
        </select>
        <select aria-label="Side" value={side} onChange={(e) => setSide(Number(e.target.value) as 1 | 2)} disabled={line === 50 && xd === 'on'}>
          <option value={1}>Side 1</option><option value={2}>Side 2</option>
        </select>
        <select aria-label="Yard line" value={line} onChange={(e) => setLine(Number(e.target.value))}>
          {LINES.map((l) => <option key={l} value={l}>{l === 0 ? 'Goal' : l}</option>)}
        </select>
      </div>
      <div style={row}>
        <input aria-label="Front-to-back steps" type="number" min={0} step={0.25} value={ys} onChange={(e) => setYs(num(e.target.value))} style={{ width: 52 }} />
        <select aria-label="In front or behind" value={yd} onChange={(e) => setYd(e.target.value as FrontDir)}>
          <option value="on">on</option><option value="in front of">in front of</option><option value="behind">behind</option>
        </select>
        <select aria-label="Reference" value={ref} onChange={(e) => setRef(e.target.value as FrontRef)}>
          {(['Front Sideline', 'Front Hash', 'Back Hash', 'Back Sideline'] as FrontRef[]).map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div style={row}>
        <button onClick={() => onPlace(xFrom(side, line, xs, xd), (h) => yFrom(ref, ys, yd, h))}>Place</button>
      </div>
    </fieldset>
  );
}

function ShapePanel({ shape, startShape, updateShape, endShape }: Props) {
  return (
    <fieldset style={{ marginTop: 10, border: '1px solid #33443a' }}>
      <legend>Shape</legend>
      <div style={row} role="radiogroup" aria-label="Shape">
        {SHAPES.map(([k, l]) => (
          <button key={k} role="radio" aria-checked={shape?.kind === k} onClick={() => startShape(k)}
            style={{ fontWeight: shape?.kind === k ? 700 : 400, outline: shape?.kind === k ? '2px solid #5ad1ff' : undefined }}>{l}</button>
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
            <button onClick={endShape}>Done (Esc)</button>
          </div>
          <p style={{ margin: '6px 0 0', opacity: 0.75, fontSize: 12 }}>Drag the blue handles on the field. Performers keep their order along the shape.</p>
        </>
      )}
    </fieldset>
  );
}
