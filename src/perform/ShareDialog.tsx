import { useEffect, useState } from 'react';
import { encodeShow, SHARE_PREFIX } from '../engine/share';
import type { Show } from '../engine/show';

/** Make a link that opens this show in the performer view. The show travels inside the link. */
export function ShareDialog({ show, onClose }: { show: Show; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { encodeShow(show).then((code) => setUrl(location.origin + location.pathname + SHARE_PREFIX + code)); }, [show]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  const kb = Math.ceil(url.length / 1024);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setNote('Link copied.'); } catch { setNote('Copy failed: select the link and copy it.'); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Share with performers" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: '#1d2a1f', border: '1px solid #33443a', padding: 20, width: 460, maxWidth: 'calc(100vw - 32px)', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Share with performers</h2>
        <p style={{ margin: '0 0 10px' }}>
          Send this link to performers and staff (text, email, a team app). It opens <strong>{show.title}</strong> on their phone, where they pick who they are.
          The whole show is inside the link, so no account or server is involved, and it works offline once opened.
        </p>
        <textarea aria-label="Share link" readOnly value={url || 'Making the link…'} rows={3} onFocus={(e) => e.currentTarget.select()}
          style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 12 }} />
        <p style={{ margin: '6px 0 10px', fontSize: 12, opacity: 0.75 }}>
          {url && `${kb} KB link. `}Anyone with the link can view the show. Edits you make later aren't sent automatically: share a new link.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {note && <span role="status" style={{ marginRight: 'auto', alignSelf: 'center' }}>{note}</span>}
          <a href={url || undefined} target="_blank" rel="noopener" style={{ color: '#9cf', alignSelf: 'center' }}>Preview performer view</a>
          {'share' in navigator && <button disabled={!url} onClick={() => navigator.share({ title: show.title, url }).catch(() => {})}>Share…</button>}
          <button disabled={!url} onClick={copy}>Copy link</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
