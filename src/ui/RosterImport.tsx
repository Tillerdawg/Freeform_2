import { useMemo, useState } from 'react';
import { applyRoster, parseTable, planRoster, type Choices, type Role } from '../engine/roster';
import type { Show } from '../engine/show';

const ROLE_NAMES: [Role, string][] = [['name', 'Name'], ['first', 'First name'], ['last', 'Last name'], ['instrument', 'Instrument'], ['code', 'Dot code'], ['ignore', '(not used)']];

/** Paste a list from Excel (or load a CSV), see what each row will do, then apply it in one step (Undo reverses it). */
export function RosterImport({ show, setShow, onClose }: { show: Show; setShow: (f: (s: Show) => Show) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [fileError, setFileError] = useState('');
  const [roles, setRoles] = useState<Role[] | null>(null); // null: as detected
  const [choices, setChoices] = useState<Choices>({}); // instrument → section id or 'skip'
  const { rows, error: readError } = useMemo(() => { try { return { rows: parseTable(text), error: '' }; } catch (e) { return { rows: [], error: e instanceof Error ? e.message : String(e) }; } }, [text]);
  const error = fileError || readError;
  const auto = useMemo(() => planRoster(show, rows, undefined, choices), [show, rows, choices]);
  const plan = useMemo(() => (roles ? planRoster(show, rows, roles, choices) : auto), [show, rows, roles, auto, choices]);
  const undecided = plan.unknown.filter((u) => !u.choice).length;
  const width = Math.max(0, ...rows.map((r) => r.length));
  const count = (k: string) => plan.steps.filter((s) => s.kind === k).length;
  const file = async (f: File) => {
    setFileError('');
    if (/\.xlsx?$/i.test(f.name)) { setFileError('Freeform reads CSV or pasted cells, not .xlsx: in Excel, select the cells and copy them here, or Save As "CSV".'); return; }
    if (f.size > 2_000_000) { setFileError('That file is too big for a roster.'); return; }
    setRoles(null); setChoices({}); setText(await f.text());
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Import a roster" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 30 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 720, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Import a roster</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13 }}>
          In Excel, select your list (names, instruments, dot codes like P4) and paste it here, or choose a CSV file. A row with a dot code names that dot, or
          adds it if it doesn't exist; a row with just an instrument names that section's next unnamed dot, or adds one. New dots wait in a row on the front
          sideline in every set.
        </p>
        <textarea aria-label="Pasted roster" value={text} onChange={(e) => { setRoles(null); setChoices({}); setFileError(""); setText(e.target.value); }} rows={6}
          placeholder={'Name\tInstrument\tDot\nPat Example\tTrumpet\tP4'} style={{ width: '100%', boxSizing: 'border-box', font: '13px ui-monospace, monospace' }} />
        <label style={{ display: 'block', margin: '6px 0', fontSize: 13 }}>Or a file: <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain,.xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) file(f); e.target.value = ''; }} /></label>
        {error && <p role="alert" style={{ color: 'var(--danger)', margin: '6px 0' }}>{error}</p>}
        {rows.length > 0 && (
          <>
            <p style={{ margin: '10px 0 4px', fontSize: 13 }}>Columns{auto.header ? ' (from the header row)' : ''}: change any that were read wrong.</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: width }, (_, k) => (
                <label key={k} style={{ fontSize: 12 }}>
                  {auto.header ? rows[0][k] || `Column ${k + 1}` : `Column ${k + 1}`}{' '}
                  <select aria-label={`Column ${k + 1} holds`} value={plan.roles[k] ?? 'ignore'} onChange={(e) => { const r = [...plan.roles]; while (r.length < width) r.push('ignore'); r[k] = e.target.value as Role; setRoles(r); }}>
                    {ROLE_NAMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {plan.unknown.length > 0 && (
              <fieldset style={{ margin: '10px 0 0', border: '1px solid var(--warn-line)' }}>
                <legend>Players whose instrument has no section</legend>
                <p style={{ margin: '0 0 6px', fontSize: 12 }}>Choose the section they march with (a bassoonist who marches baritone), or leave them off this show.</p>
                {plan.unknown.map((u) => (
                  <label key={u.key} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ minWidth: 160 }}><strong>{u.instrument}</strong> ({u.rows} {u.rows === 1 ? 'row' : 'rows'})</span>
                    <select aria-label={`Section for ${u.instrument} players`} value={u.choice ?? ''} onChange={(e) => setChoices((c) => ({ ...c, [u.key]: e.target.value }))}
                      style={{ outline: u.choice ? undefined : '2px solid var(--warn)' }}>
                      <option value="" disabled>Choose…</option>
                      {show.sections.map((s) => <option key={s.id} value={s.id}>March with {s.letter} · {s.name}</option>)}
                      <option value="skip">Leave them off</option>
                    </select>
                    {u.note.includes(' could be ') && <span style={{ fontSize: 12, opacity: 0.8 }}>{u.note}</span>}
                  </label>
                ))}
              </fieldset>
            )}
            <p role="status" style={{ margin: '10px 0 4px' }}>
              <strong>{count('name')}</strong> dots named · <strong>{count('new')}</strong> new dots · <strong>{count('skip') - plan.steps.filter((x) => x.waiting).length}</strong> rows skipped{plan.steps.some((x) => x.waiting) ? <> · <strong>{plan.steps.filter((x) => x.waiting).length}</strong> waiting on you</> : null}
            </p>
            <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--line)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr><th style={th}>Row</th><th style={th}>Name</th><th style={th}>Result</th></tr></thead>
                <tbody>{plan.steps.map((s) => (
                  <tr key={s.row} style={{ opacity: s.kind === 'skip' ? 0.7 : 1 }}>
                    <td style={td}>{s.row}</td><td style={td}>{s.name || '—'}</td>
                    <td style={{ ...td, color: s.kind === 'skip' ? 'var(--warn)' : undefined }}>
                      {s.waiting ? 'waiting: choose a section for this instrument above' : <>{s.kind === 'name' ? `names ${s.label}` : s.kind === 'new' ? `new dot ${s.label}` : 'skipped'}{s.note ? `: ${s.note}` : ''}</>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose}>Cancel</button>
          {undecided > 0 && <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--warn)' }}>Choose a section (or leave off) for {undecided === 1 ? 'the instrument' : `${undecided} instruments`} above first.</span>}
          <button className="primary" disabled={undecided > 0 || (!count('name') && !count('new'))} onClick={() => { setShow((s) => applyRoster(s, plan)); onClose(); }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

const th = { textAlign: 'left' as const, padding: '2px 6px', borderBottom: '1px solid var(--line)', position: 'sticky' as const, top: 0, background: 'var(--bg)' };
const td = { padding: '2px 6px', borderBottom: '1px solid var(--line)' };
