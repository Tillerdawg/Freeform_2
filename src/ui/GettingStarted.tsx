// A step-by-step checklist card: Getting started, and Send it to your band (see gettingStarted.ts for the steps). On a
// blank field, Getting started is the "Start your show" card in the middle of the field, with step 1's ways to begin as
// buttons; otherwise a card sits in the bottom-right corner, out of the way of the drill.
import { useState, type ReactNode } from 'react';
import type { Step } from './gettingStartedSteps';

/** A step, with a button or two for the step you're on (Open Review, Copy the message). */
export type CardStep = Step & { action?: ReactNode };

export function GettingStarted({ steps, onHide, start, dock = 'center', logo, title = 'Getting started', doneText }: {
  steps: CardStep[]; onHide: () => void; start?: ReactNode; dock?: 'center' | 'top'; logo?: ReactNode; title?: string; doneText?: ReactNode;
}) {
  const [small, setSmall] = useState(false);
  const n = steps.filter((s) => s.done).length, next = steps.findIndex((s) => !s.done);
  const center = !!start && next === 0; // a blank field: the card is where you start
  return (
    <section className={center ? `getting-started ${dock}` : 'getting-started'} aria-label={center ? 'Start your show' : title}>
      {center && logo}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <strong style={{ flex: 1, fontSize: center ? 16 : undefined }}>{center ? 'Start your show' : `${title}: ${n} of ${steps.length}`}</strong>
        {!center && <button onClick={() => setSmall(!small)} aria-expanded={!small} title={small ? 'Show the steps' : 'Fold the list down to this line'}>{small ? 'Show' : 'Fold'}</button>}
        <button onClick={onHide} title="Close this checklist for this show (Help brings it back)">Close</button>
      </div>
      {!small && (next < 0
        ? <p style={{ margin: '6px 0 0' }}>{doneText}</p>
        : <ol>
          {steps.map((s, k) => (
            <li key={s.id} aria-current={k === next ? 'step' : undefined} className={s.done ? 'done' : undefined}>
              <span aria-hidden className="gs-mark">{s.done ? '✓' : k + 1}</span>
              <span style={{ flex: 1 }}>
                {s.title}{s.done && <span className="sr-only"> (done)</span>}
                {k === next && (center ? <span className="gs-hint gs-start">{start}</span> : <span className="gs-hint">{s.hint}</span>)}
                {k === next && !center && s.action && <span className="gs-action">{s.action}</span>}
              </span>
            </li>
          ))}
        </ol>)}
    </section>
  );
}
