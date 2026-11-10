import { Component, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/palette'; // light or dark before either view loads, so the page doesn't flash
import { AUTOSAVE } from './ui/showStore';
import { isPhone } from './perform/device';

/** If the app crashes, show the error and keep the autosaved show recoverable (a bad save would otherwise crash every reload). */
class Crash extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const saved = (() => { try { return localStorage.getItem(AUTOSAVE); } catch { return null; } })();
    const download = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([saved ?? ''], { type: 'application/octet-stream' }));
      a.download = 'recovered.freeform';
      a.click();
    };
    const reset = () => {
      if (!confirm('Clear the autosaved show and start fresh? Download it first if you want to keep it.')) return;
      try { localStorage.removeItem(AUTOSAVE); } catch { /* nothing to clear */ }
      location.reload();
    };
    return (
      <div role="alert" style={{ padding: 24, maxWidth: 720 }}>
        <h1 style={{ fontSize: 20 }}>FreeFORM hit an error</h1>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#111', padding: 12 }}>{error.message}{'\n\n'}{error.stack}</pre>
        <p>Your show is still in this browser's autosave.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => location.reload()}>Reload</button>
          <button onClick={download} disabled={!saved}>Download autosaved show</button>
          <button onClick={reset}>Reset to a new show</button>
        </div>
      </div>
    );
  }
}

// Share links (#show=...), hosted links (#load=...) and the saved performer view (#perform) open the read-only performer screen.
const isPerform = () => ['#show=', '#load=', '#perform'].some((p) => location.hash.startsWith(p));
// A phone-sized window gets the performer view. When it's the size that put us there (a closed iPhone Duo, at launch
// or by folding mid-session, or a narrow iPad Split View pane), a note in sessionStorage says so, and widening (opening
// the Duo) goes back to the editor; a performer who came by link or chose the performer view stays put. The show is
// autosaved on every change; the undo history doesn't survive the reload.
const FOLDED = 'freeform:folded-from-editor';
const note = (on: boolean) => { try { if (on) sessionStorage.setItem(FOLDED, '1'); else sessionStorage.removeItem(FOLDED); } catch { /* storage blocked */ } };
const noted = () => { try { return !!sessionStorage.getItem(FOLDED); } catch { return false; } };
if (isPhone() && !isPerform()) note(true);
if (!isPhone() && isPerform() && location.hash === '#perform' && noted()) history.replaceState(null, '', location.pathname); // opened since
const perform = isPhone() || isPerform();
if (perform && !isPerform()) history.replaceState(null, '', location.pathname + '#perform');
if (!perform) note(false);
document.body.classList.toggle('performer', perform);
window.addEventListener('hashchange', () => {
  if (isPerform() !== perform && !isPhone()) location.reload();
  else if (location.hash.startsWith('#show=') || location.hash.startsWith('#load=')) location.reload(); // a new link opened in the same tab
});
let resizing = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizing);
  resizing = window.setTimeout(() => { // after the fold or rotation settles
    const phone = isPhone();
    if (phone && !perform) { note(true); history.replaceState(null, '', location.pathname + '#perform'); location.reload(); }
    else if (!phone && perform && noted()) { note(false); history.replaceState(null, '', location.pathname); location.reload(); }
  }, 400);
});
// Each view is its own download, so a phone opening a show doesn't fetch the whole editor (the offline cache keeps both; see sw.js).
const App = lazy(() => import('./App').then((m) => ({ default: m.App })));
const Perform = lazy(() => import('./perform/Perform').then((m) => ({ default: m.Perform })));
createRoot(document.getElementById('root')!).render(<Crash><Suspense fallback={null}>{perform ? <Perform /> : <App />}</Suspense></Crash>);

// Offline support in the published app only (in development it would cache stale code).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('../sw.js').catch(() => { /* offline just won't be available */ }));
}
