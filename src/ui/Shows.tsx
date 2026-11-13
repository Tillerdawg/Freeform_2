import { useEffect, useRef, useState } from 'react';
import { normalizeFtl, parseShow, type Show } from '../engine/show';
import { DAILY_DAYS, RECENT, VERSION_EVERY } from '../engine/versions';
import { useDialog } from './useDialog';
import { listShows, listVersions, type Entry, type Listed } from './showStore';
import { VersionPreview } from './VersionPreview';

/** What the dialog asks the editor to do; each returns once it's done, so the list can be read again. */
export interface ShowActions {
  open: (id: string) => Promise<void>;
  openLink: (text: string) => Promise<void>; // a phone link or a recovery code
  fresh: () => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  restore: (version: Show) => Promise<void>;
  flush: () => Promise<unknown>; // the open show into the library now, so the list is current
}

const when = (ms: number) => new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const size = (e: { performers: number; sets: number }) => `${e.performers} performer${e.performers === 1 ? '' : 's'} · ${e.sets} set${e.sets === 1 ? '' : 's'}`;
const rowStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--line)' };

/** The shows kept in this browser (open, start, copy, rename, delete) and the open show's earlier versions. */
export function ShowsDialog({ show, act, onClose, linkFirst = false, versionsFirst = false }: { show: Show; act: ShowActions; onClose: () => void; linkFirst?: boolean; versionsFirst?: boolean }) {
  const [shows, setShows] = useState<Listed[] | null>(null);
  const [versions, setVersions] = useState<Entry[] | null>(null); // the versions view, when open
  const [preview, setPreview] = useState<{ show: Show; at: number } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const returnTo = useRef<number | null>(null);
  const [error, setError] = useState('');
  const [link, setLink] = useState<string | null>(linkFirst ? '' : null); // Open from a link or recovery code: the box's text, while it's open
  const list = () => listShows().then(setShows, () => { setShows([]); setError("This browser wouldn't read its saved shows (its storage may be turned off)."); });
  // The open show goes into the library first, so the list is current. Only here: right after an action the editor may not have caught up.
  useEffect(() => { act.flush().then(list); }, [show.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const backToVersions = () => {
    returnTo.current = preview?.at ?? null;
    setPreview(null);
    setError('');
  };
  const dialog = useDialog(() => {
    if (restoring) return;
    if (preview) backToVersions();
    else onClose();
  });
  useEffect(() => {
    if (!preview && returnTo.current !== null) {
      dialog.current?.querySelector<HTMLButtonElement>(`button[data-version="${returnTo.current}"]`)?.focus();
      returnTo.current = null;
    }
  }, [dialog, preview]);
  const doing = (f: () => Promise<void>) => () => { setError(''); f().then(list, (e) => setError(e instanceof Error ? e.message : String(e))); };
  const showVersions = () => {
    setError('');
    return act.flush().then(() => listVersions(show.id!)).then(setVersions, () => {
      setVersions([]);
      setError("This browser couldn't read the show's earlier versions.");
    });
  };
  useEffect(() => { if (versionsFirst) showVersions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- Get a show back, then See earlier versions
  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={preview ? 'Preview earlier version' : versions ? 'Earlier versions' : 'Shows in this browser'} style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', display: 'grid', placeItems: 'center', zIndex: 30 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: preview ? 820 : 640, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100dvh - 32px)', boxSizing: preview ? 'border-box' : undefined, overflow: 'auto' }}>
        {preview ? <>
          <VersionPreview show={preview.show} when={when(preview.at)} busy={restoring} onBack={backToVersions} onRestore={() => {
            setError('');
            setRestoring(true);
            act.restore(preview.show).then(onClose, (e) => {
              setError(e instanceof Error ? e.message : String(e));
              setRestoring(false);
            });
          }} />
          {error && <p role="alert" style={{ color: 'var(--danger)', margin: '6px 0' }}>{error}</p>}
        </> : !versions ? <>
          <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Shows in this browser</h2>
          <p style={{ margin: '0 0 8px', fontSize: 13 }}>Every show you start or import is kept here and saved as you work. They live only in this browser: use <strong>Save</strong> to keep a copy in a file.</p>
          {error && <p role="alert" style={{ color: 'var(--danger)', margin: '6px 0' }}>{error}</p>}
          {shows === null ? <p>Reading…</p> : shows.map((x) => {
            const open = x.id === show.id;
            return (
              <div key={x.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: open ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.title || 'Untitled show'}{open && ' (open)'}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{size(x)} · changed {when(x.at)}</div>
                </div>
                <button disabled={open} onClick={doing(() => act.open(x.id))}>Open</button>
                <button onClick={doing(async () => { const t = prompt('New name for the show', x.title); if (t?.trim()) await act.rename(x.id, t.trim()); })}>Rename…</button>
                <button onClick={doing(() => act.duplicate(x.id))} title="Make a copy of this show (with its recording and picture) to try something new">Duplicate</button>
                <button className="danger" onClick={doing(async () => {
                  if (confirm(`Delete "${x.title || 'Untitled show'}" from this browser? Its earlier versions, recording, and tracing picture go too, and this can't be undone. Save it to a file first if you might want it again.`)) await act.remove(x.id);
                })}>Delete</button>
              </div>
            );
          })}
          {link !== null && (
            <div style={{ ...rowStyle, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontSize: 13, width: '100%' }}>
                Paste a link students open (a share link or a <strong>Keep phones up to date</strong> link), or a recovery code from another device.
                The show opens here as a show of its own. With a recovery code, this browser can keep updating the same link.
              </p>
              <input aria-label="Link or recovery code" autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://freeformdrill.org/app/#load=… or FREEFORM-PUBLISHING-1.…" style={{ flex: 1, minWidth: 200 }} />
              <button className="primary" disabled={!link.trim()} onClick={() => { setError(''); act.openLink(link).catch((e) => setError(e instanceof Error ? e.message : String(e))); }}>Open</button>
              <button onClick={() => setLink(null)}>Cancel</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={doing(act.fresh)}>New show</button>
            <button onClick={() => setLink('')} title="Open a show from a link students use, or from a recovery code (a new computer)">Open from a link or recovery code…</button>
            <button onClick={showVersions} title="Earlier copies of the open show, kept as you work">Versions of "{show.title || 'Untitled show'}"…</button>
            <span style={{ flex: 1 }} />
            <button className="primary" onClick={onClose}>Close</button>
          </div>
        </> : <>
          <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Earlier versions of "{show.title || 'Untitled show'}"</h2>
          <p style={{ margin: '0 0 8px', fontSize: 13 }}>
            While you work, FreeFORM keeps a copy of the show at most every {VERSION_EVERY / 60_000} minutes: the last {RECENT}, plus the last one of each day
            for {DAILY_DAYS} days. Choose <strong>Preview</strong> to look through its sets. If you restore it, you can use <strong>Undo</strong> or find the copy kept here before the restore.
          </p>
          {versions.length === 0 && <p style={{ opacity: 0.75 }}>No earlier versions yet. The first one is kept once you've worked on the show for a while.</p>}
          {versions.map((v) => (
            <div key={v.at} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>{when(v.at)}</div>
                <div style={{ fontSize: 12, opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title || 'Untitled show'} · {size(v)}</div>
              </div>
              <button data-version={v.at} aria-label={`Preview version saved ${when(v.at)}`} onClick={() => {
                setError('');
                try { setPreview({ show: normalizeFtl(parseShow(v.json)), at: v.at }); }
                catch { setError("This earlier version couldn't be read. Try another version."); }
              }}>Preview</button>
            </div>
          ))}
          {error && <p role="alert" style={{ color: 'var(--danger)', margin: '6px 0' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => setVersions(null)}>Back to shows</button>
            <span style={{ flex: 1 }} />
            <button className="primary" onClick={onClose}>Close</button>
          </div>
        </>}
      </div>
    </div>
  );
}
