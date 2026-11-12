import { expect, it } from 'vitest';

// Code files whose names differ only in capitalization (GettingStarted.tsx next to gettingStarted.ts) work on Linux but
// break on a Mac or Windows, where the two names are the same file: an import without an extension finds the wrong one.
const files = Object.keys(import.meta.glob(['../**/*.{ts,tsx,js,mjs}', '../../services/api/src/**/*.ts', '../../scripts/**/*.{js,mjs,cjs}']));

it('no two code files in a folder differ only in capitalization', () => {
  const seen = new Map<string, string>();
  const clashes: string[] = [];
  for (const f of files) {
    const key = f.replace(/\.[^./]+$/, '').toLowerCase(); // the name an extensionless import uses
    const other = seen.get(key);
    if (other && other !== f && other.replace(/\.[^./]+$/, '') !== f.replace(/\.[^./]+$/, '')) clashes.push(`${other} and ${f}`);
    seen.set(key, f);
  }
  expect(clashes).toEqual([]);
});
