<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/freeform-logo-dark.svg">
    <img src="brand/freeform-logo-light.svg" alt="Freeform" width="420">
  </picture>
</h1>

<p align="center"><em>Drill, without the bill.</em></p>

**Free, open-source drill design for marching bands and drum corps.**

I taught band for six years, five in public schools and one in a private school. I'm building Freeform to take licensing cost off the table for school and community programs. It's a drill writer that runs in your browser: put performers on a football field, build sets, watch the moves count by count, print dot sheets and drill charts, and send the show to your students' phones. The ideas come from Pyware and the Ultimate Drill Book, but none of their code (see [Clean room](#clean-room)).

**Use it here:** <https://tillerdawg.github.io/Freeform_2/>

There's no account and nothing to install. It works offline, and you can add it to a phone's or tablet's home screen.

**New to Freeform? Start with the [How-to guide](docs/HOW-TO.md).** It walks through everything below, step by step, with pictures.

![The Freeform editor](docs/img/editor.png)

> **Status:** early, and I'm working on it actively. Everything listed below works today. Shows are saved in your browser, in files you export, and in the links you share. There are no accounts and no cloud sync yet.

## What it does

**Writing drill**
- A football field with high school, college/DCI or NFL hashes and an 8-to-5 grid, seen from the press box (Side 1 on the left).
- Coordinates in standard drill language, like "2 steps outside the Side 2 45, 2 steps in front of Front Hash."
- Sections with letters and colors, a roster of names (paste it from a spreadsheet), and labels that stay out of each other's way.
- Shapes: line, arc, curve, Bézier, circle and block. Freeform assigns spots by least total travel, so paths don't cross.
- Rotate and stretch a group by dragging handles on the field. Flip across the 50 or front to back, or copy one side to the other.
- Follow-the-leader moves, with turns.
- Step-size warnings: yellow past a 6-to-5, red past a 4-to-5.
- Text, arrows and freehand markup on each set, plus ensemble notes and per-performer notes.
- Undo for every edit.

**Timing and music**
- A timeline you can scrub count by count, play at any tempo, or loop over a range of sets.
- Lay out a show by counts first (one movement per tune), then add sets at any count.
- Sync to a recording: take every count's timing from the MuseScore score (or MusicXML or MIDI), or tap the counts along with any mp3.

**Getting it to the band**
- Dot sheets (four cards per page) and drill charts (one per set), printed or saved as PDF.
- Share links with a QR code. The whole show is in the link, with no server involved.
- Locked hosted links that update themselves on phones, can carry the music, and keep names private. One-click publishing to your own GitHub repository.
- A performer view for phones: pick who you are, follow your dot, see your next spot and step size, and see who's around you. It works offline once it's opened.

**Files**
- Autosave in your browser, plus export and import of `.freeform` files.
- Import Pyware 3D (`.3dj`) shows, tested with files from 2008 to 2010.

It runs on a current Chrome, Edge, Firefox or Safari, and on iPadOS/iOS 16.4 or later. Write drill on a computer or an iPad. Phones get only the performer view.

## Roadmap

The full list is in [PLAN.md](PLAN.md). What's next, roughly:

- Touch versions of the few actions that still need a keyboard key, and Apple Pencil support
- Paths on printed charts, a notes column on dot sheets, and one dot sheet per page
- Faster count entry for recordings that weren't made from the score (tap a few downbeats, Freeform fills in the rest)
- Markup that spans several sets
- Basketball courts and custom surfaces
- Later: optional cloud sync and app-store versions

## Running it yourself

You need [Node.js](https://nodejs.org/) 22 or newer.

```sh
npm install
npm run dev        # the editor, at the address it prints
npm test           # unit tests
npm run typecheck  # TypeScript checks
npm run build      # production build in dist/
```

Every push to `main` runs the checks and tests and then publishes to GitHub Pages ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). If a test fails, the site doesn't update.

### Screenshots

The pictures in the How-to guide and this README are made by a script, from a sample show in [`src/engine/sample.ts`](src/engine/sample.ts). After a change to anything they show, retake them:

```sh
npm i --no-save playwright && npx playwright install chromium   # once
node scripts/screenshots.mjs              # all of them
node scripts/screenshots.mjs ftl print    # or just these
```

### Code map

| Path | What's there |
|---|---|
| `src/engine/` | The drill logic, with no UI: coordinates and readouts, the show model, shapes, markup, undo, music timing, share links and locked files, QR codes, and the Pyware reader. Unit-tested. |
| `src/field/` | Drawing the field, performers, shapes and markup, dot-label placement, and the rotate/stretch frame |
| `src/ui/` | The toolbar, sidebar, timeline, music menu and color palette |
| `src/print/` | Dot sheets and drill charts |
| `src/perform/` | The performer view, the Share dialog and the QR scanner |
| `public/` | App icons, logos, the link-preview image, the manifest and the offline service worker |
| `docs/` | The How-to guide and its screenshots |
| `scripts/` | The screenshot script |
| `brand/` | Logo files, colors and rules ([brand/README.md](brand/README.md)) |

Positions are stored in 8-to-5 steps (one step is 22.5 inches), measured from where the 50 meets the front sideline. +x points toward Side 2 and +y toward the back sideline. Every readout is worked out from that.

## How decisions get made

Every design decision is logged in [DECISIONS.md](DECISIONS.md): when, who made it, what else was considered, and why. If you wonder why something works the way it does, look there first. [IDEA.md](IDEA.md) is the original brief.

### Clean room

Freeform is written from scratch. I studied Pyware and UDB only through how they behave and what their documentation says, never by decompiling them, and there's no third-party code or show file in this repo.

## Contributing

Issues and pull requests are welcome, especially from drill writers and band directors who can say how things *should* work. If you change or add a feature, please update this README, the [How-to guide](docs/HOW-TO.md) (and its screenshots, if they show it) and [DECISIONS.md](DECISIONS.md) in the same change. [CLAUDE.md](CLAUDE.md) has the house rules.

## License

[MIT](LICENSE) © Jason Tiller and Freeform contributors.
