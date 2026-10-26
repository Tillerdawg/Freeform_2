import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, AUTOSAVE } from './App';
import { Perform } from './perform/Perform';
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
        <h1 style={{ fontSize: 20 }}>Freeform hit an error</h1>
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
const perform = isPhone() || isPerform();
if (perform && !isPerform()) history.replaceState(null, '', location.pathname + '#perform');
document.body.classList.toggle('performer', perform);
window.addEventListener('hashchange', () => {
  if (isPerform() !== perform && !isPhone()) location.reload();
  else if (location.hash.startsWith('#show=') || location.hash.startsWith('#load=')) location.reload(); // a new link opened in the same tab
});
createRoot(document.getElementById('root')!).render(<Crash>{perform ? <Perform /> : <App />}</Crash>);

// Offline support in the published app only (in development it would cache stale code).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { /* offline just won't be available */ }));
}
