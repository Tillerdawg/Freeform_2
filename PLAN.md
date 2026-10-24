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
- Touch support pass (tablets).

## Later milestones (rough order)
- ✅ Shape tools: line, arc, curve, Bézier, circle, block (select, then shape; even or interval spacing; least-travel assignment).
- ✅ Mirror: flip across the 50 or front to back; copy Side 1 → 2 (or 2 → 1) with least-travel pairing.
- ✅ Rotate and scale a selection around its center.
- Shape follow-ups: shapes that create new performers; on-field rotate/scale handles; stretch in one direction only.
- ✅ FTL transitions (leader + order, path-following; IDEA.md example is the acceptance test).
- FTL follow-ups: a leader path with turns (several points) instead of a straight leader move; FTL trail shown mid-move.
- ✅ Coordinate (dot) sheets, 4 cards per page, and drill charts, one per set (print / Save as PDF).
- ✅ Measure numbers per set (typed), on dot sheets, chart headers, and the timeline.
- Print follow-ups: paths on charts; a notes column; 1-per-page sheets; computing measures from a meter map once music sync exists.
- ✅ Page markup: text notes, arrows, freehand drawing, page notes; per-performer cues on dot sheets.
- Markup follow-ups: markup that spans several sets; text size/color options; editing ink strokes point by point.
- ✅ Published on GitHub Pages; installable and offline (PWA).
- ✅ Performer view (phone): share links; pick my dot or Staff; follow me; facing front or director view; count-by-count; my spot, next spot, step size, notes.
- ✅ Performer view: pinch-zoom; screen kept awake while playing.
- ✅ QR codes for share links that fit; hosted links (`#load=` + a show file's https address) that phones re-check and update in place. Tested with GitHub gists. ✅ In-app QR scanner (camera) so scans land in the home-screen app, not Safari. ✅ Phones get only the performer/director views (no editor).
- ✅ Protected hosting: hosted show files are encrypted in the browser (AES-GCM); the key rides only in the link's `#` part, so any plain file host (a secret gist) only ever stores ciphertext. Re-keying cuts off old links for future updates. Later, if needed: a Freeform-run upload service so directors needn't touch gists; per-performer links.
- Count-first layout (Jason): ✅ drag a set's button on the timeline to place it at a specific count (neighbors stay pinned). Still to do: enter the total counts for a musical selection (movement) or the whole show up front. Fits the current model, since a set at count N just means counts-into-set = N − previous set's count. When a set moves, later sets keep their absolute counts (Jason): moving set 3 from count 24 to 28 lengthens the move into set 3 and shortens the move out of it; set 4 stays at 48.
- Music sync (mp3; MIDI tempo map). Pairs with count-first layout: counts → measures → audio time.
- Basketball court and custom surfaces.
- Pyware .3dj import (from Jason's own sample files; behavior-only RE, see DECISIONS.md).
- Optional cloud sync; store-wrapped mobile apps.
