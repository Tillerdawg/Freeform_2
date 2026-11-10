# Decisions

Each entry: timestamp, who decided, context, options considered, decision.

## 2026-10-22 11:30 EDT — Reverse-engineering scope
- **Who:** Jason Tiller (proposed by Claude)
- **Context:** Freeform is modeled on Pyware and UDB, which are commercial and licensed. Decompiled code in a public MIT repo is a copyright/EULA takedown risk.
- **Options:** (a) file-format analysis only; (b) behavior only — study UI/features through use, docs, screenshots; (c) full decompilation.
- **Decision:** (b) Behavior only. No binary analysis of Pyware or UDB. All Freeform code is written fresh (clean-room).

## 2026-10-22 11:30 EDT — Use of Jason's sample show files
- **Who:** Jason Tiller (proposed by Claude)
- **Context:** Jason has the UDB app and sample show files. Reading the structure of his own data files supports import/interoperability without touching vendor binaries.
- **Options:** inspect files for import support; don't inspect.
- **Decision:** Inspect them to support import. Files live in `Examples_Drill/`, which is git-ignored and never pushed.

## 2026-10-22 11:30 EDT — rea toolkit
- **Who:** Jason Tiller (proposed by Claude)
- **Context:** Jason asked to use github.com/morluto/rea. It is mainly a binary/app decompilation MCP server, which the behavior-only decision rules out.
- **Options:** install now for website/capture tools; skip.
- **Decision:** Skip for now. Revisit if file-format work turns out to need it.

## 2026-10-22 11:30 EDT — License
- **Who:** Jason Tiller
- **Context:** Choosing an open-source license.
- **Options:** GPL-3.0, MIT, AGPL-3.0, decide later.
- **Decision:** MIT.

## 2026-10-22 11:30 EDT — Repository hosting
- **Who:** Jason Tiller (proposed by Claude)
- **Context:** Neither the cloud workspace nor Jason's Mac had a GitHub login.
- **Options:** Jason creates an empty repo and Claude pushes; Jason pushes from his Mac.
- **Decision:** Repo: github.com/Tillerdawg/Freeform_2. Jason created it empty; Claude pushes to it. Default branch `main`. Commits authored as Jason Tiller <49928484+Tillerdawg@users.noreply.github.com> so his personal email stays out of public history.

## 2026-10-22 11:50 EDT — Show storage and sharing
- **Who:** Jason Tiller (options from Claude)
- **Context:** Needs no server cost for schools, but cloud sync like UDB's is convenient.
- **Options:** files only; hosted cloud sync; files first, cloud later.
- **Decision:** Files first, cloud later. A show is one versioned JSON file, designed so optional sync can be added later without changing the format.

## 2026-10-22 11:50 EDT — Performer app delivery
- **Who:** Jason Tiller (options from Claude)
- **Context:** iOS/Android performer app. Store apps cost fees and add review overhead.
- **Options:** installable web app (PWA); native store apps; web first, store later.
- **Decision:** PWA first (offline, Add to Home Screen), sharing code with the designer. Wrap for the stores (e.g. Capacitor) once it's proven.

## 2026-10-22 11:50 EDT — Milestone 1 scope
- **Who:** Jason Tiller (options from Claude)
- **Context:** Choosing the first usable deliverable.
- **Options:** core designer; performer viewer with .3dj import; coordinate engine only.
- **Decision:** Core designer. See PLAN.md.

## 2026-10-22 11:50 EDT — Maintainers
- **Who:** Jason Tiller
- **Context:** Who maintains the code shapes how mainstream the stack should be.
- **Options:** AI agents + Jason; open-source volunteers; Jason learning to code.
- **Decision:** Mostly AI agents, reviewed and steered by Jason. Favor mainstream, well-documented tools.

## 2026-10-22 11:50 EDT — Coordinate readout precision
- **Who:** Jason Tiller (options from Claude)
- **Options:** quarter, half, tenth, or whole steps.
- **Decision:** Quarter steps (e.g. "2.75 steps outside the Side 2 45"). Positions are stored at full precision; only readouts round.

## 2026-10-22 11:50 EDT — Step-size warnings
- **Who:** Jason Tiller (options from Claude)
- **Context:** IDEA.md: warn past 6-to-5; 4-to-5 is the practical max.
- **Options:** two tiers; red past 6-to-5 only; configurable per show.
- **Decision:** Two tiers: yellow when a step is longer than 6-to-5 (30 in), red when longer than 4-to-5 (45 in). The path and the timeline step size take the warning color. Step size = straight-line distance ÷ counts (FTL uses actual path length).

## 2026-10-22 11:50 EDT — Hash mark positions
- **Who:** Jason Tiller confirmed Claude's values
- **Decision:** Measured from the nearer sideline: High school 53'4" (28.44 steps); College/DCI 60' (32 steps); NFL 70'9" (37.73 steps). Field is 160' wide (85.33 steps) and 100 yd between goal lines (160 steps).

## 2026-10-22 11:50 EDT — Tech stack
- **Who:** Claude (Jason holds veto)
- **Context:** Agent-maintained, browser designer plus PWA performer app, file-based.
- **Options:** TypeScript+React+Vite (mainstream, most agent/volunteer familiarity); Svelte (smaller, less common); vanilla JS (no framework, more hand-written UI). Rendering: Canvas 2D (fast for hundreds of animated dots); SVG (simpler hit-testing, slows with many animated elements); WebGL/Konva (more power or deps than needed).
- **Decision:** TypeScript + React + Vite, Canvas 2D for the field, vite-plugin-pwa for offline/installable, Vitest for tests. One repo: the designer and performer views are routes in the same app.

