import { useEffect, useRef, useState } from 'react';
import { colorOf, fieldOf, mark, type Show } from '../engine/show';
import { drawField, drawMarks, drawPerformers, drawProps, fitView } from '../field/drawField';

export function VersionPreview({ show, when, busy, onBack, onRestore }: {
  show: Show;
  when: string;
  busy: boolean;
  onBack: () => void;
  onRestore: () => void;
}) {
  const [index, setIndex] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const set = show.sets[index];
  const name = `Set ${set.name}`;
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const field = fieldOf(show);
    const dots = show.performers.flatMap((p) => {
      const at = set.pos[p.id];
      return at ? [{ id: p.id, ...mark(show, p), at, pin: set.labels?.[p.id], color: colorOf(show, p) }] : [];
    });
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = c;
      if (!clientWidth || !clientHeight) return;
      c.width = Math.round(clientWidth * dpr);
      c.height = Math.round(clientHeight * dpr);
      const view = fitView(c.width, c.height, field);
      drawField(ctx, view, field);
      drawProps(ctx, view, show.props ?? [], set.props ?? {}, null, 'screen', 12 * dpr);
      drawMarks(ctx, view, set.marks ?? []);
      drawPerformers(ctx, view, dots, new Set(), [], undefined, dpr);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(c);
    return () => observer.disconnect();
  }, [show, set]);

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Preview earlier version</h2>
      <p style={{ margin: '0 0 12px', fontSize: 13, overflowWrap: 'anywhere' }}><strong>{show.title || 'Untitled show'}</strong> · Saved {when}</p>
      <canvas ref={canvas} role="img" aria-label={`Field preview of ${name}`}
        style={{ width: '100%', height: 'clamp(150px, 44dvh, 390px)', display: 'block', border: '1px solid var(--line)', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <button disabled={busy || index === 0} onClick={() => setIndex(index - 1)}>Previous set</button>
        <label>Set{' '}
          <select aria-label="Preview set" autoFocus disabled={busy} value={index} onChange={(e) => setIndex(Number(e.target.value))}>
            {show.sets.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
          </select>
        </label>
        <button disabled={busy || index === show.sets.length - 1} onClick={() => setIndex(index + 1)}>Next set</button>
        <span role="status" style={{ fontSize: 13 }}>{index + 1} of {show.sets.length}{index > 0 && ` · ${set.counts} counts`}{set.measures && ` · m. ${set.measures}`}</span>
      </div>
      {set.note && <p style={{ fontSize: 13, margin: '8px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{set.note}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button disabled={busy} onClick={onBack}>Back to versions</button>
        <button className="primary" disabled={busy} onClick={onRestore}>{busy ? 'Restoring…' : 'Restore this version'}</button>
      </div>
    </>
  );
}
