import { expect, it } from 'vitest';
import readme from '../../README.md?raw';

// The README's code map stays true: every folder in the repo (and in src/) is in it, and every path it lists exists.
const files = Object.keys(import.meta.glob(['/**/*', '!/node_modules/**', '!/dist/**', '!/Examples_Drill/**', '!/samples/**']))
  .map((k) => k.slice(1)); // '/src/App.tsx' → 'src/App.tsx'

const section = readme.slice(readme.indexOf('### Code map'));
const mapped = section.split('\n').filter((l) => l.startsWith('| `'))
  .flatMap((l) => [...l.split('|')[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]));

it('the code map lists every folder', () => {
  const folders = new Set<string>();
  for (const f of files) {
    const parts = f.split('/');
    if (parts.length > 1) folders.add(parts[0] + '/');
    if (parts[0] === 'src' && parts.length > 2) folders.add(`src/${parts[1]}/`);
  }
  const covered = (d: string) => mapped.some((p) => p.startsWith(d));
  expect([...folders].filter((d) => !covered(d)).sort()).toEqual([]);
});

it('every path in the code map exists', () => {
  expect(mapped.length).toBeGreaterThan(10);
  const exists = (p: string) => p.endsWith('/') ? files.some((f) => f.startsWith(p)) : files.includes(p);
  expect(mapped.filter((p) => !exists(p))).toEqual([]);
});
