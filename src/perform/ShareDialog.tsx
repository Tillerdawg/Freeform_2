import { useEffect, useState } from 'react';
import { encodeShow, fetchHosted, hostedLink, linkHash, lockShow, newKey, parseHosted, SHARE_PREFIX } from '../engine/share';
import { qrSvg } from '../engine/qr';
import type { Show } from '../engine/show';
import { synced } from '../engine/music';
import { getAudio } from '../ui/audioStore';
import { checkRepo, fileNameFor, publishFile, REPO_RE, type GitHubTarget } from '../engine/github';

// The director's GitHub repository and token for one-click publishing, kept only in this browser.
const GH = 'freeform:github';
const loadGh = (): GitHubTarget | null => { try { const g = JSON.parse(localStorage.getItem(GH) ?? 'null'); return g && typeof g.token === 'string' && REPO_RE.test(g.repo) ? g : null; } catch { return null; } };
const saveGh = (g: GitHubTarget | null) => { try { if (g) localStorage.setItem(GH, JSON.stringify(g)); else localStorage.removeItem(GH); } catch { /* not remembered */ } };

// shortcut: hosted links are remembered per show title in this browser; a renamed show starts fresh. Upgrade if shows get ids.
const LINKS = 'freeform:hosted-links';
const loadLinks = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(LINKS) ?? '{}') ?? {}; } catch { return {}; } };
const saveLink = (title: string, link: string) => { try { localStorage.setItem(LINKS, JSON.stringify({ ...loadLinks(), [title]: link })); } catch { /* not remembered */ } };
// The key of a locked file downloaded but not yet linked: kept from the moment it's made, so closing the dialog to upload
// the file doesn't lose it (a lost key leaves the uploaded file unopenable).
const KEYS = 'freeform:pending-keys';
const loadKeys = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEYS) ?? '{}') ?? {}; } catch { return {}; } };
const saveKey = (title: string, key: string | null) => {
  try { const k = loadKeys(); if (key) k[title] = key; else delete k[title]; localStorage.setItem(KEYS, JSON.stringify(k)); } catch { /* not remembered */ }
};

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
  const [madeKey, setMadeKey] = useState<string | null>(() => loadKeys()[show.title] ?? null);
  const [gh, setGh] = useState(loadGh);
  const [startOpen] = useState(!!field || !!gh); // opened once if this show already has a hosted link; then the user's toggle rules
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
    if (!pasted) { setMadeKey(k); saveKey(show.title, k); }
    const blob = new Blob([await lockShow(show, k, withMusic && audio ? audio : undefined)], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${show.title.replace(/[^\w\- ]+/g, '').trim() || 'show'}.freeform-locked`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  // One click: lock (with this link's key, so the link stays the same), upload to the director's repository, show the link.
  const [busy, setBusy] = useState('');
  const publish = async () => {
    if (!gh) return;
    setBusy('Publishing…');
    try {
      const k = key ?? newKey();
      const fileAt = await publishFile(gh, fileNameFor(show.title), await lockShow(show, k, withMusic && audio ? audio : undefined));
      setField(hostedLink(base, fileAt, k)); saveKey(show.title, null);
      setBusy(`Published ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Phones that already have the show get this version the next time they open it (GitHub can take a few minutes to serve it).`);
    } catch (e) { setBusy(`✗ ${e instanceof Error ? e.message : String(e)}`); }
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
          <p style={{ fontSize: 12, margin: '6px 0' }}>The show is encrypted in this browser before it goes online: without your link, the file is unreadable.</p>
          {audio && <label style={{ display: 'block', fontSize: 12, margin: '0 0 6px' }}><input type="checkbox" checked={withMusic} onChange={(e) => setWithMusic(e.target.checked)} />{' '}
            Include the music ({show.music!.name}, {(audio.size / 1e6).toFixed(1)} MB), so phones play the drill with it</label>}
          {!audio && synced(show.music) && <p style={{ fontSize: 12, margin: '0 0 6px' }}>To include the music, load {show.music!.name} in Music ▾ first.</p>}
          {gh ? <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="primary" disabled={busy === 'Publishing…'} onClick={publish}>{hosted ? 'Publish update' : 'Publish to phones'}</button>
              <span style={{ fontSize: 12, opacity: 0.8 }}>to {gh.repo} · <button style={{ fontSize: 12 }} onClick={() => { saveGh(null); setGh(null); setBusy(''); }}>Disconnect</button></span>
            </div>
            {busy && <p role="status" style={{ fontSize: 12, margin: '6px 0 0' }}>{busy}</p>}
          </> : <ConnectGitHub onConnected={(g) => { saveGh(g); setGh(g); }} />}
          <details style={{ margin: '8px 0 0', fontSize: 12 }}>
          <summary>Or host the file yourself</summary>
          <ol style={{ margin: '6px 0', paddingLeft: 20, fontSize: 12 }}>
            <li><button onClick={download}>Download locked show file</button></li>
            <li>Put it online. On GitHub: in a repository (public is fine: the file is encrypted), <em>Add file → Upload files</em>,
              then open the file and copy its <em>Raw</em> link. Uploading again with the same name updates it at the same address.
              (Gists work for files without music, but fail on big files.)</li>
            <li>Paste that address here.</li>
          </ol>
          <input aria-label="Show file address" placeholder="https://raw.githubusercontent.com/…/main/show.freeform-locked" value={field}
            onChange={(e) => { setField(e.target.value); if (!e.target.value.trim()) { setMadeKey(null); saveKey(show.title, null); } /* cleared = start over with a new key */ }} style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 12 }} />
          {badUrl && <p role="alert" style={{ fontSize: 12 }}>That isn't a web address starting with https://</p>}
          {!badUrl && fileUrl && !key && <p role="alert" style={{ fontSize: 12 }}>
            {pasted ? "That link isn't locked. Download a locked file (step 1), upload it, and paste its address." : 'Download the locked file first (step 1), then upload that file and paste its address.'}</p>}
          </details>
          {hosted && <>
            {hostedQr && <div aria-label="QR code for the hosted link" style={{ background: '#fff', width: 200, margin: '8px auto' }} dangerouslySetInnerHTML={{ __html: hostedQr }} />}
            <p role="status" style={{ fontSize: 12, margin: '4px 0' }}>{check}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => copy(hosted)}>Copy hosted link</button></div>
            <p style={{ fontSize: 12, opacity: 0.75, margin: '6px 0 0' }}>
              The link is the password: anyone who has it can open the show, so share it only with your band. <strong>To update</strong> after
              edits, publish again (or download the locked file again, which reuses this link's key, and replace the file online), and phones
              pick it up. To cut off old links, clear the address box (under "host the file yourself") and publish or download a new file.
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

/** One-time setup for one-click publishing: the director's public repository and a token that can write only to it. */
function ConnectGitHub({ onConnected }: { onConnected: (g: GitHubTarget) => void }) {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');
  const connect = async () => {
    const g = { repo: repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, ''), token: token.trim() };
    setMsg('Checking…');
    try { await checkRepo(g); setMsg(''); onConnected(g); } catch (e) { setMsg(`✗ ${e instanceof Error ? e.message : String(e)}`); }
  };
  return (
    <div style={{ fontSize: 12, border: '1px solid var(--line)', padding: 8 }}>
      <strong>Publish straight from Freeform</strong> (one-time setup with GitHub):
      <ol style={{ margin: '4px 0', paddingLeft: 20 }}>
        <li>Make a <em>public</em> repository for your shows (e.g. freeform-shows), with a README so it isn't empty.</li>
        <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>Make a fine-grained token</a>:
          Repository access → <em>Only select repositories</em> → that repository; under Permissions, add <em>Contents</em> and change its access to <em>Read and write</em>. Generate the token and copy it (GitHub shows it once).</li>
        <li>Type the repository as <em>owner/name</em> in the first box and paste the token in the second. The token stays in this browser and is sent only to GitHub; it can't touch anything else in your account.</li>
      </ol>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input aria-label="GitHub repository" title="Your GitHub name / the repository, e.g. Tillerdawg/freeform-shows" placeholder="owner/freeform-shows" value={repo} onChange={(e) => setRepo(e.target.value)} style={{ flex: 1, minWidth: 140, font: 'inherit' }} />
        <input aria-label="GitHub token" type="password" placeholder="github_pat_…" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" style={{ flex: 1, minWidth: 140, font: 'inherit' }} />
        <button disabled={!repo.trim() || !token.trim()} onClick={connect}>Connect</button>
      </div>
      {msg && <p role="alert" style={{ margin: '4px 0 0' }}>{msg}</p>}
    </div>
  );
}
