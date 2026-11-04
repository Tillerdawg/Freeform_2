# Plan

## Milestone 1 — Core designer (browser)
1. ✅ **Coordinate engine** (pure TS, unit-tested first): positions in steps, hash presets, readouts in the IDEA.md format ("2 steps outside the Side 2 45, 2 steps in front of Front Hash", "Splitting 40 and 45 on Side 1", "On the 50"), quarter-step rounding, step size per transition with yellow/red tiers.
2. ✅ **Show model + file:** performers (dot/letter/icon, label), sets (counts to arrive), field type and hash preset. Saved as versioned JSON; open and save as local files.
3. ✅ **Field view:** football field with yard lines, numbers, hashes, and an 8-to-5 grid; zoom and pan.
4. ✅ **Editing:** place, select, multi-select, and drag performers with grid snap; add, duplicate, and delete sets; set counts.
5. ✅ **Playback:** linear (float) interpolation, count-by-count scrub, play from any count at a set tempo, a range of sets with optional loop; paths colored by step-size tier.
6. ✅ **Coordinate panel:** selected performer's readout per set.

## Milestone 1 follow-ups
- ✅ Undo/redo.
- ✅ Play a range of sets (IDEA.md: individual set, sub-collection, whole show); a loop toggle.
- ✅ Drill toolbar under the top bar (dropdown menus for markup, shape, transform, FTL, labels) and app-wide button styling.
- ✅ Timeline: stacked set buttons with lines up to them; zoom (−, +, Fit) and sideways scrolling for long pieces (wheel, swipe, right-drag), following the playhead.
- ✅ Touch support pass (tablets): two-finger pan and pinch on the field (a second finger takes back what the first started), fingertip hit areas, Add to selection (no Shift key), 44 pt controls with fixed rows sized once per device, sideways-scrolling rows with Undo/Redo/Fit pinned, hold-to-pick-up set buttons on the timeline. Checked in emulated iPads (Playwright, real touch events). ✅ Sidebar show/hide button; on narrow windows it starts hidden and opens over the field. Follow-ups: a real iPad check (Jason); touch alternatives for Option-drag (move one shape handle) and other modifier-key actions; Apple Pencil (palm rejection, Pencil draws while fingers pan).

