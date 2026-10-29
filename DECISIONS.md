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

## 2026-10-23 08:55 EDT — Pickups are measure 0
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
