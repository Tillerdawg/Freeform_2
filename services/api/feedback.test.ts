import { describe, expect, it } from 'vitest';
import { checkFeedback, feedbackEmail, LIMITS } from './src/feedback';

describe('the feedback service', () => {
  it('takes a message, trimmed, with an optional name and email', () => {
    const r = checkFeedback({ message: '  The arc tool is great  ', name: ' Pat ', email: 'pat@example.org', kind: 'idea', page: 'app', lang: 'en' });
    expect(r).toEqual({ ok: true, feedback: { message: 'The arc tool is great', name: 'Pat', email: 'pat@example.org', kind: 'idea', page: 'app', lang: 'en' } });
  });
  it('turns away empty, oversized, or odd input', () => {
    expect(checkFeedback(null)).toMatchObject({ ok: false });
    expect(checkFeedback({ message: '   ' })).toMatchObject({ ok: false, error: 'Please write a message.' });
    expect(checkFeedback({ message: 'x'.repeat(LIMITS.message + 1) })).toMatchObject({ ok: false });
    expect(checkFeedback({ message: 'hi', email: 'not an email' })).toMatchObject({ ok: false });
    expect(checkFeedback({ message: 'hi', email: 'a@b.c<script>' })).toMatchObject({ ok: false });
    expect(checkFeedback({ message: 42 })).toMatchObject({ ok: false });
  });
  it('quietly drops bots that fill in the hidden field', () => {
    expect(checkFeedback({ message: 'buy now', website: 'spam.example' })).toEqual({ ok: false, error: 'spam', quiet: true });
  });
  it('keeps unknown kinds and languages in bounds', () => {
    const r = checkFeedback({ message: 'hola', kind: 'admin', lang: 'fr' });
    expect(r.ok && [r.feedback.kind, r.feedback.lang]).toEqual(['other', 'en']);
  });
  it('writes a plain-text email with a short subject', () => {
    const r = checkFeedback({ message: 'A long first line that goes on and on past sixty characters for sure\nsecond line', kind: 'problem' });
    const m = feedbackEmail(r.ok ? r.feedback : (null as never));
    expect(m.subject).toBe('FreeFORM Problem: A long first line that goes on and on past sixty characters…');
    expect(m.text).toContain('second line');
    expect(m.text).toContain("no email: they can't be answered");
  });
});
