import { clearStartingSections, hasOwnStartingSections, saveStartingSections } from './startingSections';
import { coarse } from '../perform/device';
import { Fragment, useEffect, useRef, useState } from 'react';
import { RosterImport } from './RosterImport';
import { deleteAudio, putAudio } from './audioStore';
import { IconGrip } from './icons';
import { Menu } from './Toolbar';
import { COURT, FEET, HASHES, distance, fieldDepth, readout, type HashPreset } from '../engine/coords';
import type { Shape, ShapeKind } from '../engine/shapes';
import {
  fieldOf, addProp, MAX_PROPS, placeProp, removeProp, updateProp, EQUIPMENT, equipmentIn, equipmentName, setEquipment, type Equipment, FACINGS, facingIn, facingName, setFacing, type Facing, MAX_NAME, scoreOrder, setCue, setMarks, setNames, setNote, label, locate, newId, moveToSection, removeSection, duplicateLetters, renumberSection, placeInSet, remapHash, positionsAt, xFrom, yFrom,
  type FrontDir, type FrontRef, type Section, type Show, type SideDir,
} from '../engine/show';
import { NumberField } from './NumberField';

export type Tool = 'select' | 'add' | 'text' | 'arrow' | 'draw' | 'turn'; // turn: click to add an FTL leader's turning points
export type Snap = 1 | 0.5 | 0;

interface Props {
  adding: boolean; // taps add to the selection (Add to selection, for touch screens)
  setAdding: (b: boolean) => void;
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
  clip: number; // how many performers' spots are copied
  onCopy: () => void;
  onPaste: () => void;
  selectedProp: string | null;
  setSelectedProp: (id: string | null) => void;
  onTrace: () => void; // a tracing picture was added
}

const PRESETS: [HashPreset, string][] = [['highSchool', 'High school'], ['college', 'College / DCI'], ['nfl', 'NFL']];
const LINES = [50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0];
const box: React.CSSProperties = { borderTop: '1px solid var(--line)', padding: '10px 0' };
const row: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 };

