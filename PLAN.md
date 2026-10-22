# Plan

## Milestone 1 — Core designer (browser)
1. ✅ **Coordinate engine** (pure TS, unit-tested first): positions in steps, hash presets, readouts in the IDEA.md format ("2 steps outside the Side 2 45, 2 steps in front of Front Hash", "Splitting 40 and 45 on Side 1", "On the 50"), quarter-step rounding, step size per transition with yellow/red tiers.
2. ✅ **Show model + file:** performers (dot/letter/icon, label), sets (counts to arrive), field type and hash preset. Saved as versioned JSON; open and save as local files.
3. ✅ **Field view:** football field with yard lines, numbers, hashes, and an 8-to-5 grid; zoom and pan.
4. ✅ **Editing:** place, select, multi-select, and drag performers with grid snap; add, duplicate, and delete sets; set counts.
5. ✅ **Playback:** linear (float) interpolation, count-by-count scrub, play from any count at a set tempo (set ranges are a follow-up); paths colored by step-size tier.
6. ✅ **Coordinate panel:** selected performer's readout per set.

## Milestone 1 follow-ups
- Undo/redo.
- Play a range of sets (IDEA.md: individual set, sub-collection, whole show); a loop toggle.
- Touch support pass (tablets).

## Later milestones (rough order)
- Shape tools: line, arc, curve, block, free.
- FTL transitions (leader + order, path-following; IDEA.md example is the acceptance test).
- Page markup/text; PDF drill charts and coordinate sheets.
- Performer view (PWA): director view and personal view, count-by-count.
- Count-first layout (Jason): enter the total counts for a musical selection (movement) or the whole show, then place sets at specific counts. Fits the current model, since a set at count N just means counts-into-set = N − previous set's count. Open question: when a set moves, do the later sets keep their absolute counts (default?) or shift with it?
- Music sync (mp3; MIDI tempo map). Pairs with count-first layout: counts → measures → audio time.
- Basketball court and custom surfaces.
- Pyware .3dj import (from Jason's own sample files; behavior-only RE, see DECISIONS.md).
- Optional cloud sync; store-wrapped mobile apps.
