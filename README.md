<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/freeform-logo-dark.svg">
    <img src="brand/freeform-logo-light.svg" alt="FreeFORM" width="420">
  </picture>
</h1>

<p align="center"><em>Drill, without the bill.</em></p>

**FreeFORM is a free and open-source drill design and learning tool for all marching arts organizations.**

I'm a former band director. Over my career teaching in public and private K-12 schools, I wrote several marching band shows in Pyware, and over the years the software frustrated me more and more: the yearly license fee, the limits on how many performers a show could have, and the tools locked behind higher tiers. I built FreeFORM because I wanted a drill writing tool that was easy to use, gave users every tool from the start, worked for marching ensembles of any size, and eased my organization's financial burden. I made FreeFORM free and open-source because I believe other marching arts directors and drill writers may want a tool that solves these same pain points.

FreeFORM runs in your web browser, or as an app on your home screen. There's nothing to install. Your shows are saved in the browser on your device, and once you've opened FreeFORM, it works offline too. You can quickly add performers to a show, build sets, watch the moves between sets play out count by count, print drill charts and individual dot sheets, and send the show to your students' and staff members' devices.

FreeFORM is released under the [MIT license](LICENSE), so anyone is free to use it, share it, and change it as they need to, as long as the license notice stays with it.

Sharing a show is easy: students and staff scan a QR code (or open a link you text or email them) on their phones or tablets. Once the show is loaded, anyone can look up a performer's coordinates (their "dot") and watch any move from the director's point of view, facing the audience the way a performer would, or following their own dot. That helps students and staff learn the show quickly.

A note on where the ideas came from: FreeFORM is modeled on Pyware and the Ultimate Drill Book (UDB), but no proprietary code went into it (see [Clean room](#clean-room)).

**Use it here:** <https://freeformdrill.org/>

**New to FreeFORM? Start with the [How-to guide](docs/HOW-TO.md).** It walks through everything below, step by step, with pictures.

![The FreeFORM editor](docs/img/editor.png)

> **Status:** early, and I'm working on it actively. Everything listed below works today. Shows are saved in your browser, in files you export, and in the links you share. There are no accounts and no cloud sync yet.

## What it does

**Writing drill**
- A football field with high school, college/DCI, or NFL hashes and an 8-to-5 grid, seen from the press box (Side 1 on the left).
- Coordinates in standard drill language, like "2 steps outside the Side 2 45, 2 steps in front of Front Hash."
- Sections with letters and colors, a roster of names (paste it from a spreadsheet), and labels that stay out of each other's way.
- Shapes: line, arc, curve, Bézier, circle, polygon, star, spiral, and block. FreeFORM assigns spots by least total travel, so paths don't cross.
- Rotate and stretch a group by dragging handles on the field, or turn it around one performer for a gate turn. Flip across the 50 or front to back, or copy one side to the other.
- Follow-the-leader moves, with turns, and counter-marches.
- Delayed step-offs (hold 4, move 12) and turning moves, where a rotating group marches arcs instead of straight lines.
- Which way each performer faces (eight directions) and what guard equipment they carry (flag, rifle, or saber), carried from set to set, on the field, charts, dot sheets, and phones.
- Select everyone or a whole section, copy spots from one set and paste them into another, and see how far apart two performers are.
- Step-size warnings (yellow past a 6-to-5, red past a 4-to-5), and a warning when two performers come within a step of each other at any point in a move.
- Text, arrows, and freehand markup on each set, plus ensemble notes and per-performer notes.
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

It runs on a current Chrome, Edge, Firefox, or Safari, and on iPadOS/iOS 16.4 or later. Write drill on a computer or an iPad (hide the timeline and sidebar for more field). Phones get only the performer view.

## Roadmap

The full list is in [PLAN.md](PLAN.md). What's next, roughly:

- Touch versions of the few actions that still need a keyboard key
- Paths on printed charts, a notes column on dot sheets, and one dot sheet per page
- Faster count entry for recordings that weren't made from the score (tap a few downbeats, FreeFORM fills in the rest)
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
| `src/field/` | Drawing the field, performers, shapes, and markup, plus dot-label placement and the rotate/stretch frame |
| `src/ui/` | The toolbar, sidebar, timeline, music menu, and color palette |
| `src/print/` | Dot sheets and drill charts |
| `src/perform/` | The performer view, the Share dialog, and the QR scanner |
| `public/` | App icons, logos, the link-preview image, the manifest, and the offline service worker |
| `docs/` | The How-to guide and its screenshots |
| `scripts/` | The screenshot script |
| `brand/` | Logo files, colors, and rules ([brand/README.md](brand/README.md)) |

Positions are stored in 8-to-5 steps (one step is 22.5 inches), measured from where the 50 meets the front sideline. +x points toward Side 2 and +y toward the back sideline. Every readout is worked out from that.

## How decisions get made

Every design decision is logged in [DECISIONS.md](DECISIONS.md): when, who made it, what else was considered, and why. If you wonder why something works the way it does, look there first. [IDEA.md](IDEA.md) is the original brief.

### Clean room

FreeFORM is written from scratch. I studied Pyware and UDB only through how they behave and what their documentation says, never by decompiling them, and there's no third-party code or show file in this repo.

## Contributing

Issues and pull requests are welcome, especially from drill writers and band directors who can say how things *should* work. If you change or add a feature, please update this README, the [How-to guide](docs/HOW-TO.md) (and its screenshots, if they show it) and [DECISIONS.md](DECISIONS.md) in the same change. [CLAUDE.md](CLAUDE.md) has the house rules.

## License

[MIT](LICENSE) © Jason Tiller and FreeFORM contributors.
