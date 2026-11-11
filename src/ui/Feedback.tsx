// Send feedback from the editor: a short form that goes to FreeFORM's service (services/api), which emails it to Jason.
// No account and no email address on show; the sender's email is optional, for a reply.
import { useState } from 'react';
import { useDialog } from './useDialog';

export const FEEDBACK_API = 'https://api.freeformdrill.org/feedback';
export const ISSUES = 'https://github.com/Tillerdawg/freeform-drill/issues/new/choose';

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState('problem');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'' | 'sending' | 'sent'>('');
  const [error, setError] = useState('');
  const dialog = useDialog(onClose);
  const send = async () => {
    setState('sending'); setError('');
    try {
      const res = await fetch(FEEDBACK_API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, message, name, email, page: 'editor', lang: 'en', website: '' }) });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error || `The message couldn't be sent (${res.status}).`);
      setState('sent');
    } catch (e) {
      setState(''); setError(e instanceof TypeError ? "The message couldn't be sent. Check your connection and try again." : (e as Error).message);
    }
  };
  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', marginTop: 4 };
  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Send feedback" style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 20, width: 420, maxWidth: 'calc(100vw - 32px)', fontSize: 14 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Send feedback</h2>
        {state === 'sent' ? (
          <>
            <p role="status">Thanks! Your message is on its way.</p>{/* the same words as the front page's form */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={onClose}>Close</button></div>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 12px' }}>Something that doesn't work, an idea, or how drill writers do it in your program. It goes straight to me, with no account needed.</p>
            <label style={{ display: 'block', marginBottom: 8 }}>What is it?{' '}
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="problem">Something doesn't work</option>
                <option value="idea">An idea</option>
                <option value="spanish">The Spanish translation</option>
                <option value="other">Something else</option>
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 8 }}>Message
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={5000} style={field}
                placeholder={kind === 'problem' ? 'What you did, what you expected, and what happened instead' : ''} />
            </label>
            <label style={{ display: 'block', marginBottom: 8 }}>Your name (optional)
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" style={field} />
            </label>
            <label style={{ display: 'block', marginBottom: 8 }}>Your email (optional, if you'd like an answer)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" style={field} />
            </label>
            <p style={{ margin: '0 0 12px', fontSize: 12, opacity: 0.8 }}>Only Jason sees what you send; it isn't posted anywhere. Your show isn't sent: to share one, attach a saved file to an <a href={ISSUES} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>issue on GitHub</a>.</p>
            {error && <p role="alert" style={{ color: 'var(--danger)', margin: '0 0 12px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose}>Cancel</button>
              <button className="primary" disabled={!message.trim() || state === 'sending'} onClick={send}>{state === 'sending' ? 'Sending…' : 'Send'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
