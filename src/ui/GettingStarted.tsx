// The getting-started checklist card, in the field's bottom-right corner (see gettingStarted.ts for the steps).
import { useState } from 'react';
import type { Step } from './gettingStarted';

export function GettingStarted({ steps, onHide }: { steps: Step[]; onHide: () => void }) {
  const [small, setSmall] = useState(false);
  const n = steps.filter((s) => s.done).length, next = steps.findIndex((s) => !s.done);
  return (
    <section className="getting-started" aria-label="Getting started">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <strong style={{ flex: 1 }}>Getting started: {n} of {steps.length}</strong>
        <button onClick={() => setSmall(!small)} aria-expanded={!small} title={small ? 'Show the steps' : 'Fold the list down to this line'}>{small ? 'Show' : 'Fold'}</button>
        <button onClick={onHide} title="Hide this list for good (it won't come back on new shows)">Hide</button>
      </div>
      {!small && (next < 0
        ? <p style={{ margin: '6px 0 0' }}>All six done: you've written a move and sent it to your band. The guide (Help, then How-to guide) has the rest. <strong>Hide</strong> puts this list away.</p>
        : <ol>
          {steps.map((s, k) => (
            <li key={s.id} aria-current={k === next ? 'step' : undefined} className={s.done ? 'done' : undefined}>
              <span aria-hidden className="gs-mark">{s.done ? '✓' : k + 1}</span>
              <span>
                {s.title}{s.done && <span className="sr-only"> (done)</span>}
                {k === next && <span className="gs-hint">{s.hint}</span>}
              </span>
            </li>
          ))}
        </ol>)}
    </section>
  );
}
