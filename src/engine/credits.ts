// Open-source credits: every package the app ships (the production dependencies in package.json, and theirs) and the
// rehearsal track's sound library, each with its license text in full, as their licenses ask. The build writes it to
// licenses.txt (vite.config.ts), linked from Help; the test fails if a shipped package has no license text to show.
// File access is passed in, so this stays free of Node in the app's own code.

export interface Files {
  read: (path: string) => string | null; // null: no such file
  list: (dir: string) => string[];
}

export interface Credit { name: string; version: string; license: string; source: string; text: string }

const LICENSE_FILE = /^(licen[cs]e|copying)(\.(md|txt))?$/i;

/** The standard MIT license, for a package that says "MIT" and gives its copyright only in its code. */
const mit = (copyright: string) => `MIT License

${copyright}

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

/** The packages the app ships, from package.json's dependencies down. Type-only packages (@types/…) ship no code. */
export function shipped(files: Files, root = '.'): Credit[] {
  const top = JSON.parse(files.read(`${root}/package.json`) ?? '{}');
  const seen = new Map<string, Credit>(), queue = Object.keys(top.dependencies ?? {});
  while (queue.length) {
    const name = queue.shift()!;
    if (seen.has(name) || name.startsWith('@types/')) continue;
    const dir = `${root}/node_modules/${name}`, raw = files.read(`${dir}/package.json`);
    if (!raw) throw new Error(`${name} is a dependency but isn't installed (run npm ci).`);
    const pkg = JSON.parse(raw);
    const license = typeof pkg.license === 'string' ? pkg.license : pkg.license?.type ?? 'UNKNOWN';
    const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? '';
    const source = repo.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://') || `https://www.npmjs.com/package/${name}`;
    seen.set(name, { name, version: pkg.version, license, source, text: licenseText(files, dir, pkg, license) });
    queue.push(...Object.keys(pkg.dependencies ?? {}));
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function licenseText(files: Files, dir: string, pkg: { name: string; main?: string; module?: string }, license: string): string {
  const file = files.list(dir).find((f) => LICENSE_FILE.test(f));
  if (file) return files.read(`${dir}/${file}`)!.trim();
  // No license file (qrcode-generator): an MIT package with its copyright in its own code.
  if (license === 'MIT') {
    for (const f of [pkg.module, pkg.main, 'index.js'].filter(Boolean) as string[]) {
      const line = files.read(`${dir}/${f}`)?.match(/Copyright \(c\)[^\n*]*/i)?.[0].trim();
      if (line) return mit(line);
    }
  }
  throw new Error(`${pkg.name} has no license text to credit (no LICENSE file, and no copyright line in its code). Add it to the credits by hand, or don't ship it.`);
}

/** The whole credits file. `extra` is anything shipped that isn't an npm package (the sound library). */
export function creditsText(credits: Credit[], extra: { title: string; source: string; text: string }[]): string {
  const rule = '='.repeat(72);
  const block = (title: string, lines: string[], text: string) => [rule, title, ...lines, rule, '', text, ''].join('\n');
  return [
    'FreeFORM Drill: open-source credits',
    '',
    'FreeFORM Drill is free and open source, under the MIT license (https://github.com/Tillerdawg/freeform-drill).',
    'It\'s built with the open-source work below. Thank you to everyone who made it. Each is under its own license,',
    'given here in full. Their source code is at the address listed with each one.',
    '',
    ...credits.map((c) => block(`${c.name} ${c.version} (${c.license})`, [`Source: ${c.source}`], c.text)),
    ...extra.map((e) => block(e.title, [`Source: ${e.source}`], e.text.trim())),
  ].join('\n');
}
