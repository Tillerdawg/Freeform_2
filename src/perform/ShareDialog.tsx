import { useEffect, useState } from 'react';
import { encodeShow, fetchHosted, hostedLink, linkHash, lockShow, newKey, parseHosted, SHARE_PREFIX } from '../engine/share';
import { qrSvg } from '../engine/qr';
import type { Show } from '../engine/show';
import { synced } from '../engine/music';
import { getAudio } from '../ui/audioStore';
import { useDialog } from '../ui/useDialog';
import { checkRepo, fileNameFor, publishFile, REPO_RE, type GitHubTarget } from '../engine/github';
import { cloudUrl, publishCloud, publishingCode, readPublishingCode, unpublishCloud, type CloudShow } from '../engine/cloud';
import { getPublishing, loadCloud, loadLinks, saveCloud, saveLink, setPublishing } from '../ui/publishing';

// The director's GitHub repository and token for one-click publishing, kept only in this browser.
const GH = 'freeform:github';
const loadGh = (): GitHubTarget | null => { try { const g = JSON.parse(localStorage.getItem(GH) ?? 'null'); return g && typeof g.token === 'string' && REPO_RE.test(g.repo) ? g : null; } catch { return null; } };
const saveGh = (g: GitHubTarget | null) => { try { if (g) localStorage.setItem(GH, JSON.stringify(g)); else localStorage.removeItem(GH); } catch { /* not remembered */ } };

// The key of a locked file downloaded but not yet linked: kept from the moment it's made, so closing the dialog to upload
// the file doesn't lose it (a lost key leaves the uploaded file unopenable).
const KEYS = 'freeform:pending-keys';
const loadKeys = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEYS) ?? '{}') ?? {}; } catch { return {}; } };
const saveKeyFor = (id: string, key: string | null) => {
  try { const k = loadKeys(); if (key) k[id] = key; else delete k[id]; localStorage.setItem(KEYS, JSON.stringify(k)); } catch { /* not remembered */ }
};

