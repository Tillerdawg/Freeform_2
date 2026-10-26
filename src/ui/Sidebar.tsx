import { useState } from 'react';
import { readout, type HashPreset } from '../engine/coords';
import type { Shape, ShapeKind } from '../engine/shapes';
import {
  setCue, setMarks, setNote, label, locate, newId, placeInSet, remapHash, positionsAt, xFrom, yFrom,
  type FrontDir, type FrontRef, type Show, type SideDir,
} from '../engine/show';

export type Tool = 'select' | 'add' | 'text' | 'arrow' | 'draw';
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
  onPrint: () => void;
  onShare: () => void;
  fileError: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFit: () => void;
  selectedMark: string | null;
  setSelectedMark: (id: string | null) => void;
  shape: Shape | null;
  startShape: (k: ShapeKind) => void;
  updateShape: (patch: Partial<Shape>) => void;
  endShape: () => void;
}

const PRESETS: [HashPreset, string][] = [['highSchool', 'High school'], ['college', 'College / DCI'], ['nfl', 'NFL']];
const LINES = [50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0];
const box: React.CSSProperties = { borderTop: '1px solid #33443a', padding: '10px 0' };
const row: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 };

export function Sidebar(p: Props) {
  const { show, setShow, onSet, selected } = p;
  const cur = onSet >= 0 ? onSet : locate(show, p.t).to;
  const one = selected.size === 1 ? show.performers.find((x) => selected.has(x.id)) : undefined;
  const [pendingHash, setPendingHash] = useState<HashPreset | null>(null);
  const ids = [...selected];

  return (
    <aside style={{ width: 300, padding: '8px 14px 0', overflowY: 'auto', borderLeft: '1px solid #33443a', fontSize: 14, display: 'flex', flexDirection: 'column' }}>
      <div style={row}>
        <button onClick={p.onNew}>New</button>
        <button onClick={p.onOpen} title="Load a .freeform.json show file or a Pyware 3D .3dj drill (replaces the current show; Undo brings it back)">Import…</button>
        <button onClick={p.onSave} title="Download this show as a .freeform.json file: a backup, or a copy to share or open in another browser">Export</button>
        <button onClick={p.onPrint} disabled={!show.performers.length} title="Dot sheets and drill charts (print or save as PDF)">Print…</button>
        <button onClick={p.onShare} disabled={!show.performers.length} title="A link that opens this show on performers' and staff phones">Share…</button>
        <button onClick={() => { location.hash = '#perform'; }} title="Open the performer view: your saved show, or scan / paste a show link">Performer view</button>
      </div>
      {p.fileError && <div role="alert" style={{ color: '#ff8080', marginTop: 6 }}>{p.fileError}</div>}
      <div style={{ ...row, marginBottom: 10 }}>
        <input aria-label="Show title" value={show.title} onChange={(e) => setShow((s) => ({ ...s, title: e.target.value }))} style={{ flex: 1 }} />
        <select aria-label="Hashes" value={show.hash} onChange={(e) => {
          const to = e.target.value as HashPreset;
          if (show.performers.length) setPendingHash(to); // ask what should happen to the drill
          else setShow((s) => ({ ...s, hash: to }));
        }}>
          {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      {pendingHash && (
        <div role="dialog" aria-modal="true" aria-label="Change hash marks" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
          <div style={{ background: '#1d2a1f', border: '1px solid #33443a', padding: 20, width: 420, maxWidth: 'calc(100vw - 32px)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Change to {PRESETS.find(([k]) => k === pendingHash)![1]} hashes</h2>
            <p style={{ margin: '0 0 12px' }}>What should happen to the drill?</p>
            <div style={{ display: 'grid', gap: 8 }}>
              <button onClick={() => { setShow((s) => remapHash(s, pendingHash)); setPendingHash(null); }} style={{ textAlign: 'left', padding: 8 }}>
                <strong>Keep positions relative to the hashes</strong><br />
                <span style={{ fontSize: 12 }}>On the hash stays on the hash; the field stretches to fit. Use this if the show was started with the wrong hashes.</span>
              </button>
              <button onClick={() => { setShow((s) => ({ ...s, hash: pendingHash })); setPendingHash(null); }} style={{ textAlign: 'left', padding: 8 }}>
                <strong>Keep spots on the field</strong><br />
                <span style={{ fontSize: 12 }}>Dots stay where they are; only the hashes move, so coordinates change.</span>
              </button>
              <button onClick={() => setPendingHash(null)}>Cancel</button>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, opacity: 0.75 }}>Changes every set. Undo reverses it.</p>
          </div>
        </div>
      )}

      <section style={box}>
        <strong>Set {show.sets[cur].name}</strong>
        <label style={{ display: 'block', marginTop: 6 }}>Ensemble notes
          <textarea aria-label="Ensemble notes" aria-describedby="ensemble-help" value={show.sets[cur].note ?? ''} rows={2} placeholder="e.g. Guard: flag toss on 9"
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 2, font: 'inherit' }}
            onChange={(e) => setShow((s) => setNote(s, cur, e.target.value))} />
        </label>
        <span id="ensemble-help" style={{ display: 'block', fontSize: 12, opacity: 0.75, marginTop: 2 }}>For everyone: printed under set {show.sets[cur].name}'s drill chart.</span>
      </section>

      <section style={box}>
        <strong>Selection</strong>
        {selected.size === 0 && <p style={{ opacity: 0.7, margin: '6px 0 0' }}>Click a performer, shift-click to add, or drag a box.</p>}
        {selected.size > 1 && <p style={{ margin: '6px 0 0' }}>{selected.size} performers selected</p>}
        {onSet < 0 && <p style={{ color: '#f5c518', margin: '6px 0 0' }}>Mid-move: you can select, but scrub to a set to move or add.</p>}
        {selected.size > 0 && onSet >= 0 && (() => {
          const cues = ids.map((id) => show.sets[onSet].cues?.[id] ?? '');
          const same = cues.every((c) => c === cues[0]);
          return (
            <>
              <label style={{ display: 'block', marginTop: 8 }}>Performer notes
                <input aria-label="Performer notes" aria-describedby="performer-help" value={same ? cues[0] : ''} placeholder={same ? 'e.g. Slide L, horns 45' : '(different notes)'}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 2 }}
                  onChange={(e) => setShow((s) => setCue(s, onSet, ids, e.target.value))} />
              </label>
              <span id="performer-help" style={{ display: 'block', fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                Only for the {ids.length === 1 ? 'selected performer' : `${ids.length} selected performers`}: printed on their dot sheets under set {show.sets[onSet].name}.
              </span>
            </>
          );
        })()}
        {p.selectedMark && onSet >= 0 && (() => {
          const m = show.sets[onSet].marks?.find((x) => x.id === p.selectedMark);
          if (!m) return null;
          return (
            <fieldset style={{ marginTop: 10, border: '1px solid #33443a' }}>
              <legend>{m.kind === 'text' ? 'Note' : m.kind === 'arrow' ? 'Arrow' : 'Drawing'}</legend>
              {m.kind === 'text' && (
                <input key={m.id} aria-label="Note text" value={m.text} placeholder="Type the note"
                  ref={(el) => { if (el && !m.text && document.activeElement !== el) el.focus(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.currentTarget.blur(); p.setSelectedMark(null); } }}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  onChange={(e) => setShow((s) => setMarks(s, onSet, (ms) => ms.map((x) => (x.id === m.id && x.kind === 'text' ? { ...x, text: e.target.value } : x))))} />
              )}
              <div style={row}>
                <button onClick={() => { setShow((s) => setMarks(s, onSet, (ms) => ms.filter((x) => x.id !== m.id))); p.setSelectedMark(null); }}>Delete</button>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Drag it on the field to move it.</span>
              </div>
            </fieldset>
          );
        })()}
        {one && (
          <>
            {onSet < 0 && (
              <p style={{ margin: '8px 0 4px' }}>
                <strong>{label(show, one)}</strong> at count {Math.round(locate(show, p.t).count * 100) / 100} of move into set {show.sets[cur].name}:<br />
                {readout(positionsAt(show, p.t)[one.id], show.hash)}
              </p>
            )}
            {onSet >= 0 && (
              <p style={{ margin: '8px 0 4px' }}>
                <strong>{label(show, one)}</strong> on set {show.sets[onSet].name}:<br />{readout(show.sets[onSet].pos[one.id], show.hash)}
              </p>
            )}
            <details style={{ margin: '4px 0 0' }}>
              <summary>All sets</summary>
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {show.sets.map((s, i) => (
                  <li key={s.id} value={Number(s.name) || undefined} style={{ fontWeight: i === onSet ? 700 : 400, marginBottom: 2 }}>
                    {readout(s.pos[one.id], show.hash)}
                  </li>
                ))}
              </ol>
            </details>
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
    <details style={{ marginTop: 10 }}>
      <summary>Place exactly (this set)</summary>
    <fieldset style={{ marginTop: 6, border: '1px solid #33443a' }}>
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
    </details>
  );
}
