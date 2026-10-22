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
