# Freeform

**Free, open-source drill design for marching bands and drum corps.**

Freeform is a browser-based drill writer: put performers on a football field, build sets, animate the moves count by count, and print dot sheets and drill charts. It's inspired by Pyware and the Ultimate Drill Book, with one goal: take licensing cost off the table for school and community programs.

**Use it:** <https://tillerdawg.github.io/Freeform_2/>. No account and no install. It also works offline and can be added to your phone or tablet's home screen. Write drill on a computer or tablet. Phones open only the performer view (with Staff and Director view for directors); there's no editor on a phone.

> **Status:** early, actively developed. The drill writer's core workflow, music sync in the editor, and a performer view for phones work today, and hosted links can carry the show's music to phones (see [Roadmap](#roadmap) for what's next). Shows are saved in your browser, in files you export, and in share links. There are no accounts or cloud sync.

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
- **Roster:** each dot can have the person who marches it. Click a dot and its **Name** is at the top of **Selection** in the sidebar (type to assign, clear to unassign); the sidebar's **Roster** list shows every dot with its name (click a label to select that dot). Pyware imports fill it in from the names in the file. **Import a list…** (in Roster) takes a list from a spreadsheet: copy the cells in Excel and paste them, or choose a CSV file (for an .xlsx, copy the cells or Save As CSV). Columns are found by their headers (Name, or First and Last; Instrument or Section; Dot, Code, Label or Rank) or, with no header row, by what's in them, and you can change any column it read wrong. Instruments match your sections by name, letter or common abbreviation (Tpt, Mello, Bari, Euph, Quads, Guard…; a lone "Sax" means alto). You see every row's result before anything changes: a row with a dot code (P4) names that dot, or adds it if it doesn't exist yet; a row with just an instrument names that section's next unnamed dot, or adds a new one; for an instrument that matches no section (Bassoon, Oboe), you choose which section those players march with (a bassoonist who marches baritone) or leave them off, once per instrument, before Apply; rows it can't place (a code used twice, no name) are skipped and say why. New dots wait in rows on the front sideline, centered on the 50, in every set. Apply is one step, so Undo takes the whole import back. Printed dot sheets show each performer's name beside their label. Names are saved in the show, its autosave and exported `.freeform` files, and in encrypted hosted links (the phone's "who are you" list then shows P4 · name); plain share links leave them out, since anyone with the link can read it.
- **Sections and labels:** add performers by section (P1, P2… for trumpets). New shows start with F Flute, K Clarinet, A Alto Sax, X Tenor Sax, P Trumpet, H Mellophone, N Trombone, E Baritone, T Tuba, S Snare Drum, B Bass Drum, Q Quads, C Cymbals and G Color Guard (no front ensemble, since they're stationary). After editing the list, **Use as my starting list** makes new shows in that browser start with yours instead; **Back to Freeform's list** undoes that. In the sidebar's **Sections** list you can give a section a **color** (its dots on the field, the phone's staff view and printed charts; **Clear colors** goes back to plain dots), rename a section, change its letter, add one, or delete one (if it has performers, you pick where they go). Two sections sharing a letter are flagged, since their labels would clash. To split a section (Saxophone into Alto and Tenor), add the new section, select its performers on the field and change their **Section** in the sidebar; they're numbered after the section's current members. **#** on a section's row renumbers it 1, 2, 3…: **Close the gaps** keeps the order (X4 X5 X6 → X1 X2 X3), **Left to right** numbers from Side 1 to Side 2, and **Front to back** numbers rank by rank from the front (each rank from Side 1 to Side 2), both as they stand in the current set.
- **Letters or dots:** performers are drawn as their section letter, centered on their spot, with just the number as the label (P with 4), on the field, printed charts and both phone views (in a performer's own view: their letter on a gold badge, neighbors bright with their numbers, the rest of the band quieter). The picker beside the hashes (**Letters / Dots**) switches the show to dots labeled P4; the choice is saved with the show.
- **Readable dot labels:** labels never overlap each other or cover another dot. Each one sits above its dot, or below, right or left when that's taken; when a block is too tight for every label, some hide until you zoom in. Selected performers' labels get first pick. To choose yourself, select performers, open **Labels ▾** in the toolbar and click a direction on the compass for the current set (8 directions; the center **A** goes back to automatic), or **Hide**. For 3 or more dots, **Inside curve** / **Outside curve** point each label toward or away from the center of the curve its dot sits on (arcs, circles and S-curves). The compass lights the current direction when the selection shares one. Sides are on the field, so they turn with it in Facing front. A chosen side is still skipped rather than drawn over another label. The same placement is used in the phone's staff view, where labels stay upright in Facing front. Printed drill charts use it too, but there every label is always shown: one that doesn't fit beside its dot tries the other sides (a chosen side still comes first), then moves out until it finds room, with a thin leader line back to its dot. While a show plays, labels hide (they'd jump around), even on the sets; pause or stop anywhere and they're back. Selected performers keep their labels, and on the phone so does your own.
- **Selecting:** click, shift-click, or drag a box; drag to move, with whole-step, half-step, or free snapping.
- **Exact placement:** type a coordinate ("2 steps outside the Side 2 45…") to place a performer precisely.
- **Sets:** add, delete, and set counts and measure numbers (as the score numbers them: a pickup bar is m. 1). Drag a set's button on the timeline to change which count it lands on; its neighbors stay put.
- **Undo / redo** for every edit (⌘Z / Ctrl+Z).

### Shapes and transforms
- **Shapes:** select performers, then shape them into a **Line, Arc, Curve, Bézier, Circle, or Block**, with drag handles. Space them evenly or at a fixed interval.
- **Who goes where:** each performer is assigned the spot that minimizes total travel from the previous set, so paths never cross.
- **Bézier joints** stay smooth unless you hold Option/Alt.
- **Mirror** across the 50 or front to back, or copy one side onto the other.
- **Rotate and scale** a selection around its center (Transform ▾), and round a selection back onto the grid with **Snap to grid → Apply** (with a warning if two performers land on the same spot).

### Moves and playback
- **Timeline:** one segment per move with a tick for every count. Click any count to see exactly where everyone is.
- **Playback** at any tempo. Play always starts where you are (pick a set, then Play) and goes forward. Set a range of sets to stop, or loop, at the range's end; from outside the range it plays on to the end of the show.
- **Music:** **Music ▾** (beside Tempo) loads the show's recording (mp3, m4a or wav). Then **Tap counts…** plays it from the top while you press Space on every count, starting with count 0 (set 1); undo a tap, pause and resume, or start over. After that, Play runs the drill with the music, following it exactly (rubato and fermatas included); counts past your last tap keep its pace. Or, if the recording was rendered from the show's score (for example a MuseScore export of the score as audio), **Counts from the score's MIDI…** takes every count's time from that score's MIDI file instead of tapping: each set's counts are placed in the measures typed in its Measures box (a count on each beat, a steady number per bar such as "in one", or every other beat; a G.P. bar inside a set is skipped when the counts fit the bars that sound). Count 1 of a set is the downbeat of its first measure and the set is hit on its last count. The MIDI's first bar is m. 1, as the score numbers it, so a pickup bar is m. 1; it should be its own short bar (a 1/4 bar for a one-beat pickup), not padded to a full bar with rests. If a set's counts don't fit its noted measures but do fit once the uncovered bars just before it are included (the note's measures are out of date), the set is widened to cover them and the menu says so. Bars that no set covers (a G.P. between moves, or an intro before the first move) get a hold sub-set, as you'd write one in Pyware: named after the set before it (4 → 4A, 4A → 4B), standing on its spots, one count per beat; Undo takes it back out. Sets with no measures count plain beats, and the menu lists any set whose counts don't fit its measures. It also warns about a lone bar that's a fraction of a beat off from the bars around it (a 9/8 bar in the middle of 4/4): that's almost always a glitch from converting the score, which puts a hitch in the music. Uncheck **Play with music** to go back to Tempo. The recording stays in that browser and isn't put in the `.freeform` file (the taps are); on another computer, load the same file again and your taps still apply.
- **Step-size warnings:** moves bigger than 6-to-5 turn **yellow**, and bigger than 4-to-5 turn **red**, on both the paths and the timeline.
- **Follow-the-leader:** pick a leader and an order; the followers march the leader's trail automatically.

### Markup and notes
- **Per-set markup:** text notes, arrows, and freehand drawing on each set.
- **Ensemble notes** (printed under a set's chart, for everyone) and **Performer notes** (printed on selected performers' dot sheets).

### Printing
- **Dot sheets:** 4 cards per page, with set, counts, measures, and coordinates, plus that performer's notes. Print for everyone, one section, or a selection.
- **Drill charts:** one page per set, with labeled dots (every label shown, with leader lines where a label had to move out from its dot), markup, and notes. Black on white, for copiers; sections with a color print as colored dots (shades of gray on a black-and-white printer).
- **PDFs:** use your browser's print dialog and choose **Save as PDF**.

### Performer view (phones)
- **Share links:** in the editor, **Share…** makes a link with the whole show packed inside it. A 150-performer, 40-set show is about 40 KB. Text it, email it, or post it; there's no server involved. Anyone with the link can view the show, so performers' names are left out of share links (hosted links keep them, encrypted). Later edits aren't sent automatically, so share a new link after changes.
- **QR codes:** when the link is small enough to scan (roughly a small show with a few sets), the Share dialog shows a QR code to put on a screen or print for rehearsal.
- **Hosted links (short, scannable, locked, update themselves):** under **Hosted link** in the Share dialog, download a **locked show file** (a `.freeform-locked` file), put it online, and paste its address. Freeform makes a short link and QR code and checks that the link opens the show. The file is encrypted in your browser, and the key travels only in the link's `#` part, which browsers never send to any server, so the file host (or anyone who finds the file) sees only scrambled data. *The link is the password:* share it only with your band. Phones download and unlock the file when the link opens, check it like any import, and keep it for offline use. Whenever a performer reopens the view while online, it quietly picks up your latest version, keeping their "who am I" choice. **To update:** download the locked file again (the dialog remembers each show's link and reuses its key) and replace the file online. **To cut off old links:** clear the address box and start over; phones that already opened the show keep their saved copy but get no more updates. For hosting, a secret GitHub gist works (drag the file onto the gist, copy its **Raw** link, and remove the long code after `/raw/` so it always serves the newest version).
- **Music on phones:** if the show has music with its counts (tapped, or from the score's MIDI), the locked file can carry the recording: **Include the music** under the download button (on by default; it shows the file's size; load the recording in **Music ▾** first if this browser doesn't have it). It's encrypted with the same key as the show. The phone keeps the recording for offline use, and **Play** then follows the music, count for count. **♪ Music** (beside the play buttons) turns it off to practice at a tempo instead. Plain share links can't carry audio. A file with music is a few MB (about 1.4× the mp3), and phones download it again each time they reopen the show online, to check for updates.
- **Opening a link:** on a phone, it opens a read-only performer screen. In the home-screen app (which has no address bar), tap **Scan QR code** (on the empty screen, or under **Open a different show**) and point the camera at the show's QR code, or paste the link (share or hosted) in the box next to it. On iPhone, scanning with the Camera app always opens Safari, which keeps its own copy separate from the home-screen app; Safari alone works fine too. On a computer or tablet, the editor's **Performer view** button (or **Open performer view here** in Share…) switches to the performer view, and **← Editor** switches back; phones have no editor. Each performer picks **who they are** (or **Staff** for the whole band); the choice and the show stay saved on that phone and work offline.
- **Yard lines always labeled:** in My view, or whenever you've zoomed in, a ruler along the bottom names every yard line on screen ("S1 40", "50", "S2 35", "G"), since the painted numbers are usually out of view.
- **Pinch to zoom:** in My view you stay centered on your dot. In Whole field you can also drag around. **Reset zoom** or switching views puts it back.
- **Screen stays awake** while the show is playing, where the browser allows it (on iPhone, recent iOS versions).
- **My dot:** highlighted, with **My view** following me through each move, my path into the next set (including follow-the-leader trails), and where I end up.
- **Facing front:** turns the field around to match what I see facing the audience: front sideline at the top, Side 1 on my right. **Director view** is the editor's orientation.
- **Who's around me:** my nearest neighbors (up to 4, within 10 steps) are labeled on the field, and an **Around you** list says where each one is, e.g. "P5 · 4 steps toward Side 1", "P2 · 4 steps in front". Directions are in field terms, so they mean the same in either view.
- **Readouts:** my coordinate now and in the next set, with counts, measures and step size (colored like the editor's warnings), plus my performer notes and the ensemble notes.
- **Controls:** play at any tempo, step count by count, scrub, or tap a set number to jump to it (the row of set buttons scrolls sideways in long shows, with faded edges showing there's more, and keeps the current set centered); Play starts from where you are. Works in portrait and landscape.

### Saving
- **Autosave:** your show saves in this browser automatically.
- **Export / Import** a `.freeform` file (older `.freeform.json` files still import) to back up a show, share it, or move it to another browser or device. *Export is your real backup:* the autosave lives only in that one browser.
- **Import Pyware 3D drills (`.3dj`):** Import… also opens Pyware 3D files (tested with 2008–2010 shows). You get every set with its counts, named as the notes name it ("Set 2A", "Set: 3A", "Page: 2"; otherwise numbered), the set's notes (as ensemble notes), and measure numbers when the notes say "mm. 5-8". Moves that aren't straight lines in Pyware (follow-the-leader, delayed step-offs, rotations, a jump on count 1) come through count by count, with even steps: Freeform keeps each move's route but spaces its counts evenly along it while the performer is moving (Pyware's pages sometimes jump on one count), and leaves holds standing still. Playback follows those spots, the move's path line on the field follows the same route (a rotation draws as an arc, a follow-the-leader turns its corners), and the step size shown is that move's biggest single count. Edit either set's spot for that performer (or the set's counts) and the move becomes a straight line again. Sections come from Pyware's dot symbols. They're named by a common letter scheme (F Flute, K Clarinet, A Alto Sax, X Tenor Sax, P Trumpet, H Mellophone, N Trombone, E Baritone, T Tuba, S Snare, B Bass Drum, Q Quads, C Cymbals, G Color Guard) when the file's 3D figure agrees or there's no figure, otherwise after the figure (Trumpet, Clarinet…), otherwise "Symbol P", all ready to rename. Labels are symbol plus Pyware's number (P1, P2…). Performers' names fill in the roster. Label sides come over too: where you moved a label in Pyware (above, below, either side or a diagonal, set by set), Freeform pins it there; labels Pyware left in its default spot stay automatic. Not brought over: drawn markup, and the 3D figures and colors. Backup or draft copies that have no sets saved are reported as such.

## Using it

The editor has the current set's controls across the top, and under them the **drill toolbar**: **Select Performer(s)** and **Add Performer(s) ▾** (pick the section, then click the field to place each performer), then **Snap to grid** (whole, half or free steps for dragging and adding) with **Apply** to round performers already off the grid; **Markup ▾** (text notes, arrows, drawing) on its own; then **Shape ▾**, **Transform ▾** (mirror, rotate and scale), **FTL ▾**, **Labels ▾**, **Reset to set N** (puts the selected performers back where they were in the set before, to start the set over) and Delete for the selection, with Undo, Redo and Fit (icons) at the end. The field is in the middle and the timeline across the bottom. The sidebar holds the show (file buttons, title, hashes), the set's ensemble notes, the selected performers' notes and coordinates, and sections.

| Action | How |
|---|---|
| Pan / zoom | Scroll / pinch (or ⌘/Ctrl + scroll); right-drag also pans; the **Fit** button (four corners) resets |
| Select / move tool | **V** |
| Add performer tool | **A** |
| Text note tool | **T** |
| Play / pause | **Space** |
| Step one count | **← / →** |
| Delete selection | **Delete** |
| Undo / redo | **⌘Z / ⇧⌘Z** (Ctrl+Z / Ctrl+Y) |
| Close a toolbar menu | **Esc** (a second Esc clears the selection) |

## Roadmap

Roughly in order (details in [PLAN.md](PLAN.md)):

1. Laying out sets by musical selection (total counts up front).
2. Follow-the-leader paths with turns, markup that spans several sets, basketball courts and custom surfaces, and optional cloud sync and app-store versions.

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
| `src/engine/` | All the drill logic, with no UI: coordinates and readouts, show model, shapes, markup, undo history, share links and encrypted hosted files, QR codes, and the Pyware `.3dj` reader. Unit-tested. |
| `src/field/` | Drawing the field, performers, shapes and markup on a canvas, and dot-label placement |
| `src/ui/` | Drill toolbar, sidebar, timeline, and top-bar controls |
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
