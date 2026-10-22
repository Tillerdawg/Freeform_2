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
