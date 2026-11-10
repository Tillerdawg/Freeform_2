# Contributing to FreeFORM

Thanks for helping. FreeFORM is a free drill design tool for marching bands, drum corps, and indoor programs, and it gets better when people who write and teach drill say how things should work.

## Reporting a problem or an idea

Open an [issue](https://github.com/Tillerdawg/freeform-drill/issues/new/choose). There's a form for problems and one for ideas. A `.freeform` file that shows the problem helps a lot (leave out students' names if the show is public).

## Changing the code

You need [Node.js](https://nodejs.org/) 22 or newer.

```sh
npm install
npm run dev        # the editor, at the address it prints (/app/)
npm test           # unit tests
npm run typecheck  # TypeScript checks
npm run build      # the site in dist/
```

Before you open a pull request, read [CLAUDE.md](CLAUDE.md): it has the house rules for people and AI agents alike. The short version:

- Keep the docs true in the same change: [docs/HOW-TO.md](docs/HOW-TO.md), [README.md](README.md), and the screenshots (`node scripts/screenshots.mjs <name>`).
- Log design decisions in [DECISIONS.md](DECISIONS.md).
- New logic gets unit tests; UI changes get checked in a real browser.
- Legible beats pretty, one palette, and even step sizes.
- **Clean room:** no code or files from Pyware, UDB, or OpenMarch (AGPL). Ideas are fine; their code and show files are not.

By contributing, you agree that your work is released under the [MIT license](LICENSE).
