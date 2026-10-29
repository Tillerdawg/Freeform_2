import { clearStartingSections, hasOwnStartingSections, saveStartingSections } from './startingSections';
import { Fragment, useEffect, useRef, useState } from 'react';
import { RosterImport } from './RosterImport';
import { readout, type HashPreset } from '../engine/coords';
import type { Shape, ShapeKind } from '../engine/shapes';
import {
  MAX_NAME, setCue, setMarks, setNames, setNote, label, locate, newId, moveToSection, removeSection, duplicateLetters, renumberSection, placeInSet, remapHash, positionsAt, xFrom, yFrom,
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
        <button onClick={p.onOpen} title="Load a .freeform show file (or an older .freeform.json) or a Pyware 3D .3dj drill (replaces the current show; Undo brings it back)">Import…</button>
        <button onClick={p.onSave} title="Download this show as a .freeform file: a backup, or a copy to share or open in another browser">Export</button>
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

      <SectionsEditor show={show} setShow={setShow} cur={cur} />
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
  return (
    <details style={box} ref={panel}>
      <summary><strong>Sections</strong> <span style={{ fontSize: 12, opacity: 0.7 }}>({show.sections.length})</span></summary>
      <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.75 }}>
        The swatch colors the section's dots. The letter starts each label (A1, X1). To split a section, add one here, then select its performers and change their Section.
      </p>
      {show.sections.map((s, i) => {
        const n = count(s.id), dup = dupes.has(s.letter.trim().toUpperCase());
        return (
          <div key={s.id}>
            <div style={row}>
              <input type="color" aria-label={`Color for ${s.name}`} title={s.color ? `Dot color for ${s.name}` : `Pick a dot color for ${s.name} (none yet)`}
                value={s.color ?? '#111111'} onChange={(e) => edit(i, { color: e.target.value })}
                style={{ width: 24, height: 24, padding: 0, border: s.color ? '1px solid #44594a' : '1px dashed #6b8270', borderRadius: 6, background: 'none', cursor: 'pointer', opacity: s.color ? 1 : 0.6 }} />
              <input aria-label={`Letter for ${s.name}`} value={s.letter} maxLength={3} style={{ width: 36, textAlign: 'center', borderColor: dup ? '#ff8080' : undefined }}
                onChange={(e) => edit(i, { letter: e.target.value })} />
              <input aria-label={`Name of section ${s.letter}`} value={s.name} style={{ flex: 1, minWidth: 0 }} onChange={(e) => edit(i, { name: e.target.value })} />
              <span style={{ fontSize: 12, opacity: 0.7, minWidth: 18, textAlign: 'right' }} title={`${n} performer${n === 1 ? '' : 's'}`}>{n}</span>
              <button aria-label={`Renumber section ${s.name}`} title="Renumber this section 1, 2, 3…" className="icon" disabled={n < 1}
                onClick={() => { setRenumbering(renumbering === s.id ? null : s.id); setDeleting(null); }}>#</button>
              <button aria-label={`Delete section ${s.name}`} title="Delete this section" className="icon danger" disabled={show.sections.length < 2}
                onClick={() => { setRenumbering(null); if (n) { setDeleting(s.id); setMoveTo(show.sections.find((x) => x.id !== s.id)!.id); } else setShow((sh) => removeSection(sh, s.id)); }}>×</button>
            </div>
            {dup && <div role="alert" style={{ color: '#ff8080', fontSize: 12, marginTop: 2 }}>Another section also uses "{s.letter}": their labels would clash.</div>}
            {renumbering === s.id && (
              <div style={{ ...row, fontSize: 12, background: '#22302a', padding: 6, borderRadius: 6 }}>
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
              <div style={{ ...row, fontSize: 12, background: '#22302a', padding: 6, borderRadius: 6 }}>
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
        {show.sections.some((s) => s.color) && (
          <button onClick={() => setShow((sh) => ({ ...sh, sections: sh.sections.map(({ color: _, ...x }) => x) }))} title="Back to plain dots for every section">Clear colors</button>
        )}
      </div>
      <div style={{ ...row, marginTop: 10 }}>
        <button onClick={() => { setStartNote(saveStartingSections(show) ? 'New shows will start with this list.' : "This browser won't save it."); setOwn(hasOwnStartingSections()); }}
          title="New shows you start in this browser get these sections and letters">Use as my starting list</button>
        {own && <button onClick={() => { clearStartingSections(); setOwn(false); setStartNote("New shows will start with Freeform's list."); }}
          title="New shows go back to Freeform's starting sections">Back to Freeform's list</button>}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.75 }} role="status">
        {startNote || (own ? 'New shows start with your own list (in this browser).' : "New shows start with Freeform's list.")}
      </p>
    </details>
  );
}
