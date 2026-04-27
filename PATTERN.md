# ostk.ai reference pattern — composition-first

House style for `/docs/*` pages and any page describing how the system works.
Sibling to `TONE.md` (voice) — this doc covers structure.

## Principle

> Show how primitives compose to solve operator problems. Don't enumerate
> every element of the substrate.

The pipeline exists in haystack source. Mirroring it on the site teaches a
system to readers who already work there. The reference docs serve operators
who need to know *how the pieces compose to make the system work* — what
happens when the daemon dies, how to bound a worker, how to verify a release.

Catalog form (verb dump, directive table, subsystem enumeration) is the
**anti-pattern**. The user already has `ostk help <verb>`, `ostk abi list`,
and the haystack source for verb-by-verb depth. The site's job is the
composition story.

## Shape

Every reference page has the same skeleton:

```
HERO (italic subhead, 1-2 sentences — the page's thesis-as-shape)

ANCHORING_PARAGRAPH (≤80 words; cite the kernel files the page is about,
                     point readers at the live introspection / spec for
                     verb-by-verb depth)

PROBLEM_01 // <SHOUTY_NAME>
  Problem statement as a question (h2, serif, sentence case).
  Narrative answer (3-5 sentences, plain prose).
  Optional: terminal block (real commands; verified verbs only).
  COMPOSES_FROM box (primitives that chain into the answer).
  Source-cite footer (file:line where it makes sense).

PROBLEM_02 // <SHOUTY_NAME>
  ...

[3-6 problem sections — pick the four to six biggest.]

THE_COMPOSITION
  Closing section that restates the page's model.
  "N problems, one shape" framing — name the primitives and how they
  compose. Optional reference panel (e.g. capability-tokens cheat-sheet
  on /docs/pins) embedded inline.

metadata-ribbon
  3-4 RELATED links to sibling reference pages.
```

## Aesthetics

- Section labels: `<div class="section-label">PROBLEM_01 // SHORT_NAME</div>`
  All-caps, terminal-flavored, mode-named (not verb-named).
- Problem titles: `<h2 class="serif-text text-3xl font-medium ...">`
  Sentence case, ends in a question mark or a period. Mirror how an
  operator would phrase the problem in conversation, not how a spec
  would.
- COMPOSES_FROM: `<div class="bg-surface-container-low p-5 ...">` with
  font-label header and font-body text. Lists the primitives and which
  invariants (where applicable) the composition relies on.
- Source-cite footer: `<p class="font-body text-[10px] text-outline">`
  prefixed `Source:` — file:line format where line numbers add value;
  bare file paths for whole-file references.

## Worked example

`/docs/session-topology` is the canonical shape: four problems
(daemon crashed during work / isolate blast radius / client disconnected /
worker hung mid-flight), each ~5 sentences of composition narrative,
COMPOSES_FROM box per problem, closing "four problems, one shape" with the
four primitives and their invariants. Read it before authoring a new
reference page.

`/docs/commands` is the workflow variant — same shape but each problem is a
multi-verb workflow (boot a project / drive an agent over MCP / run a
one-shot / observe the fleet / sign and ship). Use this variant when the
page is about the CLI surface specifically.

## Truth-grounding

Every claim on a reference page must be verifiable against haystack source
at the page's pinned rev:

1. Before authoring, check the verbs you plan to mention actually exist
   at the current haystack HEAD. Run `ostk <verb> --help` and `ostk
   abi list`. Don't fabricate.
2. Cite source files in the COMPOSES_FROM box and the source-cite footer.
   Use file:line where the line number teaches; bare paths otherwise.
3. After authoring, register the page's source dependencies in
   `v2/site-manifest.json` with notes naming what each source backs.
4. Run `docfresh verify <route>` to pin the page at the current HEAD.
   `docfresh status` should show the page as `current`, never `unverified`.
5. When the kernel changes, `docfresh diff <route>` will show which
   sources moved — re-author the affected sections, re-verify, re-pin.

## When NOT to use this pattern

- Inherently-catalog pages: `/docs/env-vars` (env var matrix), the System
  ABI verb list (already covered by `ostk abi list`). Don't force these
  into problem-composition shape.
- Spec mirrors: `docs/spec/*.md` in haystack carries normative text. The
  site's job is to point readers at it, not duplicate it.
- Tutorial pages (`/start/*`): use the time-boxed walkthrough shape
  documented in those pages directly. Composition-first applies to
  reference; tutorials are step-by-step.

## When to depart

Two cases warrant departures from the shape:

1. **Operator-supplied positioning.** If the operator names a primitive
   they want featured (e.g. "include Ternary-Bonsai as the primary mlx
   model"), respect the framing even when the page's voice would push
   back. Operator framing wins; reviewer findings inform but don't
   override.

2. **Source overrides reviewer.** If a reviewer (BG / Adoption / TW / SD)
   flags a finding that contradicts haystack source, the source is
   canonical. Flag the disagreement in the commit message; cite the file
   and line; apply the truth.

## Reviewer fleet

Four-reviewer pattern for high-stakes pages:

- `brand-guardian` — TONE.md voice, banned words, structural rules.
- `adoption-reviewer` — cold-read, five-question scorecard
  (understanding / is-this-for-me / next-action / friction-to-try /
  trust-to-install).
- `technical-writer` — clarity, parallel structure, jargon discipline.
- `senior-dev` — technical accuracy verified against haystack source
  (the highest-value reviewer; SD has caught P0 install bugs and
  factually-wrong claims like "audit.jsonl" and "GPG-signed audit rows"
  that survived multiple authoring passes).

The fleet pattern that worked: spawn all four in parallel via `Agent`
with `team_name: ostk-site-fleet`, hand each the same page, aggregate
the four `REVIEW_<PAGE>_<INITIALS>.md` files, apply findings, optionally
do a round-2.

## Pages already in the pattern

As of 2026-04-26:
- `/why` (3 problems — collide / drift / no trace)
- `/docs/architecture` (6 problems — daemon dies / agent escapes /
  prove what shipped / two agents one file / ship to someone else /
  see everything)
- `/docs/session-topology` (4 problems — daemon crashed / isolate /
  client disconnected / worker hung)
- `/docs/commands` (5 workflows — boot / drive over MCP / one-shot /
  observe / sign and ship)
- `/docs/trust-model` (4 problems — what can I do / graduate / verify /
  revoke)
- `/docs/pins` (4 problems — default by tier / bound a worker /
  merge order / discover via learn)
- `/docs/agentfile` (4 problems — write your first / declare full spec /
  share across projects / verify before run)

## Pages still in the old shape (next-round candidates)

`/docs/humanfile`, `/docs/primefile`, `/docs/needles`, `/docs/bail`,
`/docs/tui`, `/docs/kernel-spec` (probably should redirect to architecture
or be cut), `/features/*` (10 pages, all unverified).

Read `/docs/session-topology` for the canonical shape before drafting.
Verify against `ostk` at the current HEAD. Pin via docfresh.
