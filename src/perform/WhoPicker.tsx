// "Who are you?" on the phone: a big button showing the choice, opening a sheet with a search box (type a name or a
// dot like P4) over the band listed by section. iOS's own <select> wheel can't be typed into, and a band is long.
import { useState } from 'react';
import { label, type Performer, type Show } from '../engine/show';
import { byLastName, lastFirst, matchesSearch } from '../engine/roster';
import { useDialog } from '../ui/useDialog';
import { tr } from '../i18n';
import { LanguageButton } from './Perform';


export function WhoPicker({ show, value, staff, onPick }: { show: Show; value: string | null; staff: string; onPick: (v: string) => void }) {
  const STAFF_NAME = tr('Staff (whole band)');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const shown = (p: Performer) => (p.name ? `${lastFirst(p.name)} · ${label(show, p)}` : label(show, p));
  const mine = show.performers.find((p) => p.id === value);
  const current = value === staff ? STAFF_NAME : mine ? shown(mine) : tr('Who are you?');

  // Named dots by last name, then unnamed ones by number; sections in the show's order.
  const groups = show.sections.map((sec) => ({
    sec,
    ps: show.performers.filter((p) => p.section === sec.id && matchesSearch(q, p.name ?? '', label(show, p), sec.name))
      .sort((a, b) => (a.name ? (b.name ? byLastName(a.name, b.name) : -1) : b.name ? 1 : a.number - b.number)),
  })).filter((g) => g.ps.length);
  const staffShown = matchesSearch(q, STAFF_NAME, 'director staff');
  const first = groups[0]?.ps[0]?.id ?? (staffShown ? staff : undefined); // Return picks the first match
  const close = () => { setOpen(false); setQ(''); };
  const pick = (v: string) => { onPick(v); close(); };
  const dialog = useDialog(close, open);

  return (
    <>
      <button className="who-button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="who-current">{current}</span><span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div ref={dialog} tabIndex={-1} className="who-sheet" role="dialog" aria-modal="true" aria-label={tr('Who are you?')}>
          <div className="who-head"><strong>{tr('Who are you?')}</strong><button onClick={close}>{tr('Cancel')}</button></div>
          <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} aria-label={tr('Search by name or dot')}
            placeholder={tr('Type your name or dot (P4)')} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go"
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim() && first) pick(first); }} />
          <div className="who-list">
            {staffShown && <button aria-pressed={value === staff} onClick={() => pick(staff)}>{STAFF_NAME}</button>}
            {groups.map(({ sec, ps }) => (
              <section key={sec.id} aria-label={sec.name}>
                <h3>{sec.name}</h3>
                {ps.map((p) => <button key={p.id} aria-pressed={value === p.id} onClick={() => pick(p.id)}>{shown(p)}</button>)}
              </section>
            ))}
            {!staffShown && !groups.length && <p>{tr('No one matches “{q}”. Try your last name or your dot (like P4).', { q: q.trim() })}</p>}
            <p><LanguageButton /></p>
          </div>
        </div>
      )}
    </>
  );
}
