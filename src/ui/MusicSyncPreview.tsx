import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { countsFromMidi, insertHolds, suggestHolds, type Midi } from '../engine/midi';
import { setStarts, totalCounts, type Show } from '../engine/show';
import { useDialog } from './useDialog';

type SyncResult = { sets: Show['sets']; taps: number[] };

export function MusicSyncPreview({ show, map, scoreName, audioName, warning, saving, error, onApply, onCancel }: {
  show: Show;
  map: Midi;
  scoreName: string;
  audioName: string;
  warning?: string;
  saving: boolean;
  error: string;
  onApply: (result: SyncResult) => void;
  onCancel: () => void;
}) {
  const [chosen, setChosen] = useState<string[]>([]);
  const dialog = useDialog(() => { if (!saving) onCancel(); });
  const holds = useMemo(() => suggestHolds(show, map), [show, map]);
  const selected = holds.filter((hold) => chosen.includes(hold.beforeId));
  const sets = insertHolds(show.sets, selected);
  const sync = countsFromMidi(map, sets);
  const addedCounts = selected.reduce((sum, hold) => sum + hold.set.counts, 0);
  const skipped = new Set(holds.filter((hold) => !chosen.includes(hold.beforeId)).map((hold) => hold.beforeId));
  const added = new Set(selected.map((hold) => hold.set.id));
  const lastCount = totalCounts(show);
  const movementCounts = show.movements?.reduce((sum, movement) => sum + movement.counts, 0) ?? 0;
  const starts = setStarts({ ...show, sets });
  const rows = sets.slice(1).map((set, i) => ({ set, issue: sync.issues[i + 1], count: starts[i + 1] }));
  const flagged = rows.filter(({ set, issue }) => issue || skipped.has(set.id)).length;

  return createPortal(
    <div ref={dialog} role="dialog" aria-modal="true" aria-label="Preview music sync" tabIndex={-1}
      style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'var(--backdrop)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(660px, 100%)', maxHeight: 'calc(100dvh - 32px)', padding: 16, boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 10, boxShadow: 'var(--lift)', overflowWrap: 'anywhere' }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Preview music sync</h2>
        <div style={{ overflowY: 'auto', fontSize: 13 }}>
          <p style={{ marginTop: 0 }}><strong>{scoreName}</strong> with {audioName}</p>
          <p>FreeFORM keeps your movement lengths, set numbers, counts, and measure labels. Choose any holds you want to add, then review where the counts land.</p>
          {[warning, ...(map.warnings ?? []), ...sync.scoreNotes].filter(Boolean).map((message) => <p key={message} style={{ color: 'var(--warn)' }}>{message}</p>)}
          {!!holds.length && <fieldset style={{ border: '1px solid var(--line-strong)', margin: 0 }}>
            <legend>Suggested holds</legend>
            {holds.map(({ beforeId, beforeName, set }) => <label key={beforeId} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
              <input type="checkbox" disabled={saving} checked={chosen.includes(beforeId)}
                onChange={(e) => setChosen(e.target.checked ? [...chosen, beforeId] : chosen.filter((id) => id !== beforeId))} />
              Add hold {set.name} before set {beforeName} · m. {set.measures} · {set.counts} counts
            </label>)}
            <p role="status" style={{ margin: '4px 0' }}>{addedCounts
              ? `${addedCounts} hold counts added to the preview. The last set moves from count ${lastCount} to ${lastCount + addedCounts}.`
              : 'No holds selected.'}</p>
            {addedCounts > 0 && !!show.movements?.length && <p style={{ marginBottom: 0 }}>Holds move later sets down the timeline. Check where they fall against your movement boundaries.</p>}
            {addedCounts > 0 && movementCounts > 0 && lastCount + addedCounts > movementCounts
              && <p style={{ color: 'var(--warn)' }}>The last set would go past the movement totals.</p>}
          </fieldset>}
          <h3 style={{ fontSize: 14, marginBottom: 4 }}>Set timing</h3>
          <p role="status" style={{ marginTop: 0 }}>{!rows.length ? 'Add sets to match them to the score.' : flagged
            ? `${flagged} ${flagged === 1 ? 'set to check' : 'sets to check'}. You can cancel to edit the drill first.`
            : 'All sets match.'}</p>
          {!!rows.length && <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {rows.map(({ set, issue, count }) => <li key={set.id} style={{ borderTop: '1px solid var(--line)', padding: '7px 0' }}>
              <strong>{added.has(set.id) ? 'Hold' : 'Set'} {set.name}</strong> · {set.counts} counts · {set.measures?.trim() ? `m. ${set.measures}` : 'No measures'} · arrives at count {count}
              <div style={{ color: issue || skipped.has(set.id) ? 'var(--warn)' : undefined }}>
                {issue ?? (skipped.has(set.id) ? 'Measure range matched.' : 'Matched')}
                {skipped.has(set.id) && ' The gap before this set has no hold.'}
              </div>
            </li>)}
          </ul>}
        </div>
        {error && <p role="alert" style={{ margin: 0, color: 'var(--warn)' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="primary" disabled={saving} onClick={() => onApply({ sets, taps: sync.taps })}>{saving ? 'Applying…' : 'Apply music sync'}</button>
        </div>
      </div>
    </div>, document.body,
  );
}
