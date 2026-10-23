# Freeform

**Free, open-source drill design for marching bands and drum corps.**

Freeform is a browser-based drill writer: put performers on a football field, build sets, animate the moves count by count, and print dot sheets and drill charts. It's inspired by Pyware and the Ultimate Drill Book, with one goal: take licensing cost off the table for school and community programs.

**Use it:** <https://tillerdawg.github.io/Freeform_2/>. No account and no install. It also works offline and can be added to your phone or tablet's home screen. Write drill on a computer or tablet. Phones open only the performer view (with Staff and Director view for directors); there's no editor on a phone.

> **Status:** early, actively developed. The drill writer's core workflow and a performer view for phones work today; music sync is next (see [Roadmap](#roadmap)). Shows are saved in your browser, in files you export, and in share links. There are no accounts or cloud sync.

---

## What it does today

### The field
- **Football field** with high school, college/DCI, or NFL hashes, drawn the way drill software draws it: a stylized **84-step field** with whole-step hashes:

  | Level | Sideline → hash / hash → hash / hash → sideline |
  |---|---|
  | High school | 28 / 28 / 28 steps |
  | College / DCI | 32 / 20 / 32 steps |
  | NFL | 36 / 12 / 36 steps |

- **8-to-5 grid** from the front sideline, with every 4th step a bit brighter. 4-inch lines, hash marks across each yard line, and yard numbers outside the sidelines.
- **Director's view:** front sideline at the bottom, Side 1 on the left.
- **Changing hashes** on an existing show asks whether to keep positions *relative to the hashes* (on the hash stays on the hash) or keep the *spots on the field*.

### Coordinates
Every spot reads in standard drill language, e.g. *"2 steps outside the Side 2 45, 2 steps in front of Front Hash"*, *"Splitting 40 and 45 on Side 1"*, *"On the 50"*. Distances round to quarter steps and are measured from the field's inside edges (sidelines, front and back hashes).

### Performers and sets
- **Sections and labels:** add performers by section (T1, T2… for trumpets). Section letters and names can be edited.
- **Selecting:** click, shift-click, or drag a box; drag to move, with whole-step, half-step, or free snapping.
- **Exact placement:** type a coordinate ("2 steps outside the Side 2 45…") to place a performer precisely.
- **Sets:** add, delete, and set counts and measure numbers (pickups are measure 0). Drag a set's button on the timeline to change which count it lands on; its neighbors stay put.
- **Undo / redo** for every edit (⌘Z / Ctrl+Z).

### Shapes and transforms
- **Shapes:** select performers, then shape them into a **Line, Arc, Curve, Bézier, Circle, or Block**, with drag handles. Space them evenly or at a fixed interval.
- **Who goes where:** each performer is assigned the spot that minimizes total travel from the previous set, so paths never cross.
- **Bézier joints** stay smooth unless you hold Option/Alt.
- **Mirror** across the 50 or front to back, or copy one side onto the other.
- **Rotate and scale** a selection around its center, and **snap a selection to the grid** (with a warning if two performers land on the same spot).

### Moves and playback
- **Timeline:** one segment per move with a tick for every count. Click any count to see exactly where everyone is.
- **Playback** at any tempo, for the whole show or a range of sets, with optional looping.
- **Step-size warnings:** moves bigger than 6-to-5 turn **yellow**, and bigger than 4-to-5 turn **red**, on both the paths and the timeline.
- **Follow-the-leader:** pick a leader and an order; the followers march the leader's trail automatically.

### Markup and notes
- **Per-set markup:** text notes, arrows, and freehand drawing on each set.
- **Ensemble notes** (printed under a set's chart, for everyone) and **Performer notes** (printed on selected performers' dot sheets).

### Printing
- **Dot sheets:** 4 cards per page, with set, counts, measures, and coordinates, plus that performer's notes. Print for everyone, one section, or a selection.
- **Drill charts:** one page per set, with labeled dots, markup, and notes. Black on white, for copiers.
- **PDFs:** use your browser's print dialog and choose **Save as PDF**.

