# FreeFORM's web service (api.freeformdrill.org)

A Cloudflare Worker. For now it does one thing: the feedback form (in the editor's **Help** menu and on the front page) posts here, and it emails the message to Jason. Nothing is stored. Later the upload service for **Keep phones up to date** goes here too.

Guardrails: only freeformdrill.org may post (CORS and the Origin header), a hidden field catches bots, messages are capped at 5,000 characters, and each visitor can send 3 messages a minute. The email is plain text, so nothing a sender types is ever treated as HTML.

The address the email goes to is a Cloudflare secret, `FEEDBACK_TO`. It isn't in this code or on the site.

## Setting it up (once, in the Cloudflare dashboard)

1. **Email Routing:** open freeformdrill.org → **Email** → **Email Routing** (or **Compute** → **Email Service** → **Email Routing**), and enable it (Cloudflare adds the records it needs). Under **Destination addresses**, add the address feedback should go to, then click the link Cloudflare emails there to verify it.

That's all: the service sends through Email Routing, which is free for verified addresses in your own account. (**Email Sending**, the newer product, needs the Workers Paid plan; it isn't used.)

## Deploying (from this folder, on a computer logged in with `npx wrangler login`)

```sh
cd services/api
npx wrangler@4.153.0 secret put FEEDBACK_TO   # paste the verified address when it asks
npx wrangler@4.153.0 deploy                   # also creates api.freeformdrill.org
```

Then send a test from the front page's form. `npx wrangler@4.153.0 tail` shows the service's log live.

## Testing without sending

`npx wrangler@4.153.0 dev --var FEEDBACK_TO:test@example.org` runs it locally: messages are written to files instead of sent. The checks are unit-tested in `feedback.test.ts` (`npm test` at the top of the repo).