export function Sidebar(p: Props) {
  const { show, setShow, onSet, selected } = p;
  const cur = onSet >= 0 ? onSet : locate(show, p.t).to;
  const one = selected.size === 1 ? show.performers.find((x) => selected.has(x.id)) : undefined;
  const [pendingHash, setPendingHash] = useState<HashPreset | null>(null);
  const ids = [...selected];

  return (
    <aside style={{ width: 300, padding: '8px 14px 0', overflowY: 'auto', borderLeft: '1px solid var(--line)', fontSize: 14, display: 'flex', flexDirection: 'column' }}>
      <div style={row}>
        <button onClick={p.onNew}>New</button>
        <button onClick={p.onOpen} title="Load a .freeform show file (or an older .freeform.json) or a Pyware 3D .3dj drill (replaces the current show; Undo brings it back)">Import…</button>
        <button onClick={p.onSave} title="Download this show as a .freeform file: a backup, or a copy to share or open in another browser">Export</button>
        <button onClick={p.onPrint} disabled={!show.performers.length} title="Dot sheets and drill charts (print or save as PDF)">Print…</button>
        <button onClick={p.onShare} disabled={!show.performers.length} title="A link that opens this show on performers' and staff phones">Share…</button>
        <button onClick={() => { location.hash = '#perform'; }} title="Open the performer view: your saved show, or scan / paste a show link">Performer view</button>
      </div>
      {p.fileError && <div role="alert" style={{ color: 'var(--danger)', marginTop: 6 }}>{p.fileError}</div>}
      <div style={{ ...row, marginBottom: 10 }}>
        <input aria-label="Show title" value={show.title} onChange={(e) => setShow((s) => ({ ...s, title: e.target.value }))} style={{ flex: 1 }} />
        <select aria-label="Field" title="What the show is written on: a football field (by its hashes), a basketball court, or a floor or tarp you size" value={show.surface ? show.surface.kind : show.hash} onChange={(e) => {
          const to = e.target.value;
          if (to === 'court') setShow((s) => ({ ...s, surface: COURT }));
          else if (to === 'floor') setShow((s) => ({ ...s, surface: { kind: 'floor', w: Math.round(60 * FEET * 4) / 4, d: Math.round(40 * FEET * 4) / 4 } }));
          else if (show.surface) setShow(({ surface: _, ...s }) => ({ ...s, hash: to as HashPreset })); // back outside: spots stay put
          else if (show.performers.length) setPendingHash(to as HashPreset); // ask what should happen to the drill
          else setShow((s) => ({ ...s, hash: to as HashPreset }));
        }}>
          {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          <option value="court">Basketball court</option>
          <option value="floor">Custom floor</option>
        </select>
        <select aria-label="Draw performers as" title="On the field, printed charts, and phones: the section letter labeled with the number, a dot labeled P4, or letters with the flag, rifle, or saber drawn in place of the letter for anyone carrying one"
          value={show.symbols ?? 'letters'} onChange={(e) => setShow((s) => { const { symbols: _, ...rest } = s, v = e.target.value; return v === 'dots' || v === 'icons' ? { ...rest, symbols: v } : rest; })}>
          <option value="letters">Letters</option>
          <option value="dots">Dots</option>
          <option value="icons">Equipment icons</option>
        </select>
      </div>
      {show.surface?.kind === 'floor' && (
        <div style={{ ...row, marginTop: -4, marginBottom: 10 }}>
          <label>Wide <NumberField aria-label="Floor width in feet" min={8} max={700} step={1} value={Math.round(show.surface.w / FEET)} style={{ width: 56 }}
            onValue={(n) => setShow((s) => (s.surface ? { ...s, surface: { ...s.surface, w: n * FEET } } : s))} /></label>
          <label>Deep <NumberField aria-label="Floor depth in feet" min={8} max={700} step={1} value={Math.round(show.surface.d / FEET)} style={{ width: 56 }}
            onValue={(n) => setShow((s) => (s.surface ? { ...s, surface: { ...s.surface, d: n * FEET } } : s))} /></label>
          <span style={{ fontSize: 12, opacity: 0.75 }}>feet</span>
        </div>
      )}
      {show.surface && show.performers.some((x) => show.sets.some((st) => { const q = st.pos[x.id]; return q && (Math.abs(q.x) > show.surface!.w / 2 || q.y < 0 || q.y > show.surface!.d); })) && (
        <p role="status" style={{ color: 'var(--warn)', fontSize: 12, margin: '-4px 0 10px' }}>Some performers are off the floor in some sets. They kept their spots in steps from the center and the front.</p>
      )}
      {pendingHash && (
        <div role="dialog" aria-modal="true" aria-label="Change hash marks" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 420, maxWidth: 'calc(100vw - 32px)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <strong>Selection</strong>
          <button aria-pressed={p.adding} onClick={() => p.setAdding(!p.adding)} title="While on, tapping or boxing performers adds to the selection (like shift-click)">Add to selection</button>
        </div>
        {selected.size === 0 && <p style={{ opacity: 0.7, margin: '6px 0 0' }}>{coarse() ? 'Tap a performer or drag a box around several. Turn on Add to selection to pick more.' : 'Click a performer, shift-click to add, or drag a box.'}</p>}
        {selected.size > 1 && <p style={{ margin: '6px 0 0' }}>{selected.size} performers selected</p>}
        {selected.size === 2 && (() => {
          const [x, y] = ids.map((id) => show.performers.find((q) => q.id === id)!), pos = onSet >= 0 ? show.sets[onSet].pos : positionsAt(show, p.t);
          const d = Math.round(distance(pos[x.id], pos[y.id]) * 4) / 4; // quarter steps, like the coordinates
          return <p style={{ margin: '4px 0 0' }}>{label(show, x)} to {label(show, y)}: {d} step{d === 1 ? '' : 's'} apart</p>;
        })()}
        <div style={row}>
          <button onClick={() => p.setSelected(new Set(show.performers.map((x) => x.id)))} disabled={!show.performers.length} title="Select every performer (⌘A / Ctrl+A)">Select all</button>
          <select aria-label="Select a section" value="" disabled={!show.performers.length}
            onChange={(e) => { const sec = e.target.value; if (sec) p.setSelected(new Set(show.performers.filter((x) => x.section === sec).map((x) => x.id))); }}>
            <option value="" disabled>Select a section…</option>
            {show.sections.filter((s) => show.performers.some((x) => x.section === s.id)).map((s) => <option key={s.id} value={s.id}>{s.letter} · {s.name}</option>)}
          </select>
        </div>
        <div style={row}>
          <button onClick={p.onCopy} disabled={!(selected.size && onSet >= 0)} title="Copy the selected performers' spots in this set (⌘C / Ctrl+C)">Copy spots</button>
          <button onClick={p.onPaste} disabled={!(p.clip && onSet >= 0)} title="Put the copied performers on the copied spots in this set (⌘V / Ctrl+V)">Paste spots{p.clip ? ` (${p.clip})` : ''}</button>
        </div>
        {onSet < 0 && <p style={{ color: 'var(--warn)', margin: '6px 0 0' }}>Mid-move: you can select, but scrub to a set to move or add.</p>}
        {one && (
          <label style={{ display: 'block', marginTop: 8 }}>Name
              <input aria-label="Performer's name" value={one.name ?? ''} placeholder={`Who marches ${label(show, one)}?`} maxLength={MAX_NAME}
                style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 2 }}
                onChange={(e) => setShow((s) => setNames(s, { [one.id]: e.target.value }))} />
          </label>
        )}
        {selected.size > 0 && (() => {
          const secs = new Set(show.performers.filter((x) => selected.has(x.id)).map((x) => x.section));
          return (
            <label style={{ display: 'block', marginTop: 8 }} title="Moves them into that section for the whole show; they're numbered after its current members">Section{' '}
              <select aria-label="Section of selected performers" value={secs.size === 1 ? [...secs][0] : ''}
                onChange={(e) => e.target.value && setShow((s) => moveToSection(s, [...selected], e.target.value))}>
                {secs.size > 1 && <option value="" disabled>Mixed</option>}
                {show.sections.map((s) => <option key={s.id} value={s.id}>{s.letter} · {s.name}</option>)}
              </select>
            </label>
          );
        })()}
        {selected.size > 0 && onSet >= 0 && (() => {
          // Facing set here, or carried on from an earlier set ('' = carried on).
          const own = new Set(ids.map((id) => show.sets[onSet].facing?.[id] ?? ''));
          const before = new Set(ids.map((id) => (onSet ? facingIn(show, onSet - 1, id) ?? '' : '')));
          const carried = before.size === 1 ? [...before][0] : 'mixed';
          return (
            <label style={{ display: 'block', marginTop: 8 }} title="Which way they face in this set. It carries on into later sets until you change it.">Facing{' '}
              <select aria-label="Facing of selected performers" value={own.size === 1 ? [...own][0] : 'mixed'}
                onChange={(e) => e.target.value !== 'mixed' && setShow((s) => setFacing(s, onSet, ids, (e.target.value || null) as Facing | null))}>
                {own.size > 1 && <option value="mixed" disabled>Mixed</option>}
                <option value="">{onSet === 0 ? 'Not set' : carried === 'mixed' ? 'As in the set before (mixed)' : carried ? `As in the set before (${facingName(carried as Facing)})` : 'Not set'}</option>
                {FACINGS.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
              </select>
            </label>
          );
        })()}
        {selected.size > 0 && onSet >= 0 && (() => {
          // Equipment set here, or carried on from an earlier set ('' = carried on).
          const own = new Set(ids.map((id) => show.sets[onSet].equipment?.[id] ?? ''));
          const before = new Set(ids.map((id) => (onSet ? equipmentIn(show, onSet - 1, id) ?? 'none' : 'none')));
          const carried = before.size === 1 ? [...before][0] : 'mixed';
          return (
            <label style={{ display: 'block', marginTop: 8 }} title="A flag, rifle, or saber they carry from this set on, until you change it">Carries{' '}
              <select aria-label="Equipment of selected performers" value={own.size === 1 ? [...own][0] : 'mixed'}
                onChange={(e) => e.target.value !== 'mixed' && setShow((s) => setEquipment(s, onSet, ids, (e.target.value || null) as Equipment | 'none' | null))}>
                {own.size > 1 && <option value="mixed" disabled>Mixed</option>}
                {onSet > 0 && <option value="">{carried === 'mixed' ? 'As in the set before (mixed)' : `As in the set before (${carried === 'none' ? 'nothing' : equipmentName(carried as Equipment).toLowerCase()})`}</option>}
                <option value={onSet > 0 ? 'none' : ''}>Nothing</option>
                {EQUIPMENT.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
              </select>
            </label>
          );
        })()}
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
            <fieldset style={{ marginTop: 10, border: '1px solid var(--line)' }}>
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
                {readout(positionsAt(show, p.t)[one.id], fieldOf(show))}
              </p>
            )}
            {onSet >= 0 && (
              <p style={{ margin: '8px 0 4px' }}>
                <strong>{label(show, one)}</strong> on set {show.sets[onSet].name}:<br />{readout(show.sets[onSet].pos[one.id], fieldOf(show))}
              </p>
            )}
            <details style={{ margin: '4px 0 0' }}>
              <summary>All sets</summary>
              <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {show.sets.map((s, i) => (
                  <li key={s.id} value={Number(s.name) || undefined} style={{ fontWeight: i === onSet ? 700 : 400, marginBottom: 2 }}>
                    {readout(s.pos[one.id], fieldOf(show))}
                  </li>
                ))}
              </ol>
            </details>
            {onSet >= 0 && !show.surface && <CoordEntry onPlace={(x, y) => setShow((s) => placeInSet(s, onSet, { [one.id]: { x, y: y(s.hash) } }))} />}
          </>
        )}
      </section>

      <SectionsEditor show={show} setShow={setShow} cur={cur} />
      <PropsEditor show={show} setShow={setShow} onSet={onSet} selected={p.selectedProp} setSelected={p.setSelectedProp} />
      <TraceEditor show={show} setShow={setShow} onTrace={p.onTrace} />
      <Roster show={show} setShow={setShow} selected={selected} setSelected={p.setSelected} />
    </aside>
  );
}

