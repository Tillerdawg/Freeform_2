// FreeFORM's small web service (api.freeformdrill.org), on Cloudflare Workers. For now it takes the feedback form and
// emails it to Jason; the address is a Cloudflare secret (FEEDBACK_TO), never in this code or on the site.
// Guardrails: only the site may post (CORS and Origin), a hidden field catches bots, sizes are capped, and each
// visitor may send a few messages a minute. Nothing is stored: the email is the only copy.
import { checkFeedback, feedbackEmail, ORIGINS } from './feedback';

interface Env {
  EMAIL: { send(m: { to: string; from: { email: string; name: string }; replyTo?: string; subject: string; text: string }): Promise<unknown> };
  LIMITER: { limit(o: { key: string }): Promise<{ success: boolean }> };
  FEEDBACK_TO: string;
}

const cors = (origin: string) => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' });
const json = (body: unknown, status: number, origin: string) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin') ?? '';
    const url = new URL(req.url);
    if (url.pathname !== '/feedback') return new Response('Not found', { status: 404 });
    if (!ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405, origin);
    const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (!(await env.LIMITER.limit({ key: ip })).success) return json({ error: 'Too many messages at once. Please wait a minute and try again.' }, 429, origin);
    const raw = await req.text();
    if (raw.length > 20_000) return json({ error: 'That is too long.' }, 413, origin);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return json({ error: 'Nothing was sent.' }, 400, origin); }
    const r = checkFeedback(body);
    if (!r.ok) return r.quiet ? json({ ok: true }, 200, origin) : json({ error: r.error }, 400, origin);
    const { subject, text } = feedbackEmail(r.feedback);
    try {
      await env.EMAIL.send({ to: env.FEEDBACK_TO, from: { email: 'feedback@freeformdrill.org', name: 'FreeFORM feedback' }, ...(r.feedback.email ? { replyTo: r.feedback.email } : {}), subject, text });
    } catch (e) {
      console.error('send failed', (e as { code?: string }).code, (e as Error).message);
      return json({ error: "The message couldn't be sent right now. Please try again later." }, 502, origin);
    }
    return json({ ok: true }, 200, origin);
  },
};
