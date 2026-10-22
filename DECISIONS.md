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
