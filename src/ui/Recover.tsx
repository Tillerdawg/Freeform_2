// Help, then Get a show back: "what happened?", and the button that fixes each case. Everything it points to already
// exists (Undo, earlier versions, the show list, Import, Open from a link); this is the map to them.
import { useDialog } from './useDialog';

export interface RecoverActions {
  canUndo: boolean;
  undo: () => void;
  versions: () => void;
  shows: () => void;
  importFile: () => void;
  fromLink: () => void;
  feedback: () => void;
}

export function RecoverDialog({ title, fileSaved, act, onClose }: { title: string; fileSaved: string | null; act: RecoverActions; onClose: () => void }) {
  const dialog = useDialog(onClose);
  const go = (f: () => void) => () => { onClose(); f(); };
  const name = title || 'Untitled show';
  const cases: [string, string, string, () => void, boolean?][] = [
    ['I just made a mistake', 'Undo takes back the last change, and again for the one before (⌘Z, or Ctrl+Z on Windows).', 'Undo', act.undo, !act.canUndo],
    [`I want an earlier version of "${name}"`, 'FreeFORM keeps a copy as you work: the last 20, at most 10 minutes apart, plus one a day for 60 days. Pick one to see it and bring it back (Undo puts things back if it was the wrong one).', 'See earlier versions', act.versions],
    ['A different show is missing from the screen', 'Every show you start, import, or open is kept in this browser. Shows… lists them all, newest change first.', 'Open Shows…', act.shows],
    ["It's gone from this browser (new computer, cleared history)", `A browser's saved shows stay in that browser only. If you saved a .freeform file or a Full backup, open it here.${fileSaved ? ` You last saved "${name}" to a file ${fileSaved}.` : ''}`, 'Import a file…', act.importFile],
    ['Something happened and I need to recover my show', "If you published it to phones, the link your students use holds the whole show. Paste it (or a recovery code from your other computer), and FreeFORM brings the show back, still publishing to the same link.", 'Open from a link or recovery code…', act.fromLink],
  ];
  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Get a show back" style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 560, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Get a show back</h2>
        <p style={{ margin: '0 0 12px' }}>What happened?</p>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {cases.map(([what, why, button, f, off]) => (
            <li key={button} style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '10px 12px' }}>
              <strong>{what}</strong>
              <p style={{ margin: '4px 0 8px' }}>{why}</p>
              <button onClick={go(f)} disabled={off} title={off ? 'Nothing to undo yet' : undefined}>{button}</button>
            </li>
          ))}
        </ol>
        <p style={{ margin: '12px 0 0' }}>None of these? <button onClick={go(act.feedback)}>Send feedback</button> and say what happened. It comes straight to me.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}><button onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
