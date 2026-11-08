import { STEP_LIMIT } from '../engine/coords';
import type { Issue, IssueKind } from '../engine/review';
import { MAX_STEP_LIMIT, MIN_STEP_LIMIT, type Show } from '../engine/show';
import { NumberField } from './NumberField';

const KIND: Record<IssueKind, [string, string]> = {
  steps: ['Steps', 'var(--danger)'], close: ['Too close', 'var(--danger)'], straight: ['Straight now', 'var(--warn)'],
  missing: ['No spot', 'var(--warn)'], unwritten: ['Not written', 'var(--text)'],
};

/**
 * Every problem in the show, in show order: click one to go to its count with its performers selected. Floats over the
 * field (so opening it can't resize the field) and isn't a dialog, so keyboard shortcuts keep working while it's open.
 */
export function ReviewPanel({ show, setShow, issues, onGo, onClose }: {
  show: Show; setShow: (f: (s: Show) => Show) => void; issues: Issue[]; onGo: (x: Issue) => void; onClose: () => void;
}) {
  const where = (x: Issue) => x.kind === 'unwritten' ? `After set ${show.sets[x.set].name}`
    : x.set && x.kind !== 'missing' ? `${show.sets[x.set - 1].name} → ${show.sets[x.set].name}` : `Set ${show.sets[x.set].name}`;
  return (
    <section aria-label="Review" style={{ position: 'absolute', top: 8, right: 8, width: 360, maxWidth: 'calc(100% - 16px)', maxHeight: 'calc(100% - 16px)', zIndex: 5,
      display: 'flex', flexDirection: 'column', background: 'var(--bg)', border: '1px solid var(--line-strong)', boxShadow: '0 6px 16px rgba(0,0,0,0.45)', fontSize: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
        <strong style={{ flex: 1 }}>Review · {issues.length ? `${issues.length} to check` : 'all clear'}</strong>
        <button onClick={onClose} aria-label="Close Review">Close</button>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderBottom: '1px solid var(--line)' }}>
        Step limit: bigger than a
        <NumberField aria-label="Step limit, as N-to-5" min={MIN_STEP_LIMIT} max={MAX_STEP_LIMIT} step={0.5} value={show.stepLimit ?? STEP_LIMIT} style={{ width: 52 }}
          onValue={(n) => setShow(({ stepLimit: _, ...s }) => (n === STEP_LIMIT ? s : { ...s, stepLimit: n }))} />
        -to-5
      </label>
      {issues.length ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto' }}>
          {issues.map((x, k) => (
            <li key={k}>
              <button onClick={() => onGo(x)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '4px 6px', margin: '2px 0', border: 'none', background: 'var(--surface)' }}>
                <span style={{ color: KIND[x.kind][1], fontWeight: 700 }}>{KIND[x.kind][0]}</span> <span style={{ opacity: 0.8 }}>· {where(x)}</span>
                <div>{x.text}</div>
              </button>
            </li>
          ))}
        </ul>
      ) : <p style={{ margin: 0, padding: 10 }}>Nothing to fix: no steps over the limit, nobody too close, every imported path still fits, every performer has a spot in every set, and every count is written.</p>}
    </section>
  );
}
