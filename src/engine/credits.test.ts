// @ts-expect-error: the tests run in Node, but its type definitions aren't installed (nothing else needs them)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { creditsText, shipped, type Files } from './credits';

const real: Files = { read: (f) => (existsSync(f) ? readFileSync(f, 'utf8') : null), list: (d) => (existsSync(d) ? readdirSync(d) : []) };

describe('open-source credits', () => {
  it('credit every package the app ships, with its license text', () => {
    const c = shipped(real);
    const deps = Object.keys(JSON.parse(real.read('package.json')!).dependencies);
    for (const d of deps) expect(c.map((x) => x.name)).toContain(d); // and what they depend on
    expect(c.map((x) => x.name)).toContain('stb-vorbis'); // spessasynth_core's
    expect(c.some((x) => x.name.startsWith('@types/'))).toBe(false); // types ship no code
    for (const x of c) expect(x.text.length, x.name).toBeGreaterThan(200);
    // qrcode-generator has no LICENSE file: its MIT text is built from the copyright line in its code.
    expect(c.find((x) => x.name === 'qrcode-generator')!.text).toMatch(/^MIT License\n\nCopyright \(c\) 2009 Kazuhiko Arase/);
  });
  it('stop when a package has nothing to credit', () => {
    const fake: Files = {
      read: (f) => ({ './package.json': '{"dependencies":{"x":"1"}}', './node_modules/x/package.json': '{"name":"x","version":"1.0.0","license":"ISC"}' } as Record<string, string>)[f] ?? null,
      list: () => [],
    };
    expect(() => shipped(fake)).toThrow(/x has no license text/);
  });
  it('lay out the file', () => {
    const t = creditsText([{ name: 'a', version: '1', license: 'MIT', source: 'https://a', text: 'A text' }], [{ title: 'Sounds', source: 'https://s', text: 'S text\n' }]);
    expect(t).toMatch(/^FreeFORM Drill: open-source credits/);
    expect(t).toContain('a 1 (MIT)\nSource: https://a');
    expect(t).toContain('Sounds\nSource: https://s');
  });
});
