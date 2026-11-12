// New show: name it and pick what it's written on before the blank field opens.
import { useState } from 'react';
import type { FieldSpec } from '../engine/coords';
import { FieldSelect, FloorSize } from './FieldPicker';
import { startingField } from './startingField';
import { useDialog } from './useDialog';

export function NewShowDialog({ onStart, onClose }: { onStart: (title: string, field: FieldSpec) => void; onClose: () => void }) {
  const dialog = useDialog(onClose);
  const [title, setTitle] = useState('');
  const [field, setField] = useState<FieldSpec>(startingField); // what the last new show used
  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="New show" style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', display: 'grid', placeItems: 'center', zIndex: 30 }}>
      <form onSubmit={(e) => { e.preventDefault(); onStart(title.trim() || 'Untitled show', field); }}
        style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 420, maxWidth: 'calc(100vw - 32px)', display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>New show</h2>
        <label style={{ display: 'grid', gap: 4 }}>Title
          <input aria-label="New show title" autoFocus value={title} placeholder="Untitled show" onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div style={{ display: 'grid', gap: 4 }}>
          <span>Written on</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <FieldSelect value={field} onChange={setField} />
            <FloorSize value={field} onChange={setField} />
          </span>
          <span style={{ fontSize: 12, opacity: 0.75 }}>A football field by its hashes, a basketball court, or a floor or tarp you size. You can change it later in the sidebar.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Start the show</button>
        </div>
      </form>
    </div>
  );
}
