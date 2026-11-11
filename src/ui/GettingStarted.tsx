// The getting-started checklist card (see gettingStarted.ts for the steps). On a blank field it's the "Start your show"
// card in the middle of the field, with step 1's ways to begin as buttons; once performers are on the field it moves to
// the bottom-right corner, out of the way of the drill.
import { useState, type ReactNode } from 'react';
import type { Step } from './gettingStarted';

export function GettingStarted({ steps, onHide, start }: { steps: Step[]; onHide: () => void; start?: ReactNode }) {
  const [small, setSmall] = useState(false);
  const n = steps.filter((s) => s.done).length, next = steps.findIndex((s) => !s.done);
  const center = !!start && next === 0; // a blank field: the card is where you start
  return (
    <section className={center ? 'getting-started center' : 'getting-started'} aria-label={center ? 'Start your show' : 'Getting started'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <strong style={{ flex: 1, fontSize: center ? 16 : undefined }}>{center ? 'Start your show' : `Getting started: ${n} of ${steps.length}`}</strong>
        {!center && <button onClick={() => setSmall(!small)} aria-expanded={!small} title={small ? 'Show the steps' : 'Fold the list down to this line'}>{small ? 'Show' : 'Fold'}</button>}
        <button onClick={onHide} title="Close the checklist for this show (Help, then Getting started checklist, brings it back)">Close</button>
      </div>
      {!small && (next < 0
        ? <p style={{ margin: '6px 0 0' }}>All six done: you've written a move and sent it to your band. The guide (Help, then How-to guide) has the rest. <strong>Close</strong> puts this list away.</p>
        : <ol>
          {steps.map((s, k) => (
            <li key={s.id} aria-current={k === next ? 'step' : undefined} className={s.done ? 'done' : undefined}>
              <span aria-hidden className="gs-mark">{s.done ? '✓' : k + 1}</span>
              <span style={{ flex: 1 }}>
                {s.title}{s.done && <span className="sr-only"> (done)</span>}
                {k === next && (center ? <span className="gs-hint gs-start">{start}</span> : <span className="gs-hint">{s.hint}</span>)}
              </span>
            </li>
          ))}
        </ol>)}
    </section>
  );
}
