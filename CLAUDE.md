# Working on Freeform

Instructions for anyone (person or AI agent) changing this repo. IDEA.md is the original brief; PLAN.md is the roadmap.

## Every change
1. **Keep README.md current and true.** When a feature is added, changed, renamed, or removed, update README.md in the same commit: the feature list, the keyboard/how-to table, the roadmap, and anything else the change affects. Don't describe features that don't exist yet as if they do.
2. **Log decisions in DECISIONS.md:** timestamp, who decided, context, other options, and the decision. Include decisions you make yourself, and mark them so Jason can veto.
3. **Update PLAN.md** when something on it is finished or newly planned.
4. **Test before pushing:** `npm run typecheck`, `npm test`, `npm run build`. New logic gets unit tests in `src/engine/` (or next to the code); UI changes get checked in a real browser.

## House rules learned the hard way
- **Nothing in the top bar or bottom panel may change height** as you move the mouse, switch sets, or play. A canvas resize clears and refits the field, which flashes. Use fixed heights and no wrapping.
- **Shows from files are untrusted.** Validate new fields in `parseShow`.
- **Clean-room:** no decompiled or copied code from Pyware/UDB, and no third-party show files in the repo (`Examples_Drill/` is git-ignored).
- **Commits** are authored as Jason Tiller <49928484+Tillerdawg@users.noreply.github.com>.
