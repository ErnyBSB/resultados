# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

**Programa de Resultados — COBIB** (called *Registro de Atividades* through the
beta, up to v11): a static PWA where public-sector staff (`servidor`) log their
daily work processes and activities, each scored by complexity, and where
supervisors approve those entries in a chain. Version **1.0** onward lives here;
the beta history (v1–v14) stays in the `actividades` repository.

There is **no server**. All shared state lives in a Windows network folder
(`\\COBIB\AmbienteTrabalho\unidadeCentral`) reached from the browser through the
**File System Access API** — so the app runs in Chrome/Edge only. Offline use comes
from a cache-first service worker.

## Objectives (in priority order)

1. **Zero infrastructure.** No backend, no database, no npm, no build step, no CDN.
   The app must run by opening `code/index.html` from a folder. Any proposal that
   adds a server, a package manager, or a network dependency is out of scope — say
   so before implementing.
2. **No write conflicts by construction.** The data model follows *one file, one
   single writer*: each `servidor` writes only their own
   `<UNIDADE>/lancamentos/<servidor>.json`; each unit chief writes only
   `<UNIDADE>/aprovacoes.json`. Never introduce a file that two roles write to.
   Prefer reading from two places (as approval lookup already does) over sharing a
   writer.
3. **Backward-compatible data.** Files already written in the shared folder must keep
   loading. Entries from older versions lack fields (e.g. pre-v11 entries have no
   `carga`); handle their absence explicitly instead of migrating or rewriting user
   files. Never change a persisted key (`k` values in `TIPOS_AUSENCIA`, role names,
   `localStorage` keys) — add a new versioned key instead.
4. **Legible to non-technical staff.** UI, code comments, and docs are **pt-BR**.
   The interface should explain refusals rather than fail silently.
5. **Accessible and dependency-light.** Native elements first (`<details>/<summary>`
   for the accordion, `role`/`aria-label` on custom widgets). ECharts is the only
   vendored library, and it is vendored, not fetched.

## Layout

```
code/                    the app — one copy, always the current version
  index.html             UI + all app logic + inline CSS (~2.2k lines)
  catalogo.js            editable catalog: units, staff, processes, activities,
                         complexity points, absence types, daily targets
  rede.js                network folder access: IndexedDB handle, permissions,
                         JSON read/write helpers
  sw.js                  service worker; const VERSAO gates the offline cache
  manifest.webmanifest   PWA metadata (name shows on the installed icon)
  gerar-senha.html       standalone tool: sha256("nome|senha") for CFG.senhas
  echarts.min.js         vendored charting lib
  icons/                 icon-192.png, icon-512.png — required for offline install
  LEIA-ME.txt            the real documentation: what changed and WHY
Projeto_Design_v1.0.md        technical report for the current version: architecture,
                              data model, roles, decisions, limitations
Projeto_Design_until_v8.pdf   the same report for the betas v1–v8 (superseded)
```

**The two documents differ in purpose.** `LEIA-ME.txt` argues each decision in
chronological, conversational prose — it is what you update on every behavioral
change. `Projeto_Design_v1.0.md` is the structured reference (numbered sections,
schemas, tables) for someone arriving without context; update it when the
architecture, the data model, the roles or the limitations move, and add the
version's row to its history table (section 1.2) when publishing a tag.

## Working conventions

**Versioning is git only.** There are no per-version folders — that was the beta's
scheme and it ended at 1.0. `code/` is always the current version; each published
version is a **tag** (`v1.0`, `v1.1`, …). Never create `code/v2/`, `versionBeta/`,
or a dated copy of a file; make the change in place and let the history hold the
past.

**Publishing a version requires three edits, and they must agree:**
1. `code/sw.js` → `const VERSAO = "ra-1.1"` (otherwise browsers keep serving the
   old cache); the VERSAO string tracks the tag
2. `code/index.html` → the `<span class="versao">` label in the header
3. the repository tag (`git tag -a v1.1`)

**Branches.** One branch per version in progress, merged to `main` by PR, then
tagged on `main`. Commit subjects are pt-BR and describe the user-visible change,
not the code: `recusa gravar por cima de arquivo de lançamentos ilegível`.

**LEIA-ME.txt is part of the deliverable.** It is not a changelog — it argues the
reasoning behind each decision (why an accordion instead of tabs, why chart rendering
is deferred inside a closed section, why absences became periods instead of a
checkbox). Any behavioral change needs a matching section written in that voice:
plain pt-BR prose, the tradeoff stated, the limitation admitted.

**Code style.** `"use strict"`, pt-BR identifiers (`lancamento`, `aprovacao`,
`servidoresDe`, `garantirPermissao`), block comments with `/* ===== TITLE ===== */`
banners at section heads. Inline comments explain *why*, matching the LEIA-ME voice.
Small predicate helpers (`ehServidor()`, `ehChefia()`, `ehMeu(r)`) over inline role
string comparisons.

**Styling.** CSS custom properties in `:root` with pt-BR names (`--tinta`, `--papel`,
`--ficha`, `--verde`, `--dourado`, `--grafite`, `--linha`, `--raio`). Colors carry
meaning — green is approved, gold is pending — so do not reuse them decoratively.

## Domain model

- **Roles (`perfil`)**: `servidor` → `chefia` (unit chief) → `geral` (general chief)
  → `adm`. Role and unit come from configuration, never from a screen choice.
- **Scoring**: complexity `b`/`m`/`a` = 5/10/15 points. Daily target depends on the
  workday: 8h → 15 pts/day, 6h → 11 pts/day. The percentage is averaged **only over
  days with an entry** — empty days and absence days are excluded, which is a known
  and documented limitation, not a bug to fix.
- **Absences** are periods, carry no points, and never go through approval.
- **Config**: `config.json` in the central folder holds units, chiefs, staff,
  password hashes, and an installation id; it overrides the defaults baked into
  `catalogo.js` at connect time. Processes and activities stay in `catalogo.js`.
- **Approval** may be recorded in two places (the unit's `aprovacoes.json` or the
  general chief's own file), so reads must check both. Only the role that wrote an
  approval can undo it.

## Verifying changes

There are no tests and no runner. To check a change, open `code/index.html` in
Chrome and exercise it; the shared folder can be simulated with any local directory
holding the expected `<UNIDADE>/lancamentos/` structure. Syntax-check standalone JS
with `node --check`. When touching `sw.js` or cached assets, verify with a hard
reload — a stale `VERSAO` will happily serve the previous version and hide your
change.

## Do not

- Add build tooling, package managers, frameworks, or remote assets.
- Create per-version folders or dated copies of files — versions are tags.
- Rename persisted keys, role names, or absence `k` values.
- Bump `VERSAO` in `sw.js` without also updating the header label and the tag.
- Rewrite or migrate JSON files that users already have in the network folder.
- Write English into the UI, comments, or LEIA-ME.