/** Who marches each dot. Click a label to select that performer on the field. */
function Roster({ show, setShow, selected, setSelected }: { show: Show; setShow: Props['setShow']; selected: Set<string>; setSelected: (s: Set<string>) => void }) {
  const order = new Map(show.sections.map((s, i) => [s.id, i]));
  const rows = [...show.performers].sort((a, b) => (order.get(a.section) ?? 0) - (order.get(b.section) ?? 0) || a.number - b.number);
  const named = show.performers.filter((x) => x.name).length;
  const [importing, setImporting] = useState(false);
  return (
    <details style={box}>
      <summary><strong>Roster</strong> <span style={{ fontSize: 12, opacity: 0.7 }}>({named} of {show.performers.length} named)</span></summary>
      <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.75 }}>
        Who marches each dot. Names are saved with the show and in encrypted hosted links, but not in plain share links.
      </p>
      <button onClick={() => setImporting(true)} style={{ marginTop: 6 }} title="Paste a list from Excel or load a CSV: names, instruments, dot codes">Import a list…</button>
      {importing && <RosterImport show={show} setShow={setShow} onClose={() => setImporting(false)} />}
      {!rows.length && <p style={{ margin: '6px 0 0', opacity: 0.7 }}>No performers yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 6px', alignItems: 'center', marginTop: 6 }}>
        {rows.map((x) => (
          <Fragment key={x.id}>
            <button onClick={() => setSelected(new Set([x.id]))} aria-pressed={selected.has(x.id)} title="Select this performer"
              style={{ padding: '0 6px', minWidth: 40, fontWeight: selected.has(x.id) ? 700 : 400 }}>{label(show, x)}</button>
            <input aria-label={`Name for ${label(show, x)}`} value={x.name ?? ''} maxLength={MAX_NAME} placeholder="(no one yet)"
              onChange={(e) => setShow((s) => setNames(s, { [x.id]: e.target.value }))} style={{ minWidth: 0 }} />
          </Fragment>
        ))}
      </div>
    </details>
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
  return (
    <details style={{ marginTop: 10 }}>
      <summary>Place exactly (this set)</summary>
    <fieldset style={{ marginTop: 6, border: '1px solid var(--line)' }}>
      <div style={row}>
        <NumberField aria-label="Side-to-side steps" min={0} step={0.25} value={xs} onValue={setXs} style={{ width: 52 }} />
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
        <NumberField aria-label="Front-to-back steps" min={0} step={0.25} value={ys} onValue={setYs} style={{ width: 52 }} />
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

const abc = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const SORTS: [string, (l: Section[]) => Section[], string][] = [
  ['Score order', scoreOrder, 'Woodwinds, brass, battery, front ensemble, then guard; sections with other names go last'],
  ['By letter (A–Z)', (l) => [...l].sort((a, b) => abc(a.letter, b.letter)), "By each section's label letter: A, B, C…"],
  ['By name (A–Z)', (l) => [...l].sort((a, b) => abc(a.name, b.name)), 'Alphabetically by instrument: Alto Saxophone, Baritone, Bass Drum…'],
];

/** Rename, re-letter, add and delete sections. Letters two sections share are flagged (their labels would clash). */
function SectionsEditor({ show, setShow, cur }: { show: Show; setShow: (f: (s: Show) => Show) => void; cur: number }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [renumbering, setRenumbering] = useState<string | null>(null);
  const [own, setOwn] = useState(hasOwnStartingSections);
  const [startNote, setStartNote] = useState('');
  const [moveTo, setMoveTo] = useState('');
  const dupes = duplicateLetters(show);
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (dupes.size && panel.current) panel.current.open = true; }, [dupes.size]); // show a clash; never close on the user
  const count = (id: string) => show.performers.filter((p) => p.section === id).length;
  const edit = (i: number, patch: { letter?: string; name?: string; color?: string }) =>
    setShow((sh) => ({ ...sh, sections: sh.sections.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  // Drag a row's grip to reorder: a gold line shows where it will land; one change (one undo) on release. Rows don't
  // move during the drag (moving the grabbed element in the page would drop the pointer).
  const [drag, setDrag] = useState<{ from: number; to: number; mids: number[] } | null>(null);
  const rowEls = useRef<(HTMLDivElement | null)[]>([]);
  const reorder = (from: number, to: number) => { if (from !== to) setShow((sh) => { const list = [...sh.sections]; list.splice(to, 0, ...list.splice(from, 1)); return { ...sh, sections: list }; }); };
  const landing = (i: number) => (!drag || drag.to === drag.from ? undefined
    : i === drag.to ? (drag.to < drag.from ? 'inset 0 3px 0 var(--gold)' : 'inset 0 -3px 0 var(--gold)') : undefined);
  return (
    <details style={box} ref={panel}>
      <summary><strong>Sections</strong> <span style={{ fontSize: 12, opacity: 0.7 }}>({show.sections.length})</span></summary>
      <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.75 }}>
        The swatch colors the section's dots. The letter starts each label (A1, X1). To split a section, add one here, then select its performers and change their Section.
      </p>
      {show.sections.map((s, i) => {
        const n = count(s.id), dup = dupes.has(s.letter.trim().toUpperCase()), last = show.sections.length - 1;
        return (
          <div key={s.id} ref={(el) => { rowEls.current[i] = el; }} style={{ boxShadow: landing(i), opacity: drag && drag.from === i && drag.to !== i ? 0.5 : 1 }}>
            <div style={coarse() ? { ...row, flexWrap: 'wrap' } : row}>{/* touch: 44 px controls; the name wraps rather than shrink */}
              <button aria-label={`Move ${s.name} (drag up or down, or use the arrow keys)`} title="Drag up or down to reorder" className="icon"
                style={{ cursor: drag ? 'grabbing' : 'grab', touchAction: 'none', padding: '4px 5px' }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setRenumbering(null); setDeleting(null);
                  // Each row's middle, in list order, as it stands when the drag starts.
                  const mids = show.sections.map((_, j) => { const r = rowEls.current[j]?.getBoundingClientRect(); return r ? r.top + r.height / 2 : 0; });
                  setDrag({ from: i, to: i, mids });
                }}
                onPointerMove={(e) => { if (drag) { const to = drag.mids.filter((m, j) => j !== drag.from && m < e.clientY).length; if (to !== drag.to) setDrag({ ...drag, to }); } }}
                onPointerUp={() => { if (drag) { reorder(drag.from, drag.to); setDrag(null); } }}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(e) => {
                  const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : -1;
                  if (to < 0 || to > last) return;
                  e.preventDefault(); reorder(i, to);
                  requestAnimationFrame(() => (rowEls.current[to]?.querySelector('button') as HTMLButtonElement | null)?.focus()); // keep moving it
                }}>
                <IconGrip />
              </button>
              <input type="color" aria-label={`Color for ${s.name}`} title={s.color ? `Dot color for ${s.name}` : `Pick a dot color for ${s.name} (none yet)`}
                value={s.color ?? '#111111'} onChange={(e) => edit(i, { color: e.target.value })}
                style={{ width: 24, height: 24, padding: 0, border: s.color ? '1px solid var(--line-strong)' : '1px dashed var(--muted)', borderRadius: 6, background: 'none', cursor: 'pointer', opacity: s.color ? 1 : 0.6 }} />
              <input aria-label={`Letter for ${s.name}`} value={s.letter} maxLength={3} style={{ width: 36, padding: '4px 2px', textAlign: 'center', borderColor: dup ? 'var(--danger)' : undefined }}
                onChange={(e) => edit(i, { letter: e.target.value })} />
              <input aria-label={`Name of section ${s.letter}`} value={s.name} style={{ flex: 1, minWidth: coarse() ? 120 : 0 }} onChange={(e) => edit(i, { name: e.target.value })} />
              <span style={{ fontSize: 12, opacity: 0.7, minWidth: 18, textAlign: 'right' }} title={`${n} performer${n === 1 ? '' : 's'}`}>{n}</span>
              <button aria-label={`Renumber section ${s.name}`} title="Renumber this section 1, 2, 3…" className="icon" disabled={n < 1}
                onClick={() => { setRenumbering(renumbering === s.id ? null : s.id); setDeleting(null); }}>#</button>
              <button aria-label={`Delete section ${s.name}`} title="Delete this section" className="icon danger" disabled={show.sections.length < 2}
                onClick={() => { setRenumbering(null); if (n) { setDeleting(s.id); setMoveTo(show.sections.find((x) => x.id !== s.id)!.id); } else setShow((sh) => removeSection(sh, s.id)); }}>×</button>
            </div>
            {dup && <div role="alert" style={{ color: 'var(--danger)', fontSize: 12, marginTop: 2 }}>Another section also uses "{s.letter}": their labels would clash.</div>}
            {renumbering === s.id && (
              <div style={{ ...row, fontSize: 12, background: 'var(--surface)', padding: 6, borderRadius: 6 }}>
                Renumber {s.letter}1–{s.letter}{n}:
                <button onClick={() => { setShow((sh) => renumberSection(sh, s.id, 'number')); setRenumbering(null); }}
                  title="Keep their order and close the gaps (e.g. X4 X5 X6 become X1 X2 X3)">Close the gaps</button>
                <button onClick={() => { setShow((sh) => renumberSection(sh, s.id, 'field', cur)); setRenumbering(null); }}
                  title={`From Side 1 to Side 2 as they stand in set ${show.sets[cur].name}, front to back where they line up`}>Left to right (set {show.sets[cur].name})</button>
                <button onClick={() => { setShow((sh) => renumberSection(sh, s.id, 'ranks', cur)); setRenumbering(null); }}
                  title={`Front rank first, each rank from Side 1 to Side 2, as they stand in set ${show.sets[cur].name}`}>Front to back (set {show.sets[cur].name})</button>
                <button onClick={() => setRenumbering(null)}>Cancel</button>
              </div>
            )}
            {deleting === s.id && (
              <div style={{ ...row, fontSize: 12, background: 'var(--surface)', padding: 6, borderRadius: 6 }}>
                Move its {n} performer{n === 1 ? '' : 's'} to
                <select aria-label="Move performers to" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                  {show.sections.filter((x) => x.id !== s.id).map((x) => <option key={x.id} value={x.id}>{x.letter} · {x.name}</option>)}
                </select>
                <button className="danger" onClick={() => { setShow((sh) => removeSection(sh, s.id, moveTo)); setDeleting(null); }}>Delete section</button>
                <button onClick={() => setDeleting(null)}>Cancel</button>
              </div>
            )}
          </div>
        );
      })}
      <div style={row}>
        <button onClick={() => setShow((sh) => ({ ...sh, sections: [...sh.sections, { id: newId('s'), name: 'New section', letter: '?' }] }))}>+ Section</button>
        <Menu label="Sort" title="Put the sections in an order: score order, by letter, or by name">
          {(close) => SORTS.map(([name, how, title]) => (
            <button key={name} title={title} disabled={how(show.sections).every((x, i) => x === show.sections[i])}
              onClick={() => { setShow((sh) => ({ ...sh, sections: how(sh.sections) })); close(); }}>{name}</button>
          ))}
        </Menu>
        {show.sections.some((s) => s.color) && (
          <button onClick={() => setShow((sh) => ({ ...sh, sections: sh.sections.map(({ color: _, ...x }) => x) }))} title="Back to plain dots for every section">Clear colors</button>
        )}
      </div>
      <div style={{ ...row, marginTop: 10 }}>
        <Menu label="Starting list" title="Which sections new shows start with, in this browser">
          {(close) => <>
            <button onClick={() => { setStartNote(saveStartingSections(show) ? 'New shows will start with this list.' : "This browser won't save it."); setOwn(hasOwnStartingSections()); close(); }}
              title="New shows you start in this browser get these sections and letters">Use this list for new shows</button>
            <button disabled={!own} onClick={() => { clearStartingSections(); setOwn(false); setStartNote("New shows will start with FreeFORM's list."); close(); }}
              title="New shows go back to FreeFORM's starting sections">Back to FreeFORM's list</button>
          </>}
        </Menu>
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.75 }} role="status">
        {startNote || (own ? 'New shows start with your own list (in this browser).' : "New shows start with FreeFORM's list.")}
      </p>
    </details>
  );
}

