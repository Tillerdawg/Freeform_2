import { useEffect, useState } from 'react';
import { encodeShow, hostedLink, SHARE_PREFIX } from '../engine/share';
import { qrSvg } from '../engine/qr';
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
  const qr = url ? qrSvg(url) : null;
  const [fileUrl, setFileUrl] = useState('');
  const base = location.origin + location.pathname;
  const hosted = (() => { try { return fileUrl.trim() ? hostedLink(base, fileUrl) : ''; } catch { return ''; } })();
  const hostedQr = hosted ? qrSvg(hosted) : null;
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setNote('Link copied.'); } catch { setNote('Copy failed: select the link and copy it.'); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Share with performers" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: '#1d2a1f', border: '1px solid #33443a', padding: 20, width: 460, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Share with performers</h2>
        <p style={{ margin: '0 0 10px' }}>
          Send this link to performers and staff (text, email, a team app). It opens <strong>{show.title}</strong> on their phone, where they pick who they are.
          The whole show is inside the link, so no account or server is involved, and it works offline once opened.
        </p>
        <textarea aria-label="Share link" readOnly value={url || 'Making the link…'} rows={3} onFocus={(e) => e.currentTarget.select()}
          style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 12 }} />
        <p style={{ margin: '6px 0 10px', fontSize: 12, opacity: 0.75 }}>
          {url && `${kb} KB link. `}Anyone with the link can view the show. Edits you make later aren't sent automatically: share a new link.
          {url && !qr && ' Too big for a QR code: use a hosted link below.'}
        </p>
        {qr && <div aria-label="QR code for the share link" style={{ background: '#fff', width: 200, margin: '0 auto 10px' }} dangerouslySetInnerHTML={{ __html: qr }} />}
        <details style={{ margin: '0 0 10px' }}>
          <summary>Hosted link (short, scannable, updates itself)</summary>
          <p style={{ margin: '6px 0', fontSize: 12 }}>
            Put the exported show file online and paste its address here. Phones download it when the link is opened and pick up your changes
            whenever they're online. For testing: Export, paste the file into a <em>secret</em> gist at gist.github.com, then copy the <em>Raw</em> link
            and remove the long code after <code>/raw/</code> so it always serves the latest version.
          </p>
          <input aria-label="Show file address" placeholder="https://gist.githubusercontent.com/…/raw/show.json" value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 12 }} />
          {fileUrl.trim() && !hosted && <p role="alert" style={{ fontSize: 12 }}>That isn't a web address starting with https://</p>}
          {hosted && <>
            {hostedQr && <div aria-label="QR code for the hosted link" style={{ background: '#fff', width: 200, margin: '8px auto' }} dangerouslySetInnerHTML={{ __html: hostedQr }} />}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => copy(hosted)}>Copy hosted link</button></div>
          </>}
        </details>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {note && <span role="status" style={{ marginRight: 'auto', alignSelf: 'center' }}>{note}</span>}
          <button disabled={!url} onClick={() => { location.hash = url.slice(url.indexOf('#')); }}
            title="Switch this app to the performer view of this show (← Editor comes back)">Open performer view here</button>
          {'share' in navigator && <button disabled={!url} onClick={() => navigator.share({ title: show.title, url }).catch(() => {})}>Share…</button>}
          <button disabled={!url} onClick={() => copy(url)}>Copy link</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
