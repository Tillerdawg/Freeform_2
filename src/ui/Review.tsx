import { useState } from 'react';
import { STEP_LIMIT } from '../engine/coords';
import { dismissIssues, issueKey, restoreIssues, type Issue, type IssueKind } from '../engine/review';
import { MAX_STEP_LIMIT, MIN_STEP_LIMIT, type Show } from '../engine/show';
import { NumberField } from './NumberField';

const KIND: Record<IssueKind, [string, string]> = {
  steps: ['Steps', 'var(--danger)'], close: ['Too close', 'var(--danger)'], straight: ['Straight now', 'var(--warn)'],
  missing: ['No spot', 'var(--warn)'], unwritten: ['Not written', 'var(--text)'],
};

/**
 * Every problem in the show, in show order: click one to go to its count with its performers selected. Floats over the
 * field (so opening it can't resize the field) and isn't a dialog, so keyboard shortcuts keep working while it's open.
 * Warnings that are fine as written can be checked off and dismissed (saved with the show), and brought back the same way.
 */
export function ReviewPanel({ show, setShow, issues, all, dismissed, onGo, onClose }: {
  show: Show; setShow: (f: (s: Show) => Show) => void; issues: Issue[]; all: Issue[]; dismissed: Issue[]; onGo: (x: Issue) => void; onClose: () => void;
}) {
  const [viewDismissed, setViewDismissed] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const showingDismissed = viewDismissed && dismissed.length > 0;
  const list = showingDismissed ? dismissed : issues;
  const keys = list.map((x) => issueKey(show, x));
  const chosen = keys.filter((k) => picked.has(k)); // only what's still listed
  const allChosen = keys.length > 0 && chosen.length === keys.length;
  const view = (d: boolean) => { setViewDismissed(d); setPicked(new Set()); };
  const toggle = (k: string) => setPicked((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const act = () => {
    setShow((s) => (showingDismissed ? restoreIssues(s, chosen) : dismissIssues(s, all, chosen)));
    setPicked(new Set());
    if (showingDismissed && chosen.length === dismissed.length) setViewDismissed(false);
  };
  const where = (x: Issue) => x.kind === 'unwritten' ? `After set ${show.sets[x.set].name}`
    : x.set && x.kind !== 'missing' ? `${show.sets[x.set - 1].name} → ${show.sets[x.set].name}` : `Set ${show.sets[x.set].name}`;
  const tab = (on: boolean) => ({ flex: 1, border: 'none', borderBottom: `2px solid ${on ? 'var(--gold)' : 'transparent'}`, background: 'none', fontWeight: on ? 700 : 400, padding: '6px 4px' });
  return (
    <section aria-label="Review" style={{ position: 'absolute', top: 8, right: 8, width: 360, maxWidth: 'calc(100% - 16px)', maxHeight: 'calc(100% - 16px)', zIndex: 5,
      display: 'flex', flexDirection: 'column', background: 'var(--bg)', border: '1px solid var(--line-strong)', boxShadow: '0 6px 16px rgba(0,0,0,0.45)', fontSize: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
        <strong style={{ flex: 1 }}>Review · {issues.length ? `${issues.length} to check` : 'all clear'}</strong>
        <button onClick={onClose} aria-label="Close Review">Close</button>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ flex: 1 }}>Step size limit: warn above a</span>
        <NumberField aria-label="Step size limit, as N-to-5" min={MIN_STEP_LIMIT} max={MAX_STEP_LIMIT} step={0.5} value={show.stepLimit ?? STEP_LIMIT} style={{ width: 52, flex: 'none' }}
          onValue={(n) => setShow(({ stepLimit: _, ...s }) => (n === STEP_LIMIT ? s : { ...s, stepLimit: n }))} />
        <span style={{ whiteSpace: 'nowrap' }}>-to-5</span>
      </label>
      {dismissed.length > 0 && (
        <div role="group" aria-label="Which warnings" style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          <button aria-pressed={!showingDismissed} onClick={() => view(false)} style={tab(!showingDismissed)}>To check ({issues.length})</button>
          <button aria-pressed={showingDismissed} onClick={() => view(true)} style={tab(showingDismissed)}>Dismissed ({dismissed.length})</button>
        </div>
      )}
      {list.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--line)' }}>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={allChosen} ref={(el) => { if (el) el.indeterminate = chosen.length > 0 && !allChosen; }}
              onChange={() => setPicked(allChosen ? new Set() : new Set(keys))} />
            Select all
          </label>
          <button disabled={!chosen.length} onClick={act}
            title={showingDismissed ? 'Put the checked warnings back on the list to check' : "They're fine as written: hide the checked warnings. Each comes back if its problem changes."}>
            {showingDismissed ? 'Bring back' : 'Dismiss'}{chosen.length ? ` ${allChosen && chosen.length > 1 ? 'all ' : ''}${chosen.length}` : ''}
          </button>
        </div>
      )}
      {list.length ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto' }}>
          {list.map((x, k) => (
            <li key={keys[k]} style={{ display: 'flex', gap: 4, alignItems: 'stretch', margin: '2px 0', background: 'var(--surface)' }}>
              <input type="checkbox" checked={picked.has(keys[k])} onChange={() => toggle(keys[k])} style={{ margin: '8px 2px 8px 8px', flex: 'none' }}
                aria-label={`Select: ${KIND[x.kind][0]}, ${where(x)}, ${x.text}`} />
              <button onClick={() => onGo(x)} style={{ display: 'block', flex: 1, textAlign: 'left', padding: '4px 6px', border: 'none', background: 'none', opacity: showingDismissed ? 0.75 : 1 }}>
                <span style={{ color: KIND[x.kind][1], fontWeight: 700 }}>{KIND[x.kind][0]}</span> <span style={{ opacity: 0.8 }}>· {where(x)}</span>
                <div>{x.text}</div>
              </button>
            </li>
          ))}
        </ul>
      ) : <p style={{ margin: 0, padding: 10 }}>{dismissed.length ? 'Nothing else to check. The ones you dismissed are under Dismissed.' : 'Nothing to fix: no steps over the limit, nobody too close, every imported path still fits, every performer has a spot in every set, and every count is written.'}</p>}
    </section>
  );
}
