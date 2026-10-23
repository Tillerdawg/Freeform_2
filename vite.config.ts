import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base: the same build works at a domain root, under /Freeform_2/ on GitHub Pages, or opened locally.
export default defineConfig({ base: './', plugins: [react()] });
