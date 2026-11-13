import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { guidePage, studentPage } from './src/guide/page';
import { sampleShow } from './src/engine/sample';
import { qrSvg } from './src/engine/qr';
import { QR_LOGO } from './src/ui/palette';
import { creditsText, shipped } from './src/engine/credits';

const SITE = 'https://freeformdrill.org/';

// The how-to guide as a page on the site: guide/index.html made from docs/HOW-TO.md, with its pictures beside it.
// shortcut: built only, so `npm run dev` has no /guide/; add a dev-server route if that's ever needed.
const guide: Plugin = {
  name: 'guide',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'guide/index.html', source: guidePage(readFileSync('docs/HOW-TO.md', 'utf8')) });
    for (const f of readdirSync('docs/img')) this.emitFile({ type: 'asset', fileName: `guide/img/${f}`, source: readFileSync(`docs/img/${f}`) });
    // The student quickstart, in English and Spanish, using the guide's pictures.
    this.emitFile({ type: 'asset', fileName: 'students/index.html', source: studentPage(readFileSync('docs/STUDENTS.md', 'utf8'), 'en') });
    this.emitFile({ type: 'asset', fileName: 'es/students/index.html', source: studentPage(readFileSync('docs/STUDENTS.es.md', 'utf8'), 'es') });
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
  transformIndexHtml: (html) => html.replaceAll('%SAMPLE_PHONE_LINK%', SAMPLE_LINK).replace('%SAMPLE_QR%', qrSvg(SAMPLE_LINK, QR_LOGO) ?? ''),
  generateBundle() { this.emitFile({ type: 'asset', fileName: 'sample.freeform', source: sampleFile() }); },
};

// Open-source credits: licenses.txt, every shipped package's license in full plus the sound library's (Help → Open-source
// credits). Made from what's installed, so it can't go stale; the build stops if a package has no license text.
const files = { read: (f: string) => (existsSync(f) ? readFileSync(f, 'utf8') : null), list: (d: string) => (existsSync(d) ? readdirSync(d) : []) };
const licenses = () => creditsText(shipped(files), [{
  title: 'GeneralUser GS 1.471, by S. Christian Collins (the rehearsal track\'s instrument sounds, public/sounds/)',
  source: 'https://www.schristiancollins.com/generaluser.php',
  text: readFileSync('public/sounds/GeneralUser-GS-LICENSE.txt', 'utf8'),
}, {
  title: 'MS Basic marching percussion subset (MIT, public/sounds/)',
  source: 'https://github.com/mrbumpy409/MS_Basic',
  text: readFileSync('public/sounds/MS-Basic-Marching-LICENSE.txt', 'utf8'),
}]);
const credits: Plugin = {
  name: 'credits',
  configureServer(server) { server.middlewares.use('/licenses.txt', (_req, res) => { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end(licenses()); }); },
  generateBundle() { this.emitFile({ type: 'asset', fileName: 'licenses.txt', source: licenses() }); },
};

// Everything the app needs offline, for the service worker (public/sw.js) to keep: both pages, every built file, and the
// icons and logos. The editor and the performer view are separate downloads now, so "the files the page links" isn't enough.
const precache: Plugin = {
  name: 'precache',
  generateBundle(_, bundle) {
    const built = Object.keys(bundle).filter((f) => f.startsWith('assets/') && !f.endsWith('.png')); // not the front page's screenshots
    // Sound banks are fetched when a rehearsal track needs them, then cached.
    const pub = readdirSync('public').filter((f) => f !== 'sw.js' && f !== 'og-image.png' && f !== 'sounds' && !f.startsWith('.'));
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(['./', 'app/', 'students/', 'es/students/', ...pub, ...built]) });
  },
};

// Relative base: the same build works at a domain root, under a GitHub Pages project address, or opened locally.
// The front page (index.html, and es/index.html in Spanish) and the app (app/index.html), which old links (/#show=…) are forwarded to.
export default defineConfig({
  base: './',
  plugins: [react(), guide, sample, precache, credits],
  build: { rollupOptions: { input: { main: 'index.html', es: 'es/index.html', app: 'app/index.html' } } },
});
