# Working on FreeFORM

Instructions for anyone (person or AI agent) changing this repo. IDEA.md is the original brief; PLAN.md is the roadmap.

## Every change
1. **Keep the docs current and true.** When a feature is added, changed, renamed, or removed, update in the same commit:
   - **docs/HOW-TO.md**, the user guide: the steps, button names, keyboard shortcuts, and anything else the change affects. It's the only copy: the build turns it into the site's guide page (freeformdrill.org/guide/, `src/guide/page.ts`), so never edit the page itself.
   - **README.md**: the short feature list, the roadmap, the code map.
   - **The screenshots** (`docs/img/`), when the change alters what one shows: retake it with `node scripts/screenshots.mjs <name>` and look at it. A new screen worth showing gets a shot in the script and a picture in the guide. The sample show is `src/engine/sample.ts`.
   Don't describe features that don't exist yet as if they do. Write plainly, the way Jason would explain it to another band director: short sentences, button names in **bold**, the Oxford comma (a, b, and c), and no em dashes.
2. **Log decisions in DECISIONS.md:** timestamp, who decided, context, other options, and the decision. Include decisions you make yourself, and mark them so Jason can veto.
3. **Update PLAN.md** when something on it is finished or newly planned.
4. **Test before pushing:** `npm run typecheck`, `npm test`, `npm run build` (`src/engine/guide.test.ts` checks that every picture the docs use exists and every screenshot is used). New logic gets unit tests in `src/engine/` (or next to the code); UI changes get checked in a real browser.

## House rules learned the hard way
- **Nothing in the top bar or bottom panel may change height** as you move the mouse, switch sets, or play. A canvas resize clears and refits the field, which flashes. Use fixed heights and no wrapping.
- **Legible beats pretty (Jason).** Keep strong contrast between everything on screen and paper; when in doubt, choose the more readable option. Targets: text at least 4.5:1 against what's behind it, lines and shapes at least 3:1 (WCAG). `palette.test.ts` checks the main pairs; check new color pairs the same way.
- **One palette.** Colors come from `src/ui/palette.ts` (canvas) and the matching `--name` CSS variables in `app/index.html` and the front page, `index.html` (`var(--surface)` in inline styles). Don't add loose hex colors; add to the palette if a new one is truly needed. `palette.test.ts` checks the two match. Print styles (black on white) are the exception.
- **Even steps (Jason).** A moving performer takes one step size from start to finish of a move: no animation may have one big step. Holds (standing still) are fine. Imported count-by-count paths are evened with `evenPath`; anything new that moves performers must keep step size constant too.
- **Shows from files are untrusted.** Validate new fields in `parseShow`.
- **Clean-room:** no decompiled or copied code from Pyware/UDB, and no third-party show files in the repo (`Examples_Drill/` is git-ignored). The same goes for OpenMarch (AGPL): borrowing ideas is fine, copying its code is not.
- **Commits:** AI agents author commits as themselves (Claude <noreply@anthropic.com>, so GitHub shows them as Verified), with `Co-Authored-By: Jason Tiller <49928484+Tillerdawg@users.noreply.github.com>` at the end of the message. Jason's own commits are authored as him.