/** Props: add, name, size, and delete them; the selected one's turn in this set. Drag a prop on the field to move it. */
function PropsEditor({ show, setShow, onSet, selected, setSelected }: { show: Show; setShow: Props['setShow']; onSet: number; selected: string | null; setSelected: (id: string | null) => void }) {
  const props = show.props ?? [];
  const [open, setOpen] = useState(false);
  useEffect(() => { if (selected) setOpen(true); }, [selected]); // picking a prop on the field opens the list
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
      <summary><strong>Props</strong> <span style={{ fontSize: 12, opacity: 0.7 }}>({props.length})</span></summary>
      <p style={{ fontSize: 12, opacity: 0.75, margin: '6px 0' }}>Platforms, backdrops, and other things on the field. Drag one on the field to move it in this set; it moves between sets like a performer.</p>
      {props.map((pr) => {
        const spot = onSet >= 0 ? show.sets[onSet].props?.[pr.id] : undefined, sel = pr.id === selected;
        return (
          <div key={pr.id} onClick={() => setSelected(pr.id)} style={{ border: `1px solid ${sel ? 'var(--gold)' : 'var(--line)'}`, borderRadius: 4, padding: 6, marginTop: 6 }}>
            <div style={row}>
              <input aria-label="Prop name" value={pr.name} maxLength={MAX_NAME} style={{ flex: 1, minWidth: 80 }} onChange={(e) => setShow((s) => updateProp(s, pr.id, { name: e.target.value }))} />
              <button aria-label={`Delete prop ${pr.name}`} title="Delete this prop from the whole show" className="icon danger"
                onClick={(e) => { e.stopPropagation(); setShow((s) => removeProp(s, pr.id)); if (sel) setSelected(null); }}>×</button>
            </div>
            <div style={row}>
              <label>Wide <NumberField aria-label="Prop width in steps" min={0.5} max={200} step={0.5} value={pr.w} style={{ width: 52 }} onValue={(n) => setShow((s) => updateProp(s, pr.id, { w: n }))} /></label>
              <label>Deep <NumberField aria-label="Prop depth in steps" min={0.5} max={200} step={0.5} value={pr.h} style={{ width: 52 }} onValue={(n) => setShow((s) => updateProp(s, pr.id, { h: n }))} /></label>
              <span style={{ fontSize: 12, opacity: 0.75 }}>steps</span>
            </div>
            <div style={row}>
              <label><input type="checkbox" checked={!!pr.round} onChange={(e) => setShow((s) => updateProp(s, pr.id, { round: e.target.checked || undefined }))} /> Round</label>
              {spot && <label title="Its turn in this set, in degrees counterclockwise">Turned <NumberField aria-label="Prop turn in degrees" min={-360} max={360} integer value={spot.angle} style={{ width: 52 }}
                onValue={(n) => setShow((s) => placeProp(s, onSet, pr.id, { ...spot, angle: n }))} />°</label>}
            </div>
          </div>
        );
      })}
      <div style={row}>
        <button disabled={props.length >= MAX_PROPS} onClick={() => { const r = addProp(show, `Prop ${props.length + 1}`, 8, 4, false, { x: 0, y: fieldDepth(fieldOf(show)) / 2 }); setShow(() => r.show); setSelected(r.id); }}
          title="A new prop, 8 steps wide and 4 deep, in the middle">+ Prop</button>
      </div>
    </details>
  );
}

