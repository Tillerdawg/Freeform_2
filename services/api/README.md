# FreeFORM's web service (api.freeformdrill.org)

A Cloudflare Worker with two jobs:

- **Feedback** (`POST /feedback`): the form in the editor's **Help** menu and on the front page posts here, and the message is emailed to Jason. Nothing is stored.
- **Published shows** (`/shows`): **Publish to phones** in the Share dialog. The director's browser uploads a show file it has already encrypted (the key is only in the link it gives performers, after the #), and phones download it with `GET /shows/<id>`. The service can't read the files. `POST /shows` publishes and returns an id and an edit token (only its hash is kept); `PUT` and `DELETE /shows/<id>` with that token update or remove it. Files live in Workers KV (free: 1 GB in all, 25 MB a file); a daily job deletes shows nobody has opened or updated for a year.

Guardrails: only freeformdrill.org may post (CORS and the Origin header); feedback has a hidden field that catches bots, a 5,000-character cap, and 3 messages a minute per visitor, and the email is plain text, so nothing a sender types is ever treated as HTML; publishing takes only locked show files (checked by shape), up to 24 MB, 6 publishes a minute per visitor, and changes only with the show's edit token.

The address the email goes to is a Cloudflare secret, `FEEDBACK_TO`. It isn't in this code or on the site.

## Setting it up (once, in the Cloudflare dashboard)

1. **Email Routing:** open freeformdrill.org → **Email** → **Email Routing** (or **Compute** → **Email Service** → **Email Routing**), and enable it (Cloudflare adds the records it needs). Under **Destination addresses**, add the address feedback should go to, then click the link Cloudflare emails there to verify it.

That's all: the service sends through Email Routing, which is free for verified addresses in your own account. (**Email Sending**, the newer product, needs the Workers Paid plan; it isn't used.)

## Deploying (from this folder, on a computer logged in with `npx wrangler login`)

```sh
cd services/api
npx wrangler@4.153.0 secret put FEEDBACK_TO   # paste the verified address when it asks
npx wrangler@4.153.0 deploy                   # also creates api.freeformdrill.org and, the first time, the KV storage for shows
```

Then send a test from the front page's form. `npx wrangler@4.153.0 tail` shows the service's log live.

## Testing without sending

`npx wrangler@4.153.0 dev --var FEEDBACK_TO:test@example.org` runs it locally: messages are written to files instead of sent. The checks are unit-tested in `feedback.test.ts` (`npm test` at the top of the repo).