## Later milestones (rough order)
- ✅ Shape tools: line, arc, curve, Bézier, circle, block (select, then shape; even or interval spacing; least-travel assignment).
- ✅ Mirror: flip across the 50 or front to back; copy Side 1 → 2 (or 2 → 1) with least-travel pairing.
- ✅ Rotate and scale a selection around its center.
- ✅ On-field rotate/stretch handles (a frame around a selection of 2+: knob rotates, corners stretch side to side and front to back, each on its own; works by touch). (Not planned: shapes that create performers. Jason: performers are defined when the show is first created.)
- ✅ FTL transitions (leader + order, path-following; IDEA.md example is the acceptance test).
- ✅ FTL follow-ups: a leader route with turns (click each turn); paths and FTL trails shown mid-move. ✅ Drag a turn's handle to move it; turns follow a drag, flip, rotate or scale of the group. ✅ Copy Side 1 → 2 copies FTL groups and their turns to the partners.
- ✅ Coordinate (dot) sheets, 4 cards per page, and drill charts, one per set (print / Save as PDF).
- ✅ Measure numbers per set (typed), on dot sheets, chart headers, and the timeline.
- ✅ Readable dot labels (auto placement and hiding, per-set pinned sides) in the editor, printed charts and phone.
- Print follow-ups: paths on charts; a notes column; 1-per-page sheets; (done: measures fill in from the score for sets without them).
- ✅ Page markup: text notes, arrows, freehand drawing, page notes; per-performer cues on dot sheets.
- Markup follow-ups: markup that spans several sets; text size/color options; editing ink strokes point by point.
- ✅ Published on GitHub Pages; installable and offline (PWA).
- ✅ Performer view (phone): share links; pick my dot or Staff; follow me; facing front or director view; count-by-count; my spot, next spot, step size, notes.
- ✅ Performer view: pinch-zoom; screen kept awake while playing.
- ✅ QR codes for share links that fit; hosted links (`#load=` + a show file's https address) that phones re-check and update in place. Tested with GitHub gists. ✅ In-app QR scanner (camera) so scans land in the home-screen app, not Safari. ✅ Phones get only the performer/director views (no editor).
- ✅ Protected hosting: hosted show files are encrypted in the browser (AES-GCM); the key rides only in the link's `#` part, so any plain file host (a secret gist) only ever stores ciphertext. Re-keying cuts off old links for future updates. Later, if needed: a Freeform-run upload service so directors needn't touch gists; per-performer links.
- ✅ Count-first layout (Jason): drag a set's button to place it at a count (neighbors stay pinned); **Movements** (named totals, one per tune or several per file) set the timeline's length up front; add a set at a clicked or typed count without moving the others (mid-move = a sub-set, 1A). ✅ Movement names on the timeline and printed chart headers. Follow-up: filling movement totals from the score's MIDI.
- ✅ Music sync in the editor: load the recording (kept in the browser), tap every count, playback follows the audio.
- ✅ Music on phones: the locked hosted file carries the recording (encrypted with the show's key); the phone view plays along, with a ♪ Music toggle back to tempo. Share links can't carry audio. Tested by Jason on his phone (the 2010 Closer, ~5.6 MB, hosted in a GitHub repo; gists fail on big files). ✅ One-click **Publish to phones** to the director's own GitHub repository (a fine-grained token kept in the browser). Unchanged files aren't re-downloaded (the browser revalidates; GitHub answers 304). Follow-up: a Freeform-run upload service if other directors adopt it (no GitHub account needed).
- ✅ Counts from the score's MIDI (for audio rendered from the score): each set's counts placed in its typed measures. Bars no set covers get a hold sub-set (4A). Checked on the 2008 Mario drill + its MuseScore render (14 of 14 sets, with hold 4A for the m. 33 G.P.).
- Automatic count finding from a recording alone (`src/engine/beats.ts`, not in the app): on the 2008 Finale-playback mp3s it agreed with the score only ~half the time (half/double-time slips, unrendered sections), so it stays out until it's better; a hybrid (tap a few downbeats, fill from the score, nudge ±60 ms) is the likely next step for real recordings.
- ✅ Music from MuseScore: **Add the score…** and **Add the recording…**, in either order; the second completes it (Jason: two buttons = two steps). Later, if the export step still bothers: Freeform rendering the audio itself (a browser synth and a ~40 MB sound library; MuseScore-basic sound, not Muse Sounds).
- ✅ Music follow-ups: re-tap from a given count; the recording's waveform on the timeline, aligned to the counts; counts from the MuseScore file itself (.mscz), MusicXML or .mxl (no MIDI needed; fermatas as MuseScore plays them). Later, if needed: playing out repeats and endings in MusicXML.
- Basketball court and custom surfaces.
- ✅ Pyware 3D .3dj import (sets, counts, notes, measures, sections from symbols/figures, hashes). ✅ Set names from the notes (2A, 3A…) and count-by-count paths for moves that aren't straight; ✅ their path lines follow the real route in the editor. Printed charts show only each set's spots (Jason). Follow-ups: .3dj files with no sets (backups/drafts); the CaneRidge Part 2/3 variant with no PAGE blocks.
- ✅ iPhone Duo (foldable): closed = phone (performer view), open = small iPad (editor), switching live on fold and unfold; editor labels shorten at 700 px and under. Checked in emulation at WebKit's published sizes. Follow-ups: a check in Device Hub's iPhone Duo simulator (Xcode 27.1+); (done: a slimmer timeline on short touch screens, about 36% more field on the open Duo on its side); the Device Posture and Viewport Segments APIs (behind Safari feature flags) for a half-folded layout.
- Optional cloud sync; store-wrapped mobile apps. With a store app, offer a choice of app icon (the curve or FF on field dark); web apps have no way to change a home-screen icon after it's added.

- ✅ Roster: a name per dot (Selection and a Roster list in the sidebar), filled in from Pyware imports; in encrypted hosted links, not in plain share links. ✅ Names on printed dot sheets; ✅ import a list (Excel paste / CSV) to name or create dots. ✅ The phone's "who are you" list in last-name order within each section. Follow-up: read .xlsx directly.
- ✅ Logo and brand: the Freeform curve, the "Free FORM" wordmark (Parisienne + Barlow Semi Condensed), an FF monogram and app icon, tagline "Drill, without the bill." Files and rules in `brand/`. ✅ In the app: browser-tab favicon and home-screen icons (both the curve; FF on field dark kept as an alternate). ✅ Logo in the editor's top bar, the phone start screen and the old-browser page; a link-preview card for pasted links.
- ✅ Light mode: a sun/moon button (editor top bar, phone view) switches the panels between dark and light; the field stays the same. Kept per browser. Later, if wanted: follow the device's light/dark setting.