/** A picture under the field to trace (kept in this browser, never in the show file or links). */
function TraceEditor({ show, setShow, onTrace }: { show: Show; setShow: Props['setShow']; onTrace: () => void }) {
  const tr = show.trace, file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const pick = async (f: File) => {
    const id = tr?.id ?? newId('trace');
    if (!(await putAudio(id, f))) { setErr("This browser wouldn't save the picture (private browsing?)."); return; }
    setErr('');
    setShow((s) => ({ ...s, trace: s.trace ? { ...s.trace, id } : { id, x: 0, y: fieldDepth(fieldOf(s)) / 2, w: 40, opacity: 0.5 } }));
    onTrace();
  };
  const set = (patch: Partial<NonNullable<Show['trace']>>) => setShow((s) => (s.trace ? { ...s, trace: { ...s.trace, ...patch } } : s));
  return (
    <details style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
      <summary><strong>Picture to trace</strong></summary>
      <p style={{ fontSize: 12, opacity: 0.75, margin: '6px 0' }}>A logo or a sketch under the field, to place performers on. It stays in this browser: it isn't saved in the show file, printed, or sent to phones.</p>
      <div style={row}>
        <button onClick={() => file.current?.click()}>{tr ? 'Change picture…' : 'Add a picture…'}</button>
        {tr && <button onClick={() => { deleteAudio(tr.id); setShow(({ trace: _, ...s }) => s); }}>Remove</button>}
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      </div>
      {err && <p role="alert" style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>{err}</p>}
      {tr && <>
        <div style={row}>
          <label>Wide <NumberField aria-label="Picture width in steps" min={2} max={200} step={1} value={tr.w} style={{ width: 52 }} onValue={(n) => set({ w: n })} /> steps</label>
        </div>
        <div style={row}>
          <label title="Steps from the 50: minus toward Side 1, plus toward Side 2">Across <NumberField aria-label="Picture center, steps from the 50" min={-100} max={100} step={1} value={tr.x} style={{ width: 52 }} onValue={(n) => set({ x: n })} /></label>
          <label title="Steps from the front sideline">Up <NumberField aria-label="Picture center, steps from the front sideline" min={-20} max={104} step={1} value={tr.y} style={{ width: 52 }} onValue={(n) => set({ y: n })} /></label>
        </div>
        <div style={row}>
          <label>See-through <input type="range" aria-label="Picture strength" min={10} max={100} value={Math.round(tr.opacity * 100)} onChange={(e) => set({ opacity: Number(e.target.value) / 100 })} /></label>
        </div>
        <p style={{ fontSize: 12, opacity: 0.75, margin: '4px 0 0' }}>{show.surface ? 'Across is steps from the center line (minus toward Side 1). Up is steps from the front edge.' : `Across is steps from the 50 (minus toward Side 1). Up is steps from the front sideline; the front hash is ${HASHES[show.hash]} up.`}</p>
      </>}
    </details>
  );
}
