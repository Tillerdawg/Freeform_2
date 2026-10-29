import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base: the same build works at a domain root, under /Freeform_2/ on GitHub Pages, or opened locally.
// One bundle on purpose: the offline cache keeps the files the page links, so split-off chunks wouldn't work offline.
export default defineConfig({ base: './', plugins: [react()], build: { chunkSizeWarningLimit: 800 } });
