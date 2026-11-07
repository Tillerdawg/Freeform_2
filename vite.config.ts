import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { guidePage } from './src/guide/page';

// The how-to guide as a page on the site: guide/index.html made from docs/HOW-TO.md, with its pictures beside it.
// shortcut: built only, so `npm run dev` has no /guide/; add a dev-server route if that's ever needed.
const guide: Plugin = {
  name: 'guide',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'guide/index.html', source: guidePage(readFileSync('docs/HOW-TO.md', 'utf8')) });
    for (const f of readdirSync('docs/img')) this.emitFile({ type: 'asset', fileName: `guide/img/${f}`, source: readFileSync(`docs/img/${f}`) });
  },
};

// Relative base: the same build works at a domain root, under /Freeform_2/ on GitHub Pages, or opened locally.
// One bundle on purpose: the offline cache keeps the files the page links, so split-off chunks wouldn't work offline.
export default defineConfig({ base: './', plugins: [react(), guide], build: { chunkSizeWarningLimit: 800 } });