### Performer view (phones)
- **Share links:** in the editor, **Share…** makes a link with the whole show packed inside it. A 150-performer, 40-set show is about 40 KB. Text it, email it, or post it; there's no server involved. Anyone with the link can view the show. Later edits aren't sent automatically, so share a new link after changes.
- **QR codes:** when the link is small enough to scan (roughly a small show with a few sets), the Share dialog shows a QR code to put on a screen or print for rehearsal.
- **Hosted links (short, scannable, update themselves):** put your exported show file online, paste its address under **Hosted link** in the Share dialog, and Freeform makes a short link and QR code that point to it. Phones download the file when the link opens, check it like any import, and keep it for offline use. Whenever a performer reopens the view while online, it quietly picks up your latest version, keeping their "who am I" choice. If the download fails, the saved copy stays. *Today this is for testing:* a secret GitHub gist works (Export → paste into a gist → copy its **Raw** link and remove the long code after `/raw/` so it always serves the newest version). A secret gist is unlisted, not private: anyone with the address can read it. Protected hosting for real use is on the roadmap.
- **Opening a link:** on a phone, it opens a read-only performer screen. In the home-screen app (which has no address bar), tap **Scan QR code** (on the empty screen, or under **Open a different show**) and point the camera at the show's QR code, or paste the link (share or hosted) in the box next to it. On iPhone, scanning with the Camera app always opens Safari, which keeps its own copy separate from the home-screen app; Safari alone works fine too. On a computer or tablet, the editor's **Performer view** button (or **Open performer view here** in Share…) switches to the performer view, and **← Editor** switches back; phones have no editor. Each performer picks **who they are** (or **Staff** for the whole band); the choice and the show stay saved on that phone and work offline.
- **Yard lines always labeled:** in My view, or whenever you've zoomed in, a ruler along the bottom names every yard line on screen ("S1 40", "50", "S2 35", "G"), since the painted numbers are usually out of view.
- **Pinch to zoom:** in My view you stay centered on your dot. In Whole field you can also drag around. **Reset zoom** or switching views puts it back.
- **Screen stays awake** while the show is playing, where the browser allows it (on iPhone, recent iOS versions).
- **My dot:** highlighted, with **My view** following me through each move, my path into the next set (including follow-the-leader trails), and where I end up.
- **Facing front:** turns the field around to match what I see facing the audience: front sideline at the top, Side 1 on my right. **Director view** is the editor's orientation.
- **Who's around me:** my nearest neighbors (up to 4, within 10 steps) are labeled on the field, and an **Around you** list says where each one is, e.g. "T5 · 4 steps toward Side 1", "T2 · 4 steps in front". Directions are in field terms, so they mean the same in either view.
- **Readouts:** my coordinate now and in the next set, with counts, measures and step size (colored like the editor's warnings), plus my performer notes and the ensemble notes.
- **Controls:** play at any tempo, step count by count, scrub, or tap a set number to jump to it (the row of set buttons scrolls sideways in long shows and follows playback). Works in portrait and landscape.

### Saving
- **Autosave:** your show saves in this browser automatically.
- **Export / Import** a `.freeform.json` file to back up a show, share it, or move it to another browser or device. *Export is your real backup:* the autosave lives only in that one browser.

## Using it

The editor has the field in the middle, the current set's controls across the top, the timeline across the bottom, and tools in the sidebar.

| Action | How |
|---|---|
| Pan / zoom | Scroll / pinch (or ⌘/Ctrl + scroll); right-drag also pans; **Fit field** resets |
| Select / move tool | **V** |
| Add performer tool | **A** |
| Text note tool | **T** |
| Play / pause | **Space** |
| Step one count | **← / →** |
| Delete selection | **Delete** |
| Undo / redo | **⌘Z / ⇧⌘Z** (Ctrl+Z / Ctrl+Y) |

## Roadmap

Roughly in order (details in [PLAN.md](PLAN.md)):

1. **Music sync:** play the drill against an mp3, compute measures from the meter, and lay out sets by musical selection.
2. **Pyware `.3dj` import.**
3. **Protected show hosting** for hosted links, so a band's drill isn't readable by anyone who finds the address (see PLAN.md).
4. Follow-the-leader paths with turns, markup that spans several sets, basketball courts and custom surfaces, and optional cloud sync and app-store versions.

## Running it yourself

You need [Node.js](https://nodejs.org/) 22 or newer.

```sh
npm install
npm run dev        # local editor at the address it prints
npm test           # unit tests
npm run typecheck  # TypeScript checks
npm run build      # production build in dist/
```

Every push to `main` runs the tests and publishes to GitHub Pages ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). A failing test stops the deploy.

### Code map
| Path | What's there |
|---|---|
| `src/engine/` | All the drill logic, with no UI: coordinates and readouts, show model, shapes, markup, undo history. Unit-tested. |
| `src/field/` | Drawing the field, performers, shapes and markup on a canvas |
| `src/ui/` | Sidebar, timeline, and top-bar controls |
| `src/print/` | Dot sheets and drill charts |
| `src/perform/` | Performer/staff view and the Share dialog |
| `public/` | App icons, manifest, offline service worker |

Positions are stored in **8-to-5 steps**: 1 step = 22.5 in, measured from where the 50 yard line meets the front sideline. +x points toward Side 2 and +y toward the back sideline. Every readout is computed from that.

## How decisions are made

Every design decision, who made it, and the options considered are logged in [DECISIONS.md](DECISIONS.md). If you're wondering why something works the way it does, look there first.

**Clean-room policy:** Freeform is written from scratch. Pyware and UDB were studied only through their behavior and documentation, never by decompiling them, and no third-party code or show files are in this repo.

## Contributing

Issues and pull requests are welcome, especially from drill writers and band directors who can say how things *should* work. If you change or add a feature, please update this README and add an entry to DECISIONS.md in the same change.

## License

[MIT](LICENSE) © Jason Tiller and Freeform contributors.
