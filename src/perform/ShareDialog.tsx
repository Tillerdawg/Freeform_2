import { useEffect, useState } from 'react';
import { encodeShow, fetchHosted, hostedLink, linkHash, lockShow, newKey, parseHosted, SHARE_PREFIX } from '../engine/share';
import { qrSvg } from '../engine/qr';
import type { Show } from '../engine/show';
import { synced } from '../engine/music';
import { getAudio } from '../ui/audioStore';

// shortcut: hosted links are remembered per show title in this browser; a renamed show starts fresh. Upgrade if shows get ids.
const LINKS = 'freeform:hosted-links';
const loadLinks = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(LINKS) ?? '{}') ?? {}; } catch { return {}; } };
const saveLink = (title: string, link: string) => { try { localStorage.setItem(LINKS, JSON.stringify({ ...loadLinks(), [title]: link })); } catch { /* not remembered */ } };

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
  // Hosted link. The field takes a file address, or an existing hosted link (whose key then locks the updated file).
  const [field, setField] = useState(() => loadLinks()[show.title] ?? '');
  const [madeKey, setMadeKey] = useState<string | null>(null);
  const [startOpen] = useState(!!field); // opened once if this show already has a hosted link; then the user's toggle rules
  const pasted = (() => { const h = linkHash(field); return h ? parseHosted(h) : null; })();
  const fileUrl = pasted ? pasted.url : field.trim();
  const key = pasted ? pasted.key : madeKey;
  const base = location.origin + location.pathname;
  const hosted = (() => { try { return fileUrl && key ? hostedLink(base, fileUrl, key) : ''; } catch { return ''; } })();
  const badUrl = !!fileUrl && (() => { try { return new URL(fileUrl).protocol !== 'https:'; } catch { return true; } })();
  const hostedQr = hosted ? qrSvg(hosted) : null;
  // The recording can ride along in the locked file, so phones play the drill with the music (share links can't carry it).
  const [audio, setAudio] = useState<Blob | null>(null);
  const [withMusic, setWithMusic] = useState(true);
  useEffect(() => { if (synced(show.music)) getAudio(show.music.audioId).then((b) => setAudio(b ?? null)); }, [show.music]);
  const [check, setCheck] = useState('');
  useEffect(() => {
    setCheck('');
    if (!hosted) return;
    saveLink(show.title, hosted);
    const t = setTimeout(() => {
      setCheck('Checking the link…');
      fetchHosted(hosted.slice(hosted.indexOf('#')))
        .then((r) => setCheck(`✓ Checked: this link opens “${r.show.title}”${r.audio ? ' with its music' : ''}.`))
        .catch((e: Error) => setCheck(`✗ ${e.message}`));
    }, 600);
    return () => clearTimeout(t);
  }, [hosted, show.title]);
  const download = async () => {
    const k = key ?? newKey();
    if (!pasted) setMadeKey(k);
    const blob = new Blob([await lockShow(show, k, withMusic && audio ? audio : undefined)], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${show.title.replace(/[^\w\- ]+/g, '').trim() || 'show'}.freeform-locked`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setNote('Link copied.'); } catch { setNote('Copy failed: select the link and copy it.'); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Share with performers" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 460, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', fontSize: 14 }}>
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
        <details style={{ margin: '0 0 10px' }} open={startOpen}>
          <summary>Hosted link (short, scannable, locked, updates itself)</summary>
          <ol style={{ margin: '6px 0', paddingLeft: 20, fontSize: 12 }}>
            <li><button onClick={download}>Download locked show file</button> It's encrypted: without your link, the file is unreadable.
              {audio && <label style={{ display: 'block', marginTop: 4 }}><input type="checkbox" checked={withMusic} onChange={(e) => setWithMusic(e.target.checked)} />{' '}
                Include the music ({show.music!.name}, {(audio.size / 1e6).toFixed(1)} MB), so phones play the drill with it</label>}
              {!audio && synced(show.music) && <span style={{ display: 'block', marginTop: 4 }}>To include the music, load {show.music!.name} in Music ▾ first.</span>}</li>
            <li>Put it online. For testing: drag the file onto a new <em>secret</em> gist at gist.github.com, then copy the
              gist's <em>Raw</em> link and remove the long code after <code>/raw/</code> so it always serves the newest version.</li>
            <li>Paste that address here.</li>
          </ol>
          <input aria-label="Show file address" placeholder="https://gist.githubusercontent.com/…/raw/show.freeform-locked" value={field}
            onChange={(e) => { setField(e.target.value); if (!e.target.value.trim()) setMadeKey(null); /* cleared = start over with a new key */ }} style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 12 }} />
          {badUrl && <p role="alert" style={{ fontSize: 12 }}>That isn't a web address starting with https://</p>}
          {!badUrl && fileUrl && !key && <p role="alert" style={{ fontSize: 12 }}>
            {pasted ? "That link isn't locked. Download a locked file (step 1), upload it, and paste its address." : 'Download the locked file first (step 1), then upload that file and paste its address.'}</p>}
          {hosted && <>
            {hostedQr && <div aria-label="QR code for the hosted link" style={{ background: '#fff', width: 200, margin: '8px auto' }} dangerouslySetInnerHTML={{ __html: hostedQr }} />}
            <p role="status" style={{ fontSize: 12, margin: '4px 0' }}>{check}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => copy(hosted)}>Copy hosted link</button></div>
            <p style={{ fontSize: 12, opacity: 0.75, margin: '6px 0 0' }}>
              The link is the password: anyone who has it can open the show, so share it only with your band. <strong>To update</strong> after
              edits, download the locked file again (it reuses this link's key), replace the gist's contents, and phones pick it up. To cut off
              old links, clear this box and start over with a new file.
            </p>
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
