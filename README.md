<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/freeform-logo-dark.svg">
    <img src="brand/freeform-logo-light.svg" alt="Freeform" width="420">
  </picture>
</h1>

<p align="center"><em>Drill, without the bill.</em></p>

**Free, open-source drill design for marching bands and drum corps.**

Freeform is a browser-based drill writer: put performers on a football field, build sets, animate the moves count by count, and print dot sheets and drill charts. It's inspired by Pyware and the Ultimate Drill Book, with one goal: take licensing cost off the table for school and community programs.

**Use it:** <https://tillerdawg.github.io/Freeform_2/>. No account and no install. It also works offline and can be added to your phone or tablet's home screen. Write drill on a computer or tablet. It needs a current Chrome, Edge, Firefox or Safari, or iPadOS/iOS 16.4 or later (any iPad from 2017 on); an older browser gets a page saying so instead of a blank screen. Phones open only the performer view (with Staff and Director view for directors); there's no editor on a phone.

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
- **Roster:** each dot can have the person who marches it. Click a dot and its **Name** is at the top of **Selection** in the sidebar (type to assign, clear to unassign); the sidebar's **Roster** list shows every dot with its name (click a label to select that dot). Pyware imports fill it in from the names in the file. **Import a list…** (in Roster) takes a list from a spreadsheet: copy the cells in Excel and paste them, or choose a CSV file (for an .xlsx, copy the cells or Save As CSV). Columns are found by their headers (Name, or First and Last; Instrument or Section; Dot, Code, Label or Rank) or, with no header row, by what's in them, and you can change any column it read wrong. Instruments match your sections by name, letter or common abbreviation (Tpt, Mello, Bari, Euph, Quads, Guard…; a lone "Sax" means alto). You see every row's result before anything changes: a row with a dot code (P4) names that dot, or adds it if it doesn't exist yet; a row with just an instrument names that section's next unnamed dot, or adds a new one; for an instrument that matches no section (Bassoon, Oboe), you choose which section those players march with (a bassoonist who marches baritone) or leave them off, once per instrument, before Apply; rows it can't place (a code used twice, no name) are skipped and say why. New dots wait in rows on the front sideline, centered on the 50, in every set. Apply is one step, so Undo takes the whole import back. Printed dot sheets show each performer's name beside their label. Names are saved in the show, its autosave and exported `.freeform` files, and in encrypted hosted links (the phone's "who are you" list then shows each section in last-name order, "Smith, Pat · P4", with any unnamed dots after by number, and can be searched by name); plain share links leave them out, since anyone with the link can read it.
- **Sections and labels:** add performers by section (P1, P2… for trumpets). New shows start with F Flute, K Clarinet, A Alto Sax, X Tenor Sax, P Trumpet, H Mellophone, N Trombone, E Baritone, T Tuba, S Snare Drum, Q Quads, B Bass Drum, C Cymbals and G Color Guard (no front ensemble, since they're stationary). After editing the list, **Starting list ▾ → Use this list for new shows** makes new shows in that browser start with yours instead; **Back to Freeform's list** (in the same menu) undoes that. The line under it says which list new shows get. In the sidebar's **Sections** list you can give a section a **color** (its dots on the field, the phone's staff view and printed charts; **Clear colors** goes back to plain dots), rename a section, change its letter, add one, or delete one (if it has performers, you pick where they go). Drag a section's grip (the dotted handle at the left of its row) up or down to reorder the list by hand; a gold line shows where it will land (or focus the grip and use the up and down arrow keys). **Sort ▾** puts the whole list in **Score order** (woodwinds, brass, battery, front ensemble, drum major, guard; sections it doesn't recognize go last), **By letter** (A, B, C…) or **By name** (alphabetically by instrument). The list's order is the order the roster and printed dot sheets follow. Two sections sharing a letter are flagged, since their labels would clash. To split a section (Saxophone into Alto and Tenor), add the new section, select its performers on the field and change their **Section** in the sidebar; they're numbered after the section's current members. **#** on a section's row renumbers it 1, 2, 3…: **Close the gaps** keeps the order (X4 X5 X6 → X1 X2 X3), **Left to right** numbers from Side 1 to Side 2, and **Front to back** numbers rank by rank from the front (each rank from Side 1 to Side 2), both as they stand in the current set.
- **Letters or dots:** performers are drawn as their section letter, centered on their spot, with just the number as the label (P with 4), on the field, printed charts and both phone views (in a performer's own view: their letter on a gold badge, neighbors bright with their numbers, the rest of the band quieter). The picker beside the hashes (**Letters / Dots**) switches the show to dots labeled P4; the choice is saved with the show.
- **Readable dot labels:** labels never overlap each other or cover another dot. Each one sits above its dot, or below, right or left when that's taken; when a block is too tight for every label, some hide until you zoom in. Selected performers' labels get first pick. To choose yourself, select performers, open **Labels ▾** in the toolbar and click a direction on the compass for the current set (8 directions; the center **A** goes back to automatic), or **Hide**. For 3 or more dots, **Inside curve** / **Outside curve** point each label toward or away from the center of the curve its dot sits on (arcs, circles and S-curves). The compass lights the current direction when the selection shares one. Sides are on the field, so they turn with it in Facing front. A chosen side is still skipped rather than drawn over another label. The same placement is used in the phone's staff view, where labels stay upright in Facing front. Printed drill charts use it too, but there every label is always shown: one that doesn't fit beside its dot tries the other sides (a chosen side still comes first), then moves out until it finds room, with a thin leader line back to its dot. While a show plays, labels hide (they'd jump around), even on the sets; pause or stop anywhere and they're back. Selected performers keep their labels, and on the phone so does your own.
- **Selecting:** click, shift-click, or drag a box; drag to move, with whole-step, half-step, or free snapping. **Add to selection** (in the sidebar's Selection) makes every click, tap or box add to what's selected, for touch screens with no Shift key.
- **Exact placement:** type a coordinate ("2 steps outside the Side 2 45…") to place a performer precisely.
- **Sets:** add, delete, and set counts and measure numbers (as the score numbers them: a pickup bar is m. 1). Drag a set's button on the timeline to change which count it lands on; its neighbors stay put.
- **Timeline:** each set's button sits at the start of its yellow line (in a second row when sets are close together), with the line running up to it. A long piece opens zoomed in enough to read and scrolls sideways: swipe or use the mouse wheel over it, right-drag to pan (as on the field), or zoom with the magnifying glasses (zoom out, zoom in) and **Fit** at the timeline's right end. The timeline follows the playhead when you play or pick a set.
- **Count-first layout:** **Movements** (beside Music, under the field) takes the show's length up front: one movement per tune (Opener 416 counts), or several for a whole show in one file (Opener, Ballad, Closer). The timeline then runs to their total, with the part past the last set striped *Not written yet* (performers hold there, and music keeps playing), and each movement's name in blue where it starts (with a dashed blue line after the first); the timeline's readout and each printed drill chart's header name the movement too (a set hit on a movement's last count belongs to that movement). To add a set at a specific count, click that count on the timeline (between sets or in the unwritten part) and press **+ Add set**, or type the count in **at count** beside it. Every other set stays where it is: a set added mid-move splits that move (it takes everyone's spots at that count, so the drill looks the same) and is named as a sub-set (1A after 1, as in Pyware); one past the last set starts as a copy of it. **+ Add set** with the playhead on a set still adds 16 counts after it, moving later sets along.
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
- **Music:** the quickest way: in MuseScore, export the score as audio (mp3); then in **Music ▾** (beside Tempo), **Add the score (MuseScore)…** (the `.mscz`, or MusicXML or MIDI) and **Add the recording (mp3)…**, in either order. When both are in, every count comes from the score (as described under Counts from the score below), and Freeform warns if the recording's length doesn't match how long the score plays (the wrong pair). A score added first waits (✓) until its recording comes, for as long as the page stays open. Or add just a recording (mp3, m4a or wav) and tap the counts. Then **Tap counts…** plays it from the top while you press Space on every count, starting with count 0 (set 1); undo a tap, pause and resume, or start over. To fix part of it, set **Redo from count** first: playback starts two counts before it, earlier counts keep their taps, and later ones keep theirs too as long as your new taps still come before them (otherwise they're replaced). After that, Play runs the drill with the music, following it exactly (rubato and fermatas included); counts past your last tap keep its pace. Or, if the recording was rendered from the show's score (for example a MuseScore export of the score as audio), **Add the score…** takes every count's time from that score instead of tapping: choose the score's MuseScore file (`.mscz`, from MuseScore 3 or 4) or, from any notation program, its MusicXML, compressed MusicXML (`.mxl`) or MIDI. A MuseScore or MusicXML score gives the same timing MuseScore plays (meters, pickups, tempo marks and metronome marks, and fermatas held as MuseScore holds them), checked bar for bar against MuseScore's MIDI for three real shows; they count repeats once through, so the menu warns if the score has any (use the MIDI then). each set's counts are placed in the measures typed in its Measures box (a count on each beat, a steady number per bar such as "in one", or every other beat; a G.P. bar inside a set is skipped when the counts fit the bars that sound). Count 1 of a set is the downbeat of its first measure and the set is hit on its last count. The score's first bar is m. 1, as the score numbers it, so a pickup bar is m. 1; it should be its own short bar (a 1/4 bar for a one-beat pickup), not padded to a full bar with rests. Freeform never changes the counts or measures you wrote; it places counts around them. Counts always run on from the last set's hit, so a set whose noted measures overlap the set before it ("mm. 24-28" right after "mm. 21-24") or start a bar late still lands right when its counts do. Bars that no set covers (a G.P. between moves, or an intro before the first move) get a hold sub-set, as you'd write one in Pyware: named after the set before it (4 → 4A, 4A → 4B), standing on its spots, one count per beat; Undo takes it back out. A set can hit mid-bar: when its counts don't fit from a downbeat, they run on a beat at a time from the last set's hit, and that's fine as long as the hit lands in the set's last noted bar (15 counts over m. 17–20 in 4/4 hits on beat 3 of m. 20); the next set then counts on from beat 4, whether its measures are written from m. 20 or m. 21. A set whose counts fit its measures no way at all (48 counts over bars that add up to 52 beats, so the hit would fall before its last bar) keeps its counts, spread evenly over those bars, and the menu names it so you can check it. Sets with no measures count plain beats, and once their counts are placed, their **Measures** box fills in from where those counts fall in the score (count 1's bar through the last count's bar), so dot sheets show them; measures you typed are never changed. It also warns about a lone bar that's a fraction of a beat off from the bars around it (a 9/8 bar in the middle of 4/4): that's almost always a glitch from converting the score, which puts a hitch in the music. Once the recording has counts, its waveform runs along the bottom of the timeline, lined up with the counts (loud and quiet passages show where they fall in the drill). Uncheck **Play with music** to go back to Tempo. The recording stays in that browser and isn't put in the `.freeform` file (the taps are); on another computer, load the same file again and your taps still apply.
- **Step-size warnings:** moves bigger than 6-to-5 turn **yellow**, and bigger than 4-to-5 turn **red**, on both the paths and the timeline.
- **Follow-the-leader:** select the group in a set, open **FTL ▾**, pick a leader and an order; the followers march the leader's trail automatically. For a leader route with corners, **Add turns** and click each turn on the field in marching order (they snap like everything else; Esc when done); **Remove last turn** and **Straight route** undo them. With the group selected, each turn has a blue handle: drag it to move that turn. Turns go along when you drag, mirror (Flip), rotate or scale the whole group, and **Copy Side 1 → 2** (or 2 → 1) copies a follow-the-leader group to the other side: the performer who starts mirror-opposite the leader leads the copy, along the mirrored route. Everyone covers the leader's whole route at one steady step size, so turns never make anyone take a big step. Path lines and FTL trails also show mid-move, for the move you're in.

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
- **Hosted links (short, scannable, locked, update themselves):** under **Hosted link** in the Share dialog, download a **locked show file** (a `.freeform-locked` file), put it online, and paste its address. Freeform makes a short link and QR code and checks that the link opens the show. The file is encrypted in your browser, and the key travels only in the link's `#` part, which browsers never send to any server, so the file host (or anyone who finds the file) sees only scrambled data. *The link is the password:* share it only with your band. Phones download and unlock the file when the link opens, check it like any import, and keep it for offline use. Whenever a performer reopens the view while online, it quietly picks up your latest version, keeping their "who am I" choice. **To update:** download the locked file again (the dialog remembers each show's link and reuses its key) and replace the file online. **To cut off old links:** clear the address box and start over; phones that already opened the show keep their saved copy but get no more updates. **Publish to phones (one click):** connect Freeform to a public GitHub repository once (under **Hosted link**: the repository name and a fine-grained token that can write only to that repository, with *Contents: Read and write*; both stay in that browser, and the token is sent only to GitHub). After that, **Publish to phones** locks the show (with its music, if included), uploads it, and shows the link and QR code; **Publish update** after edits replaces the file at the same address, so the link and QR code never change. **Disconnect** forgets the token. To host the file yourself instead (under **Or host the file yourself**): a GitHub repository works (public is fine, since the file is encrypted): **Add file → Upload files**, then open the file and copy its **Raw** link; uploading again with the same name updates it at the same address (GitHub can take a few minutes to serve the new version). A secret gist also works for files without music, but the gist page fails on big files. The key of a downloaded locked file is remembered in that browser right away, so you can close the dialog to go upload it.
- **Music on phones:** if the show has music with its counts (tapped, or from the score), the locked file can carry the recording: **Include the music** under the download button (on by default; it shows the file's size; load the recording in **Music ▾** first if this browser doesn't have it). It's encrypted with the same key as the show. The phone keeps the recording for offline use, and **Play** then follows the music, count for count. **♪ Music** (beside the play buttons) turns it off to practice at a tempo instead. Plain share links can't carry audio. A file with music is a few MB (about 1.4× the mp3). When a phone reopens the show online it asks whether the file changed, and only downloads it again if it did.
- **Phones, tablets and the iPhone Duo:** a phone gets only the performer screen (no editing); an iPad gets the editor too. What counts as a phone is a touch screen whose window's short side is under 500 px, checked again whenever the window changes size. So an iPhone Duo is a phone when closed and a small iPad when open: closing it while editing (or starting Freeform while it's closed) shows the performer screen, and opening it goes straight to the editor (the show is saved on every change; the undo history starts over). Someone who opened a show link stays on the performer screen when they open the phone, and gets the **← Editor** button an iPad has. On a touch screen 700 px wide or less (an open Duo held upright), the toolbar shortens its labels to Select, Add, Delete and Reset so everything fits; on a short touch screen (650 px tall or less: an open Duo on its side) the sidebar starts hidden, as on an upright iPad, and the timeline slims down: one row of set buttons (close sets' buttons overlap, the current one on top; zoom the timeline to spread them), each move on one line, and the zoom buttons two across.
- **Opening a link:** on a phone, it opens a read-only performer screen. In the home-screen app (which has no address bar), tap **Scan QR code** (on the empty screen, or under **Open a different show**) and point the camera at the show's QR code, or paste the link (share or hosted) in the box next to it. On iPhone, scanning with the Camera app always opens Safari, which keeps its own copy separate from the home-screen app; Safari alone works fine too. On a computer or tablet, the editor's **Performer view** button (or **Open performer view here** in Share…) switches to the performer view, and **← Editor** switches back; phones have no editor. Each performer picks **who they are** (or **Staff** for the whole band); the choice and the show stay saved on that phone and work offline.
- **Yard lines always labeled:** in My view, or whenever you've zoomed in, a ruler along the bottom names every yard line on screen ("S1 40", "50", "S2 35", "G"), since the painted numbers are usually out of view.
- **Who are you:** the show's title sits at the top of the phone screen, and under it a big button with who you've picked. Tapping it opens a list of the whole band by section, with a search box ready for typing: any part of a first or last name ("pat sm", "smith"), a dot ("P4") or a section ("trump") narrows it as you type, ignoring capitals and accents, and Return picks the top match. **Staff (whole band)** is at the top of the list.
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
- **Import Pyware 3D drills (`.3dj`):** Import… also opens Pyware 3D files (tested with 2008–2010 shows). You get every set with its counts, named as the notes name it ("Set 2A", "Set: 3A", "Page: 2"; otherwise numbered), the set's notes (as ensemble notes), and measure numbers when the notes say "mm. 5-8". Moves that aren't straight lines in Pyware (follow-the-leader, delayed step-offs, rotations, a jump on count 1) come through count by count, with even steps: Freeform keeps each move's route but spaces its counts evenly along it while the performer is moving (Pyware's pages sometimes jump on one count), and leaves holds standing still. Playback follows those spots, the move's path line on the field follows the same route (a rotation draws as an arc, a follow-the-leader turns its corners), and the step size shown is that move's biggest single count. Edit either set's spot for that performer (or the set's counts) and the move becomes a straight line again. Sections come from Pyware's dot symbols. They're named by a common letter scheme (F Flute, K Clarinet, A Alto Sax, X Tenor Sax, P Trumpet, H Mellophone, N Trombone, E Baritone, T Tuba, S Snare, Q Quads, B Bass Drum, C Cymbals, G Color Guard) when the file's 3D figure agrees or there's no figure, otherwise after the figure (Trumpet, Clarinet…), otherwise "Symbol P", all ready to rename. They come in score order (Flute first, Color Guard last), not by letter. Labels are symbol plus Pyware's number (P1, P2…). Performers' names fill in the roster. Label sides come over too: where you moved a label in Pyware (above, below, either side or a diagonal, set by set), Freeform pins it there; labels Pyware left in its default spot stay automatic. Not brought over: drawn markup, and the 3D figures and colors. Backup or draft copies that have no sets saved are reported as such.

## Using it

The editor has the current set's controls across the top, and under them the **drill toolbar** in two rows. The first: **Select Performer(s)** and **Add Performer(s) ▾** (pick the section, then click the field to place each performer), **Delete Performer(s)** for the selection (it asks first), and Undo, Redo, Fit and the sidebar button at the right end. The second, for placing and moving: **Snap to grid** (just "Snap" on a narrow touch screen) (whole, half or free steps for dragging and adding) with **Apply** to round performers already off the grid; **Markup ▾** (text notes, arrows, drawing) on its own; then **Shape ▾**, **Transform ▾** (mirror, rotate and scale), **FTL ▾**, **Labels ▾** and **Reset to set N** (puts the selected performers back where they were in the set before, to start the set over). Both rows fit an iPad held either way; in a narrower window they scroll sideways, with Undo, Redo and Fit pinned at the end. The field is in the middle and the timeline across the bottom. The sidebar holds the show (file buttons, title, hashes), the set's ensemble notes, the selected performers' notes and coordinates, and sections. The **sidebar button** (a window with a panel on its right, after Fit) shows or hides it. On a wide window it sits beside the field; on a narrow one (under 900 px: an iPad in portrait, Split View) it starts hidden, and opening it lays it over the field's right side, so the field keeps its size and zoom.

| Action | How |
|---|---|
| Pan / zoom | Scroll / pinch (or ⌘/Ctrl + scroll); right-drag also pans; the **Fit** button (four corners) resets |
| Select / move tool | **V** |
| Add performer tool | **A** |
| Text note tool | **T** |
| Play / pause | **Space** |
| Step one count | **← / →** |
| Delete selection | **Delete** (asks first; Undo brings them back) |
| Undo / redo | **⌘Z / ⇧⌘Z** (Ctrl+Z / Ctrl+Y) |
| Close a toolbar menu | **Esc** (a second Esc clears the selection) |

**On an iPad (or any touch screen):** one finger does what the tool does (tap to select or add, drag to move, drag on open field for a box); two fingers pan and pinch-zoom the field. If a second finger lands while the first has started something (a dot added, a drag, a box), that is taken back and the fingers move the view instead. Performers, handles and markup can be grabbed within a fingertip's reach. Controls are at least 44 points (Apple's minimum), and the top bar, toolbar and timeline rows scroll sideways when they don't fit. On the timeline, tap a set to go to it, swipe to scroll, and touch and hold a set (it lifts) before dragging it to a new count, so a swipe can't move a set by accident. With a keyboard attached, the shortcuts above work too.

## Roadmap

Roughly in order (details in [PLAN.md](PLAN.md)):

1. Markup that spans several sets, basketball courts and custom surfaces, and optional cloud sync and app-store versions.

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
| `public/` | App icons, logos, link-preview image, manifest, offline service worker |

Positions are stored in **8-to-5 steps**: 1 step = 22.5 in, measured from where the 50 yard line meets the front sideline. +x points toward Side 2 and +y toward the back sideline. Every readout is computed from that.

## Logo

The logo, monogram, app icon, colors and the rules for using them are in [brand/](brand/README.md). The files are SVG with outlined letters, ready to use.

## How decisions are made

Every design decision, who made it, and the options considered are logged in [DECISIONS.md](DECISIONS.md). If you're wondering why something works the way it does, look there first.

**Clean-room policy:** Freeform is written from scratch. Pyware and UDB were studied only through their behavior and documentation, never by decompiling them, and no third-party code or show files are in this repo.

## Contributing

Issues and pull requests are welcome, especially from drill writers and band directors who can say how things *should* work. If you change or add a feature, please update this README and add an entry to DECISIONS.md in the same change.

## License

[MIT](LICENSE) © Jason Tiller and Freeform contributors.