## 2026-10-22 11:50 EDT — Internal coordinate model
- **Who:** Claude
- **Context:** Every feature (readouts, step sizes, FTL, export) shares one coordinate system.
- **Options:** inches; yards; 8-to-5 steps.
- **Decision:** Floating-point 8-to-5 steps (1 step = 22.5 in). Origin is where the 50 yard line meets the front sideline. +x points toward Side 2 (director's right), +y points toward the back sideline. Text readouts are derived from this.

## 2026-10-22 12:05 EDT — Direct GitHub push from Claude's sandbox
- **Who:** Jason Tiller (method proposed by Claude)
- **Context:** Pushes were going through a relay because neither of Claude's environments had GitHub credentials.
- **Options:** keep the relay; fine-grained personal access token; SSH deploy key (not possible, since the sandbox only allows HTTPS).
- **Decision:** Fine-grained PAT limited to Tillerdawg/Freeform_2, with only Contents read/write. It's kept in the sandbox's private home (git credential store), outside the synced project folder. `*.gh-token` is git-ignored. The relay is the fallback if a new session loses the credential.

## 2026-10-22 12:10 EDT — Readout wording for cases IDEA.md doesn't cover
- **Who:** Claude (Jason holds veto)
- **Context:** Building the coordinate engine. IDEA.md doesn't spell out these cases.
- **Decision:**
  - Exactly on a yard line: "On the Side 1 45". Exactly on a reference: "On Front Hash".
  - Near the 50: "2 steps outside the 50 on Side 2".
  - Exactly 4 steps from the 50: "Splitting 45 and 50 on Side 2". The splitting rule wins over "outside the 50", for consistency.
  - Goal lines are called "Goal Line"; beyond them reads "outside the Side 1 Goal Line".
  - Front-to-back phrasing: "in front of" is toward the front sideline, "behind" toward the back sideline, e.g. "5 steps behind Front Sideline".
  - If a point is exactly equidistant from two references, the more frontward one wins.
  - Rounding to quarter steps applies to the distance from the reference, since that's what performers count. This matters for high school hashes, which don't fall on whole steps.
- **Other options:** "4 steps outside the 50"; rounding the position instead of the distance.

## 2026-10-22 12:10 EDT — FTL model
- **Who:** Claude
- **Context:** IDEA.md's FTL example.
- **Decision:** The trail runs leader end ← leader start ← each follower's start, in order. Every performer travels the leader's path length along the trail at the leader's pace. This reproduces the IDEA.md example exactly, and that example is a unit test.

## 2026-10-22 13:20 EDT — Field view orientation and drawing
- **Who:** Claude (Jason holds veto)
- **Context:** First on-screen field.
- **Decision:** Director's view: front sideline at the bottom, Side 1 on the left. The 8-to-5 grid is drawn from the front sideline, with every 4th step (the "splitting" lines) drawn a little brighter, and it hides when zoomed far out. Hash ticks at every yard. Back-side numbers are rotated to read from the back sideline. Yard numbers sit at one approximate depth for all presets (logged as a code shortcut). Mouse wheel zooms around the cursor; drag pans. Hovering shows the live coordinate readout.
- **Other options:** an audience/press-box view as the default (a view toggle can come later for the performer app).

## 2026-10-22 13:25 EDT — Yard numbers are not coordinate references
- **Who:** Jason Tiller
- **Context:** Some drill writers use landmarks like "top of the numbers." Yard number placement is not consistent from field to field.
- **Options:** use numbers as front-to-back references; references limited to sidelines and hashes.
- **Decision:** Readouts reference only the sidelines and hashes. Yard numbers are drawn for orientation only. Their approximate position is fine.

## 2026-10-22 13:35 EDT — Hash stripes on yard lines
- **Who:** Jason Tiller
- **Context:** On the field view, the hash depth wasn't marked where a yard line crosses it.
- **Decision:** Draw a short stripe parallel to the sideline across every yard line (goal lines included) at both hash depths, 2 ft long to match the hash ticks.

## 2026-10-22 13:40 EDT — No hash ticks between yard lines
- **Who:** Jason Tiller
- **Context:** The field view drew football-style hash ticks at every yard as well as the new stripes on yard lines.
- **Decision:** Drop the per-yard ticks. The hash shows only as the stripes across each yard line.

## 2026-10-22 13:45 EDT — Real-world line dimensions
- **Who:** Jason Tiller
- **Context:** Field lines should be drawn to scale.
- **Decision:** All yard lines are 4 in wide. Hash marks are 24 in long and 4 in wide, centered on their coordinate. When zoomed far out, lines never draw thinner than 1 screen pixel, so they stay visible. The outer boundary is still a thicker frame, pending Jason's call.

## 2026-10-22 13:50 EDT — Line widths and measurement edges
- **Who:** Jason Tiller (edge convention proposed by Claude)
- **Context:** Real fields vary (e.g. NCAA sidelines may be wider, goal lines 4 or 8 in). Freeform isn't for playing football.
- **Options:** per-level widths; a per-field setting; 4 in everywhere.
- **Decision:** Every line is 4 in at every level. Coordinates count from the field's inside edge. Sidelines and end lines are drawn outside the field, with their inner edge on the coordinate. Goal lines are drawn into the end zone, with their field-side edge on the coordinate. Yard lines and hashes are centered. This replaces the "thicker frame" note above.

## 2026-10-22 14:05 EDT — Stylized 84-step field (replaces "Hash mark positions" above)
- **Who:** Jason Tiller (options from Claude)
- **Context:** Drill software and drill sheets use a tidy whole-step field, not exact survey dimensions. Source: "The Dot System, Part IV" (Colleyville Heritage Band PDF) gives college hashes as 32 steps from the sideline with 20 steps between them.
- **Options:** keep real dimensions (85.33 steps wide, HS hash 28.44, NFL 37.73); stylized 84 steps wide with whole-step hashes. HS: 28/28/28 or 32/20/32. NFL: 36/12/36 or 37/10/37.
- **Decision:** Stylized, 84 steps wide at every level. Sideline-to-hash / between hashes / hash-to-sideline: High school 28/28/28, College/DCI 32/20/32, NFL 36/12/36. Yard lines stay 8 steps apart. The line widths in inches are still drawn to the 22.5-in step.

## 2026-10-22 14:12 EDT — Yard number placement
- **Who:** Jason Tiller
- **Decision:** The bottoms of the yard numbers sit 8 steps from their sideline (front numbers from the front sideline, back numbers from the back sideline). The digits are 4 steps tall (Jason, for looks; real numbers are 6 ft = 3.2 steps). Still decorative only.

## 2026-10-22 14:15 EDT — Yard numbers centered on yard lines
- **Who:** Jason Tiller
- **Decision:** The two digits sit on either side of their yard line, with equal space between the line and each digit's inked edge. The gap is 18 in from the line's center to a straight edge (the stems of 1 and 4). Round edges (0, 2, 3, 5) sit 4 in closer, a standard optical correction, because round shapes look farther from a line than straight ones at the same distance. Jason widened the gap from 1 ft after the "10" looked uneven.

## 2026-10-22 14:40 EDT — Performer labels and sections
- **Who:** Jason Tiller (options from Claude)
- **Options:** section letter + number; free text; numbers only.
- **Decision:** Section letter + number (T1, T2…). Numbers are assigned per section in the order performers are added. New shows start with common sections (F Flute, C Clarinet, X Saxophone, T Trumpet, M Mellophone, B Low Brass, U Tuba, S Snare, Q Tenors, D Bass Drum, Y Cymbals, P Front Ensemble, G Color Guard). Their letters and names can be edited per show; Claude picked the default letters.

## 2026-10-22 14:40 EDT — Milestone 1 placement and timeline features
- **Who:** Jason Tiller
- **Decision:** Click to add; select, shift-click, and box-select; drag to move with a snap toggle (whole, half, free); exact coordinate entry. Jason added a counts timeline: one segment per move, sized by its counts, for scrubbing between sets count by count.

## 2026-10-22 14:40 EDT — Editing model and controls
- **Who:** Claude (Jason holds veto)
- **Decision:**
  - A set's `counts` is the length of the move into it. Time is measured in counts from set 1.
  - Positions can only be edited when the timeline sits exactly on a set; mid-move is view only.
  - A new set starts as a copy of the current one, 16 counts by default.
  - A performer added in any set appears at that spot in every set.
  - Dragging a group snaps the grabbed performer to the grid, and the rest of the group keeps its shape.
  - Scroll or two-finger trackpad pans; pinch or ⌘/Ctrl+scroll zooms; right- or middle-drag pans. This frees left-drag for box selection.
  - Keys: Space play/pause, ←/→ one count, V select, A add, Delete removes, Esc clears the selection.
  - Each timeline segment shows that move's largest step, colored by tier. Paths into the current set are drawn dashed in the tier color.
- **Other options:** editing mid-move by moving the destination; drag-pans with a modifier for box select.

## 2026-10-22 14:40 EDT — Saving
- **Who:** Claude
- **Decision:** The browser autosaves every change, so a refresh or crash can't lose work. Save downloads `<title>.freeform.json`; Open loads one. Opened files are checked (format marker, version, finite positions) before use, because files from disk are untrusted. There's no undo yet.

## 2026-10-22 16:45 EDT — Crash screen and autosave recovery
- **Who:** Claude
- **Context:** Jason hit a crash on Play: playback could step to a negative count. That's now fixed. A crash used to leave a blank page, and a corrupt autosave would crash on every reload.
- **Decision:** A crash now shows the error, with Reload, Download autosaved show, and Reset to a new show. If an autosave won't load, it's kept under `freeform:autosave:unreadable` before a fresh show replaces it. Show files are now checked for every field the app renders (names, ids, numbers), not just positions.

## 2026-10-22 16:55 EDT — Count ticks on the timeline; selecting mid-move
- **Who:** Jason Tiller (tick details and mid-move selection by Claude)
- **Decision:** The timeline gets a tick for every count, with every 4th count within a move a little taller; set boundaries keep their yellow line. Clicking anywhere snaps to the nearest count, so clicking a tick lands exactly on it. The current count's tick is highlighted. Mid-move, performers can be selected, but not moved or added. The sidebar shows the selected performer's coordinate at the current count.

## 2026-10-22 16:50 EDT — Count-first layout: later sets stay pinned
- **Who:** Jason Tiller
- **Context:** A future feature: enter a selection's total counts and place sets at specific counts.
- **Options:** later sets keep their absolute counts; later sets shift along with a moved set.
- **Decision:** Later sets stay where they were placed. Moving set 3 from count 24 to 28 makes the move into set 3 longer and the move out of it shorter; set 4 stays at count 48. The current "counts in" field still shifts later sets, as it does today.

## 2026-10-22 17:15 EDT — Undo/redo
- **Who:** Jason Tiller asked; step rules by Claude
- **Decision:** Undo/redo keeps whole-show snapshots, up to 200 steps per browser session. One step = everything from one click, tap, or shortcut until the next one. Continuous changes after it merge into that step: a held drag (however slow), or typing (until a half-second pause). Fast clicks are separate steps. Keys: ⌘Z / Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y, plus Undo and Redo buttons. Inside text boxes, ⌘Z is the browser's own text undo. New, Open, and every set or performer edit can be undone; playback, selection, and zoom are not edits. History is not saved with the show or kept after a reload.

## 2026-10-22 21:05 EDT — Yard numbers outside the field (replaces "bottoms 8 steps in")
- **Who:** Jason Tiller
- **Decision:** The yard numbers sit outside the sidelines. The top of each front number is 2 steps in front of the front sideline, and the top of each back number is 2 steps behind the back sideline. They're 4 steps tall, so each spans 2 to 6 steps outside its sideline, still facing its own sideline. Fit field leaves room for them. Why: it keeps the playing surface uncluttered so formations read clearly. No green apron or extended yard lines.

## 2026-10-22 21:20 EDT — Range playback
- **Who:** Jason Tiller asked (IDEA.md: play one set, a sub-collection, or the whole show); details by Claude
- **Decision:** "Play set A to B", with a Loop checkbox, next to the transport controls; the default is the whole show. Play starts from the current count if it's inside the range, otherwise from the range start, and stops at the range end (or wraps when looping). To play a single move, pick its two sets. The timeline dims everything outside the range. The range is stored by set, so it follows its sets when counts change. It isn't saved with the show.

## 2026-10-22 21:50 EDT — Shape tools
- **Who:** Jason Tiller (options from Claude); geometry details by Claude
- **Decisions:**
  - **Workflow:** select 2 or more performers on a set, then pick Line, Arc, Curve, Circle, or Block. A shape starts fitted around the selection, and dragging its blue handles (with snap) updates the performers live. Done, Esc, clicking elsewhere on the field, or leaving the set finishes it. Creating a shape and each handle drag are separate undo steps.
  - **Handles:** Line, 2 ends. Arc, 2 ends plus a bend point it passes through (a bend point exactly on the line makes it straight). Curve, a smooth curve (Catmull-Rom spline) through every point, with "+ Curve point" to add one. Circle, center plus an edge point (the first performer sits at the edge point). Block, two opposite corners plus a column count, filled row by row from the first corner.
  - **Spacing:** Even (end to end; around the whole circle; filling the block's rectangle), or every N steps from the first handle, continuing past the far end if needed. Typing a number switches to interval spacing. Blocks start at 2-step intervals.
  - **Who goes where:** the assignment that minimizes total travel (Hungarian algorithm), measured from the previous set, where the move starts. That guarantees the move's paths never cross. The assignment is made when a shape is picked and kept while its handles are dragged, so performers don't swap mid-edit; clicking the same shape button again re-picks it.
- **Other options:** draw-then-fill; label order; current left-to-right order; assignment measured from the current set (rejected: after trying several shapes it measures from the last shape, not from where the move starts, and paths could cross).

## 2026-10-23 07:05 EDT — Fix screen flashing; hover readout floats over the field
- **Who:** Claude (Jason reported the flashing on a smaller screen)
- **Context:** The hover readout in the top bar changed length on every mouse move. That changed the bar's size, which resized the field canvas. A canvas resize clears it and refits the view, so the screen flashed. Measured 8 to 27 resizes per 60 mouse moves at every window size.
- **Decision:** The top bar has a fixed height and never wraps, and its hint text truncates first. The coordinate readout moved to a small label floating in the field's lower-left corner, so it never affects layout. Its live screen-reader announcement was dropped, since announcing on every mouse move is noise. Verified: 0 resizes during mouse moves and playback at 1500, 1100 and 900 px wide.

## 2026-10-23 07:25 EDT — Mirroring
- **Who:** Jason Tiller asked; details by Claude
- **Decision:** In the Selection panel, on a set:
  - **Flip across the 50:** x → −x for the selected performers.
  - **Flip front ↔ back:** y → 84 − y, across the field's center line.
  - **Copy Side 1 → 2** (and 2 → 1): the selected performers on the source side keep their spots, and those on the other side take the mirror image. Pairing is least total travel from the previous set, so paths don't cross. Anyone exactly on the 50 is left alone. Uneven sides are refused with a message giving both counts.
  - Each is one undo step.
- **Other options:** mirroring around the selection's own center instead of the 50 (possible later as part of rotate/scale).

## 2026-10-23 07:40 EDT — Rotate and scale
- **Who:** Jason Tiller asked; details by Claude
- **Decision:** A "Rotate & scale" box in the Selection panel (2 or more performers, on a set). Rotate by a typed angle (1–180°, default 15°) with ↺ / ↻ buttons, counterclockwise and clockwise as the director sees the field. Expand or Contract by a typed percentage (101–400%, default 110%); Contract divides by the same factor, so it exactly undoes one Expand. Both pivot on the center of the selection's bounding box, and each click is one undo step. Results aren't snapped to the grid: a 30° turn lands between steps and the readout shows quarter steps. A 90° turn of an on-grid form stays on the grid.
- **Other options:** on-field drag handles for rotate and scale (later); pivoting on the 50 or a chosen point; stretching in one direction only.

## 2026-10-23 07:55 EDT — Snap selection to grid
- **Who:** Jason Tiller asked; details by Claude
- **Decision:** A "Snap to grid" button in the Selection panel (on a set) rounds the selected performers to the nearest grid point, using the Snap setting: whole or half steps, with Free falling back to whole steps. It's one undo step. Performers that end up sharing a spot are named in a warning, including an unselected performer already standing there. They're not moved apart automatically, since any automatic choice could be wrong.

## 2026-10-23 08:00 EDT — "Save" / "Open" renamed "Export" / "Import"
- **Who:** Jason Tiller
- **Context:** Work autosaves in the browser, so a Save button was confusing.
- **Decision:** The button that downloads the show file is now "Export". Its tooltip says what it's for: a backup, or a copy to share or open in another browser. Autosave lives only in that one browser, so Export is the real backup. "Open…" became "Import…" to match (Jason). It replaces the current show, which Undo brings back.

## 2026-10-23 08:30 EDT — Dot sheets and drill charts
- **Who:** Jason Tiller (layout, columns, chart contents, who to include); rendering approach by Claude
- **Decisions:**
  - **Dot sheets:** 4 cards per letter page, with dashed cut lines for flip folders and lanyards. Each card has the performer's label, section, and show title, and one row per set: Set, Counts (into the set), Side to side, Front to back. Coordinates use the same wording as the editor, with phrases like "Side 2 45" and "Front Hash" kept on one line. A card holds 24 sets; longer shows continue on another card ("card 2 of 2"). Performers are in section order, then number.
  - **Who:** everyone, one section, or the current selection.
  - **Drill charts:** one landscape letter page per set, with the whole field, labeled dots, and a header with the show title, set number and counts (e.g. "Set 3 · 8 counts (counts 16–24)"). Charts always show every performer.
  - **Paper style:** black on white, not green turf, to save toner and stay readable on copiers. Labels get a white halo so lines don't run through them.
  - **How:** a Print… button lays out the pages and opens the browser's print dialog; "Save as PDF" there gives the PDF. That works in every browser, including iPhone Safari, with no PDF library to add. The editor's keyboard shortcuts are off while the dialog is open.
- **Other options:** a PDF library (bigger download, more code); green charts; 1 performer per page; 2 charts per page; a notes column; paths on charts (left for later).

## 2026-10-23 08:45 EDT — Measure numbers
- **Who:** Jason Tiller (typed per set; range of the move; pickups allowed); free-text field by Claude
- **Decision:** Each set has an optional Measures box. The drill writer types the measures the move into that set covers, as on the score ("9–12"; "pu" or "pu–4" for pickups; notes like "17–24 (fermata)" are fine). Freeform doesn't interpret it, so pickups and irregular music need no special handling. It shows as "m. 9–12" on the timeline segment and the drill chart header, and in a Meas. column on dot sheets. The column only appears once some set has measures. Saved in the show file as an optional per-set text field, so older files still load; non-text values are rejected on import.
- **Other options:** computed from a meter map (counts per measure + changes + pickup), or computed with per-set override. Revisit with music sync, where a meter map is needed anyway.
- **Note:** typed measures don't update when a move's counts change. The drill writer edits them.

## 2026-10-23 08:55 EDT — Pickups are measure 0 *(superseded 2026-10-30: pickups are m. 1)*
- **Who:** Jason Tiller
- **Decision:** A pickup is written as measure 0 ("0", "0–4"), not "pu". The Measures box hint and the examples use that convention. It's still free text, so nothing is enforced.

## 2026-10-23 09:10 EDT — Bézier curve tool
- **Who:** Jason Tiller asked for it alongside the simple Curve; details by Claude
- **Decision:** A Bézier shape made of cubic segments. Anchors (squares) are points the curve passes through. Each segment's two controls (circles, on thin arms from their anchors) pull the curve toward them without touching it, as in Illustrator or Keynote. "+ Segment" adds a segment in the same direction; the new joint starts smooth (its two controls mirror each other), but either control can be dragged to make a corner. Spacing and least-travel assignment work as for the other shapes.
- **Other options:** keep a joint smooth automatically when one of its controls is dragged (deferred at first; adopted below).

## 2026-10-23 09:30 EDT — Bézier joints stay smooth unless Option is held
- **Who:** Jason Tiller; behavior details by Claude (modeled on Illustrator)
- **Decision:**
  - Dragging a control at a smooth joint swings the other control to stay opposite, keeping its own length, so lopsided-but-smooth joints are possible.
  - A joint that's already a corner stays a corner.
  - Dragging an anchor carries its two controls with it.
  - Holding Option (Mac) or Alt (Windows) while dragging moves just that one handle: that's how you make a corner, or move an anchor without its controls.
  - "Smooth" means the controls point within about 2° of directly opposite.

## 2026-10-23 10:00 EDT — Follow-the-leader transitions
- **Who:** Jason Tiller (IDEA.md: float by default, FTL per transition for any performers, with leader and order); details by Claude
- **Decisions:**
  - FTL belongs to a move. It's stored on the set being moved into, as groups (leader first, then followers in order); one move can have several groups. Everyone else floats.
  - Select 2 or more performers on a set (not set 1) and click "Make FTL". The default leader is the lowest label, and the default order chains from the leader to the nearest remaining performer, measured at the start of the move. That gives A–E for the IDEA.md example. Picking a different leader re-chains from it; ↑/↓ swaps followers. "Float instead" turns it off and leaves everyone where they ended.
  - The drill writer places only the leader's end spot. Followers' end spots are computed from the trail (leader's end ← leader's start ← each follower's start, in order), and each performer marches the leader's path length at the leader's pace. Followers are recomputed after every edit, including edits to the previous set, so they can't go stale.
  - Changing the order changes the trail itself: it always runs through the followers' starting spots in the chosen order.
  - Step sizes for an FTL group use the leader's distance, not each straight line. The trail is drawn once per group in the leader's step-size color, and the timeline segment is tagged "FTL".
  - The leader moves in a straight line. A leader path with turns is a follow-up.
  - Imported files are checked: an FTL group can only name performers that exist in that set.
- **Other options:** placing followers' ends by hand (rejected: they'd fight the trail); a leader path with waypoints (later).

## 2026-10-23 10:00 EDT — Drags apply the release point
- **Who:** Claude
- **Context:** One browser test run had a drag land 2 steps short. It couldn't be reproduced in 20+ further runs, with or without the change.
- **Decision:** On release, the app also applies the pointer's final position for drags of performers, shape handles, and selection boxes, so a release that arrives without a final move event can't leave the drag short.

## 2026-10-23 10:20 EDT — Changing hash marks on an existing show
- **Who:** Jason Tiller (both options); details by Claude
- **Context:** A drill writer may start a show with the wrong hashes by mistake. Dots are stored as physical spots, so switching hashes kept the dots in place and changed their coordinates ("on Front Hash" became "4 steps behind Front Hash").
- **Decision:** Changing the hash preset on a show with performers asks:
  - **Keep positions relative to the hashes:** each zone (front sideline to front hash, hash to hash, back hash to back sideline) is stretched or squeezed proportionally, in every set. On the hash stays on the hash, and switching back restores the original spots exactly. Shapes that cross a hash can bend slightly there, and step sizes change a little; the step-size warnings flag anything that gets too big.
  - **Keep spots on the field:** dots stay put and only the hashes move.
  - **Cancel.**
  - Either choice is one undo step. An empty show switches without asking. Editor shortcuts are off while any dialog is open.

## 2026-10-23 11:00 EDT — Page markup, page notes, and cues
- **Who:** Jason Tiller (text, arrows, page notes and freehand; per-set cues on dot sheets; markup visible on its own set only); details by Claude
- **Decisions:**
  - **Tools:** Text (T): click to place, then type; the sidebar's box takes the typing right away, and Enter or Esc finishes. Arrow: drag tail to tip. Draw: freehand. Text and arrows snap with the Snap setting; freehand doesn't.
  - **Editing:** with Select, click a mark to select it, drag to move, Delete to remove. Performers take priority when a click is near both. An empty note is removed as soon as it's not the one being edited; a click with the Arrow tool that doesn't drag leaves nothing behind.
  - **Page note:** a text box per set, printed under that set's drill chart.
  - **Cues:** select performers on a set and type a cue. It's stored per performer per set and printed in italics under that set's row on each performer's dot sheet (the quarter-page card has no room for another column). With a mixed selection the box shows "(different cues)"; typing gives them all the same cue.
  - Markup belongs to one set: it shows when the timeline is on that set and on that set's chart (black on white), and a new set starts with none. Everything is saved in the show file and checked on import; deleting a performer removes their cues.
- **Other options:** markup spanning several sets; inline editing of text on the field; a cue column on dot sheets.

## 2026-10-23 11:10 EDT — Selected performer shows the current set's coordinate only
- **Who:** Jason Tiller
- **Decision:** Clicking a performer shows its coordinate on the current set, plus its exact spot at the current count when mid-move. The full list of coordinates for every set is folded into a closed "All sets" section. "Place exactly" is folded into a closed section too.

## 2026-10-23 11:20 EDT — "Ensemble notes" and "Performer notes"
- **Who:** Jason Tiller
- **Context:** "Page note" and "Cue for set X" looked like duplicates.
- **Options:** clearer labels, kept separate; one box whose meaning changes with the selection.
- **Decision:** Kept separate, renamed, with help text under each. **Ensemble notes** (the set's page note) are for everyone and print under the set's drill chart. **Performer notes** (cues) are only for the selected performers and print on their dot sheets under that set. The help text names the set and how many performers are selected. The show file fields are unchanged (`note`, `cues`).

## 2026-10-23 11:40 EDT — Set controls in the bottom panel; set buttons on the timeline
- **Who:** Jason Tiller; layout details by Claude
- **Decision:** "Set N · Counts in · Measures · + Set after · Delete set" moved from the sidebar to a row at the top of the bottom panel. The set number buttons moved into a strip right above the timeline bar, each centered over the line where its set lands (the last set at the bar's end). Ensemble notes stay in the sidebar. Every bottom-panel row has a fixed height so moving between sets or playing never resizes the field (no flashing); "Counts in" stays visible but disabled on set 1. Mid-move, the row shows the set being moved into.
- **Known limit:** sets only a few counts apart in a long show put their buttons on top of each other; at narrow widths the status text on the transport row is cut off first.

## 2026-10-23 11:45 EDT — "Counts in" relabeled "Counts"
- **Who:** Jason Tiller
- **Decision:** The label is just "Counts", the term drill writers use. It still means the counts of the move into that set.

## 2026-10-23 11:55 EDT — Drag set buttons to change where a set lands
- **Who:** Jason Tiller (draggable set buttons; neighbors stay pinned, per the earlier count-first decision); details by Claude
- **Decision:** Dragging a set's button on the timeline moves the count that set lands on. The move into it and the move out of it trade counts, and every other set stays put. It snaps to whole counts, each move keeps at least 1 count, and dragging the last set just lengthens or shortens the final move. Set 1 stays at count 0. A plain click (less than a few pixels of movement) still jumps to the set, and the playhead follows a dragged set. Each drag is one undo step.
- **Note:** typed measure numbers don't update when counts change.

## 2026-10-23 12:10 EDT — Top bar holds the set controls; Undo/Redo/Fit at the bottom of the sidebar
- **Who:** Jason Tiller; layout details by Claude
- **Decision:** "Set X · Counts · Measures · + Add set · Delete set" moved from the bottom panel into the top bar, on the same line as "Freeform" and centered over the field. When space is short, the scroll/zoom hint shrinks away first and the controls slide left toward "Freeform"; at 900 px wide they just fit. Undo, Redo and Fit field moved to the bottom of the sidebar, pinned there however long the sidebar gets: Fit field on the left, Undo and Redo on the right (Jason). "+ Set after" is now "+ Add set" (it still adds the new set right after the current one, 16 counts). The top bar keeps its fixed height and no-wrap rule, so the field never resizes from it.

## 2026-10-23 12:40 EDT — Published on GitHub Pages; installable and offline
- **Who:** Jason Tiller (go-ahead); details by Claude
- **Context:** The app only ran on Jason's Mac. Phones (performer view) and other programs need a URL, and the project's plan is no servers and no cost.
- **Decision:** GitHub Pages at tillerdawg.github.io/Freeform_2, deployed by a GitHub Actions workflow on every push to `main`: type-check, test, build, publish. A failing test stops the deploy. The build uses relative paths, so it also works under a custom domain later with no changes.
  - **Offline/installable:** a web app manifest, icons, and a small hand-written service worker. After one visit, the app works with no network: it caches the page and every file the page links. Online, the page loads from the network first so updates appear right away, and files from older releases are pruned from the cache.
- **Other options:** vite-plugin-pwa (planned in the tech-stack decision). Replaced by the ~40-line service worker, since the plugin added 320 dev packages for the same result.

## 2026-10-23 12:40 EDT — README kept current; CLAUDE.md holds the house rules
- **Who:** Jason Tiller (README must be updated with every feature change); CLAUDE.md by Claude
- **Decision:** README.md describes what the app does today, how to use it, the roadmap, how to run and deploy it, the code map, the coordinate model, the clean-room policy, and the license. CLAUDE.md (the file AI coding agents read automatically) makes "update README.md in the same commit as any feature change" a standing rule, along with logging decisions, updating PLAN.md, testing before pushing, and the fixed-height layout rule.

## 2026-10-23 12:55 EDT — Landscape on phones
- **Who:** Jason Tiller (lock to landscape); approach by Claude
- **Context:** In portrait on an iPhone the sidebar takes most of the screen. iOS ignores orientation locks for home-screen web apps and doesn't support the Screen Orientation lock API, so a true lock isn't possible there.
- **Decision:** The manifest asks for landscape, which Android honors. Phones in portrait (portrait and 600 px wide or less) get a full-screen "Turn your phone sideways" message over the app; the app keeps running underneath, so nothing is lost. iPads in portrait and desktop windows aren't affected.
- **Note:** the coming performer view will probably want portrait and should opt out of this.

## 2026-10-23 13:30 EDT — Performer view and share links
- **Who:** Jason Tiller (share link; "my view" = follow me + facing front; info shown; staff option); details by Claude
- **Decisions:**
  - **Share links:** the editor's Share… packs the whole show (compressed, positions to 1/1000 step) into the link after "#show=". No server: the files-first plan holds. About 40 KB for 150 performers × 40 sets. Links are untrusted input and go through the same checks as files; a damaged link says so. Copy, the phone share sheet (where available), and a preview are offered. Anyone with the link can view the show, and later edits need a new link.
  - **Performer screen:** opening a link shows a read-only screen built for phones (portrait first, side by side in landscape). The show is stored on the phone under its own key, separate from the editor's autosave, so opening a link in a director's browser never touches their work. The address becomes "#perform", so reloading or opening offline returns to it.
  - **Who are you?:** pick a performer (grouped by section) or **Staff** for the whole band with labels. The pick, and the view toggles, are remembered on the phone; a new link keeps the pick if that performer still exists.
  - **Views:** **Following me** centers on my dot, about 36 steps across; **Whole field** shows everything. **Facing front** turns the field 180° (front sideline at the top, Side 1 on my right); **Director view** is the editor's orientation. My label stays upright either way.
  - **What I see:** my dot highlighted; others dimmed; my path into the next set, sampled count by count so follow-the-leader trails are right; and a ring where I end up. Ensemble markup shows on its set.
  - **Info:** the set, counts, measures, and the count within a move; my spot (or "Now" mid-move); the next set with its counts, measures, coordinate and step size, colored by tier; my performer notes; and the ensemble notes.
  - **Controls:** a count slider, previous/next count, play/pause with tempo, and go to set, all with large touch targets.
  - **Rotation:** the "turn sideways" prompt no longer appears in the performer view. The manifest's landscape setting was removed, because Android would apply it to the whole installed app, performer view included. The editor still asks phones in portrait to rotate.
  - Playback timing is shared by the editor and the performer view (`usePlayback`).
- **Other options:** import the file (still works); QR codes (too small for real shows without hosting); a hosted copy that updates in place (needs a server or sync; later).

## 2026-10-23 13:45 EDT — Performer view shows who's around me
- **Who:** Jason Tiller (show surrounding performers); details by Claude
- **Decision:** In the performer view, my nearest neighbors (up to 4, within 10 steps, at the current count) get a brighter dot and an upright label; everyone else stays an unlabeled dim dot, to avoid clutter. The info panel's "Around you" list gives each neighbor's offset in field directions ("toward Side 1/2", "in front" = toward the front sideline, "behind"), rounded to quarter steps, so it reads the same in Director view and Facing front. The portrait info panel now has a fixed height and scrolls, so changing content can't resize (and flash) the field.
- **Other options:** label everyone (too cluttered on a phone); performer-relative left/right (depends on which way the performer is facing at that moment, which Freeform doesn't know).

## 2026-10-23 13:55 EDT — Transport buttons use drawn icons
- **Who:** Claude (Jason reported the mismatch)
- **Context:** On Apple devices ⏮ and ⏸ render as colored emoji while ▶ and ◀ render as text, so the transport buttons didn't match.
- **Decision:** All transport buttons (editor and performer view) use one small set of SVG icons in the button's text color: back to start, back one count (|◀, a bar plus triangle, matching forward one count ▶|), play, pause, forward one count. Each keeps its spoken label for screen readers.

## 2026-10-23 14:05 EDT — Yard-line ruler in the performer view
- **Who:** Jason Tiller (yard numbers always visible); details by Claude
- **Decision:** While "Following me", a band pinned to the bottom of the field view labels every yard line on screen, every 5 yards, not just the painted 10s, with its side: "S1 40", "50", "S2 45", "G". It follows the view, so Facing front reads correctly too. In Whole field view the painted numbers are already visible, so there's no ruler.
- **Other options:** labels only on the painted 10-yard numbers; side shown by color instead of "S1/S2".

## 2026-10-23 14:10 EDT — "Following me" renamed "My view"
- **Who:** Jason Tiller
- **Decision:** The performer view's zoomed-in, follows-my-dot mode is labeled "My view". The other choice is still "Whole field".

## 2026-10-23 14:30 EDT — Performer view: pinch-zoom and keeping the screen awake
- **Who:** Jason Tiller (go-ahead); details by Claude
- **Decisions:**
  - **Pinch-zoom** (0.5×–5×) in the performer view. In My view the camera stays centered on my dot, and one-finger drags do nothing, so the view can't drift off me. In Whole field (and the Staff view), dragging with one or two fingers moves around the field, in the right direction in Facing front too. "Reset zoom" appears whenever the view is zoomed or moved; switching views or picking a different performer also resets. Zoom isn't saved. The page itself never zooms: the field takes the pinch, including Safari's older gesture events.
  - **The yard-line ruler** now also shows whenever the view is zoomed in, not only in My view.
  - **Screen wake lock** while playing, released on pause, when playback ends, or when the app is hidden, and re-taken when it comes back. Where the browser doesn't allow it (older iOS home-screen apps), nothing happens.

## 2026-10-23 14:45 EDT — Reaching the performer view inside the home-screen app
- **Who:** Claude (Jason couldn't find the performer view in his installed app)
- **Context:** The performer view only opened from a share link. On iPhone, links open in Safari, and a home-screen app keeps storage separate from Safari and has no address bar, so there was no way to reach the performer view from inside the installed app.
- **Decision:** The Share dialog's "Preview" link became **Open performer view here**, which switches the current app or tab to the performer view of that show. The performer view has **← Editor** to go back, and a **paste a share link** box (on its empty screen, and under "Open a different show") that finds the link even inside a pasted message.
- **Note:** performers who only use Safari don't need any of this. Opening the link is enough, and it works offline.

## 2026-10-23 15:30 EDT — QR codes and hosted show links
- **Who:** Jason Tiller (QR sharing; gists for testing, something protected for deployment); details by Claude *(Jason can veto)*
- **Context:** Share links carry the whole show (about 40 KB for a big show), but a QR code holds about 3 KB, so only small shows fit.
- **Decisions:**
  - The Share dialog shows a QR code whenever the share link fits, and says when it doesn't.
  - **Hosted links:** `…/#load=<https address of a show file>`. The phone downloads the file (no-cache, 10 MB cap, checked by the same validation as Import), saves it with its address, and on each later online open re-downloads it and updates in place, keeping the performer's choice. A failed download keeps the saved copy and shows the error. Only https addresses are accepted. The file host must allow other sites to read it (CORS); GitHub gist "raw" links do.
  - For testing, the dialog explains using a secret gist with a commit-free Raw link. QR library: `qrcode-generator` (MIT, no dependencies).
- **Other options:** shrink links further to fit QR (not enough for real shows); a Freeform server now (premature before the hosting/protection decision); multi-QR sequences (awkward to scan).
- **Open:** protected hosting for deployment; client-side encryption with the key in the link fragment is the first idea to evaluate (PLAN.md).

## 2026-10-23 14:30 EDT — QR scanner inside the app
- **Who:** Jason Tiller (build the scanner); details by Claude *(Jason can veto)*
- **Context:** On iPhone, scanning a QR code with the Camera app always opens Safari. Home-screen web apps can't claim links, and they keep storage separate from Safari, so the scanned show never reached the installed app.
- **Decision:** A **Scan QR code** button in the performer view (empty screen and "Open a different show") opens the rear camera inside the app and decodes with `jsqr` (Apache-2.0, no dependencies). The first Freeform link it sees (`#show=` or `#load=`) opens, and the camera turns off. Any other QR code gets "isn't a Freeform show link" and scanning continues. Only the link's `#…` part is used, the same as pasting, so a code made on any copy of Freeform works. If camera access is refused, it says so and points to pasting.
- **Other options:** the browser's built-in BarcodeDetector (not available in iPhone Safari); telling performers to use Safari only (works, but students install the app).

## 2026-10-23 14:30 EDT — "Performer view" button in the editor
- **Who:** Claude (Jason couldn't find the scanner from the editor) *(Jason can veto)*
- **Context:** The home-screen app opens in the editor, and the only way into the performer view was Share… → Open performer view here, which needs a show with performers. A student with a fresh app had no way to reach Scan QR code.
- **Decision:** The editor's top button row gets **Performer view**, which always opens the performer view (the saved show, or the empty screen with Scan QR code and paste). **← Editor** comes back.
- **Other options:** open phones straight into the performer view (later, if students find the editor confusing).

## 2026-10-23 14:40 EDT — No editor on phones
- **Who:** Jason Tiller (remove editing from phones; keep performer and director views); details by Claude *(Jason can veto)*
- **Decision:** On a phone, Freeform always opens the performer view, and **← Editor** is hidden. "Phone" means a touch screen whose short side is under 600 CSS px: every iPhone counts, and iPads (744 px and up) and computers keep the editor. Directors on a phone pick **Staff** and use Director view / Facing front. The editor's "turn your phone sideways" screen is removed, since the editor never shows on a phone now.
- **Note:** an editor autosave already on a phone isn't deleted, just unreachable there. Export from a computer is the way to move shows.
- **Other options:** a hidden way back into the editor on phones (not requested); judging by screen width alone (a narrow desktop window would lose the editor).

## 2026-10-23 14:45 EDT — Set buttons in the performer view
- **Who:** Claude (Jason missed the editor's set buttons on his phone) *(Jason can veto)*
- **Decision:** The performer view's "Set…" dropdown is replaced by a row of set-number buttons above the count slider, as large as the other touch buttons. The current set is outlined in gold. The row scrolls sideways when there are more sets than fit and keeps the current set in view during playback. Its height is fixed, so it can't resize the field.
- **Other options:** buttons placed at each set's spot along the slider, as in the editor (they overlap once a show has more than about 10 sets on a phone); keeping the dropdown.

## 2026-10-23 15:15 EDT — Play always starts where you are
- **Who:** Jason Tiller ("select a set, hit play, it should begin at that spot and go forward"); details by Claude *(Jason can veto)*
- **Context:** Play jumped back to the start of the show from the last set, and in the editor it jumped to the play range's start whenever the playhead was outside the range.
- **Decision:** In both the editor and the performer view, Play starts at the playhead and moves forward. Inside a play range, it stops (or loops) at the range's end. From outside the range, it plays on to the end of the show and doesn't loop. At the end of the show Play is grayed out; tap a set (or Back to start) to play again.
- **Also:** the performer view's row of set buttons fades whichever edge has more sets past it, and keeps the current set centered.
- **Other options:** from outside the range, jump into the range (the old behavior); at the show's end, restart from set 1 (the usual media-player habit, but it's the surprise Jason hit).

## 2026-10-24 13:30 EDT — Locked (encrypted) hosted show files
- **Who:** Jason Tiller (go-ahead on encrypted hosted links); details by Claude *(Jason can veto)*
- **Context:** A secret gist is unlisted, not private: anyone with its address can read the drill.
- **Decision:** The Share dialog's hosted link now starts with **Download locked show file**: the show is compressed, then encrypted with AES-GCM (a random 256-bit key, a fresh nonce for every file) using the browser's built-in Web Crypto. The file is `{"format":"freeform-locked","version":1,"iv","data"}`. The hosted link is `#load=<file address>&key=<key>`. The key lives only in the `#` part, which browsers never send to servers, so the host stores only ciphertext. The phone decrypts after downloading; a wrong key or a tampered file fails with "this link's key doesn't open the show file" (GCM detects tampering). The dialog checks the finished link by actually downloading and opening it.
  - **Updating** reuses the key, so the same link keeps working: the dialog remembers each show's hosted link in that browser (by show title) and locks new files with its key. Pasting an existing hosted link into the box does the same.
  - **Cutting off old links:** clear the box and start over with a new key and file. Phones that already opened the show keep their saved copy (nothing can unsend it) but stop getting updates.
  - Unlocked show files at a `#load=` address still open, for compatibility; the dialog only builds locked links.
- **Other options:** a Freeform-run server with accounts (cost and upkeep); a password typed by each performer (extra step for students, and passwords get reused); band-owned cloud storage via Google Drive or Dropbox APIs (sign-in and API setup for every director).

## 2026-10-26 11:30 EDT — Pyware 3D (.3dj) import
- **Who:** Jason Tiller (do the import next; his own files as the reference); format work and details by Claude *(Jason can veto)*
- **How it was worked out (clean-room, behavior only):** by reading the structure of Jason's own 2008–2010 .3dj files and checking it against what those shows are known to contain (set notes that state counts, measures and moves). No Pyware program code was decompiled or copied, and no .3dj file is in the repo: they hold students' names. Unit tests build a small synthetic file instead.
- **What the format turned out to be:** a chain of blocks (4-letter tag, 4-byte length, data). GRID: the field as text, in yards from center, including the hashes (±8.75 yd = high school). CAST: each performer's id, label number and name. CST2 (later files): each performer's 3D figure ("Trumpet Figure"). PAGE: one per count, 20 bytes per performer, with the dot symbol and x, y as 16-bit values centered on 0x8000, where 120 units = one 8-to-5 step, +x = Side 2 and +y = toward the front. PROP: closes a set, so the PAGEs since the last PROP are that set's counts, the last being the set itself; it carries the set's note. Files keep 300+ pages, and those after the last PROP are unused.
- **Checks against the real shows:** set counts match what the notes say ("16 count MOVE" = 16 pages); positions stay between the 20s and inside the sidelines; in Zelda's "push straight forward at 8-to-5" set, every winds and percussion dot moves exactly 16 steps toward the front over 16 counts; in Mario's "MARK-TIME right Guard" set, the guard members who hold are all on Side 2. That last check assumes "right" means as seen from the press box.
- **Decisions:** sections = one per dot symbol, named after the figure most of its performers use, with the symbol added when two symbols share a figure ("Saxophone (A)", "Saxophone (X)"), else "Symbol P". Labels = symbol + Pyware's number. Set names = 1…N in order (Pyware's own names like "3A" only appear in notes). Set notes become ensemble notes; "mm. 5-8" in a note fills Measures. Performer names are not imported (Freeform has no roster, and it keeps student names out of shared links). Per-count positions inside a move are dropped (Freeform moves in straight lines). Files with no PROP blocks (backups and drafts in Jason's library) get "no saved sets" instead of a guess. When a block's stored length is wrong (seen in one file), the reader skips ahead to the next real block.
- **Other options:** importing every PAGE as its own set (faithful paths but hundreds of one-count sets); asking the user for the scale and orientation (not needed once the checks above agreed).

## 2026-10-26 12:15 EDT — Readable dot labels
- **Who:** Jason Tiller (automatic plus manual; editor, printed charts and phone); details by Claude *(Jason can veto)*
- **Context:** In tight blocks (2-step intervals, as in the imported Pyware shows) labels ran together ("K5K6K7").
- **Decision:** One shared placer for the editor, printed charts and the phone's staff and neighbor labels. Each label takes the first free side (above, below, right, left) that covers no other dot and no label already placed; if none is free it's hidden, and zooming in brings it back. Selected performers go first. **Label** in the Selection panel pins a side (or Hidden) per performer for the current set (stored as `labels` on the set, validated on import). A pinned side is the only side tried and may cover a dot, but never another label, so pinning a whole block to one side can't recreate the jam. Labels are at least 10 CSS px (on phones they were about 3) and are drawn upright on screen, so the staff view shows them in Facing front too (they used to be hidden there).
- **Other options:** always draw every label (unreadable in blocks); smaller text that fits (unreadable on a phone); pins that always draw (Pyware-like, but it lets a pinned block jam again); per-performer pins for the whole show (wrong once the formation changes).
- **Open:** on printed charts, labels hidden in a tight block can't be zoomed. Each performer's dot sheet still has their coordinates; a smaller chart font is an option if that matters.

## 2026-10-26 12:45 EDT — Quick label buttons, diagonals, inside/outside a curve
- **Who:** Jason Tiller (quick buttons for above, below, 45°, inside and outside a curve); details by Claude *(Jason can veto)*
- **Decisions:**
  - Label sides gain the four diagonals (8 in all). Automatic placement also tries diagonals after the four straight sides, so more labels fit in tight forms.
  - Quick buttons under **Label** for the selected performers in the current set: **Above**, **Below**, **45°** (= up and to the right; the other diagonals are in the list), and for 3+ dots **Inside curve** / **Outside curve**.
  - Inside/outside: each dot takes the circle through itself and its two nearest selected neighbors, so every part of an S-curve bends its own way. Where those three are in a straight line, it uses the circle best fitting the whole selection. The direction to that circle's center (inside) or away from it (outside) is snapped to the nearest of the 8 sides. Dots on straight stretches keep their label, and an all-straight selection gets "use Above, Below or 45°".
  - Sides are on the field ("above" = toward the back sideline), so in the phone's Facing front they turn with the field and an "outside" label stays outside.
- **Other options:** 45° meaning another diagonal by default; free angles instead of 8 sides (finer, but labels would need rotating text or more collision shapes).
- **Known gap (fixed 2026-10-26):** Flip and Mirror move dots but didn't swap their pinned sides; now they do.

## 2026-10-26 13:10 EDT — Label compass replaces the label list and quick buttons
- **Who:** Jason Tiller (a small unit-circle/compass to click instead of separate buttons; keep inside/outside curve); details by Claude *(Jason can veto)*
- **Decision:** The Selection panel's **Labels** control is a compass: 8 round buttons on a ring (up = toward the back sideline), the center **A** = automatic, plus **Hide**, **Inside curve** and **Outside curve** beside it. The current direction is filled in when all selected dots share it. Each point is a real button with a spoken name ("Label up and right"). The Label list and the Above/Below/45° buttons are gone.
- **Other options:** any angle (click anywhere on the circle). Not done: 8 directions cover what the old buttons did and keep the saved show format and the collision checks simple. Easy to add if 45° steps feel coarse.

## 2026-10-26 13:40 EDT — Drill toolbar under the top bar; button styling
- **Who:** Jason Tiller (move the drill tools to a toolbar under the Freeform line, combine tools into dropdowns where possible, nicer buttons); layout details by Claude *(Jason can veto)*
- **Decisions:**
  - The top bar and a new **drill toolbar** span the whole window, with the field, timeline and sidebar below. The toolbar holds: Select | Add | **Markup ▾** (Text, Arrow, Draw; the button shows the one in use), Section, Snap, then for the selection **Shape ▾**, **Transform ▾** (Mirror: flips and side copies; Rotate & scale; Snap to grid), **FTL ▾**, **Labels ▾** (the compass, inside/outside curve, hide) and Delete, then Undo, Redo, Fit.
  - Menus that don't apply are greyed out, and their tooltip says why ("Select 2 or more performers", "Scrub to a set first", "Set 1 has no move into it"). Panels close on a click elsewhere or Esc; that Esc doesn't also clear the selection. The Shape panel stays open while a shape is being edited.
  - The house rule holds: the toolbar has a fixed 44 px height and never wraps. In narrow windows it scrolls sideways (everything fits at 1024 px), and panels are placed against the window, so the scrolling can't clip them.
  - The sidebar keeps show-level and per-performer things: file buttons, title and hashes, ensemble notes, the selection's performer notes, coordinates, Place exactly, markup editing, and sections.
  - One button style app-wide: rounded, quiet green-grey, a hover state, a gold "on" state (`aria-pressed` / `aria-checked`), a gold keyboard focus ring, dimmed when disabled; fields and selects match. Sized to stay inside the fixed rows.
- **Other options:** keep the toolbar in the field column only (it didn't fit next to the sidebar); icons instead of words (more compact, but less clear for new users).

## 2026-10-26 14:00 EDT — Performer tools and markup split in the toolbar
- **Who:** Jason Tiller
- **Decision:** "Select" and "Add" become **Select Performer(s)** and **Add Performer(s)**, a pair followed by Section and Snap (which only apply to performers). **Markup ▾** stands apart after a divider, since it adds instructions and arrows rather than performers.

## 2026-10-26 14:20 EDT — Editing sections: move performers, delete, duplicate letters
- **Who:** Jason Tiller (letters only, not dot shapes; move selected, delete, warn on duplicate letters); details by Claude *(Jason can veto)*
- **Decisions:**
  - **Section of selected performers** in the sidebar's Selection area moves them to another section for the whole show. Moved performers are numbered after the section's current members, in their old label order; nobody already in either section changes label (the ones left behind keep their numbers, e.g. X4–X6).
  - **Delete section** (× per row): an empty section goes at once; one with performers asks which section takes them first. The last section can't be deleted. Undo works for all of it.
  - Letters shared by two sections are outlined in red with "their labels would clash", and the Sections panel opens to show it.
  - Each row shows how many performers are in the section. If the section chosen for adding performers is deleted, adding falls back to the first section.
- **Other options:** dot shapes per section (not wanted now); renumbering a whole section after a split (possible follow-up).

## 2026-10-26 14:35 EDT — Renumber a section
- **Who:** Jason Tiller (add a renumber button); details by Claude *(Jason can veto)*
- **Decision:** A **#** button on each Sections row offers **Close the gaps** (keep the order, number from 1) or **Left to right** (Side 1 → Side 2 as they stand in the current set, front to back where they share a spot). Labels change everywhere for the whole show; Undo reverses it.
- **Other options:** front-to-back first, or by rank and file; numbering by a chosen set other than the current one.

## 2026-10-26 15:20 EDT — Renumber front to back
- **Who:** Jason Tiller
- **Decision:** A third renumber option, **Front to back**: the front rank first, each rank numbered from Side 1 to Side 2, using the current set. Performers count as one rank when they're within half a step of the same distance from the front sideline, so a slightly ragged rank still numbers as one.

## 2026-10-26 15:30 EDT — Brighter field on screen
- **Who:** Jason Tiller
- **Decision:** The on-screen turf is a little lighter (#357842, was #2f6b3a), and the grid lines are brighter (step lines 15% white, was 9%; 4-step lines 32%, was 22%). Printed charts are unchanged.

## 2026-10-26 15:40 EDT — Section choice moves into Add Performer(s)
- **Who:** Jason Tiller
- **Decision:** The toolbar's Section dropdown is gone. **Add Performer(s) ▾** opens a list of sections; picking one turns on the Add tool for it, and the button then reads "Add Performer(s) · T". The **A** key still turns Add on with the last section picked.

## 2026-10-26 15:55 EDT — Reset to the previous set
- **Who:** Jason Tiller
- **Decision:** A toolbar button, **Reset to set N** (N = the set before the current one), puts the selected performers back on their spots from that set, so an experiment can be started over. It only changes the current set, it's disabled on set 1 and mid-move, and Undo reverses it.

## 2026-10-26 16:05 EDT — One place for snap to grid
- **Who:** Jason Tiller (snap to grid in one place, beside Add Performer(s), labeled "Snap to grid"); keeping the "round existing dots" action by Claude *(Jason can veto)*
- **Context:** The toolbar's Snap setting (the grid for dragging and adding) and Transform's "Snap to grid" (round selected dots onto the grid) looked like the same thing in two places.
- **Decision:** Both live together after Add Performer(s): **Snap to grid [Whole / Half / Free]**, then **Apply**, which rounds the selected performers onto that grid (needed after a rotate, a shape or a Pyware import leaves dots between steps). It's gone from Transform. A "now sharing a spot" warning shows beside the button.

## 2026-10-26 16:20 EDT — Pyware import names sections by Jason's letter scheme
- **Who:** Jason Tiller (his letters: F Flute, K Clarinet, A Alto Sax, X Tenor Sax, P Trumpet, H Mellophone, N Trombone, E Baritone, T Tuba, S Snare, B Bass Drum, Q Quads, G Color Guard); C = Cymbals added by Claude from the cymbal figures in his files *(Jason can veto)*
- **Decision:** On import, a symbol takes the scheme's name when the file's 3D figure fits it (e.g. a saxophone figure for A or X), or when the file has no figures. If the figure disagrees (another writer's file where P is a flag), the figure's name wins, then "Symbol P". This names Alto and Tenor Saxophone apart, which the figures alone couldn't, and names the 2008–09 files that have no figures.
- **Other options:** use only figures (no alto/tenor split, no names for older files); ask on every import (an extra step).

## 2026-10-26 16:30 EDT — No Front Ensemble section by default
- **Who:** Jason Tiller
- **Decision:** New shows no longer start with a Front Ensemble section: those performers are stationary and don't need drill spots. A band that wants them on the chart can still add a section.

## 2026-10-26 16:45 EDT — Jason's lettering as the starting sections; directors can save their own
- **Who:** Jason Tiller (start with his convention; let directors make their edited list the default for new files); details by Claude *(Jason can veto)*
- **Decisions:**
  - New shows start with F Flute, K Clarinet, A Alto Saxophone, X Tenor Saxophone, P Trumpet, H Mellophone, N Trombone, E Baritone, T Tuba, S Snare Drum, B Bass Drum, Q Quads, C Cymbals, G Color Guard. Cymbals is added by Claude to match the import scheme. Adding performers starts on the first section.
  - In the Sections list, **Use as my starting list** saves the current show's section names and letters as the list new shows start with; **Back to Freeform's list** clears it. The panel says which list new shows will use.
  - The saved list lives in that browser (like the autosave). It isn't in exported show files or shared links, and it's checked when read back, so bad stored data falls back to Freeform's list.
- **Other options:** store the starting list in an account (no accounts yet); ask for a template on every New (an extra step each time).

## 2026-10-26 17:00 EDT — Section colors
- **Who:** Jason Tiller (let directors color-code sections); details by Claude *(Jason can veto)*
- **Decisions:**
  - Each section can have a color (a swatch on its Sections row, stored as `color: "#rrggbb"` and checked on import). No colors by default; **Clear colors** removes them all.
  - Colored dots are drawn in the editor, the phone's staff view and printed drill charts. On screen a colored dot gets a dark ring; on paper, a thin black outline, so pale colors still show. Labels stay white on screen and black on paper. Selected dots still turn gold. The performer's own "My view" keeps its gold-me / dim-others look.
  - Colors are saved with "Use as my starting list".
- **Other options:** a preset palette instead of a free color picker; coloring the labels instead of the dots (harder to read).

## 2026-10-26 17:15 EDT — Labels hide while moves play
- **Who:** Jason Tiller (hide labels during transitions; show them on a set's first count; show them when stopped between sets); details by Claude *(Jason can veto)*
- **Decision:** While playing, labels show only on a set and for the first count after it, then hide until the next set. Paused (anywhere), they always show. Selected performers keep their labels in the editor, and the phone's My view keeps your own label (it follows your dot); neighbors' labels hide mid-move. Hidden labels' dots still count as dots for the labels that do show. Same in the editor and the phone's staff view.

## 2026-10-26 17:30 EDT — File extensions: .freeform and .freeform-locked
- **Who:** Jason Tiller
- **Decision:** Export saves `<title>.freeform`; the Share dialog's locked copy for hosted links saves `<title>.freeform-locked`. The contents are unchanged (the same JSON as before), so older `.freeform.json` files still import, and hosted links to old `.locked.json` files keep working. Downloads use a generic file type so browsers don't add ".json". Importing a locked copy says what it is and to import the `.freeform` file instead.
- **Note:** on iPhone and iPad, the file picker may grey out file types it doesn't recognize; if `.freeform` files can't be picked there, the import button needs to accept any file.

## 2026-10-26 17:45 EDT — Flip and Mirror reflect pinned label sides
- **Who:** Jason Tiller (fix it); details by Claude
- **Decision:** Flip across the 50 swaps a pinned label's left and right (up-left → up-right); Flip front ↔ back swaps above and below. Copy Side 1 → 2 (or 2 → 1) gives each copied performer its partner's label side, mirrored, or automatic if the partner had none. Rotate & scale leaves pins alone (re-press Inside/Outside curve after a turn if needed).

## 2026-10-26 18:15 EDT — Music sync, part 1: tap along in the editor
- **Who:** Jason Tiller (timing by tapping along; counts set by the meter; music on performers' phones too; measures stay typed by hand); details by Claude *(Jason can veto)*
- **Decisions:**
  - **Timing = taps.** Tap counts plays the recording from the top; each Space (or the big button) records the audio time of the next count, starting at count 0 (set 1). Undo last tap, Pause / Resume (backs up 2 s), Start over, Done. The show stores `music: { name, audioId, taps }` (seconds), checked on import (strictly increasing, capped). Between taps a count is linear in time; past the last tap counts keep the last four taps' pace. Because a tap is a count, the meter isn't needed for timing (the counts-per-meter choice matters once Freeform computes measures, which isn't planned, since measures stay typed).
  - **Playback with music** seeks the audio to the current count and drives the drill from the audio clock, so rubato and fermatas line up; range stops and loops work (a loop seeks back). **Play with music** can be turned off to use Tempo.
  - **The recording stays in the browser** (IndexedDB), not in the `.freeform` file, the autosave or share links (size and copyright). The menu says when a show's recording isn't in this browser; loading a file with the same name again keeps the taps.
  - **Next (part 2):** carry the recording to phones inside the locked hosted file, encrypted with the show's key, so the performer view plays along.
- **Other options:** a typed tempo map, or importing a MIDI tempo map from notation software (not chosen now; possible later); embedding the audio in the `.freeform` file (big files, and the file is what gets shared around).
- **Known limits:** re-tapping starts from the top; a replaced or removed show's audio is cleaned up, but a show replaced by New or Import leaves its recording stored in the browser.

## 2026-10-28 16:30 EDT — Automatic count finding: our own beat tracker
- **Who:** Jason Tiller (yes, try automatic beat mapping on the 2008 recordings); approach by Claude *(Jason can veto)*
- **Decision:** Write a small beat tracker in Freeform (clean-room, after Ellis 2007, "Beat tracking by dynamic programming"): spectral-flux onset strength, a sliding-window tempo estimate that can follow tempo changes, then dynamic-programming beat placement. It runs in the browser in 1–2 s per show. Not yet in the app: first it's measured against Jason's recordings (click-track copies for listening; the scores as an answer key if he agrees to building the Finale reader).
- **Other options:** Essentia.js (AGPL) or aubio (GPL), which are stronger but don't fit Freeform's MIT license; tempo-only libraries (no beat positions).

## 2026-10-29 09:20 EDT — Counts from the score's MIDI, matched to the drill's measures
- **Who:** Jason Tiller (import the MIDI rendered from the score, map the beats, match them to the written drill); rules by Claude *(Jason can veto)*
- **Context:** On the 2008 recordings, finding counts from the audio alone was unreliable (beat slips, a section missing from the mp3). Audio rendered from the score (MuseScore → MIDI → audio) has exactly known timing, and Pyware drills already carry each set's measures in their notes.
- **Decision:** Music ▾ → **Counts from the score's MIDI…** reads the MIDI's tempo map and meters and fills the taps:
  - A set's counts go in the measures typed for it. Rules, in order: one count per beat; per beat of the bars that sound (a G.P. bar inside the set is skipped); a steady number per bar (in one, in 2); every other beat. If none fits, the counts are spread evenly and the menu names the set.
  - **Count 1 of a set = the downbeat of its first measure; the set is hit on its last count** (Mario Set 2, mm. 1–4, 12 counts: hit on beat 3 of m. 4). Count 0 is one count before that, clamped to the start of the audio.
  - Bars between sets (the Mario G.P.s, m. 33 and 45) belong to no set, so the first count after them stretches across the G.P. (dots creep instead of holding).
  - Sets without measures count plain beats (the bottom note; dotted quarter in 6/8, 9/8, 12/8). Measure 1 is assumed to start at the top of the MIDI.
- **Other options:** match by counts alone (needs a counts-per-meter setting; fails on in-one and G.P.s); MusicXML instead of MIDI (more work; MIDI already carries MuseScore's fermatas and tempo changes); render audio in the browser from the MIDI (needs a sound font in the app).

## 2026-10-29 09:40 EDT — Sets hit on their last count; holds are sub-sets
- **Who:** Jason Tiller (a set hits on the last count of the move, so the band steps off right away; holds are written as sub-sets, e.g. a 12-count hold after set 5 is set 5A on the hold's last beat); naming and counts by Claude *(Jason can veto)*
- **Decision:** Confirms the count convention above (no change). **Counts from the score's MIDI…** now first adds a hold sub-set for bars no set's measures cover (G.P.s between moves; an intro before the first move): after set 4 it's 4A, after 4A it's 4B; same spots and label pins as the set before; its measures are those bars; one count per beat of them; note "Hold (m. 33)". It's part of the same undo step, and running it again adds nothing.
- **Other options:** stretch the next move's first count across the gap (the old behavior: dots creep through the G.P.); a separate "hold" property on sets (not how drill writers think of it).
- **Known limits:** a G.P. *inside* a set's measures is skipped for counting, but the set's move still runs straight through it, as the 2008 import has only each set's final page (Pyware's per-count pages are a backlog item). Imported Pyware sets are numbered 1, 2, 3…, not by their Pyware names, so hold names follow Freeform's numbers.

## 2026-10-29 10:05 EDT — Pyware set names and count-by-count paths; no labels during playback
- **Who:** Jason Tiller (match Pyware's notes and count-by-count pages; hide labels for the whole playback, even on sets; back when stopped or paused; selected performers keep theirs); details by Claude *(Jason can veto)*
- **Set names:** taken from the first lines of each set's note: "Set 2A", "Set:  3A", "Page: 2" (2008–2010 files all use one of these). A set whose note has no number (often set 1's title) keeps its position number. Names are kept as written, so a note that says "Set 18" between 12 and 13 (Indiana Jones 2009) shows 18.
- **Count-by-count:** a scan of 9 shows found every in-between page exactly on the straight line in the 2008 shows, and 10 sets in 2009–2010 that aren't (follow-the-leader, a 4-count hold then a 12-count move, a 58-dot rotation, jumps on count 1). Those performers get `set.paths` (one spot per count, from the previous set to this one); playback follows it, and the move's step size is its biggest single count. A path is used only while its two ends still match the sets and its length matches the counts, so any edit falls back to a straight move with no stale data. Checked: Freeform's position equals Pyware's page at every count of every path in all 9 shows.
- **Other options:** split such moves into sub-sets (a rotation would need one per count); keep paths as offsets from the straight line so they survive edits (would bend edited moves in ways nobody drew).
- **Labels:** while playing, no labels at all (the "show on each set and its first count" rule is gone), in the editor and the phone view; selected performers keep theirs, and on the phone so does your own. Paused or stopped: all labels.
- **Known limits:** the path line drawn on the field and on printed charts is still straight. One Zelda 2008 copy in Examples_Drill has no saved sets (also before this change).

## 2026-10-29 10:00 EDT — Guard against score-conversion glitches (odd bars)
- **Who:** Jason Tiller (protect against the m. 31 glitch in the future); approach by Claude *(Jason can veto)*
- **Context:** Converting Halo's old Finale file left an extra eighth rest in the flute's m. 31; MuseScore made the whole bar 9/8, which put a half-beat hitch in the rendered audio around 1:17 and moved every later count.
- **Decision:** Two guards. (1) Freeform: **Counts from the score's MIDI…** warns about any lone bar that's a fraction of a beat longer or shorter than the matching bars on both sides (9/8 between 4/4). Real meter changes (whole beats: 6/4, 2/4, 3/4) aren't flagged. (2) The conversion skill (finale-mus-to-musescore) gets a required bar-length check on the MusicXML before anything is rendered: every part, every bar, against its time signature; a trailing extra rest past a full bar is removed, anything else is listed for review.
- **Other options:** fix odd bars inside Freeform (it only has the MIDI, so it can't know which part was wrong); trust the converter.

## 2026-10-29 10:20 EDT — Performer roster
- **Who:** Jason Tiller (a roster assigning dots to people; the selected dot's person shown in Selection; import names from Pyware: yes; names travel only in encrypted links); layout by Claude *(Jason can veto)*
- **Decision:** `performer.name` (optional, up to 100 characters, checked on import). Selection shows **Name** first for a single selected dot (editable; blank = unassigned). A collapsible **Roster** list in the sidebar shows every dot in section order with its name; clicking a label selects the dot. Pyware `.3dj` imports take each dot's name from the CAST block. Names are kept in the show, autosave, exported `.freeform` files and the encrypted hosted-link file; **plain share links strip them** (anyone with the link can read a share link). The phone's "who are you?" list shows "P4 · name" when the show has names.
- **Other options:** keep names out of Freeform entirely (dot labels only); names in every link; a separate roster file.

## 2026-10-29 10:35 EDT — Roster import from a spreadsheet; names on dot sheets
- **Who:** Jason Tiller (names on printed dot sheets; import a list of names, instruments and rank codes from Excel to create dots or label existing ones; a lone "Sax" means alto); rules by Claude *(Jason can veto)*
- **Decision:** Roster → **Import a list…**: paste cells copied from Excel (tabs) or load a CSV (commas or semicolons, quoted cells). Columns by header words (Name / First / Last, Instrument / Section / Part, Dot / Code / Label / Rank / Drill…), else guessed from the cells (codes like P4, known instruments, the rest is the name); each column's reading can be changed before applying. A preview lists every row's result; Apply is one undo step.
  - **Code given** (P4, p-4): names that dot (says so if it replaces a name); if it doesn't exist, adds it with that number in the section with that letter. If the instrument disagrees with the code, the code wins (noted).
  - **Only an instrument:** the section's unnamed dots in number order, then new dots numbered after the section's last.
  - **Skipped, with the reason:** no name; no section for the instrument (or an ambiguous one); a code already used on an earlier row; a code letter no section uses.
  - **New dots** go on the front sideline (2 steps in), 2 steps apart, centered on the 50, section by section, in every set.
  - Instrument matching: section letter, exact name, a list of common roster abbreviations, then an unambiguous word-prefix match.
  - **Dot sheets** show the performer's name beside the label.
- **Other options:** read .xlsx directly (needs a spreadsheet library in the app; copy-paste and CSV cover it); create a new section for an unknown instrument (could make stray sections from typos).

## 2026-10-29 10:45 EDT — Roster import: unknown instruments are the drill writer's call
- **Who:** Jason Tiller (don't skip a player whose instrument has no section; let the director add them to a section or leave them off: a bassoonist may march baritone)
- **Decision:** Each instrument in the list that matches no section (or is ambiguous) gets a picker in the preview: "March with <section>" or "Leave them off", one choice for all its rows. Its rows show "waiting" and **Apply** stays disabled until every such instrument has a choice. Rows with a dot code don't ask (the code decides). Changing the pasted list resets the choices.
- **Other options:** skip them (the old behavior); create a section named after the instrument.

## 2026-10-29 10:55 EDT — Pyware label sides imported
- **Who:** Jason Tiller (spotted that the per-set value in each PAGE record is the label direction, not facing: facing has its own FACE block); decoding by Claude (code-1 rule confirmed by Jason, 2026-10-29 10:40: below-right is Pyware's default label spot)
- **Evidence:** byte 10's top 3 bits, in Halo, Mario and Nightmare: dots in side-to-side lines get 0/4, dots in front-to-back lines get 2/6; at the edges of blocks and arcs, 0 points to the front, 2 to Side 2, 4 to the back, 6 to Side 1 (eighths of a turn from the front toward Side 2). Code 1 has no relation to the open space around a dot. On the field, imported sides point out of circles and arcs and away from lines.
- **Decision:** import each set's sides as label pins (0 below, 1 below-right, 2 right, 3 above-right, 4 above, 5 above-left, 6 left, 7 below-left in Freeform's terms). **Code 1 is treated as Pyware's untouched default and left automatic.** Pins still give way (hide) where they'd overlap another label, as with any pin; zooming in shows them.
- **Other options:** pin code 1 too (below-right everywhere it wasn't moved); ignore Pyware's sides.
- **Unknown:** the low 5 bits of byte 10 (almost always 0) and bytes 9 and 11 (per section / per show).

## 2026-10-29 11:05 EDT — Every label shows on printed drill charts (leader lines)
- **Who:** Jason Tiller (labels must always be visible on printed charts; as in Pyware, move the label out and connect it with a bar whose length fits the distance); placement order by Claude *(Jason can veto)*
- **Context:** Halo's printed charts dropped 88 labels over 14 sets (28 on set 1): pinned Pyware sides that would overlap hid instead of moving, and Freeform's print labels are large next to 2-step spacing.
- **Decision:** On printed charts only: a label that doesn't fit beside its dot tries its chosen side, then the other sides, beside the dot; then moves out one label-height at a time (chosen side first, then the others) up to 8 label-heights, and gets a thin leader line from the dot's edge to the label's edge; if there's still no room it's drawn at its usual spot, overlapping. On screen, labels keep the old rule (hidden until you zoom in). Halo: 0 hidden on any chart; at most 9 leader lines on a set.
- **Other options:** shrink crowded labels (smaller than the rest of the page); allow overlaps everywhere; leader lines on screen too.

## 2026-10-29 11:20 EDT — Performers drawn as section letters
- **Who:** Jason Tiller (draw the rank/section letter instead of a dot, centered on the spot, with the number as the label; everywhere; keep a Dots/Letters choice); sizes by Claude *(Jason can veto)*
- **Decision:** `show.symbols` (absent = letters, `'dots'` = the old look), saved with the show and checked on import; picker beside the hash marks. Letters: bold, upright even in Facing front, dark outline on the field, white edge on paper so yard lines don't cut through; selected = letter on a gold badge; section colors color the letter. Labels become just the number. On printed charts the letter is a bit larger than the number. Applies to the editor, printed charts and the phone's staff view; the phone's own-dot (performer) view keeps its highlighted dot.
- **Effect:** Halo's densest set prints with every letter and number beside its spot and no leader lines.
- **Other options:** printed charts only; letters only (no dots option).

## 2026-10-29 11:30 EDT — Dark path lines in the editor
- **Who:** Jason Tiller (picked Option A from mockups of Halo set 9: dark paths vs. black letters with a white outline)
- **Decision:** Normal-step move paths draw dark green-black (rgba(8,28,14,0.6)) instead of light white, so the white letters and numbers stay the brightest thing on the field where many paths cross. Yellow and red step-size warnings are unchanged. Printed charts have no paths.
- **Other options:** black letters with a white outline (helped letters, not numbers); both.

## 2026-10-29 11:45 EDT — Field colors settled
- **Who:** Jason Tiller (after mockups of Halo set 9)
- **Decision:** Keep white letters and white numbers, both with black outlines, and dark path lines. Rejected after mockups: black letters with a white outline; black numbers with a white outline; plain black numbers.

## 2026-10-29 12:00 EDT — One palette for the whole app
- **Who:** Jason Tiller (make the colors match wherever possible, so the app looks like one package; path lines in the interface's dark green); palette by Claude *(Jason can veto)*
- **Decision:** 18 named colors in `src/ui/palette.ts`, mirrored as CSS variables in `index.html` (a test keeps them identical). About 40 near-duplicate colors were folded in: seven panel/background greens into bg / bg-deep / surface / surface-2, five border greens into line / line-strong, two golds, two reds, two blues, four off-whites into text. Normal-step paths on the field are now the interface's own bg green (solid, #1d2a1f). Kept separate on purpose: the turf, the bright red for too-big steps on the field, black and white, and print colors (black on white for copiers).
- **Other options:** keep the slightly different shades; a full theme system (light/dark).

## 2026-10-29 12:15 EDT — Legible beats pretty: contrast targets
- **Who:** Jason Tiller (always keep good contrast between elements; when in doubt, legible is better than aesthetic); targets and fixes by Claude *(Jason can veto)*
- **Decision:** Standing rule in CLAUDE.md: text ≥ 4.5:1, lines and shapes ≥ 3:1 (WCAG), checked by `palette.test.ts`. Fixes from measuring the palette: normal paths use bg-deep (2.8 → 3.0:1 on the turf); yellow/red step paths keep their colors but get a dark casing (red alone was 1.6:1 on the turf); step-size text on panels uses warn/danger, not the field's red (was 3.6–4.2:1); the timeline's current move is surface-2 with a gold bottom bar instead of green (red text on it was 2.5:1); "done" green brightened (#5d9b6c → #7cc08b, 4.2 → 6.4:1). The field's red joined the palette as step-red.

## 2026-10-29 12:20 EDT — Letters in the phone's own-spot view too
- **Who:** Jason Tiller (yes, do it); look by Claude *(Jason can veto)*
- **Decision:** In a performer's own view on the phone, with Letters on: their own spot is their letter on a gold badge (larger), their nearest neighbors are bright letters labeled with their numbers, the rest of the band are quieter letters (60% white, outlined) without numbers. With Dots, it's unchanged.

## 2026-10-29 12:30 EDT — Path lines follow count-by-count routes
- **Who:** Jason Tiller (yes); by Claude
- **Decision:** In the editor, a move that has a count-by-count path (imported from Pyware) draws its path line through every count's spot, skipping counts where the performer stands still; color = the move's step-size tier (its biggest single count). Plain moves are unchanged. The phone's own-path line already sampled count by count. Checked on Duel of the Fates set 9 (follow-the-leader corners) and Indiana Jones set 18 (rotations draw as circles).

## 2026-10-29 12:40 EDT — Even steps in every move
- **Who:** Jason Tiller (all animations move performers with consistent, even step sizes; no move may have one big step); method by Claude *(Jason can veto)*
- **Decision:** On import, each count-by-count path is re-spaced so every count of a moving stretch covers the same distance along the route (`evenPath`): the route (arcs, follow-the-leader corners) is kept, counts standing still (holds, mark time before a delayed step-off) stay still, ends are unchanged. Fixes Pyware pages that jump on count 1 (e.g. Indiana Jones set 13: 7 steps on count 1, then 1 per count → even), Nightmare set 12, Dream On set 5. Straight moves were already even (linear). On a count that turns a corner the straight-line distance looks shorter (part one way, part the other), but the distance marched is the same. Standing rule added to CLAUDE.md.
- **Known limit:** a stretch that moves, holds, then moves again is even within each stretch, but the two stretches can have different step sizes (as written).
- **Other options:** even the whole move including holds (would erase holds); leave Pyware's spacing.

## 2026-10-29 13:40 EDT — Pickups are m. 0 when matching a MIDI to the drill *(pickup part superseded at 13:55; widening kept)*
- **Who:** Jason Tiller (Dream On: the band starts set 1 → 2 on count 1 of m. 1, not on the pickup); detection by Claude *(Jason can veto)*
- **Decision:** A MIDI whose first sound starts after the first bar's downbeat (a pickup at the end of the bar, as the score conversion now renders it) is numbered from m. 0, so drill measures line up (m. 1 = first full bar). Count 0 falls on the pickup beat. Also: when a set's counts fit exactly once the uncovered bars right before it are included, the set is widened instead of getting a hold, with a note (Dream On set 7: "mm. 35-37, 12 Counts" in the note but 16 counts → m. 34–37).
- **Known limit:** a score whose first full bar begins with rests in every part would be read as having a pickup.
- **Other options:** a "score has a pickup" checkbox; number MIDI bars from 1 and expect "0–" ranges in the drill.

## 2026-10-29 13:55 EDT — A MIDI's first bar is m. 1, pickup or not
- **Who:** Jason Tiller (the drill still lagged two beats; the score numbers the pickup m. 1); fix by Claude *(Jason can veto)*
- **Context:** the 13:40 pickup detection guessed m. 0 from a padded first bar, which was a conversion artifact: MuseScore padded the one-beat pickup to a full 3/4 bar, putting two dead beats before m. 2. That padding was the two-beat lag.
- **Decision:** Freeform no longer guesses: the MIDI's first bar is m. 1, as in the score. The score conversion gives the pickup its own short meter (1/4), so the MIDI and the recording have no dead beats. Dream On now fits every move (set 1A: the pickup + 7 bars of 3/4 = 22 counts).
- **Other options:** keep detecting padded pickups as m. 0 (wrong for this score's numbering); trim the MIDI afterward.
- **Open:** this goes against the 2026-10-23 "pickups are measure 0" convention for typed measures. *(Settled at 2026-10-30 12:50: pickups are m. 1 everywhere.)*

## 2026-10-30 12:50 EDT — Pickups are measure 1, everywhere
- **Who:** Jason Tiller
- **Context:** the Measures box used "pickups are measure 0" (2026-10-23), but scores number the pickup bar m. 1, and counts from the MIDI now follow the score.
- **Decision:** a pickup bar is m. 1 in typed measures too, matching the printed score. The Measures box hint for set 1 now reads "e.g. 1–4". The box is still free text; a show typed the old way ("0–4") just needs its numbers raised by one to match a MIDI.
- **Other options:** support both (detect m. 0 in typed measures).

## 2026-10-30 13:30 EDT — Music on phones
- **Who:** Jason Tiller (music on phones: yes, earlier; asked to build it now); details by Claude *(Jason can veto)*
- **Decision:** the locked hosted file gets an optional `audio` part: the recording, encrypted with the show's key (its own nonce), with its type. Only sent when the show has tapped counts. The Share dialog's **Include the music** is on by default and shows the size. The phone stores the recording in its browser storage under the show's audio id (replacing the old one), and plays along by the show's counts. **♪ Music** on the phone switches to a tempo for slow practice; the tempo box hides while the music is on. Sound starts inside the Play tap, since phones only allow sound there. Files are capped at 40 MB, the recording at 25 MB, and the audio type must be `audio/…`.
- **Other options:** host the audio as a separate file (two uploads for the director); stream instead of storing (no offline use).
- **Known limit:** big files on a gist fail (use a repository). *(The re-download worry was wrong: see 2026-11-02.)*

## 2026-10-30 13:40 EDT — Host locked files in a GitHub repository; keep the key from download
- **Who:** Claude, after Jason's 500 error creating a gist with the Closer's music (~5.6 MB) *(Jason can veto)*
- **Decision:** the Share dialog now recommends a GitHub repository (Upload files, then the Raw link) instead of a gist: the gist page fails on big files, and raw.githubusercontent.com allows other sites to read the file. Also fixed: the key of a downloaded locked file was kept only while the dialog stayed open, so closing it to upload the file lost the key and left the upload unopenable. The key is now saved in the browser per show title the moment the file is made, and cleared when the address box is cleared.

## 2026-10-30 13:50 EDT — One-click publishing to the director's GitHub repository
- **Who:** Jason Tiller (chose Option A: Freeform uploads to his GitHub repository; revisit storage if other directors adopt Freeform); details by Claude *(Jason can veto)*
- **Context:** the manual flow (download the locked file, upload it to GitHub, paste the address) was clunky in practice.
- **Decision:** the Share dialog's Hosted link section connects once to a public repository with a fine-grained token (Contents: Read and write, that repository only). Both are kept in the browser's localStorage; the token is sent only to api.github.com. **Publish to phones** locks the show (reusing the show's key, so the link stays the same), creates or replaces `<title>.freeform-locked` through GitHub's contents API on the default branch, and shows the hosted link and QR code. A private repository is refused (phones couldn't download from it). The manual steps stay under "Or host the file yourself".
- **Other options:** a Freeform-run upload service (no GitHub account, but a server to run); GitHub's OAuth device flow (needs a registered app and a proxy, since GitHub's token endpoint doesn't allow browser calls).
- **Known limits:** anyone using that browser can publish to that one repository. GitHub's raw files can take a few minutes to update. A renamed show publishes to a new file name and gets a new link.

## 2026-10-30 17:45 EDT — Count-first layout: movements and adding a set at a count
- **Who:** Jason Tiller (writers work both ways, whole show in one file or one file per tune; he types the totals; add a set by clicking the timeline or typing the count; the unwritten part is shown and performers hold there); details by Claude *(Jason can veto)*
- **Decision:** a show can have **movements**: named stretches of counts (`movements: [{id, name, counts}]` in the file, checked on import). The timeline's length is the larger of the written sets and the movements' total; past the last set it's striped *Not written yet*, performers hold on the last set, and playback (and the music) runs to the end. Movement starts are dashed blue lines; the readout names the current movement. **+ Add set** adds a set exactly at the playhead when it's mid-move or past the last set, or at a typed **at count**. No other set moves (the 2026-10-22 rule). Mid-move, the new set takes everyone's spots at that count, so the drill looks the same, and is named as a sub-set (1A, like holds from the MIDI; the naming helper is now shared). With the playhead on a set and no count typed, **+ Add set** still adds 16 counts after it and later sets move along, as before. The phone treats the unwritten part as holding on the last set.
- **Other options:** one show-level total only (doesn't fit a whole show in one file); renumbering sets after an insert (renames sets people already refer to).

## 2026-11-02 09:36 EST — Finishing recent work: movement names, curved paths, phone downloads
- **Who:** Jason Tiller (finish the recent work); details by Claude *(Jason can veto)*
- **Movement names:** drawn on the timeline in blue where each movement starts, below the moves' text (no change in height), and at the front of each printed chart header ("Opener · Set 3 · 16 counts…"). A set belongs to the movement its move into it is in, so a set hit on a movement's last count is in that movement; set 1 is in the first.
- **Curved paths:** nothing to build. The editor's path lines and the phone's own path already follow count-by-count routes (2026-10-29); printed charts show only each set's spots, as Jason asked. PLAN.md's note saying otherwise was out of date.
- **Phone downloads:** nothing to build either. The phone fetches hosted files with `cache: 'no-cache'`, which makes the browser ask GitHub whether its stored copy changed; GitHub answers 304 (0 bytes, checked) for an unchanged file. The service worker leaves other sites' files alone. A version check of our own isn't possible without GitHub exposing the ETag to scripts. Supersedes the "re-downloads the whole file" limit in the 2026-10-30 music-on-phones entry.

## 2026-11-02 09:49 EST — No shapes that create performers
- **Who:** Jason Tiller
- **Decision:** shapes only arrange performers who already exist. Performers (dots) are defined when the drill file is first created (added on the field, imported from a roster or from Pyware). Taken off PLAN.md.

## 2026-11-02 09:49 EST — Follow-the-leader routes with turns; paths mid-move
- **Who:** Jason Tiller (finish the FTL follow-ups); details by Claude *(Jason can veto)*
- **Decision:** an FTL group can have `turns`: the leader's turning points, in marching order (up to 50, checked on import). The leader marches start → turns → end spot, and the trail runs back from the end through the turns to the leader's start and each follower's start. Everyone covers the leader's whole route length at one steady speed, so steps stay even through corners (house rule), and the step size shown is the route's length over the counts. Turns are added as in Pyware, by clicking: **FTL ▾ → Add turns**, then click each turn on the field (snapped to the grid setting; the top bar says what to do; Esc ends). **Remove last turn** and **Straight route** take them back; Undo works too. Reordering followers keeps the route; a new leader, or deleting the leader, starts straight. Path lines and FTL trails now also draw mid-move, for the move the playhead is in.
- **Other options:** dragging the trail to bend it (needs handles; later if wanted).
- **Known limits:** *(fixed the same day, see below)* turns didn't move when the group was mirrored, rotated or scaled, and couldn't be dragged.

## 2026-11-02 09:55 EST — FTL turns: draggable, and they move with the group
- **Who:** Jason Tiller (fix both limits); details by Claude *(Jason can veto)*
- **Decision:** with an FTL group selected (exactly its members) on its set, each turn shows a blue handle like a shape's; dragging it (in Select or Add turns) moves that turn, snapped to the grid setting. Flip across the 50, Flip front ↔ back, Rotate and Scale move the turns of any group whose leader is in the selection with the same transform (`mapTurns`); dragging the whole group drags its turns too. Dragging only the leader still moves just its end spot, so the route's turns stay where they were placed.
- **Not covered:** *(fixed the same day, see below)* Copy Side 1 → 2 didn't create FTL groups for the copies.

## 2026-11-02 09:58 EST — Copy Side 1 → 2 copies follow-the-leader groups
- **Who:** Jason Tiller (fix the gap); details by Claude *(Jason can veto)*
- **Decision:** a follow-the-leader group whose members are all on the copied side becomes a group on the other side too, in the same order, with its turns mirrored. For its members, the partner is whoever starts the move mirror-opposite them (instead of the least-travel pairing used for everyone else), so the leader's twin leads and the copy follows the mirrored trail; the copy's spots then come from the trail, as with any FTL. The original group stays.
- **Bug fixed along the way:** making an FTL group, or floating one, dropped the turns of every other group in the same set. Other groups now keep their turns unless they lose their leader.

## 2026-11-02 10:09 EST — Music: re-tap from a count, waveform, counts from MusicXML
- **Who:** Jason Tiller (do the music tasks); details by Claude *(Jason can veto)*
- **Re-tap:** the tap dialog takes **Redo from count N** (when taps exist). Playback starts two counts before N; counts before N keep their taps; new taps replace from N, and the old taps after the new ones stay if they still come later in time (so a passage can be redone in the middle).
- **Waveform:** the recording is decoded in the browser once per recording; its loudness (the biggest sample per 10 ms, scaled to the loudest) is drawn along the bottom of the timeline. Each pixel covers its counts' stretch of the recording through the taps, so it lines up with the counts. Color `green-line` at 75% (at least 3.8:1 on every timeline background); count ticks get a dark edge while it's shown so they stay readable over it. No change in height.
- **MusicXML:** **Counts from the score…** (was "from the score's MIDI") takes MIDI, MusicXML or `.mxl`, told apart by content. MusicXML is read into the same bar and tempo map as a MIDI, by a small reader (no DOM needed; no DTDs or entities fetched; size- and bar-capped): bar length = the longest voice in any part (so a pickup is its own short bar), meters, `<sound tempo>` or else metronome marks, whether anything sounds, and fermatas held as MuseScore 4 plays them (half tempo from the fermata to the next note or rest in any part). Checked against MuseScore's own MIDI for the 2010 Opener, 2nd tune and Closer: same bars, meters and silent bars, bar starts within 3 ms. Repeats and endings are counted once through, with a warning.
- **Other options:** MuseScore's .mscz directly (an internal format that changes between versions); playing out repeats (later, if a score needs it).

## 2026-11-02 10:22 EST — Counts straight from a MuseScore file (.mscz)
- **Who:** Jason Tiller (pick the MuseScore file instead of exporting); details by Claude *(Jason can veto)*
- **Context:** converting .mscz to MusicXML needs MuseScore itself, which can't run in a web page; but Freeform only needs the bar and tempo map, which the .mscz holds.
- **Decision:** **Counts from the score…** also takes `.mscz` (a zip; the main `.mscx` at its top level, parts in `Excerpts/` ignored) and `.mscx`. Read: each staff's measures (a stored multi-measure rest skipped, since MuseScore keeps the real bars too), an irregular bar's `len` (pickups) or else its meter, `Tempo` (quarters per second), `Fermata` with its `timeStretch` (MuseScore 4's default when absent: 2), durations with dots and tuplets, grace notes ignored, repeats and voltas warned about. Same fermata rule as MusicXML (held from the fermata to the next note or rest in any part). Files from before MuseScore 3 get a message to re-save or export MusicXML. Checked against MuseScore's MIDI for the three 2010 scores: same bars, meters and silent bars, bar starts within 3 ms.
- **Known limit:** checked on MuseScore 4.7 files; other 3.x/4.x versions store the same elements, but a format change in a future MuseScore could need an update.

## 2026-11-02 10:26 EST — Add music from MuseScore (score + its mp3, one step)
- **Who:** Jason Tiller (option 1: one step, two files, for now; rendering audio in Freeform later if needed); details by Claude *(Jason can veto)*
- **Decision:** **Music ▾ → Add music from MuseScore…** takes two files chosen together: the score (.mscz, .mscx, MusicXML, .mxl or MIDI) and the recording (by audio type or extension). Freeform reads the score's counts (with hold sets, as Counts from the score does), stores the recording, and sets both in one show change (one Undo). If the recording is more than 2 s shorter, or more than 20 s longer, than the score plays (exports add a tail), the note says to check the pair. It's the first button in the menu when the show has no music yet; loading music alone and the separate steps stay.
- **Other options:** Freeform rendering the audio from the score itself (a browser synthesizer plus a ~40 MB sound library; recreating MuseScore's playback; basic sounds only). Kept on PLAN.md for later.

## 2026-11-02 10:36 EST — The score and the recording are two separate steps
- **Who:** Jason Tiller (choosing two files together was confusing: two buttons read as two steps); details by Claude *(Jason can veto)*
- **Decision:** replaces the 10:26 one-picker flow. The Music menu has **Add the score (MuseScore)…** and **Add the recording (mp3)…**, each its own pick, in either order. A score added before any recording waits in the menu (✓ Score: name) until the recording comes, then both are set in one change; a score added after the recording places the counts right away. The length check runs whichever comes second. With music loaded, the buttons read **Add the score again…** and **Replace the recording…**; **Tap counts…** stays for recordings without a score. The waiting score is kept only while the page is open.

## 2026-11-02 10:48 EST — Counts from the score: fix a set whose notes overlap the set before
- **Who:** Claude, from Jason's Nightmare load *(Jason can veto)*
- **Decision:** the mirror of the 2026-10-29 widening: when a set's noted measures start on or before the previous set's last bar (Nightmare set 4 "mm. 24-28" after set 3's "mm. 21-24") and its counts fit exactly from the next bar to its last (16 counts = m. 25–28), its measures become that range, with a note. Nightmare now places all 23 sets.

## 2026-11-02 11:27 EST — Timeline moves are placed at their counts
- **Who:** Claude, from Jason's report (set buttons and yellow lines drifting apart on Nightmare) *(Jason can veto)*
- **Context:** each move's box was a flex item sized to its share of the counts, with 12 px of padding and a 2 px line inside. A box narrower than that (Nightmare's 1-count move 1 → 1A, about 5 px) grows to 14 px, pushing every later box about 10 px past its count, while the set buttons are placed at their counts exactly.
- **Decision:** each move's box (and the "not written yet" box) is placed absolutely at its counts, like the buttons, with the padding on an inner block; the line is centered on the count. Measured on Nightmare's set lengths: 0 px between every button and its line (10.6 px before).
- **Then (Jason):** each set's button starts at its line (its left edge on the line) instead of being centered on it; the last set's button ends at the line, so it stays on the timeline.
- **Then (Jason): stacked buttons.** The set buttons sit in two fixed rows (the row area is always 44 px, so the panel never changes height): each button takes the top row unless it would overlap the one before it there, using the buttons' measured widths. Three sets packed into one button's width (a narrow window, or 15, 15A and the end) can still overlap; a third row would cost another 22 px of field.
- **Then (Jason): time order and stems.** The last set's button no longer ends at its line (15A looked earlier than 15): the timeline keeps just enough room past its last count for the buttons near the end, so every button starts at its own line and left-to-right order is always time order. Each set's line now runs up to its button. Fixed along the way: the move boxes had lost their width setting in the previous change.

## 2026-11-02 11:45 EST — A zoomable, scrollable timeline
- **Who:** Jason Tiller (make it scrollable left to right for long pieces); details by Claude, approved by Jason (15:18)
- **Decision:** the timeline has a zoom, in pixels per count: it fits the window unless that's under 4 px a count, when it opens at 6 (Nightmare's 376 counts: about 2,250 px). **−**, **+** (×1.5, up to 60 px a count) and **Fit** sit beside the count readout. The set buttons and moves scroll together in one container with an always-visible scroll bar, so the panel's height never changes. The mouse wheel scrolls it sideways (trackpads swipe), and a right-drag pans it, as on the field; left-click and drag still move the playhead. When the playhead moves out of view (playing, or a set picked elsewhere), the timeline scrolls to it; scrolling by hand doesn't move the playhead. The waveform canvas is capped at 16,384 px and stretched at high zoom.

## 2026-11-02 12:08 EST — Zoom buttons are magnifying glasses, beside the timeline
- **Who:** Jason Tiller (− and + read as adding or removing counts); placement by Claude *(Jason can veto)*
- **Options:** keep −/+ with a "Zoom" label; magnifier icons in the top row; magnifier icons in a small column at the timeline's right end.
- **Decision:** magnifier icons (zoom out, zoom in) plus **Fit**, stacked at the right end of the timeline itself, where they read as controls for that strip. The top row was already full: there, the zoom buttons cut the count readout down to "Set …" in a 1400 px window. The column fits inside the timeline's height, so nothing changes height.

## 2026-11-02 12:43 EST — The score decides a set's counts
- **Who:** Jason Tiller (Nightmare set 2A should be 52 counts); the general rule by Claude *(Jason can veto)*
- **Context:** Nightmare set 2A was written as 48 counts over m. 7–20, but those bars add up to 52 beats (two are 2/4). Freeform spread the 48 counts evenly over the bars and flagged it.
- **Options:** keep flagging it and let the writer retype the counts; change the counts to fit the bars when the score is added.
- **Decision:** when the score is added, a set whose counts fit its bars no way at all (not a count per beat, not just the bars that sound, not a steady number per bar, not every other beat) takes one count per beat of those bars. The music menu names each set changed, and Undo puts the old count back. Counts that do fit one of those ways (a set "in one" or in half time) are left alone.

## 2026-11-02 12:52 EST — Sections in score order
- **Who:** Jason Tiller (score order instead of alphabetical); details by Claude *(Jason can veto)*
- **Context:** Pyware imports listed sections by dot letter (A Alto, B Bass Drum, C Cymbals, E Baritone…). That list drives the roster and dot-sheet order.
- **Options:** sort imports only; also a button for shows already open; up/down arrows to reorder by hand.
- **Decision:** imports come in score order, and a **Score order** button in Sections sorts any show. Order: piccolo, flute, oboe, bassoon, clarinets, saxes, trumpet, mellophone/horn, trombone, baritone/euphonium, tuba, snare, quads/tenors, bass drum, cymbals, other battery, front ensemble, drum major, guard. Battery: snare, quads, basses, cymbals (Jason: quads before basses; the starting list now matches). Unrecognized names go last in their old order. Later the same day (Jason): sections can be reordered by hand, for a writer's own order or a director's. First as ▲ ▼ arrows; then (Jason) a grip on each row to drag up or down instead. A gold line marks where it lands, and it's one undo. The arrow keys move a focused grip, for keyboard users. Rows stay still while dragging, since moving the grabbed button in the page would drop the drag.

## 2026-11-02 13:07 EST — A Sort menu for sections
- **Who:** Jason Tiller
- **Decision:** the **Score order** button became **Sort ▾**, with Score order, By letter (A–Z) and By name (A–Z). Each choice is grayed out when the list is already in that order, and each is one undo. Letters and names sort ignoring case, with numbers in number order (Symbol 2 before Symbol 10) *(Claude; approved by Jason, 15:18)*.

## 2026-11-02 13:14 EST — Starting-list buttons go in a menu
- **Who:** Jason Tiller (the two buttons should collapse after either choice); the menu form by Claude, accepted by Jason (13:17)
- **Context:** "Back to Freeform's list" appeared only after saving your own list, so the panel grew a button after one choice and lost it after the other.
- **Decision:** one **Starting list ▾** menu, like Sort, holding **Use this list for new shows** and **Back to Freeform's list** (grayed out when new shows already get Freeform's list). The menu closes after either choice; the line under it still says which list new shows get.

## 2026-11-02 13:19 EST — Measures fill in from the score
- **Who:** Jason Tiller (go ahead); details by Claude *(Jason can veto)*
- **Decision:** when a score is added, every set with an empty Measures box gets one: the bar its count 1 falls in through the bar its last count falls in ("9–12", or "9" for one bar). Typed measures are never changed. Sets past the end of the score stay blank. The menu says how many it filled, and Undo takes them back out. The filled measures print on dot sheets like typed ones.

## 2026-11-02 14:44 EST — The phone's "who are you" list in last-name order
- **Who:** Jason Tiller (sort by LastName, FirstName); details by Claude *(Jason can veto)*
- **Context:** the list showed each section by dot number ("P4 · Pat Smith"), so a student had to know their dot to find themselves.
- **Options:** one alphabetical list for the whole band; keep the section groups and sort within each; change only the order, or also show names last-name-first.
- **Decision:** keep the section groups (score order), and within each, named dots by last name then first, shown as "Smith, Pat · P4" so the order is visible; unnamed dots follow by number. Names are stored as typed, so the last name is the last word ("Pat Smith Jr." files under Smith Jr.); a name typed "Last, First" is used as is, which is how to fix a two-word surname ("de Souza, Ana"). Case and accents are ignored. Also fixed: the roster import's tenor sax abbreviations (TS, Tsx) had been commented out by accident.

## 2026-11-02 15:04 EST — Sets can hit mid-bar
- **Who:** Jason Tiller (keep "the score decides a set's counts", but a set may land on beat 3 of a bar); details by Claude *(Jason can veto)*
- **Context:** placing counts by measures assumed every set starts on a downbeat and hits on the last beat of a bar. A set of 15 counts over m. 17–20 (hit on beat 3) fit no rule, so it was rewritten to 16 counts, and the next set (starting on beat 4) was rewritten too.
- **Options:** ask before changing counts; let the writer mark beats in the measures ("20.3"); count straight on from the last hit and accept a hit anywhere in the set's last bar.
- **Decision:** the last. When a set's counts don't fit from a downbeat, they run on a beat at a time from the last set's hit, and the set fits if its hit lands in its last noted bar. After a mid-bar hit (judged at the last set's own count length, so a set "in one" that hits a downbeat isn't mid-bar), the next set always runs on from there, since the music doesn't skip beats; it can be written from either bar. Counts are only rewritten when the hit would fall outside the last bar (Nightmare 2A: 48 counts over 52 beats still becomes 52). Trade-off: a count typo smaller than the last bar now reads as a mid-bar hit instead of being fixed.

## 2026-11-02 15:13 EST — Trust the drill writer: Freeform never changes counts or measures
- **Who:** Jason Tiller ("I would rather trust the drill writer than overwrite their counting of measures"); details by Claude *(Jason can veto)*
- **Context:** adding a score could rewrite a set's counts (12:43 today, "the score decides") or its measures (widening a set over uncovered bars, 2026-10-29; starting a set after one its notes overlap, 10:48 today). With mid-bar hits accepted (15:04), counts that run straight on from the last hit place those sets correctly without touching what was written.
- **Options:** keep the rewrites; ask before each; never rewrite, place counts around what's written, and flag what doesn't fit.
- **Decision:** never rewrite. Replaces the 12:43 and 10:48 decisions and the widening one. A set whose counts don't fit (Nightmare 2A, 48 counts over 52 beats) keeps them, spread evenly over its bars, and the Music menu names it. A set whose counts run straight on through uncovered bars to its last bar gets no hold; one whose notes overlap the set before runs on from it. Also (Claude): the "steady number per bar" rule now allows no more counts per bar than the bar has beats ("in 5" isn't a thing); it had read 10 counts over two bars that way. Known gap: an intro before the first set whose counts include the intro now gets a hold and a flag instead of being widened.

## 2026-11-02 16:00 EST — Touch support (iPad)
- **Who:** Jason Tiller (start the touch work with an emulator; keep Apple's iPhone and iPad design guidelines in mind); details by Claude *(Jason can veto)*
- **Context:** the editor was mouse-first: right-drag and the wheel to pan and zoom, shift-click to add to a selection, 10 px hit areas, 20–28 px controls, and rows that clipped what didn't fit (on an iPad mini in portrait, Undo, Delete, FTL, Labels and Loop were out of reach). A swipe on the timeline could drag a set to a new count.
- **Options:** a separate tablet layout; touch handling layered on the existing one; leaving tablets for later.
- **Decision:** layer it on, following Apple's guidelines: one finger acts with the current tool, two fingers pan and pinch (iPad drawing-app convention; a second finger undoes what the first started, so a pinch never leaves a stray dot); fingertip hit areas (44 px across) for performers, handles and markup; an **Add to selection** toggle in the sidebar as the visible stand-in for Shift (shown on every device); on a touch screen, 44 px controls, 16 px text in fields (iOS zooms in on smaller), no sticky hover look after a tap, no double-tap page zoom; taller fixed rows set once per device (top bar 56, toolbar 56, timeline row 48, set buttons 44), so nothing changes height while working; rows scroll sideways instead of clipping, with Undo/Redo/Fit pinned to the toolbar's right end (every iPad needs the toolbar to scroll: it is 1320 px wide); timeline set buttons need a touch-and-hold (400 ms; the button lifts) before dragging, so a swipe scrolls. Section rows in the sidebar wrap on touch rather than squeeze the name field. Checked in Playwright's emulated iPads (Pro 11, gen 7, mini) with real multi-touch events; desktop sizes and mouse behavior unchanged. Not yet: a narrower sidebar for portrait/Split View, touch stand-ins for Option-drag, Apple Pencil specifics.

## 2026-11-03 07:15 EST — Supported browsers, and a message for older ones
- **Who:** Jason Tiller (add the device check); the cutoff and wording by Claude *(Jason can veto)*
- **Context:** Jason's iPad mini 2 (iOS 12.5.8, its last update) can't run Freeform: the build targets Safari 16.4 (Vite's default), and iOS 12 has no pointer events, which every tap and drag uses. It showed a blank page.
- **Options:** build down to iOS 12 (older JavaScript output, a pointer-events polyfill, layout workarounds for missing CSS); keep the current target and explain; keep it and say nothing.
- **Decision:** keep Safari 16.4 / iPadOS 16.4 as the floor (every iPad from 2017 on can update to it). A small old-style script in index.html, run before the app, checks for pointer events and regex lookbehind (new in Safari 16.4, so a stand-in for "can read the code") and, if either is missing, shows "Freeform needs a newer browser" with what's needed. Checked in Chromium with each feature removed, and confirmed by Jason on his iPad mini 2 (iOS 12.5.8, Safari) on 2026-11-03. The README states the requirement.

## 2026-11-03 07:45 EST — A show/hide button for the sidebar; over the field on narrow windows
- **Who:** Jason Tiller (go ahead with the sidebar follow-up); details by Claude *(Jason can veto)*
- **Context:** the sidebar is 300 px wide, so on an iPad in portrait (768–834 px) the field got well under half the screen.
- **Options:** a narrower sidebar; one that wraps below the field; a show/hide button (Apple's iPad sidebar pattern), beside the field when wide and over it when narrow.
- **Decision:** the button, pinned with Undo/Redo/Fit. Under 900 px wide the sidebar starts hidden and opens over the field's right side (a shadow marks its edge); opening it doesn't resize the field, so the zoom stays. It stays open until the button is tapped again, so tapping performers while reading their coordinates still works. 900 px and wider it sits beside the field, as before; hiding it there gives the field the room (the field refits once). Rotating the iPad goes back to the default for the new width. It is hidden rather than removed, so open panels and half-typed notes survive.

## 2026-11-03 08:15 EST — Phone header: full title, and a searchable "who are you"
- **Who:** Jason Tiller (the top was cut off and hard to read; type a name to search the list); details by Claude *(Jason can veto)*
- **Context:** the phone's top row held the picker (iOS's own select wheel) and the show's title at 75% opacity side by side, so a long title was cut short and dim, and a long band list could only be scrolled.
- **Options:** keep the native picker and add a separate search box; a combobox that filters as you type in place; a button that opens a full-screen sheet with a search box (the iOS Contacts pattern).
- **Decision:** the title on its own line at full contrast (up to two lines), then a full-width 44 px button showing the choice. It opens a sheet (whole screen on a phone, a centered panel when wider) with the search box focused and the band by section, Staff (whole band) first. Every word typed must start a word of the name, dot label or section; capitals and accents don't matter; Return picks the top match; no match says so. A filled-in choice is no longer cleared back to "Who are you?" from the list (pick Staff instead).

## 2026-11-03 08:45 EST — Keep everything inside iOS's safe area
- **Who:** Jason Tiller (the phone's bottom buttons sat too close to the bottom edge); details by Claude *(Jason can veto)*
- **Context:** on his iPhone, the page ran behind the home indicator, but iOS reported the safe-area insets as 0 (it only reports them to pages with `viewport-fit=cover`), so the bottom controls' inset padding did nothing; the title's blur under the status bar was the same kind of problem at the top.
- **Decision:** `viewport-fit=cover` in the viewport tag, and the whole app (`#root`) padded by the four insets, so the editor (an iPad home-screen app) and the phone view both stay clear of the status bar, home indicator and a landscape notch. The "who are you" sheet, which covers the screen on its own, pads itself the same way. The phone header keeps its 24 px top padding inside that. Computers report 0, so nothing changes there. Not testable in Chrome's emulators (they report no insets): checked on Jason's iPhone.

## 2026-11-03 10:15 EST — Toolbar and timeline menus open on the page, not inside their row
- **Who:** Claude, from Jason's Device Hub report (Add Performer(s) only turned gold after a tap on the field, and a second tap was needed to add a dot) *(Jason can veto)*
- **Context:** menu panels were children of the toolbar row, which scrolls sideways since the touch work. iPad Safari clipped the panel out of sight but still let its buttons catch taps, so a tap on the field under the toolbar picked the hidden first section. Chrome doesn't clip this way, so the emulator tests missed it.
- **Decision:** the panels render into the page body (a React portal), placed against the window as before, so no scrolling row can clip them. A tap outside the button and the panel still closes it. Because the panel is no longer next to its button in the page, opening it moves keyboard focus to its first button. Applies to every toolbar menu and the timeline's Music and Movements menus.

## 2026-11-03 10:30 EST — Two toolbar rows; Delete asks first
- **Who:** Jason Tiller (the sideways-scrolling row was counterintuitive: placement tools on their own row, Delete stays with Select; an "are you sure" on Delete); details by Claude *(Jason can veto)*
- **Decision:** row 1: Select Performer(s), Add Performer(s), Delete Performer(s) (Jason: named to match), then Undo, Redo, Fit and the sidebar button at the right. Row 2: Snap to grid, Apply, Markup, Shape, Transform, FTL, Labels, Reset to set. Both are fixed height (two rows means the field gives up one row's height). On a touch screen 820 px wide or less the label reads "Snap" instead of "Snap to grid", so row 2 fits an upright iPad mini without shrinking any button below 44 px; narrower windows (Split View) still scroll as a fallback. Delete asks "Are you sure you want to delete P4 (Pat Smith)? …" (or "these 12 performers"), and so does the Delete/Backspace key (Claude: a stray Backspace is the likelier accident); Undo still brings them back. Deleting markup doesn't ask.

## 2026-11-03 11:15 EST — iPhone Duo: a phone when closed, a small iPad when open
- **Who:** Jason Tiller (closed: behave like a phone, no editing; open: a small iPad, which could gain the iPad features); details by Claude *(Jason can veto)*
- **Context:** WebKit's published Duo sizes (CSS px): closed 382 × 580–618 (594 × 368–406 on its side), open 669 × 867–902 (951 × 585–620 on its side), open with two apps side by side 385 × 571–609. Freeform decided "phone" once at launch from the screen's short side (< 600), so folding did nothing.
- **Options:** keep the screen-only rule; decide by the window only (an iPad's narrow Split View pane would lose the editor); screen or window.
- **Decision:** a phone is a touch screen whose screen's short side is under 600 or whose window's short side is under 450 (`phoneSized`, unit-tested with every size above), re-checked 0.4 s after each resize. Closing a Duo in the editor reloads into the performer view and notes it (sessionStorage); opening it again returns to the editor only with that note, so a performer who came by link stays on the performer screen (now with "← Editor"). The show is autosaved on every change; the undo history does not survive the switch. Side effects: an iPad Split View pane under 450 wide also gets the performer view, and switches back when widened. On touch screens 700 px wide or less the toolbar reads Select / Add / Delete / Reset and drops the "Freeform" title (full names kept for screen readers); on touch screens 650 px tall or less the sidebar starts hidden. Not used yet: Safari's Device Posture and Viewport Segments APIs (behind feature flags).

## 2026-11-03 11:45 EST — iPhone Duo, take two: decide by the window alone; a closed launch counts as a fold
- **Who:** Claude, from Jason's Device Hub test (the open Duo showed only "paste the share link / scan QR code") *(Jason can veto)*
- **Context:** two likely causes: what an open Duo reports as its *screen* size is unknown (anything under 600 made it a phone), and Freeform launched on a closed Duo was treated like a performer who chose that view, so opening it didn't bring the editor.
- **Decision:** a phone is a touch screen whose *window's* short side is under 500 (every iPhone is 440 or less; an open Duo is 585 or more); the screen size is no longer used. A launch into the performer view forced by a phone-sized window is noted like a fold, so opening the Duo (or widening the window) goes to the editor, at once or on the next load. Replaces the 11:15 rule; the rest of that entry stands.

## 2026-11-03 12:20 EST — Editor top margin matches the bottom on touch screens
- **Who:** Jason Tiller (option C: equal top and bottom margins for visual balance), from the iPhone Duo on its side *(Jason can veto)*
- **Context:** with the clock at the right, the top bar sat near the top edge while the timeline kept the home-bar margin below. Matching the 84 pt clock column (tried first) didn't take effect in Device Hub and would have cost the field the most height on the shortest screen.
- **Decision:** in the editor on touch screens, the top margin is the larger of the status bar and the home-bar margin plus 12 px (the timeline's bottom padding), so "Freeform" and the last timeline row sit the same distance from their edges. The performer view is unchanged.

## 2026-11-03 12:45 EST — A slimmer timeline on short touch screens
- **Who:** Jason Tiller (implement the shorter timeline rows); details by Claude *(Jason can veto)*
- **Context:** on an open iPhone Duo on its side (585 px tall) the timeline took 221 px and the field about 184.
- **Decision:** on touch screens 650 px tall or less: one row of set buttons instead of two (buttons of close sets overlap; the current set's stays on top; zooming the timeline spreads them), each move's text on one line in a 40 px track, a 44 px controls row, less padding, and the zoom buttons two across instead of stacked (stacked, they alone held the timeline at full height). Timeline 221 → 155 px; field 184 → 250 px. Every button stays 44 px. Taller screens are unchanged.

## 2026-11-03 16:30 EST — Logo and tagline
- **Who:** Jason Tiller (concepts and font tests from Claude)
- **Context:** Freeform needed a mark and wordmark that say "free" and "marching." Seven logo concepts were mocked up, then wordmark type was narrowed over several rounds, tested on dark, on white paper and at small sizes.
- **Options:** Mark: Freeform curve, zero dot, dot path, F in formation, open-field brackets, coordinate-sheet hero, flag silk. "Free": Parisienne, Great Vibes, Rouge Script, Norican, Amita Bold, plus ten others. "FORM": Graduate or Barlow.
- **Decision:** Tagline "Drill, without the bill." Mark: the Freeform curve (13 evenly spaced dots in an S, first dot gold, echoing the even-steps rule). Wordmark: "Free" in Parisienne, gold, with a thin outline to strengthen its hairlines; "FORM" in Barlow Semi Condensed Bold, all caps. A "small" version (script 20% larger, heavier outline) is for toolbar size; below that, use the curve alone. Amita Bold was the runner-up for readability. Files are in `brand/` with letters converted to outlines, so no fonts ship (both fonts are SIL OFL). `brand/build_logo.py` regenerates them.

## 2026-11-03 16:55 EST — FF monogram joins the logo family
- **Who:** Jason Tiller (designs from Claude)
- **Context:** A square mark was needed for app icons, avatars and merch. Dot-shaped F marks were tried, but next to the wordmark they repeat the F; an FF monogram compresses the wordmark itself.
- **Options:** Dot F (block, script, lowercase); FF side by side; FF interlocked; FF interlocked on an app-icon tile.
- **Decision:** Keep FF interlocked (Parisienne F in front, its swash roofing a Barlow Semi Condensed Bold F, with a see-through gap where they cross) and the same on a rounded green tile as the app icon. Family: full logo for headers, covers and the README; FF for square spots; the curve alone at favicon size, where the script F turns to a scribble. Files: `brand/freeform-ff-{dark,light,icon}.svg`.

## 2026-11-03 17:15 EST — Favicon and home-screen icons
- **Who:** Jason Tiller asked for them; the details below are Claude's calls (Jason can veto).
- **Context:** The app still used the placeholder icon (a small field with dots). The brand rules say: FF for square spots and the app icon, the curve alone at 16 px.
- **Options:** The rounded FF tile as is; a full-bleed square; the curve for home screens too.
- **Decision:**
  - **Home screens** (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`): FF on a *full-bleed* green square, because iOS and Android cut their own shapes and a pre-rounded tile would get a second, mismatched rounding. The letters are sized to stay inside Android's smallest mask (a circle 80% of the icon), so `icon-512` stays marked "maskable".
  - **Browser tab** (`favicon.svg`): the curve, with fatter dots than the logo's (they were faint at 16 px), dark dots on light tabs and light dots on dark tabs via `prefers-color-scheme`. `favicon-32.png` (FF) is the fallback for browsers without SVG favicons.
  - **Offline cache bumped to `freeform-v2`:** the offline helper serves files without a hash in their name from its cache forever, so phones would otherwise keep the old icons. Checked: a browser with v1 cached switches to the new icon after one visit. Icons already on a home screen may not change until the app is removed and added again; that's up to the phone.
  - Sources and the render script live in `brand/` (`freeform-app-icon.svg`, `freeform-favicon.svg`, `render_icons.cjs`).

## 2026-11-03 18:10 EST — The curve becomes the app icon; icon picker deferred
- **Who:** Jason Tiller (proposed by Claude). Picker deferral proposed by Claude (Jason can veto).
- **Context:** Mocked up as an app icon, the curve stayed crisp at small sizes where FF's script F turned to a scribble, and on field dark it stood out among other apps' bright icons. Jason also asked about letting users choose their app icon, with FF on field dark as an option.
- **Options:** Keep FF as the app icon; the curve on turf green; the curve on field dark (normal or fat dots); a user-chosen icon.
- **Decision:** The app icon is the curve with fat dots on field dark, bigger on iPhone/iPad (Apple never crops to a circle), circle-safe on Android. This replaces the FF home-screen icons from the entry above; the favicon is unchanged. FF moves to brand spots (avatars, shirts, stickers); FF on field dark is saved as `brand/freeform-app-icon-ff.svg`. Offline cache bumped to `freeform-v3`. **Icon picker: not now.** Native apps can swap their icon on request (iOS alternate icons, Android activity aliases), but a home-screen web app can't: iOS keeps the icon from the moment it's added, and Android takes it from the one site manifest and keeps it in sync. A picker could at best choose before adding to the home screen, and changing later would mean deleting the app, which on iOS deletes its saved shows. Revisit with store-wrapped apps (PLAN).

## 2026-11-03 18:40 EST — Logo in the app
- **Who:** Jason Tiller asked for the logo everywhere customer-facing; the placements below are Claude's calls (Jason can veto).
- **Context:** The app showed "Freeform" as plain text in the editor's top bar, the phone's start screen and the old-browser page, and pasted links had no preview image.
- **Options:** Logo or plain text in each spot; full logo, small logo or the curve in the top bar; logos on printouts or not.
- **Decision:**
  - **Top bar:** the small logo (24 px tall, 30 on touch screens), or just the curve when the window is 1000 px wide or less, so it never crowds the set controls. The bar's height doesn't change (checked at desktop, narrow and iPad sizes).
  - **Phone start screen** and **old-browser page:** the full logo.
  - **Link previews:** `og-image.png` (logo on field dark) and a description with the tagline, for iMessage, Slack and email.
  - **Printouts: no logo.** Dot sheets and charts belong to the director's show, the way a score belongs to its composer, not the notation program; a logo on every card would also cost ink and space. Easy to revisit as an opt-in "Made with Freeform" line.

## 2026-11-04 09:20 EST — Light mode
- **Who:** Jason Tiller asked for a light mode users can switch to; the details below are Claude's calls (Jason can veto).
- **Context:** The app had one dark palette shared by the page styles and the canvas.
- **Options:** Light mode for everything, the field included; light panels with the field unchanged; follow the device's light/dark setting, or a button; where the button goes.
- **Decision:**
  - **The field doesn't change.** Turf, yard lines, dots, paths and their warning colors keep the current palette in both modes, so a show reads the same everywhere and the contrast checks on the turf still hold. Only what sits off the turf follows the mode: the panels, buttons, text, the space around the field and the yard numbers printed there.
  - **A second palette** (`LIGHT` in `palette.ts`, `:root[data-theme=light]` in `index.html`), with the same names and the same contrast checks as the dark one. Gold becomes deep green (#245c33) in light mode, since gold is unreadable on white. (First tried a dark amber; Jason didn't like it and picked deep green over purple, plum, or real gold buttons with dark outlines.) Jason then didn't like gold text on deep green either; from mockups of five options (turf green, real gold, field dark with gold text, a gold tint, a turf outline) he picked **real gold**: pressed buttons in light mode are the same gold as in dark mode (`gold-fill`), with dark text (`on-gold`, 11.6:1) and a 2 px field-dark edge; `gold` itself (focus rings, set lines, selection outlines) is field dark (#1d2a1f) in light mode.
  - **A button, default dark.** A sun/moon button at the right of the editor's top bar and beside Facing front on the phone; the choice is kept in that browser. It doesn't follow the device's setting yet (that would turn Freeform light for everyone whose computer is in light mode, unasked); easy to add as the default when nothing's been chosen.
  - **Logos:** the brand's light versions in light mode.

## 2026-11-04 09:35 EST — Who authors AI commits
- **Who:** Jason Tiller
- **Context:** Commits Claude made as Jason showed on GitHub as Unverified, since they weren't signed with Jason's key.
- **Options:** Keep authoring as Jason (Unverified); Jason sets up his own signing key; Claude authors its commits as itself (signed, Verified).
- **Decision:** Claude authors its commits as Claude <noreply@anthropic.com>, with Jason as co-author in the message. CLAUDE.md updated. Earlier commits keep their authors (rewriting pushed history on `main` would need a force-push).

## 2026-11-04 10:05 EST — On-field rotate and scale handles
- **Who:** Jason Tiller asked for them; the details below are Claude's calls *(Jason can veto)*.
- **Context:** Rotate and scale were only in Transform ▾ (typed degrees and percents). Directors coming from Pyware expect to grab handles, and on an iPad that's the natural way.
- **Options:** Handles always shown for a selection, or only after a "Transform" toggle; corners scale uniformly or stretch one way; snapping the result to the grid or not; free angles or fixed steps.
- **Decision:**
  - **Always shown** in Select for 2 or more selected performers in a set (not mid-move, not while playing or editing a shape): a dashed frame, a corner square at each corner (scale) and a round knob above (rotate), in the shape-handle blue. No extra button to press.
  - **Corners scale evenly** (both directions); stretching one way stays on the plan.
  - **Angles land on whole degrees and pull to multiples of 15° within 4°; scale lands on whole percents and pulls to 100% within 3%**, so 45° and 90° are easy to hit by finger. The amount shows in the bottom-left readout while dragging.
  - **No grid snap afterward**, same as the menu: a turned block would otherwise collapse dots onto each other. Snap to grid → Apply rounds them when wanted.
  - Same center as the menu (the selection's bounding box), FTL turns go along, each drag is one Undo, and a second finger takes the drag back like every other one-finger action. Handles are sized for fingers on touch screens.

## 2026-11-04 10:15 EST — Corners stretch one direction by default
- **Who:** Jason Tiller (stretching one way is the default); how the corners do it is Claude's call *(Jason can veto)*.
- **Context:** The on-field corners scaled evenly (entry above); Jason wanted one-direction stretching to be what a corner drag does.
- **Options:** Corners stretch each direction on their own; edge handles stretch one way and corners scale evenly; a modifier key to switch (no good on touch).
- **Decision:** Corners stretch side to side and front to back independently, along the field's lines (not the frame's, after a rotate): drag sideways and only the width changes, up or down and only the depth, diagonally for both. Each direction lands on whole percents and pulls to 100% within 3%, so a slightly crooked sideways drag doesn't change the depth. Dragging past the center stops at 10% (no flipping; Flip does that). Even scaling stays in Transform ▾ (Expand/Contract). The readout shows both: "Side to side 150% · front to back 100%". `rotateScale` takes an optional separate front-to-back factor.

## 2026-11-04 13:30 EST — A How-to guide, a shorter README, and screenshots from a script
- **Who:** Jason Tiller asked for an accurate, easy-to-read README and a How-to guide that stays current, in his voice, with screenshots; the details below are Claude's calls *(Jason can veto)*.
- **Context:** README.md had grown into a full manual (one bullet ran past 600 words). The facts in it checked out against the code, but it was hard to read and the roadmap was stale. There was no guide for new users.
- **Options:** Keep everything in the README; a guide in the repo (Markdown) or a separate doc site; screenshots taken by hand or by a script; real or invented sample show.
- **Decision:**
  - **`docs/HOW-TO.md` is the user guide,** organized by task (set up a show, add performers, shapes, FTL, music, printing, sharing, phones, iPad, saving, shortcuts, troubleshooting). It lives in the repo so every change can update it in the same commit, and GitHub renders it.
  - **README.md is now a front page:** what Freeform is and why, the link, a picture, a short feature list, a current roadmap, how to run it, and the code map. The keyboard table and the step-by-step detail moved to the guide. CLAUDE.md's every-change rule now names the guide and the screenshots alongside the README.
  - **Screenshots come from `scripts/screenshots.mjs`** (Playwright, 2× for sharp images), built from an original sample show in `src/engine/sample.ts` (47 performers with invented names, 4 sets: block, arc, company front with a guard FTL turn, and a move that's too fast on purpose so the warnings show). Retaking them after a UI change is one command. The Share screenshot shows the published address, and its QR code is redrawn to match. `sample.test.ts` keeps the sample loadable; `guide.test.ts` fails if the docs use a missing picture, a screenshot goes unused, or a contents link doesn't land.
  - **Voice:** plain, first person where it's Jason talking (the README's opening), second person in the guide, button names in bold, no em dashes. The README's opening states only facts Jason has given (six years teaching band, the licensing-cost goal from IDEA.md); Jason may want to add his own story there.

## 2026-11-04 13:55 EST — The name is written "FreeFORM"
- **Who:** Jason Tiller
- **Context:** The app and docs wrote the name "Freeform"; only the logo drew it as "Free FORM". Jason likes the stylized spelling: it's distinctive and matches the wordmark.
- **Options:** Keep "Freeform" in text and the styling only in the logo; "FreeFORM" everywhere.
- **Decision:** "FreeFORM" everywhere people read the name: the app's text and error messages, the browser tab, the home-screen name (manifest; offline cache bumped to `freeform-v4` so installed apps pick it up), link previews, the logo images' alt text, README, the How-to guide, the brand README, PLAN, CLAUDE.md, LICENSE and code comments. Unchanged on purpose *(Claude's call; Jason can veto)*: anything saved data or links depend on (`.freeform` files, the `freeform-show` format, `freeform:` storage keys, the `Freeform_2` repository and web address), earlier DECISIONS.md entries and IDEA.md (records of what was written at the time), and the label inside the existing logo SVG files, which carry content credentials that editing would break. `build_logo.py` uses the new name, so the next rebuild of the logo files picks it up.

## 2026-11-04 15:05 EST — Store apps alongside the browser version
- **Who:** Jason Tiller
- **Context:** Planning ahead for app-store versions of FreeFORM, and how the docs will describe it. Claude pointed out that directors on school Chromebooks or locked-down district computers may not be able to install apps.
- **Options:** Store apps replace the browser version; store apps alongside it.
- **Decision:** Alongside. Jason wants people to be able to use FreeFORM anywhere they are, so the browser version stays. When the store apps ship, the docs and app text add them ("in your web browser, or as an app from the App Store or Google Play") instead of dropping the browser. The list of wording to update is on the store-apps item in PLAN.md.

## 2026-11-04 15:10 EST — freeformdrill.org as the web address
- **Who:** Jason Tiller
- **Context:** The app lives at `tillerdawg.github.io/Freeform_2/`. Jason wants an address of FreeFORM's own; store apps opening QR-code links need a domain FreeFORM controls (iOS Universal Links and Android App Links need files at the domain's root).
- **Options:** Rename the repository (moves the github.io address and breaks every existing link); a custom domain.
- **Decision:** A custom domain, freeformdrill.org, once it's confirmed available and registered. The repository keeps its name, and the old address should forward to the new one. The switch plan, including moving saved shows (browsers keep data per address), is in PLAN.md.

## 2026-11-04 15:50 EST — Moving to freeformdrill.org without an export notice
- **Who:** Jason Tiller (only he has shows saved so far); details Claude's *(Jason can veto)*.
- **Context:** Jason registered freeformdrill.org at Cloudflare. Browsers keep saved data per web address, so shows saved at the old address don't appear at the new one.
- **Options:** Ship an in-app "export your shows" notice and wait a week before switching; switch as soon as DNS is ready.
- **Decision:** Switch as soon as DNS is ready, since nobody else has data to lose. Jason exports his shows first and imports them at the new address. Cloudflare's records stay "DNS only" (no Cloudflare proxy), because GitHub can't issue the HTTPS certificate through the proxy.

## 2026-11-04 18:20 EST — A show/hide button for the timeline
- **Who:** Jason Tiller asked for it; the details are Claude's *(Jason can veto)*.
- **Context:** Writing drill on a tablet, the timeline and the sidebar take a lot of the screen. The sidebar already had a show/hide button; the timeline didn't.
- **Options:** Collapse the timeline to just its play row; hide it completely; a single "focus mode" button that hides both.
- **Decision:** Hide it completely, with its own button beside the sidebar button at the right end of the toolbar (pinned with Undo, so it's always in reach). Two buttons rather than one focus mode, so either panel can stay. It starts shown and isn't remembered between visits, like the sidebar. Hidden, not unmounted, so its zoom and menus survive. Showing or hiding it resizes the field, which refits it (zooms back out), the same as the sidebar button on a wide screen. This doesn't break the fixed-height rule, which is about things that change on their own as you work, not a button you press. Set controls stay in the top bar and the keyboard shortcuts keep working while it's hidden.

## 2026-11-04 18:55 EST — Apple Pencil: the Pencil edits, fingers navigate
- **Who:** Jason Tiller reported the problems on a real iPad (palm on the screen made the Pencil less accurate; a quick pinch after placing a performer with the Pencil made it disappear). The fix and its details are Claude's calls *(Jason can veto)*.
- **Context:** Fingers and the Pencil did the same thing. A resting palm counted as a finger (in emulation it added performers), and a second finger "took back" the first by running Undo, which could reach one step too far; an iPadOS cancel of the Pencil's touch also took its work back.
- **Options:** Detect palms by contact size (Safari reports it, but unreliably); a Pencil-only setting; switch automatically once a Pencil is used, as drawing apps do.
- **Decision:** Automatic. Once a pen touches the field, a single finger or palm does nothing on the field, two fingers pan and zoom, and nothing a finger does (or a system cancel) takes back the Pencil's work. It lasts until the page reloads, which is how to go back to editing by finger. Separately, taking back a finger's unfinished action now restores the show exactly as it was when that finger came down, instead of running Undo, for everyone (with or without a Pencil).

## 2026-11-04 19:10 EST — Number boxes you can clear and retype
- **Who:** Jason Tiller found it on the iPad (the Tempo box snapped to 120 the moment it was emptied, and showed the full keyboard); the fix is Claude's *(Jason can veto)*.
- **Context:** Every number box cleaned up its number on every keystroke, so an empty box jumped to a default or minimum (typing 150 into the scale box couldn't get past the 1), and a set's Counts changed with each digit, which moved the set while you typed.
- **Options:** Fix Tempo alone; one shared number box for the whole app.
- **Decision:** One shared `NumberField` (`src/ui/NumberField.tsx`) for Tempo (editor and phone), Counts, movement counts, rotation, scale percent, shape interval and columns, Redo from count, and Place exactly. It shows the number keyboard on phones and iPads, can sit empty while you type, applies each valid number as you type, and when you leave it empty puts the last good number back (a number out of range is pulled into range: 400 bpm becomes 300). Counts apply only on Enter or tapping away.

## 2026-11-04 21:20 EST — Renumber sets
- **Who:** Jason Tiller asked for it (deleting set 7 of 8 leaves 1-6 and 8); the details are Claude's *(Jason can veto)*.
- **Context:** Deleting or adding sets leaves gaps or out-of-order names.
- **Options:** Renumber automatically on every delete; a button.
- **Decision:** A **Renumber sets** button beside Delete set, grayed out when the sets are already in order. Not automatic, because renaming sets behind the director's back would stop printed dot sheets, charts, and notes from matching. Main sets become 1, 2, 3…; sub-sets (4A) follow the set before them, lettered A, B… in order. One Undo reverses it.

## 2026-11-04 21:25 EST — Sets renumber themselves
- **Who:** Jason Tiller (replaces the Renumber sets button from the entry above).
- **Context:** Jason would rather not have to click a button after deleting a set.
- **Options:** The button; automatic.
- **Decision:** Automatic. Deleting a set, adding one mid-show, or adding a sub-set keeps every set numbered in order (main sets 1, 2, 3…; sub-sets lettered A, B… after the set before them), and the button is gone. Printed sheets made before a delete will show the old numbers, so reprint after deleting or adding sets. Imported Pyware names are left as they came in until the first set is added or deleted.

## 2026-11-04 22:20 EST — Moves carry forward through holds
- **Who:** Jason Tiller reported it (new performers moved in set 2 jumped back to their set 1 spots in set 3); the rule below is Claude's *(Jason can veto)*.
- **Context:** A performer added to the show gets the same spot in every set, and moving them changed only the set being edited, so every later set still had the old spot.
- **Options:** Carry a move into every later set; carry it only through later sets where the performer was holding (still on their old spot); copy only when adding sets (as before).
- **Decision:** Through holds. A move in set i also moves the performer in each later set where they still stood on their old set-i spot, stopping at the first set where they'd been placed somewhere else, so drill already written for later sets is never changed. It applies to every way of moving performers (`placeInSet`). Holds are judged from the show as it was when the edit began (a drag or a shape), so dragging across a performer's later spot doesn't pick it up. Earlier sets never change. Side effect: the docs' sample show had its drumline left on the 50 in set 4 for this reason; it now holds where it should, and the screenshots were retaken.

## 2026-11-04 23:15 EST — Spiral shape
- **Who:** Jason Tiller asked for a spiral; the details are Claude's *(Jason can veto)*.
- **Context:** Spirals are a standard form, and the existing shapes space performers by distance along the curve. At a spiral's tight center that puts performers closer together than their interval.
- **Options:** Archimedean spiral (coils evenly apart) or logarithmic (flares out); spacing along the curve or performer to performer.
- **Decision:** Archimedean, from the center out, with handles for the center and the outer end, a **Turns** number, and a direction button. Spacing for spirals is measured in a straight line, performer to performer, so the interval is the same at the center as on the outside. A warning shows when the coils are less than 2 steps apart. Other shapes keep spacing along the curve (their curves are gentle enough that the two match).

## 2026-11-04 23:15 EST — One-letter shortcuts and arrow nudges
- **Who:** Jason Tiller asked for tool shortcuts, arrow nudges, and ⌘/Ctrl +/− zoom; the details are Claude's *(Jason can veto)*.
- **Context:** Jason suggested ⌘/Ctrl + a letter for tools and ⌘/Ctrl + arrow for a 4-step nudge. In a browser, ⌘L jumps to the address bar and ⌘B opens bookmarks in some browsers, and on a Mac ⌘+arrow is a text-editing key.
- **Options:** ⌘/Ctrl + letter; single letters (as Figma and Illustrator do); for the big nudge, ⌘/Ctrl or Shift.
- **Decision:** Single letters, which only start a shape when 2 or more performers are selected: L Line, R Arc, U Curve, B Bézier, O Circle, S Spiral, K Block (A stays Add performer, T Text, V Select; F fits the field). Arrows move the selection 1 step, Shift + arrow 4 steps (half of 5 yards at 8 to 5), and Option/Alt + arrow half a step; with no one selected, ← and → still step through counts. ⌘/Ctrl + and − zoom the field instead of the page, and ⌘/Ctrl 0 fits it. A nudge ends an open shape and carries a selected FTL group's turns along, the same as dragging.

## 2026-11-04 23:40 EST — Polygon and star shapes
- **Who:** Jason Tiller asked for them; the details are Claude's *(Jason can veto)*.
- **Context:** Regular polygons and stars are common forms. They need a way to set the corner count and, for a star, how deep its inside corners go.
- **Options:** Corner handles you drag one by one; a center and one corner handle with a number of sides. Performers only on the corners, or evenly around the outline.
- **Decision:** Center and one corner handle (dragging it sizes and turns the shape), **Sides** 3 to 12 for a polygon, **Points** 3 to 12 and **Inner** 10 to 90% for a star (default 5 and 40%). Both start with a corner straight up the field. Performers go evenly around the outline from the handle's corner, so every corner gets someone when the count is a multiple of the corners. Shortcuts: **P** Polygon, **X** Star (S was already Spiral).

## 2026-11-04 23:55 EST — Star inside-corner handle
- **Who:** Jason Tiller asked for handles for the star's inner and outer size.
- **Context:** The star had a point handle (outer size) but set its inner size only by a percent.
- **Options:** Keep the inside depth as a percent of the outer size, so it grows with the star; or as a distance set by its own handle.
- **Decision:** A third handle on the first inside corner. Dragging it sets only the inside distance from the center, and it snaps back onto its corner. Turning or resizing the star with the point handle, moving the center, or changing **Points** keeps that distance. **Inner** % still works and moves the handle. *(The fixed distance, not a percent, is Claude's call; Jason can veto.)*

## 2026-11-05 15:30 EST — Closing the gaps a Pyware or UDB writer would notice
- **Who:** Jason Tiller picked the scope (the first five gaps from Claude's review) and the too-close distance (under 1 step); the details below are Claude's *(Jason can veto)*.
- **Context:** Claude compared FreeFORM with what Pyware and UDB writers expect. The biggest gaps were delayed step-offs, moves that turn, counter-marches, collision checks, and selection basics.
- **Decisions:**
  - **Step-offs are stored as counts, not paths.** Each set can hold `timing` (hold, then move) per performer. Playback works it out from the two sets every time, so changing either set or cutting the counts keeps the step-off (it's squeezed to fit the move). The other option was writing count-by-count `paths` like the Pyware import, but those fall back to a straight line as soon as either end changes. Setting a step-off drops an imported path for that performer, since the path would override it. Step sizes count only the counts a performer moves.
  - **Turning moves fit the turn from the spots.** A `turning` group stores only who's in it. FreeFORM finds the single turn (center and angle, least squares) that best carries the group from its old spots to its new ones, and each member marches an arc around that center. If their distance from the center changes (the group also stretched), it changes evenly along the arc. Each arc is re-spaced so every step is the same size (even steps). It always takes the short way around; a 270° turn would need a direction choice, not built. The other option was storing a center and angle, but those go stale when a set is edited. A group that only slides (under 1°) can't be made a turning move. FTL keeps its own route when a performer is in both.
  - **Gate turns** come from a new **Around** choice on **Rotate & scale**: the center (as before) or one of the selected performers. The on-field knob still turns around the center.
  - **Counter-march is an FTL preset**, not a new kind of move: the leader turns into the lane 1 step to its left or right and marches to beside where the tail started, and FTL does the rest. The leader must be at an end of the file; the direction of travel is from the second performer to the leader. The lane is always 1 step for now.
  - **Too close** is checked at every half count of every move, for any two performers under 1 step apart (Jason), including at the sets themselves. Each pair is listed once, at its closest. The timeline shows a count per move, and **Move** lists the pairs with a **Select** button. The timeline remembers each move's result until one of its two sets changes, because checking a big show from scratch took about half a second, too slow to redo while dragging.
  - **Selection:** **Select all** (⌘A), **Select a section…** in the sidebar, the distance between two selected performers (to the quarter step), and **Copy spots** / **Paste spots** (⌘C / ⌘V), which put the same performers back on the copied spots in another set (through holds, like any move). Copying is inside FreeFORM only, not the system clipboard.
  - **Not done yet:** Copy Side 1 → 2 doesn't copy step-offs or turning groups to the partners.

## 2026-11-05 15:10 EST — Deploy workflow actions on Node 24
- **Who:** Jason Tiller asked to fix GitHub's warning; the versions are Claude's *(Jason can veto)*.
- **Context:** GitHub warned that `actions/checkout@v4`, `actions/setup-node@v4`, and the artifact upload inside `actions/upload-pages-artifact@v3` target Node 20, which is deprecated on its runners.
- **Options:** Pin each to the oldest version that runs on Node 24, or move to each one's latest.
- **Decision:** Latest major of each, all of which run on Node 24: `checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5` (uses `upload-artifact` v7), and `deploy-pages@v5`. The app itself still builds with Node 22, as before.

## 2026-11-05 15:40 EST — Facing
- **Who:** Jason Tiller chose eight directions; the rest is Claude's *(Jason can veto)*.
- **Context:** Writers need to say "horns to the box" or "face Side 2" per set, not only in a typed note.
- **Options:** Eight directions or any angle (Jason: eight). Store a facing in every set, or only where it changes.
- **Decision:** Stored only where it changes and carried forward (like a hold), named from the field: Front (toward the front sideline), Back, Side 1, Side 2, and the four diagonals. Shown as a small pointer beside the dot on the field, printed charts, and phones, sized up from the dot so it reads at full-field zoom. Mid-move, performers show the facing of the set they left (they usually turn at the end). Dot sheets add "Face Side 2" to the set's note line where it changes; the phone shows the current facing and "face …" for the next set when it changes. Flips and Copy Side 1 → 2 leave facings alone: flipping a company front front to back shouldn't turn everyone around. The sample show's guard faces Side 2 from set 2.

## 2026-11-05 15:55 EST — Guard equipment
- **Who:** Jason Tiller asked for flag, rifle, and saber marks; the details are Claude's *(Jason can veto)*.
- **Context:** Guard members switch equipment during a show (flags in the opener, rifles in the ballad), so a fixed mark per performer isn't enough.
- **Options:** One piece of equipment per performer for the whole show; or per set, carried forward like facing.
- **Decision:** Per set, carried forward, with **Nothing** to put it down. Drawn as a small outlined icon (a pennant; a rifle outline with a thin barrel and a flat, wedge-shaped stock, redrawn at Jason's request because the first version's rounded ends read badly; a thin blade with a guard) up and to the left of the dot, so it doesn't sit where the facing pointer goes. Dot sheets note "Flag" or "Put down equipment" where it changes, and the phone says "pick up …" for the next set. Any performer can carry equipment, not only the guard section. The sample show's guard carries flags.

## 2026-11-05 16:20 EST — Props
- **Who:** Jason Tiller chose movable props; the details are Claude's *(Jason can veto)*.
- **Context:** Shows use platforms, backdrops, and ramps that sit somewhere new in different sets.
- **Options:** Props as a kind of performer (they'd get every performer tool for free, but also show up in dot sheets, the roster, the phone's "who are you" list, step sizes, and too-close checks, each needing an exception); or a separate list with its own spot per set.
- **Decision:** A separate list (`props` on the show, a spot and turn per set). Rectangles or ovals, sized in steps, edited in a **Props** section of the sidebar; dragged on the field (performers on top are picked first), carried through holds like performers; they move in a straight line and turn the short way between sets. New sets copy them, and a sub-set mid-move takes their spot at that count. Drawn under the performers, translucent with a dashed outline and the name, on the field, charts, and phones. Not yet: putting props in shapes, transforms, or copy/paste, and a sheet per prop for the crew. The sample show has a platform that rolls toward Side 2 and turns for set 3.

## 2026-11-05 16:45 EST — Print follow-ups
- **Who:** On PLAN.md (Jason); the details are Claude's *(Jason can veto)*.
- **Context:** PLAN listed paths on charts, a notes column, and one dot sheet per page. Jason had earlier said printed charts show only each set's spots (for Pyware imports).
- **Decision:** Paths are a **Show the paths into each set** checkbox, off by default so charts stay as Jason wanted unless asked: thin dashed black lines along the real route (FTL trails, turning arcs, imported routes), drawn by the same code the editor uses (`moveSegments`). A notes column didn't fit a quarter-page card, so it comes with the new **1 per page** layout (bigger type, up to 34 sets a page); four-per-page cards keep the notes line under the set. Both layouts now list a delayed step-off ("Hold 4, move 12") with the facing, equipment, and performer notes.

## 2026-11-05 17:15 EST — Letters and a picture to trace
- **Who:** Jason Tiller picked text shapes and tracing; the details are Claude's *(Jason can veto)*.
- **Context:** Writers spell words and copy logos onto the field.
- **Options (letters):** a computer font's outlines (performers around the outside of each letter: twice the performers, and fonts' licenses); or single strokes, the way a drill writer draws a block letter.
- **Decision (letters):** Single strokes on a 4-by-6 grid, written for FreeFORM (capitals, numbers, hyphens, spaces). A **Letters** shape (W) with a **Spell** box; the word fills the box between two handles, which starts 16 steps tall and as wide as the letters need, and keeps that proportion when the word changes. Performers are shared out over the strokes by length, each stroke's spots running end to end so letters reach their corners, then dealt out by least travel (again when the word changes). Even spacing only. The guide says a letter needs about 8 to 12 performers.
- **Decision (tracing):** One picture per show, see-through, under the field in the editor only. The picture is kept in the browser (IndexedDB, like the recording), so it never makes a show file or link big and never goes to phones; the show remembers where it sits (center in steps, width, strength). Placed with numbers, not by dragging, for now.

## 2026-11-05 17:45 EST — Indoor surfaces
- **Who:** Jason Tiller chose a basketball court plus a custom floor; the details are Claude's *(Jason can veto)*.
- **Context:** Winter guard and indoor percussion write on a gym floor or a tarp, not a football field.
- **Options:** Coordinates from a numbered grid on the tarp (each floor's grid is different); or from the center line and the edges, in the same steps as outside.
- **Decision:** Steps from the center line ("3 steps Side 1 of center") and from the nearer front or back edge ("2.5 steps behind Front Sideline" on a court, "Front Edge" on a floor), with ties going to the front. Same origin and step grid as the football field, so every tool works the same. A show gets an optional `surface` (court or floor, size in steps, typed in feet), and its football hashes are kept for going back outside. The court is 94 by 50 feet with high school lines (6-foot center and free-throw circles, 16-foot lane to 19 feet, 19.75-foot three-point arc), drawn on a new palette color, `floor`, that passes the contrast checks with white labels and dark paths. Switching to a floor keeps performers' spots in steps and warns if any land off it. Flip front to back uses the floor's depth. **Place exactly** is hidden on floors until it has indoor wording.

## 2026-11-05 18:05 EST — Facing and equipment marks, redrawn
- **Who:** Jason Tiller. A flag and a pointer beside the G made it unclear where the spot was. He chose to show facing only on selected performers, then suggested drawing the equipment in place of the letter (as Pyware can draw an instrument in place of the rank letter).
- **Options considered:** a ring around the letter with the pointer attached; facing and equipment only when selected; the ring's style standing for the equipment (with a legend); the equipment drawn as the mark itself.
- **Decision:** Facing: a pointer on the edge of a selected performer's gold badge, nowhere else in the editor; on a phone, only on the performer's own mark; not on printed charts (dot sheets say "Face Side 2"). Equipment: the flag, rifle, or saber is the mark, centered on the spot, in place of the letter or dot, everywhere (field, charts, phones), with the number as its label. This replaces the earlier entries' small icons and pointers beside the dot. Instrument icons for other sections are a possible next step (not built).

## 2026-11-05 18:30 EST — Letters, dots, or icons
- **Who:** Jason Tiller: users switch between dots, letters, and equipment icons at will (as Pyware can draw an instrument in place of the rank letter). The icon designs and name matching are Claude's *(Jason can veto)*.
- **Decision:** **Draw performers as** has **Letters**, **Dots**, and **Icons** (`symbols: 'icons'`). In Icons, a performer carrying equipment is drawn as it; otherwise as their instrument, picked from the section's name the same way score order reads names (saxes and drums matched first): flute, clarinet (also oboe, bassoon), sax, trumpet, mellophone, trombone, baritone, tuba, snare, quads, bass drum, and cymbals. Sections with no match (the guard with nothing in hand, the front ensemble, a drum major) keep their letter. Icons are simple shapes drawn for FreeFORM, outlined like the letters, centered on the spot. Equipment is drawn as the mark only in Icons now (the earlier entry had it in every mode); in Letters and Dots it shows in the sidebar, dot sheets, and phones.

## 2026-11-05 18:45 EST — Equipment icons only
- **Who:** Jason Tiller didn't like the instrument icons (and had asked for equipment icons).
- **Decision:** The third choice is **Equipment icons**: anyone carrying a flag, rifle, or saber is drawn as it, and everyone else keeps their letter. The instrument pictograms and the section-name matching are removed. If instrument icons come back, they get designed with Jason from references he picks.

## 2026-11-05 19:00 EST — A simpler performer view
- **Who:** Jason Tiller: marchers don't need the list of who's around them; they need the spot they're on, their next spot, and the counts to get there.
- **Decision:** The **Around you** list is gone from the phone's performer view (and its helper). The current spot and the next spot with its counts lead the panel. Kept, as Claude's call *(Jason can veto)*: the nearest neighbors still drawn brighter and labeled on the field, and the short extras on the next-spot line (step size, a step-off, a facing or equipment change) and the notes, since they're part of getting to that spot.

## 2026-11-05 19:10 EST — No icons on the field
- **Who:** Jason Tiller: simplify, and remove the flag, rifle, and saber icons too.
- **Decision:** Performers are drawn as letters or dots only. **Carries** stays: equipment shows in the sidebar, on dot sheets ("Flag"), and on phones ("pick up rifle"). A show saved with equipment icons opens with letters (`parseShow` drops the old setting).

## 2026-11-05 19:25 EST — Performer view from the editor
- **Who:** Jason Tiller reported it: with a show open and one performer selected, **Performer view** showed the "open the show link your director sent you" screen. The fix is Claude's *(Jason can veto)*.
- **Context:** The button opened the phone screen (`#perform`), which only knows a show saved from a link.
- **Decision:** It opens `#perform-editor=<performer>`: the editor's own show (its autosave), starting on the selected performer, or on Staff (the whole band) with none selected. It's a preview: nothing is saved to the device's performer storage, so a show a student opened from a link on the same device stays. With no readable show in the editor, it falls back to the old screen.

## 2026-11-05 19:35 EST — No "Open a different show" on the performer screen
- **Who:** Jason Tiller: performers don't need it.
- **Decision:** Removed from the screen with a show open. The paste box and **Scan QR code** stay on the empty screen, where a phone opens its first show. Hosted links still update themselves. Trade-off: a student using the home-screen app can't switch it to a different show from inside the app once one is open.

## 2026-11-05 19:55 EST — Several shows on a phone
- **Who:** Jason Tiller: shows may come as separate files (Opener, Ballad, Drum Feature, Closer), and performers need to switch between them quickly. The details are Claude's *(Jason can veto)*.
- **Options:** A list in the menu vs. tabs or a home screen of shows; how to tell "the same show again" from a new one; how to set "who I am" in a new show.
- **Decision:** The phone keeps a list (`freeform:performer` now holds `{ shows, current }`; a phone from before reads as a list of one). Every opened link is added and opened. The same hosted link, or a share link with the same title, replaces its entry in place and keeps who I am. A new show starts on the performer with the same label (B5) as the show that was open, or on Staff. The show's title at the top is a native menu (big and fast on a phone) listing the shows, plus **＋ Add a show…** (paste or scan, in a panel over the field) and **Remove this show…** (asks first). Up to 12 shows; past that the oldest goes. A recording is deleted only when no show on the phone uses it. Switching to a hosted show checks it for updates, as opening one did. The editor's preview has no menu (it shows only the editor's show). This brings back a way to open a new show inside the home-screen app, which removing **Open a different show** had taken away.

## 2026-11-06 12:45 EST — Dimming sections, and a backup reminder
- **Who:** Jason Tiller picked these from Claude's list; the details are Claude's *(Jason can veto)*.
- **Dimming:** Each section's row in **Sections** has a short button that cycles On, Dim (30% strength, no labels), and Off (hidden); it's highlighted only when a section is dimmed or hidden. Dimmed and hidden performers can't be clicked, boxed, or picked by Select all or ⌘A, are dropped from the selection, and their paths aren't drawn; they still count in step sizes and too-close checks. It's a view setting kept in this browser (`freeform:section-view`), not in the show, so printing and phones always show everyone.
- **Backups:** FreeFORM notes when the first change since the last export (or since opening a file or starting a new show) happened. After 7 days, a note floats over the field (so the field doesn't resize) with **Export** and **Later** (ask again in a day). Other options: a reminder on every visit (nagging) or cloud sync (the real fix, still on the roadmap).

## 2026-11-06 13:20 EST — A click track
- **Who:** Jason Tiller picked it from Claude's list; the details are Claude's *(Jason can veto)*.
- **Decision:** A **Click** checkbox beside Tempo in the editor, and a **Click** button beside the tempo on phones (one setting per browser, `freeform:click`). While playing at a tempo, it beeps on every whole count (a short sine tone), higher and louder on counts where a set lands. Every click is timed from one starting point on the audio clock (re-anchored after a loop or a tempo change), so they're exactly even; the field's motion follows the screen's frames as before. Counts a slow frame misses are skipped, not played late. With the recording playing, there's no click (the music is the beat); a click that follows the tapped counts could come later. Sound starts inside the tap or key press that starts playback, as phones require.

## 2026-11-06 13:50 EST — A route for one performer, and smooth routes
- **Who:** Jason Tiller picked it from Claude's list; the details are Claude's *(Jason can veto)*.
- **Decision:** A performer's own route is a follow-the-leader group of one, so it reuses FTL's clicked points, handles, steady step size, drawing, and Copy Side 1 → 2. **FTL** opens for one selected performer with **Give a route** (which goes straight to clicking points) and **Straight move instead**; the order list, leader, and counter-march stay hidden for one. Groups of one are kept (they used to be dropped), and one with no points is just a straight move. **Smooth** (any FTL group with turns) turns the corners into a Catmull-Rom curve through every turn, sampled 8 points per stretch and walked at one speed (even steps); it's a flag on the group, so the clicked points stay editable. Other option: a separate path tool, which would have duplicated most of FTL.

## 2026-11-06 14:10 EST — The FTL menu becomes Path
- **Who:** Jason Tiller: call it **Path**, with three choices for a performer's path: Straight (the default), Follow the Leader, and Custom (in place of **Give a route**).
- **Decision:** **Path** opens with the three as one row of choices for the selection, showing which one it's on (or none, for a mix). Follow the leader needs 2 or more and Custom needs exactly one, so each is unavailable otherwise, with a tooltip saying why. Straight replaces **Float instead** and **Straight move instead**. The settings for the chosen path (leader, order, turns or points, Smooth, counter-march) follow below as before. Turning moves stay in **Move** (Claude's call, Jason can veto): they're how a whole group rotates, not a path one performer picks. The stored show is unchanged (a custom path is still a group of one).

## 2026-11-06 14:20 EST — Esc goes back to Select
- **Who:** Jason Tiller asked for Esc to leave the Text tool; widening it to every tool and the Enter/Esc split are Claude's *(Jason can veto)*.
- **Decision:** Esc from any tool other than Select (Add Performer(s), Text, Arrow, Draw, clicking path points) goes back to **Select Performer(s)**; on Select it still closes a shape, then clears the selection. In a note's text box, Enter finishes that note and keeps the Text tool (to place another), and Esc finishes it and goes back to Select.

## 2026-11-06 14:30 EST — New starts on Add Performer(s)
- **Who:** Jason Tiller: a new show is a blank field, so Select Performer(s) makes no sense there.
- **Decision:** **New** turns on **Add Performer(s)** (with the first section, as before) and opens its section menu, so the next click picks a section or places a performer. Opening a file still lands on Select.

## 2026-11-06 14:40 EST — New sections from Add Performer(s)
- **Who:** Jason Tiller: move adding a section to the Add Performer(s) button.
- **Decision:** The **Add Performer(s)** menu ends with **New section**: a name, a letter, and **Add**, which makes the section and picks it for placing (Enter works too). It warns if the letter is already used. The sidebar's **+ Section** button is gone; **Sections** still renames, recolors, reorders, sorts, renumbers, and deletes. New sections no longer start as "New section ?" (Claude's call: name and letter are asked up front).

## 2026-11-06 14:50 EST — The readout follows what you drag
- **Who:** Jason Tiller: placing a prop's center on the hash, the corner readout said something else.
- **Context:** The readout showed the pointer's spot, so grabbing a prop (or a performer) off its center made it disagree with where the thing landed.
- **Decision:** While dragging, the readout shows the prop's center ("Prop 1 center: …") or the grabbed performer's snapped spot ("P4: …"). Each prop's box in the sidebar also shows its **Center** in the set you're on.

## 2026-11-06 15:00 EST — "Select Performer(s)" becomes "Select"
- **Who:** Jason Tiller.
- **Decision:** The tool's button and name are just **Select** (it picks markup and props too). Add and Delete keep "Performer(s)".

## 2026-11-06 15:40 EST — One Add menu, one Delete, and the set controls on the toolbar
- **Who:** Jason Tiller (Add holds performers, props, and sets; Set, Counts, Measures, and at count move to the toolbar's first row; Delete set goes away; a new prop is an 8 by 8 square in the middle). The details below are Claude's *(Jason can veto)*.
- **Context:** **Add Performer(s)** only added performers and sections, props were added from the sidebar, and sets from **+ Add set** in the top bar. There were two delete buttons (**Delete Performer(s)** and **Delete set**).
- **Other options:** Keep the separate buttons; put Set and Prop in their own menus; keep Delete set beside Counts.
- **Decision:**
  - **Add ▾** lists **Prop**, then **Set** with an **at count** box, then the sections and **New section**. Prop and Set come first because the section list can be long. With no count, Set adds after the set you're on, or at the count you clicked on the timeline.
  - **Prop** makes an 8 by 8 step square (not round) in the middle of the field, picks it, switches to Select, and opens the sidebar so its size is in reach. The sidebar's **+ Prop** makes the same square.
  - **Delete** acts on what's selected, in this order: performers (asks first), the picked prop, the picked markup. With nothing selected, it deletes the set you're on after asking, and is grayed out when the show has one set. Its tooltip names what it will delete. The Delete key still never deletes a set, so a stray key press can't lose one.
  - The top bar keeps the logo, the pan and zoom hint, and the light/dark button.

## 2026-11-06 15:30 EST — Add menu order, and Create New Section
- **Who:** Jason Tiller.
- **Decision:** In **Add ▾**, **Prop** moves to the bottom: Set first, then the sections, then Prop. The new-section name and letter boxes stay hidden until you click **Create New Section**, so the menu is shorter. The sections sit in two columns (Jason), so Prop stays in reach with a long list; a long name is cut short with "…" and shows in full when you point at it.

## 2026-11-06 15:35 EST — Adding a set goes back to Select
- **Who:** Jason Tiller asked that Add stop looking like it's still adding performers after **Set**, and that it remember the last choice. How it remembers is Claude's *(Jason can veto)*.
- **Decision:** **Set** (like **Prop**) is one click, not a mode: afterward the tool is **Select**, and the Add button no longer shows a section letter. The last section you added stays marked in the menu (and A picks it up again), so going back to adding performers is one click.

## 2026-11-06 15:45 EST — Add repeats the last pick
- **Who:** Jason Tiller (the button repeats the last pick; its down-arrow part changes it). The labels are Claude's *(Jason can veto)*.
- **Context:** After adding a set, **Add** still looked like it was adding performers, and adding several sets or props meant opening the menu each time.
- **Decision:** **Add** is a split button. The **▾** part opens the menu. The main part repeats the last pick and is named for it: **Add · P** (turns on adding that section's performers; the A key and **New** set this too), **Add Set** (a set after the one you're on, or at the count you clicked), or **Add Prop** (another 8 by 8 square in the middle). It starts as the section. It's lit only while you're placing performers. This replaces the earlier "keep the last section marked in the menu".

## 2026-11-06 15:50 EST — New props don't land on each other
- **Who:** Jason Tiller (2 steps right and 2 down). Checking every set, and "down" meaning toward the front sideline as the field is drawn, are Claude's *(Jason can veto)*.
- **Decision:** A new prop goes in the middle of the field unless a prop's center is already within a step of there in any set; then it moves 2 steps right (toward Side 2) and 2 steps toward the front, and checks again. Both **Add Prop** and the sidebar's **+ Prop** do this.

## 2026-11-06 23:45 EST — Seven fixes from an outside review (ChatGPT, checked by Claude)
- **Who:** Jason Tiller asked for the seven items Claude ranked after checking ChatGPT's review of the project. How each one works is Claude's *(Jason can veto)*.
- **Context:** The review found that opening another show silently replaced the only autosave, that a failed autosave was silent, that the close-call check could miss a crossing between half counts, and that several things the app knows (previewing vs. editing, what Delete hits, who is too close) weren't on screen.
- **Other options:** A full show library with restore points (left for cloud sync, already on PLAN.md); a separate whole-show checker list (clickable warnings cover most of it); a count-in before a phone loop (not done yet).
- **Decision:**
  1. **Replacing a show asks first.** When the show has changes not exported since it was opened or last exported, **Import…**, **New**, and **Sample** show a note over the field: **Export, then continue**, **Continue without exporting**, or **Cancel**. If the autosave fails, a note says so with **Export now** (and **OK** hides it until saving works again and fails again). Opening a file or the sample no longer counts as an unexported change (a show with follow-the-leader groups used to).
  2. **Previewing vs. editing.** Between sets, the toolbar's set name becomes a button, **Ct 6 of 16 · Go to Set 3**, that jumps to the set. Dragging or adding mid-move puts a note at the bottom of the field saying edits go on a set. **Delete** names its target (**Delete Set 3**, **Delete P4**, **Delete 6 performers**, **Delete prop**, **Delete markup**); on the narrowest screens it stays **Delete**.
  3. **Clickable close calls.** The timeline's "N too close" is a link: it jumps to the count where the closest pair is nearest, selects both, and says who, how close, and how many more pairs there are.
  4. **Loop on phones; print a range.** A **Loop** button on phones picks **Sets … to …** (in a panel over the screen, so the field never resizes) and plays that range over and over, at a tempo or with the music. The Print dialog has **Sets … to …** for charts and dot sheets. The loop resets when the phone switches shows or an update changes the number of sets.
  5. **Revision numbers.** Each **Publish to phones** / **Publish update**, and each locked-file download, adds 1 to the show's `revision` (validated in `parseShow`). Phones show "Revision N" and, for hosted shows, when they last checked for an update. Charts and dot sheets print "rev N" after the title. Share links don't change it. Known limit: editing after a publish and printing still says the last published number, so the guide says to print after publishing.
  6. **A first step on a blank field.** With no performers, a note offers **Place performers**, **Import a roster…**, and **Try the sample show**. **Sample** in the sidebar opens the same show any time (loaded only when asked, so it isn't in the main download).
  7. **Exact close calls.** `closeCalls` still samples every half count, but works out each pair's exact closest approach inside every half count (straight-line motion between samples), so a fast crossing between samples is caught. Counts are reported to the nearest quarter.

## 2026-11-07 15:45 EST — Export becomes Save and Save As (with ⌘S), and Performer view moves to Selection
- **Who:** Jason Tiller (rename Export to Save and let the user pick where it goes; Performer view only with a performer selected, under Selection). How each browser saves, and "exactly one performer," are Claude's *(Jason can veto)*.
- **Context:** **Export** always downloaded to the Downloads folder. **Performer view** sat with the file buttons and, with no one selected, opened on the whole band.
- **Other options:** The Save button always asking (doubling as Save As), with only ⌘S saving in place: tried first, then replaced by a separate **Save As…** (Jason, 15:48).
- **Decision:**
  - **Save** opens the browser's Save dialog where there is one (Chrome and Edge on a computer: pick any folder and name). On a touch device without it (iPad, phone), it opens the share sheet, where **Save to Files** picks a folder. Elsewhere (Safari, Firefox on a computer) it downloads, and the guide says how to make those browsers ask where. Every Save asks; cancelling saves nothing and doesn't count as backed up.
  - The notes say **Save, then continue**, **Continue without saving**, **Save now**, and **Save**. **Save, then continue** goes on only after the file is saved; cancel the dialog and nothing is replaced. For **Import…**, the file picker may need a second click after saving (browsers allow one dialog per click).
  - **Save, Save As…, and ⌘S** (Jason): where the browser has a Save dialog (Chrome, Edge), **Save** and ⌘S ask where the first time, then write to that same file without asking and say "Saved to <file>." over the field. **Save As…** always asks, and later Saves go to the new file. ⌘S works while typing in a box and never triggers the browser's "save page." **Save As…** shows in every browser (Jason, 15:54; first shown only where the browser has a Save dialog); in Safari, Firefox, and on an iPad it does what **Save** does. The notes' **Save now** and **Save, then continue** save like **Save**. The file is forgotten when another show is opened, started, or loaded from the sample, and when the page closes (keeping it across reloads needs IndexedDB and a permission prompt each visit).
  - **Performer view** appears under **Selection** only when exactly one performer is selected, and opens on them. The whole band is still one tap away in the preview's list (**Staff (whole band)**).

## 2026-11-07 16:05 EST — Facing and guard equipment come out
- **Who:** Jason Tiller (take out the Facing and Carries controls; facings and equipment can be written in the ensemble or performer notes). Turning older files' facings and equipment into performer notes is Claude's *(Jason can veto)*.
- **Context:** Facing (eight directions) and Carries (flag, rifle, saber) were per-performer settings with their own sidebar boxes, a pointer on the field and the phone, and automatic notes on dot sheets and the phone.
- **Other options:** Hide the boxes but keep drawing facings already set; drop older files' facings and equipment without a trace.
- **Decision:** All of it is gone: the **Facing** and **Carries** boxes, the pointer on selected performers and on a phone's own mark, the phone's "facing Side 2" / "pick up rifle", and the automatic "Face Side 2" / "Flag" on dot sheets. A file that has them still opens: each one becomes a performer note on the same set ("Face Side 2 · Flag · <the note that was there>"), so dot sheets and phones still say it. The sample show's guard gets the same two notes ("Flag" in set 1, "Face Side 2" in set 2).

## 2026-11-07 17:05 EST — A Help menu in the top bar
- **Who:** Jason Tiller (move **Sample** out of the sidebar's file buttons; a Help menu). What's in it is Claude's *(Jason can veto)*.
- **Context:** **Sample** sat with **New**, **Import…**, **Save**, **Save As…**, **Print…**, and **Share…**, which are all about files. The editor also had no link to the how-to guide.
- **Other options:** Drop **Sample** and keep only the blank field's **Try the sample show** (then a show already open would need **New** first).
- **Decision:** **Help**, next to the sun/moon button, opens **How-to guide** (in a new tab) and **Try the sample show** (same as before: it offers to save first). The blank field keeps its own **Try the sample show**.

## 2026-11-07 17:20 EST — The how-to guide on freeformdrill.org
- **Who:** Jason Tiller (keep people on freeformdrill.org; worried two copies would drift). How it's built is Claude's *(Jason can veto)*.
- **Context:** **Help**, then **How-to guide**, opened the guide on GitHub.
- **Other options:** A second, hand-kept copy on the site (it would drift); showing the guide inside the app (more code, and it would need its own way to show pictures).
- **Decision:** `docs/HOW-TO.md` stays the only copy. Every build turns it into `guide/index.html` with its pictures beside it (`src/guide/page.ts`, run from `vite.config.ts`), in the app's colors and light or dark mode, with a link back to the app. **Help** opens it, and the README points there. Anchors match GitHub's, and a test checks every contents link has its heading. `marked` (a Markdown reader) is a build-only dependency: nothing new ships to users. The guide is online only (the offline cache keeps the app, not the guide), and `npm run dev` doesn't serve it.
- Also fixed: the sample show was split into its own file on 2026-11-06, which the offline cache doesn't keep (it saves only the files the page links); it's back in the main file.

## 2026-11-08 09:15 EST — Every show gets a permanent id
- **Who:** Claude *(Jason can veto)*, from the phone and sharing review.
- **Context:** A share link has no address of its own, so a phone matched an arriving show to a saved one by title. Two unrelated shows both called "Opener" replaced each other.
- **Other options:** Match on title plus section list or performer count (still guesses); ask the student "replace or keep both?" each time (a question they can't answer).
- **Decision:** A show has an optional `id`: 32 random hex characters, made by `newShow` (so New and the sample get one), given to an older autosave or an imported file (including a .3dj) when it's opened, then kept forever in files, share links, and locked files. `parseShow` accepts only letters, digits, `_`, and `-`, up to 64. A phone matches on the id when both copies have one, and on the title otherwise. Save As keeps the id (it's the same show in a new file); a future **Duplicate** should call `newShowId`. The Share dialog now remembers a show's hosted link by id too (it falls back to links saved by title before this).

## 2026-11-08 09:15 EST — A phone that can't save says so
- **Who:** Claude *(Jason can veto)*.
- **Context:** In a private window, or with storage full, a phone silently kept nothing, while the screen promised the show "works offline." The recording (kept in the phone's IndexedDB) could fail silently too.
- **Other options:** A notice that can't be closed (it covers part of the field for the whole rehearsal); saying nothing.
- **Decision:** The same pattern as the editor's autosave notice: a warning over the bottom of the field ("This show isn't saved on this phone… It will be gone when you close it, and it won't work offline.") with **OK**. After **OK**, a short line stays under the set: "Not saved on this phone: it won't work offline." If only the music fails to save, the warning says the phone plays with a tempo instead. The empty screen promises offline only when storage works.

## 2026-11-08 09:15 EST — One keyboard rule for every dialog
- **Who:** Claude *(Jason can veto)*.
- **Context:** Seven dialogs said they were modal but only handled Escape (and the roster import didn't even do that). Tab walked out into the editor behind them.
- **Decision:** `src/ui/useDialog.ts`: on open, focus moves to the first control (a search box that focuses itself keeps it); Tab and Shift+Tab wrap inside; Escape closes it without reaching the editor's own Escape; on close, focus goes back where it was. Only the newest open dialog listens. Every `aria-modal` dialog uses it.

## 2026-11-08 09:15 EST — Count-in on the phone
- **Who:** Claude *(Jason can veto)*, from the PLAN follow-up.
- **Context:** Students looping sets had no way to step off with the drill.
- **Other options:** A **Count-in** button in the phone's button row (tried: on an iPhone 15 the row has no room, and the labels wrapped); a choice of 2, 4, or 8 counts.
- **Decision:** A **Count-in** checkbox in the **Loop** panel, remembered on the phone. When it's on, every Play (looping or not) first clicks 4 counts (the first one higher) and shows 4, 3, 2, 1 big over the field, at the tempo, or at the recording's pace where play starts when it plays with the music. Pause during the count-in cancels it. The click sounds even when **Click** is off.

## 2026-11-08 09:15 EST — The Share dialog's two choices
- **Who:** Claude *(Jason can veto)*, from the PLAN follow-up.
- **Context:** The share link and the hosted link sat in one long dialog, with GitHub setup in the middle, and it wasn't clear which one to use or what each carried.
- **Decision:** Two buttons at the top: **Send this version** (the link, its QR code, Copy link, Share…, and Open performer view here) and **Keep phones up to date** (Publish to phones or Publish update, the music checkbox, and the hosted link and its QR code). Each starts with a plain "Included / Not included" line: a share link has the drill, sets, counts, and notes, but no names and no music; a hosted file adds names and, if checked, the music. GitHub setup and "host the file yourself" sit in a **Setup** section at the bottom, open until publishing is set up. The dialog opens on **Keep phones up to date** once a show has a hosted link or GitHub is connected. None of the link-making logic changed.

## 2026-11-08 09:15 EST — Plainer labels on the phone
- **Who:** Claude *(Jason can veto)*.
- **Context:** **Director view** / **Facing front** and **My view** / **Whole field** looked like one pair of choices but controlled two things: which way the field faces, and whether the camera follows my dot.
- **Decision:** The orientation button shows what it's set to, **From the press box** or **Facing the front** (its spoken label starts "Field orientation:"). The other is **Follow my dot**, lit while it's on.

## 2026-11-08 09:30 EST — A step limit per show
- **Who:** Claude *(Jason can veto)*, asked for by Jason's lead agent; the idea of a threshold per show and drawing over-limit paths so they stand out comes from OpenMarch (ideas only: OpenMarch is AGPL, and no code was copied).
- **Context:** The timeline showed each move's biggest step, but not who takes it, and the red line (bigger than a 4-to-5) was fixed for every band.
- **Other options:** A new limit separate from the colors (a third warning beside yellow and red); a default of 6-to-5 (would turn the sample's and most shows' yellow moves into "problems").
- **Decision:** The limit *is* red: `stepLimit` in the show (N-to-5, 2 to 8, checked in `parseShow`; missing means 4, today's red, so existing shows look the same). Yellow stays "bigger than a 6-to-5"; a limit of 6 or more leaves no yellow. Everyone over the limit in the move on screen gets a red ring on a dark casing (the paths were already red and dashed). A red "max" on the timeline is a button that goes to the set and selects them. The limit is set in **Review**, beside the list it changes, rather than in the sidebar.

## 2026-11-08 09:30 EST — Review: one list of every problem
- **Who:** Claude *(Jason can veto)*, asked for by Jason's lead agent.
- **Context:** Warnings were per move (timeline) or per set (**Move**). Nothing listed the whole show.
- **Other options:** A dialog (blocks the field and the keyboard while fixing); a timeline tab (the bottom panel can't change height); props in the too-close check (left out: standing on a platform is on purpose, so it needs a rule first).
- **Decision:** A **Review** button in the top bar, with the count of problems, opens a panel floating over the field's top right (so nothing resizes). It lists, in show order: steps over the limit (one item per move), each too-close pair, imported paths gone straight, performers with no spot in a set, and counts in **Movements** not written yet. A click moves the playhead there, selects the performers, and says what's wrong in the note over the field. Detection is `src/engine/review.ts`; close calls are now kept per move (`closeCallsMemo`), shared with the timeline.

## 2026-11-08 09:30 EST — Imported paths that go straight say so
- **Who:** Claude *(Jason can veto)*.
- **Context:** Imported Pyware count-by-count paths apply only while both sets and the counts match, so an edit quietly turned them into straight lines.
- **Other options:** Re-fit the route to the new ends (changes what Pyware wrote); delete the path at once (then moving the dot back couldn't restore it); ask before the edit (a prompt mid-drag).
- **Decision:** Keep the fallback and the stored path (Undo, or putting the spots and counts back, restores the route). When an edit makes paths stop fitting, the note over the field says "4 imported paths in the move into set 7 are straight lines now…", and Review lists them as **Straight now**.

## 2026-11-08 09:30 EST — Lasso selection
- **Who:** Claude *(Jason can veto)*.
- **Context:** Selection was click, Shift-click, and a box. A box can't pick one side of an arc or a diagonal.
- **Other options:** A lasso tool in the toolbar (another mode to leave); lasso as the default drag (the box is quicker for blocks).
- **Decision:** Option/Alt-drag on open field draws a lasso (gold, dashed, like the box); everyone inside it is selected (even-odd point-in-polygon), and Shift adds, as with the box. For touch screens, a **Lasso** toggle sits next to **Add to selection** in the sidebar's Selection area and makes a drag on open field lasso instead of box.

## 2026-11-08 09:20 EST — Several shows in one browser, versions, two tabs, and full backups
- **Who:** Jason Tiller asked for a show library, version history, a two-tab warning, and a complete backup. Every choice below is Claude's *(Jason can veto)*.
- **Context:** The browser kept exactly one show (localStorage), so **Import…**, **New**, and the sample replaced it, with a note offering to save first. Nothing older than Undo could be recovered, two tabs on the same show silently saved over each other, and the recording and tracing picture never left the browser.
- **Other options:** Keep every show in localStorage (about 5 MB in all; a few big shows plus versions would fill it). Re-key recordings and pictures by show id (needs a migration; the ids the show already keeps do the same job). A preview of a version drawn on its own small field (more code; Restore plus Undo does the job). A zip file for full backups (needs a new dependency). Keeping the "save first?" note for Import (nothing is replaced any more).
- **Decision:**
  - **Library:** every show has a permanent `id` (`newShowId()` and `withShowId()` from the phone work, checked in `parseShow`; **Duplicate** gives the copy a new one). Shows live in IndexedDB beside the recordings (`src/ui/showStore.ts`). The open show is still written to localStorage on every change (what a reload opens, the error page's download, and the editor's Performer view), and into the library 0.8 seconds later and before any other show opens. On first load, the old single autosave gets an id and moves into the library by itself; its backup reminder date moves with it. **Shows…** is the first of the sidebar's file buttons (the sidebar isn't fixed height, so the top bar and bottom panel don't change). Its dialog (the show list and the versions list) uses `useDialog` like the others.
  - **Recordings and pictures** stay keyed by the ids the show already holds (`music.audioId`, `trace.id`). **Duplicate**, and importing a show that's already in the library, copy them to new ids so each show has its own. **Delete** removes them unless another kept show uses them.
  - **New, Import…, and Try the sample show add a show** instead of replacing one, so the "Save, then continue" note is gone. Importing a show whose id is already here makes a copy beside it, never over it. Opening another show starts Undo fresh (Undo never reaches into another show), and each show has its own backup-reminder date.
  - **Versions:** before the library copy is written over, it becomes a version if the newest version is 10 minutes older (`versionDue`), so a version is "the show as it was at 3:12." Kept: the newest 20, plus the newest of each day for 60 days (`versionsToDrop`, tested). **Restore** is an ordinary edit (Undo takes it back) and keeps the show as it was as a version first. The version list shows when, the title, and the counts of performers and sets; there's no drawn preview.
  - **Two tabs:** the `storage` event on the autosave. When another tab saves the same show (same id, different content), a note says so and this tab stops saving until the director picks **Load that version** (undoable) or **Keep this one** (saves over it, and the other tab then gets the same note). A tab on a different show is ignored.
  - **Full backup…** (next to **Save As…**, enabled when the show has a recording or picture) writes the usual JSON plus `attached: { audio?, picture? }`, each `{ type, data }` with base64 data. `parseShowFile` checks it (audio/ and image/ types, at most 25 MB of audio and 10 MB of picture, real base64, and only with the music or trace it belongs to) and takes it off the show, so it never reaches the autosave or a link. Import stores the files under new ids. A full backup always asks where to save, and ⌘S never writes over it. The backup reminder offers **Full backup…** too when the show has a recording or picture.

## 2026-11-08 09:40 EST — An untouched blank show isn't kept
- **Who:** Claude *(Jason can veto)*, found while checking the show library.
- **Context:** On a first visit the editor opens a blank show. Clicking **Try the sample show** or **Import…** then left an empty "Untitled show" in the **Shows** list.
- **Other options:** Keep every show ever opened (the list fills with empty shows); ask before dropping it (a question about nothing).
- **Decision:** When another show opens, a blank show (no performers) that hasn't been changed since it opened is dropped instead of kept. Anything changed, even just the title, is kept as before.

## 2026-11-08 09:50 EST — The FreeFORM Drill logos
- **Who:** Jason.
- **Context:** The full product name is FreeFORM Drill (it matches freeformdrill.org and avoids confusion with Apple's Freeform). The logo said only FreeFORM. Claude made ten concepts that keep the existing wordmark and add DRILL.
- **Other options:** DRILL on a solid plate under FORM (Claude's first recommendation); DRILL tracked out under FORM; DRILL on a yard-line rule; a small curve leading into DRILL ("Flow"); the curve under a one-line name.
- **Decision:** The main logo is FreeFORM DRILL on one line with the curve centered over it (Jason: it looks more stable than the curve underneath). The stacked square is for avatars, and the round badge, with "Drill, without the bill." over the top and freeformdrill.org along the bottom, is for merch. The main logo replaces the old one on the phone start screen, the old-browser page, the README, and the link-preview card. The editor's top bar keeps the shorter FreeFORM logo and the curve (Claude's call, *Jason can veto*): a one-line FreeFORM DRILL with the curve over it is too tall for a 24 px bar.

## 2026-11-08 10:35 EST — FreeFORM DRILL in the top bar
- **Who:** Jason (replaces Claude's call above to keep the shorter logo there).
- **Decision:** The editor's top bar shows the curve, then FreeFORM DRILL on one line (`logo-small.svg`, built by `brand/build_drill_logo.py`). Narrow windows still show just the curve.

## 2026-11-08 11:45 EST — Sidebar and timeline on either side
- **Who:** Jason asked for it; Claude chose how it works (*Jason can veto*).
- **Context:** Some people want the sidebar on the left and/or the timeline above the field.
- **Other options:** drag the panels to dock them anywhere; put the choices in the sidebar or the Help menu.
- **Decision:** A **Layout** menu in the top bar with two buttons: **Sidebar on the left/right** and **Timeline at the top/bottom**. The choice is kept in this browser (like light mode), not in the show file, since it's how you like to work, not part of the show. Defaults stay as before: sidebar right, timeline bottom.

## 2026-11-10 09:56 EST — The review's suggestions go on the plan
- **Who:** Jason, on Claude's review.
- **Context:** Jason asked Claude to go through the docs, the app, and the tests, and say what would make FreeFORM better for drill writers, directors, and students. The review found phone layout problems, small click targets, accessibility gaps, no front door on the site, and the GitHub token as the main barrier to other directors using hosted links.
- **Other options:** take only some of them; open GitHub issues instead of plan items.
- **Decision:** All of them go in PLAN.md under "From the 2026-11-10 review." The order within it (phone layout, front door, upload service, pilot) is Claude's suggestion (*Jason can veto*). Nothing is built yet.

## 2026-11-10 10:45 EST — A front page at /, the editor at /app/
- **Who:** Jason chose the layout (landing at /, editor at /app/); Claude chose the details (*Jason can veto*).
- **Context:** freeformdrill.org opened straight into the editor, and on a phone it said only "Open the show link your director sent you," with nothing about what FreeFORM is.
- **Other options:** a page at /about/ with the editor staying at /; no front page yet.
- **Decision:** `index.html` is the front page; the app is `app/index.html`. Links made before the move (`/#show=…`, `/#load=…`, `/#perform`) and a home-screen app opened at / are forwarded to /app/ before the page draws, so nothing a student has stops working. The manifest keeps its identity (`id: "./"`, the old start address) and starts at app/. Browser storage is per site, not per page, so shows, phones' saved shows, and settings carry over. Privacy and "Coming from Pyware or UDB" are sections of the front page rather than pages of their own (Claude: one page to keep up to date). Its QR code opens the sample show from a file the build writes (`sample.freeform`, the same ids every build), so the code stays short enough to scan off a screen; a share link with the whole show inside made a very dense code. The comparison says only what FreeFORM does and doesn't do, not Pyware's prices or tiers, which change and which Claude couldn't check.

## 2026-11-10 10:45 EST — The editor and the performer view are separate downloads
- **Who:** Claude (*Jason can veto*), from the review.
- **Context:** A phone downloaded the whole editor (216 KB zipped) to show one dot. The single bundle was on purpose: the offline cache kept only files the page linked.
- **Other options:** keep one bundle.
- **Decision:** `main.tsx` loads the editor or the performer view on demand, and the QR scanner loads only when someone scans (a phone now fetches about 107 KB zipped). The build writes `precache.json` (both pages, every built file, the icons and logos); the service worker caches all of it at install and tops it up after each online visit, so the view you haven't opened yet still works offline. Checked offline in Chromium for the editor, the performer view, and the front page.

## 2026-11-10 10:45 EST — Light or dark follows the device
- **Who:** Claude, from the review item Jason approved (*Jason can veto*).
- **Context:** Dark was the default for everyone; the plan had "follow the device's setting" as "later, if wanted."
- **Other options:** keep dark as the default.
- **Decision:** Until someone clicks the sun/moon button, FreeFORM (editor, phone, front page) follows the device's light or dark setting, and changes with it. A click is remembered as before and wins. Most Macs and Windows PCs are set to light, so many directors will now see light mode first. The screenshot script asks for dark, so the guide's pictures don't change.

## 2026-11-10 10:45 EST — The phone view's layout
- **Who:** Claude (*Jason can veto*), from the review.
- **Context:** On an upright phone the view buttons floated over the field and covered the neighbors' labels, and the field was about a fifth of the screen. On its side, the play controls ran off the edge.
- **Other options:** a row of view buttons under the field (costs field height); shorter button labels (Jason chose the current ones on 2026-11-08).
- **Decision:** **From the press box** and the sun/moon button sit beside the show's title, and **Follow my dot** beside the who button, so the header is no taller and nothing covers the field. The readout panel is a share of the screen's height (130 to 230 px) instead of 230 px, and still fixed, so the field never resizes as the text changes. On its side, the field gets the left side at full height and everything else scrolls in one column on the right. The staff view draws dots instead of letters while letters would overlap.

## 2026-11-10 10:45 EST — The step size in plain words on phones
- **Who:** Claude chose the words (*Jason can veto*); Jason approved the idea in the review.
- **Context:** "8.3-to-5" means nothing to many students.
- **Other options:** replace the number; words only for big steps.
- **Decision:** The number stays, with a line under it: smaller steps than normal (past 9-to-5), normal (7 to 9), bigger than normal (6 to 7), or very big (under 6), then the overall direction for a performer facing the front ("moving back and to your left"). A sideways drift under a third of the main direction isn't mentioned. For a follow-the-leader or curved move it's where they end up, not the route.

## 2026-11-10 10:45 EST — Red paths are solid, not only red
- **Who:** Claude (*Jason can veto*).
- **Context:** In a simulation of red-green color blindness, a red (over the limit) path looked like a plain dark one.
- **Other options:** a different warning color.
- **Decision:** Red paths are solid and 1.6 times as wide; the others stay dashed. The red rings and the underlined red "max" on the timeline already work without color.

## 2026-11-10 10:45 EST — Dot sheets with field pictures
- **Who:** Claude (*Jason can veto*), from the review.
- **Context:** A UDB-style dot book shows a little field for each set.
- **Other options:** pictures on the 4-per-page cards (no room); a separate dot-book print type.
- **Decision:** A third dot-sheet layout, **1 per page, with a small field picture for each set**: a 1.3-inch picture of the whole field on each set's row, everyone faint gray and the performer a big black dot, 12 sets a page (checked: 12 rows with two-line notes fit).

## 2026-11-10 10:45 EST — Send feedback goes to GitHub for now
- **Who:** Claude (*Jason can veto*).
- **Context:** The review asked for a way to send feedback without GitHub. Any other channel (an email address, a form service) is Jason's to choose and would put his address or an outside service on the page.
- **Other options:** a mailto link; a form service.
- **Decision:** **Send feedback** (Help menu and front page) opens GitHub's new issue forms (a problem, an idea) until Jason picks a channel for people without a GitHub account. The address is one constant (`FEEDBACK` in `src/App.tsx`) plus the front page's link.

## 2026-11-10 10:45 EST — A smoke test before every deploy
- **Who:** Claude (*Jason can veto*).
- **Context:** Unit tests can't catch a screen that crashes or a button that's gone.
- **Other options:** a separate end-to-end test suite.
- **Decision:** The deploy workflow installs Playwright and runs `scripts/screenshots.mjs`, which already clicks through every screen in the guide; if it fails, the site doesn't update. It adds a few minutes to each deploy. Version 0.1.0, issue forms, and CONTRIBUTING.md came with it.

## 2026-11-10 12:00 EST — Video export
- **Who:** Jason chose what's in it (the whole field from the press box, the music if there is any, the set and count with the show's title and the piece, a range of sets, MP4); Claude chose how it's made (*Jason can veto*).
- **Context:** Directors want to post the drill in a group chat or show it to boosters.
- **Other options:** record the screen while it plays (MediaRecorder: real time, and only WebM in some browsers); a server to make videos.
- **Decision:** **Video…** in the sidebar's Get-it-to-the-band row. Frames are drawn off screen at 1920 by 1080, 30 a second, and encoded in the browser with WebCodecs through **Mediabunny** (MPL-2.0, a new dependency, loaded only when someone makes a video: about 57 KB zipped), so a 7-minute show takes well under 7 minutes. Video is H.264 when the browser has it; sound is AAC when it can encode it, otherwise Opus (plays in browsers and most players, not some older Apple apps). With the recording, frames follow the tapped counts; without, the Tempo. The caption sits in a band above the field so it covers nothing; labels are left off, as during playback, so nothing jumps. The last set holds 1.5 seconds at the end. Version 1.62.1 of Mediabunny, the newest at least two weeks old.