/** Make a link that opens this show in the performer view. The show travels inside the link. */
export function ShareDialog({ show, onClose, setRevision }: { show: Show; onClose: () => void; setRevision: (n: number) => void }) {
  // A file headed for phones gets the next revision number, kept in the show once it's out (charts print it too).
  const next = (): Show => ({ ...show, revision: (show.revision ?? 0) + 1 });
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { encodeShow(show).then((code) => setUrl(location.origin + location.pathname + SHARE_PREFIX + code)); }, [show]);
  const dialog = useDialog(onClose);
  const kb = Math.ceil(url.length / 1024);
  const qr = url ? qrSvg(url) : null;
  // Hosted link. The field takes a file address, or an existing hosted link (whose key then locks the updated file).
  const sid = show.id ?? show.title, saveKey = (k: string | null) => saveKeyFor(sid, k);
  const [field, setField] = useState(() => loadLinks()[sid] ?? loadLinks()[show.title] ?? '');
  const [madeKey, setMadeKey] = useState<string | null>(() => loadKeys()[sid] ?? loadKeys()[show.title] ?? null);
  const [gh, setGh] = useState(loadGh);
  const [cloud, setCloud] = useState<CloudShow | null>(() => loadCloud()[sid] ?? null);
  const [mode, setMode] = useState<'send' | 'live'>(field || gh || cloud ? 'live' : 'send'); // starts on Keep phones up to date once it's in use
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
    saveLink(sid, hosted);
    const t = setTimeout(() => {
      setCheck('Checking the link…');
      fetchHosted(hosted.slice(hosted.indexOf('#')))
        .then((r) => setCheck(`✓ Checked: this link opens “${r.show.title}”${r.audio ? ' with its music' : ''}.`))
        .catch((e: Error) => setCheck(`✗ ${e.message}`));
    }, 600);
    return () => clearTimeout(t);
  }, [hosted, sid]);
  const download = async () => {
    const k = key ?? newKey();
    if (!pasted) { setMadeKey(k); saveKey(k); }
    const s = next();
    const blob = new Blob([await lockShow(s, k, withMusic && audio ? audio : undefined)], { type: 'application/octet-stream' });
    setRevision(s.revision!);
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
      const s = next();
      const fileAt = await publishFile(gh, fileNameFor(show.title), await lockShow(s, k, withMusic && audio ? audio : undefined));
      setField(hostedLink(base, fileAt, k)); saveKey(null); setRevision(s.revision!);
      setBusy(`Published revision ${s.revision}, ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Phones that already have the show get this version the next time they open it (GitHub can take a few minutes to serve it).`);
    } catch (e) { setBusy(`✗ ${e instanceof Error ? e.message : String(e)}`); }
  };
  // One click with FreeFORM's own service: lock (with this link's key), upload, show the link. No account or setup.
  const onService = !!cloud && fileUrl === cloudUrl(cloud.id);
  const publishFF = async () => {
    setBusy('Publishing…');
    try {
      const k = key ?? newKey();
      const s = next();
      const r = await publishCloud(await lockShow(s, k, withMusic && audio ? audio : undefined), cloud);
      const replaced = r.fresh && !!hosted; // a new address: the link they had stops updating
      saveCloud(sid, r); setCloud(r); setField(hostedLink(base, cloudUrl(r.id), k)); saveKey(null); setRevision(s.revision!);
      const at = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setBusy(r.fresh
        ? `Published revision ${s.revision}, ${at}. Send this link to your band.${replaced ? ' It’s a new link: phones with the old one keep their copy but won’t get updates.' : ''}`
        : `Published revision ${s.revision}, ${at}. Phones that already have the show get this version the next time they open it (within a minute or so).`);
    } catch (e) { setBusy(`✗ ${e instanceof Error ? e.message : String(e)}`); }
  };
  // Moving to another device: the publishing code carries the link and the edit token (Full backup carries them too).
  const [code, setCode] = useState('');
  const takeCode = () => {
    const p = readPublishingCode(code);
    if (!p) { setBusy("✗ That isn't a FreeFORM publishing code. Copy the whole code from the other device."); return; }
    if (p.show?.id && p.show.id !== show.id && !confirm(`This code is for "${p.show.title || 'another show'}", and the show open here is "${show.title}". Publishing here would replace that show on phones with this one. Use it anyway?`)) return;
    setPublishing(sid, p); setCloud(p.cloud ?? null); setField(p.link); setMadeKey(null); saveKey(null); setCode('');
    setBusy(p.cloud ? 'Done: this browser can now update that link. Click Publish update after your edits.' : 'Done: this browser has the link. To update it, publish the file where it was hosted before.');
  };
  const stopSharing = async () => {
    if (!cloud || !confirm('Take this show off FreeFORM’s service? The link stops working. Phones that already have the show keep the copy they have, but get no more updates.')) return;
    setBusy('Taking it offline…');
    try {
      await unpublishCloud(cloud);
      saveCloud(sid, null); saveLink(sid, null); setCloud(null); setField(''); setMadeKey(null); saveKey(null);
      setBusy('Taken offline. Publish again for a new link.');
    } catch (e) { setBusy(`✗ ${e instanceof Error ? e.message : String(e)}`); }
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setNote('Link copied.'); } catch { setNote('Copy failed: select the link and copy it.'); }
  };
  const small: React.CSSProperties = { fontSize: 12, margin: '6px 0' };
  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Share with performers" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 460, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Share with performers</h2>
        <p style={{ margin: '0 0 8px' }}>Two ways to get <strong>{show.title}</strong> onto performers' and staff members' phones, where they pick who they are:</p>
        <div role="group" aria-label="How to share" style={{ display: 'flex', gap: 8, margin: '0 0 10px' }}>
          <button aria-pressed={mode === 'send'} onClick={() => setMode('send')} style={{ flex: 1 }}>Send this version</button>
          <button aria-pressed={mode === 'live'} onClick={() => setMode('live')} style={{ flex: 1 }}>Keep phones up to date</button>
        </div>
        {mode === 'send' ? <>
          <p style={{ margin: '0 0 6px' }}>
            A link (and QR code) with this version of the show inside it. Send it by text, email, or a team app. Phones save it, and it works offline.
            No account or server is involved. Edits you make later aren't sent: send a new link.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Included:</strong> the drill, sets, counts, and notes. <strong>Not included:</strong> performers' names (anyone with the link can read it) and the music (a link can't carry audio).
          </p>
          <textarea aria-label="Share link" readOnly value={url || 'Making the link…'} rows={3} onFocus={(e) => e.currentTarget.select()}
            style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 12 }} />
          <p style={{ margin: '6px 0 10px', fontSize: 12, opacity: 0.75 }}>
            {url && `${kb} KB link. `}Anyone with the link can view the show.
            {url && !qr && ' Too big for a QR code: use Keep phones up to date instead.'}
          </p>
          {qr && <div role="img" aria-label="QR code for the share link" style={{ background: '#fff', width: 200, margin: '0 auto 10px' }} dangerouslySetInnerHTML={{ __html: qr }} />}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', margin: '0 0 10px' }}>
            <button disabled={!url} onClick={() => { location.hash = url.slice(url.indexOf('#')); }}
              title="Switch this app to the performer view of this show (← Editor comes back)">Open performer view here</button>
            {'share' in navigator && <button disabled={!url} onClick={() => navigator.share({ title: show.title, url }).catch(() => {})}>Share…</button>}
            <button className="primary" disabled={!url} onClick={() => copy(url)}>Copy link</button>
          </div>
        </> : <>
          <p style={{ margin: '0 0 8px' }}>
            One short link that stays the same. When you publish an update, phones get it the next time they open the show with a connection.
          </p>
          {/* Jason: make sure directors know the file is encrypted and unreadable without their key. */}
          <div role="note" aria-label="Your show is encrypted" style={{ border: '1px solid var(--green-line)', borderRadius: 8, padding: '8px 10px', margin: '0 0 10px' }}>
            <strong>Your show is encrypted before it leaves this computer.</strong>
            <p style={{ margin: '6px 0 0' }}>
              FreeFORM locks the show in this browser with a secret key, and that key is only in your link (the part after the #, which
              browsers never send to any server). The file that goes online is unreadable without it: no one can open your show, not even
              FreeFORM, unless they have your link.
            </p>
            <p style={{ margin: '6px 0 0' }}>
              So the link is the password. Share it only with your band. This browser remembers it, but keep a copy too: without the link,
              no one can recover the key.
            </p>
          </div>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Included:</strong> the drill, sets, counts, notes, and performers' names{synced(show.music) ? ', and the music if you include it below' : ''}.
          </p>
          {audio && <label style={{ display: 'block', fontSize: 12, margin: '0 0 6px' }}><input type="checkbox" checked={withMusic} onChange={(e) => setWithMusic(e.target.checked)} />{' '}
            Include the music ({show.music!.name}, {(audio.size / 1e6).toFixed(1)} MB), so phones play the drill with it</label>}
          {!audio && synced(show.music) && <p style={{ ...small, margin: '0 0 6px' }}>To include the music, load {show.music!.name} in Music ▾ first.</p>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="primary" disabled={busy === 'Publishing…'} onClick={publishFF}>{onService ? 'Publish update' : 'Publish to phones'}</button>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Free, with no account. Shows nobody opens for a year are deleted.</span>
          </div>
          {busy && <p role="status" style={{ fontSize: 12, margin: '6px 0 0' }}>{busy}</p>}
          {hosted && <>
            {hostedQr && <div role="img" aria-label="QR code for the hosted link" style={{ background: '#fff', width: 200, margin: '8px auto' }} dangerouslySetInnerHTML={{ __html: hostedQr }} />}
            <p role="status" style={{ fontSize: 12, margin: '4px 0' }}>{check}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              {onService && <button onClick={stopSharing} title="Take the show off FreeFORM's service: the link stops working">Stop sharing</button>}
              <button onClick={() => copy(hosted)}>Copy link</button>
            </div>
            <p style={{ fontSize: 12, opacity: 0.75, margin: '6px 0 0' }}>
              <strong>To update</strong> after edits, publish again: the link stays the same, and phones pick up the new version. <strong>To cut off a
              link</strong> (say, a student leaves the program), click <strong>Stop sharing</strong>, then publish again for a new link.
            </p>
          </>}
          {onService && cloud && hosted && (
            <details style={{ margin: '10px 0 0' }}>
              <summary>Use on another device</summary>
              <p style={small}>
                Got a new computer or iPad? This code lets it keep updating this same link, so students don't need a new one. Copy it
                (email it to yourself, say), then on the new device open this show from a Full backup or with <strong>Shows… → Open from a link</strong>, and
                paste the code there. <strong>Keep it private:</strong> like the link, it's a password, and it can also change the show.
                A <strong>Full backup</strong> file carries it too.
              </p>
              <textarea aria-label="Publishing code" readOnly rows={3} value={publishingCode(getPublishing(sid, show.title) ?? { link: hosted, cloud })} onFocus={(e) => e.currentTarget.select()}
                style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 11 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => copy(publishingCode(getPublishing(sid, show.title) ?? { link: hosted, cloud }))}>Copy publishing code</button></div>
            </details>
          )}
          {!onService && (
            <details style={{ margin: '10px 0 0' }}>
              <summary>Published this show from another device?</summary>
              <p style={small}>Paste the publishing code from that device (under <strong>Use on another device</strong> there), and this browser can update the same link.</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input aria-label="Paste a publishing code" placeholder="FREEFORM-PUBLISHING-1.…" value={code} onChange={(e) => setCode(e.target.value)} style={{ flex: 1, font: 'inherit', fontSize: 12 }} />
                <button disabled={!code.trim()} onClick={takeCode}>Use code</button>
              </div>
            </details>
          )}
          <details style={{ margin: '10px 0' }}>
            <summary>Other ways to host it</summary>
            <p style={small}>The same locked file, kept somewhere of your own instead of FreeFORM's service.</p>
            {gh ? <div style={{ ...small, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button disabled={busy === 'Publishing…'} onClick={publish}>Publish to {gh.repo} on GitHub</button>
                <button style={{ fontSize: 12 }} onClick={() => { saveGh(null); setGh(null); setBusy(''); }}>Disconnect GitHub</button>
              </div>
              : <ConnectGitHub onConnected={(g) => { saveGh(g); setGh(g); }} />}
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
                onChange={(e) => { setField(e.target.value); if (!e.target.value.trim()) { setMadeKey(null); saveKey(null); } /* cleared = start over with a new key */ }} style={{ width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 12 }} />
              {badUrl && <p role="alert" style={{ fontSize: 12 }}>That isn't a web address starting with https://</p>}
              {!badUrl && fileUrl && !key && <p role="alert" style={{ fontSize: 12 }}>
                {pasted ? "That link isn't locked. Download a locked file (step 1), upload it, and paste its address." : 'Download the locked file first (step 1), then upload that file and paste its address.'}</p>}
            </details>
          </details>
        </>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {note && <span role="status" style={{ marginRight: 'auto', alignSelf: 'center' }}>{note}</span>}
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
      <strong>Publish to your own GitHub repository</strong> (one-time setup):
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
