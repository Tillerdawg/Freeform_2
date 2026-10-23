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
- **Decision:** "Set X · Counts · Measures · + Add set · Delete set" moved from the bottom panel into the top bar, on the same line as "Freeform" and centered over the field. When space is short, the scroll/zoom hint shrinks away first and the controls slide left toward "Freeform"; at 900 px wide they just fit. Undo, Redo and Fit field moved to the bottom of the sidebar, pinned there however long the sidebar gets. "+ Set after" is now "+ Add set" (it still adds the new set right after the current one, 16 counts). The top bar keeps its fixed height and no-wrap rule, so the field never resizes from it.
