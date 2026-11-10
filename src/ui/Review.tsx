import { STEP_LIMIT } from '../engine/coords';
import { issueKey, type Issue, type IssueKind } from '../engine/review';
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
export function ReviewPanel({ show, setShow, issues, all, dismissed, onGo, onClose }: {
  show: Show; setShow: (f: (s: Show) => Show) => void; issues: Issue[]; all: Issue[]; dismissed: number; onGo: (x: Issue) => void; onClose: () => void;
}) {
  // Dismissed warnings are saved with the show. Keys for problems that are gone are dropped here, so the list doesn't grow.
  const dismiss = (x: Issue) => setShow((s) => {
    const live = new Set(all.map((y) => issueKey(s, y)));
    return { ...s, dismissed: [...(s.dismissed ?? []).filter((k) => live.has(k)), issueKey(s, x)] };
  });
  const restore = () => setShow(({ dismissed: _, ...s }) => s);
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
        <span style={{ flex: 1 }}>Step size limit: warn above a</span>
        <NumberField aria-label="Step size limit, as N-to-5" min={MIN_STEP_LIMIT} max={MAX_STEP_LIMIT} step={0.5} value={show.stepLimit ?? STEP_LIMIT} style={{ width: 52, flex: 'none' }}
          onValue={(n) => setShow(({ stepLimit: _, ...s }) => (n === STEP_LIMIT ? s : { ...s, stepLimit: n }))} />
        <span style={{ whiteSpace: 'nowrap' }}>-to-5</span>
      </label>
      {issues.length ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto' }}>
          {issues.map((x, k) => (
            <li key={k} style={{ display: 'flex', gap: 4, alignItems: 'stretch', margin: '2px 0' }}>
              <button onClick={() => onGo(x)} style={{ display: 'block', flex: 1, textAlign: 'left', padding: '4px 6px', border: 'none', background: 'var(--surface)' }}>
                <span style={{ color: KIND[x.kind][1], fontWeight: 700 }}>{KIND[x.kind][0]}</span> <span style={{ opacity: 0.8 }}>· {where(x)}</span>
                <div>{x.text}</div>
              </button>
              <button onClick={() => dismiss(x)} aria-label={`Dismiss: ${KIND[x.kind][0]}, ${where(x)}, ${x.text}`}
                title="It's fine as written: hide this warning. It comes back if the problem changes." style={{ fontSize: 12, padding: '0 8px' }}>Dismiss</button>
            </li>
          ))}
        </ul>
      ) : <p style={{ margin: 0, padding: 10 }}>{dismissed ? 'Nothing else to check.' : 'Nothing to fix: no steps over the limit, nobody too close, every imported path still fits, every performer has a spot in every set, and every count is written.'}</p>}
      {dismissed > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderTop: '1px solid var(--line)', fontSize: 13 }}>
          <span style={{ flex: 1, opacity: 0.8 }}>{dismissed} dismissed</span>
          <button onClick={restore}>Show them again</button>
        </div>
      )}
    </section>
  );
}
