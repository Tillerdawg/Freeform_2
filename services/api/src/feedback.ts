// What the feedback form may send, checked here because anyone on the internet can post to the service.
// Pure (no Cloudflare APIs), so it's unit-tested (feedback.test.ts).

export const LIMITS = { message: 5000, name: 100, email: 200, page: 300 } as const;
export const ORIGINS = ['https://freeformdrill.org', 'http://localhost:5173', 'http://localhost:4173']; // the site, and local development

export interface Feedback { message: string; name: string; email: string; kind: string; page: string; lang: string }
const KINDS = ['problem', 'idea', 'spanish', 'other'];

/** The form's fields, trimmed and checked, or the reason they can't be sent. `website` is a hidden field: people leave it empty, bots fill it in. */
export function checkFeedback(body: unknown): { ok: true; feedback: Feedback } | { ok: false; error: string; quiet?: boolean } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Nothing was sent.' };
  const b = body as Record<string, unknown>;
  const str = (k: string) => (typeof b[k] === 'string' ? (b[k] as string).trim() : '');
  if (str('website')) return { ok: false, error: 'spam', quiet: true }; // a bot: pretend it worked
  const feedback: Feedback = { message: str('message'), name: str('name'), email: str('email'), kind: KINDS.includes(str('kind')) ? str('kind') : 'other', page: str('page'), lang: str('lang') === 'es' ? 'es' : 'en' };
  if (!feedback.message) return { ok: false, error: 'Please write a message.' };
  if (feedback.message.length > LIMITS.message) return { ok: false, error: `Please keep it under ${LIMITS.message} characters.` };
  if (feedback.name.length > LIMITS.name || feedback.page.length > LIMITS.page) return { ok: false, error: 'That is too long.' };
  if (feedback.email && (feedback.email.length > LIMITS.email || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(feedback.email))) return { ok: false, error: "That email address doesn't look right." };
  return { ok: true, feedback };
}

/** The email Jason gets. Plain text only: nothing the sender typed is ever treated as HTML. */
export function feedbackEmail(f: Feedback): { subject: string; text: string } {
  const label = { problem: 'Problem', idea: 'Idea', spanish: 'Spanish translation', other: 'Feedback' }[f.kind] ?? 'Feedback';
  const line = f.message.split('\n')[0].replace(/\s+/g, ' '), first = line.slice(0, 60).trimEnd();
  return {
    subject: `FreeFORM ${label}: ${first}${line.length > 60 ? '…' : ''}`,
    text: [
      f.message, '', '---',
      `From: ${f.name || '(no name)'}${f.email ? ` <${f.email}>` : ' (no email: they can\'t be answered)'}`,
      `Kind: ${label}`, `Language: ${f.lang === 'es' ? 'Spanish' : 'English'}`, `Page: ${f.page || '(not given)'}`,
      'Sent with the feedback form on freeformdrill.org. Reply from an address you don\'t mind them seeing.',
    ].join('\n'),
  };
}

const b64 = (t: string) => { let bin = ''; for (const byte of new TextEncoder().encode(t)) bin += String.fromCharCode(byte); return btoa(bin); };
/** A header value in UTF-8 that any mail program reads (RFC 2047), only when it isn't plain ASCII already. */
const word = (t: string) => (/^[\x20-\x7e]*$/.test(t) ? t : `=?UTF-8?B?${b64(t)}?=`);

/**
 * The raw email (MIME), as Cloudflare's free Email Routing send wants it: plain text, base64 so any character and any
 * line length is safe. `replyTo`: the sender's address, so Reply goes to them.
 */
export function mimeMessage(m: { from: string; fromName: string; to: string; replyTo?: string; subject: string; text: string; id: string; date: Date }): string {
  const body = b64(m.text).replace(/.{1,76}/g, '$&\r\n');
  return [
    `From: ${word(m.fromName)} <${m.from}>`, `To: <${m.to}>`, ...(m.replyTo ? [`Reply-To: <${m.replyTo}>`] : []),
    `Subject: ${word(m.subject)}`, `Date: ${m.date.toUTCString()}`, `Message-ID: <${m.id}@freeformdrill.org>`,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', body,
  ].join('\r\n');
}
