// The how-to guide as a page on the site (freeformdrill.org/guide/), made from docs/HOW-TO.md at build time (vite.config.ts).
// HOW-TO.md stays the only copy, so the page and the guide on GitHub can't drift apart.
import { Marked, type Tokens } from 'marked';
import { LIGHT, PALETTE, THEME_KEY } from '../ui/palette';

/** A heading's anchor the way GitHub makes it, so the guide's own "#…" links work in both places. */
export const slug = (text: string) => text.toLowerCase().replace(/[^\w\- ]+/g, '').replace(/ /g, '-');

const vars = (p: Record<string, string>) => Object.entries(p).map(([k, v]) => `--${k}: ${v};`).join(' ');

export function guidePage(md: string): string {
  const marked = new Marked({
    renderer: {
      heading(this: { parser: { parseInline: (t: Tokens.Heading['tokens']) => string } }, { tokens, depth, text }: Tokens.Heading) {
        return `<h${depth} id="${slug(text)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });
  const body = marked.parse(md, { async: false });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>How to use FreeFORM</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<script>try { if (localStorage.getItem(${JSON.stringify(THEME_KEY)}) === 'light') document.documentElement.dataset.theme = 'light'; } catch {}</script>
<style>
  :root { ${vars(PALETTE)} }
  :root[data-theme=light] { ${vars(LIGHT)} }
  body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.55 system-ui, sans-serif; }
  header { position: sticky; top: 0; background: var(--bg-deep); border-bottom: 1px solid var(--line); padding: 10px 16px; }
  main { max-width: 820px; margin: 0 auto; padding: 8px 16px 64px; }
  a { color: var(--blue); }
  img { max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; }
  table { border-collapse: collapse; width: 100%; font-size: 15px; }
  th, td { border: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
  code { background: var(--surface-2); padding: 1px 4px; border-radius: 4px; }
  h2 { margin-top: 2em; border-bottom: 1px solid var(--line); padding-bottom: 4px; }
  [id] { scroll-margin-top: 56px; } /* clear of the sticky header after a contents link */
</style>
</head>
<body>
<header><a href="../">← Back to FreeFORM</a></header>
<main>
${body}
</main>
</body>
</html>
`;
}
