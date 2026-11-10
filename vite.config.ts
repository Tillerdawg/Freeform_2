import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { guidePage } from './src/guide/page';
import { sampleShow } from './src/engine/sample';
import { qrSvg } from './src/engine/qr';

const SITE = 'https://freeformdrill.org/';

// The how-to guide as a page on the site: guide/index.html made from docs/HOW-TO.md, with its pictures beside it.
// shortcut: built only, so `npm run dev` has no /guide/; add a dev-server route if that's ever needed.
const guide: Plugin = {
  name: 'guide',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'guide/index.html', source: guidePage(readFileSync('docs/HOW-TO.md', 'utf8')) });
    for (const f of readdirSync('docs/img')) this.emitFile({ type: 'asset', fileName: `guide/img/${f}`, source: readFileSync(`docs/img/${f}`) });
  },
};

// The sample show as a file on the site, so the front page's QR code can be a short hosted link ("see what your students
// get"). The same ids every build, so a phone that rechecks the file doesn't see a "new" show each time.
function sampleFile(): string {
  const now = Date.now;
  Date.now = () => 0; // ids are made from the time and a counter
  try { return JSON.stringify({ ...sampleShow(), id: '0000000000000000000000000000f5ee' }); } finally { Date.now = now; }
}
const SAMPLE_LINK = `${SITE}app/#load=${encodeURIComponent(`${SITE}sample.freeform`)}`;
const sample: Plugin = {
  name: 'sample',
  transformIndexHtml: (html) => html.replaceAll('%SAMPLE_PHONE_LINK%', SAMPLE_LINK).replace('%SAMPLE_QR%', qrSvg(SAMPLE_LINK) ?? ''),
  generateBundle() { this.emitFile({ type: 'asset', fileName: 'sample.freeform', source: sampleFile() }); },
};

// Everything the app needs offline, for the service worker (public/sw.js) to keep: both pages, every built file, and the
// icons and logos. The editor and the performer view are separate downloads now, so "the files the page links" isn't enough.
const precache: Plugin = {
  name: 'precache',
  generateBundle(_, bundle) {
    const built = Object.keys(bundle).filter((f) => f.startsWith('assets/') && !f.endsWith('.png')); // not the front page's screenshots
    const pub = readdirSync('public').filter((f) => f !== 'sw.js' && f !== 'og-image.png' && !f.startsWith('.'));
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(['./', 'app/', ...pub, ...built]) });
  },
};

// Relative base: the same build works at a domain root, under a GitHub Pages project address, or opened locally.
// The front page (index.html, and es/index.html in Spanish) and the app (app/index.html), which old links (/#show=…) are forwarded to.
export default defineConfig({
  base: './',
  plugins: [react(), guide, sample, precache],
  build: { rollupOptions: { input: { main: 'index.html', es: 'es/index.html', app: 'app/index.html' } } },
});
