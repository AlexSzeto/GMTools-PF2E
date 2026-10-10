---
name: groom-story
description: Develops a thorough, developer-ready story spec through interactive Q&A, then writes it to .kanban/boards/features/ with status "groomed" or "in-progress". Adopts the card into the active feature when one is in progress. USE FOR: turning a backlog or planned idea into a full spec; grooming an existing card; starting implementation planning for a well-understood story.
---

# Groom Story

You are developing a full story specification through iterative dialogue, one question at a time. The end goal is a detailed spec that can be handed off to any developer or agent without ambiguity.

This skill grooms a **single story or ticket** — one unit of work. To scope a whole branch-level rollout, use `groom-feature` instead.

## Inputs

The skill may be invoked with:

- **A filename from `.kanban/boards/features/backlog/` or `.kanban/boards/features/planned/`** — read that file first and use its goal/notes as the starting context. Check `backlog/` first, then `planned/` if not found there.
- **A free-form description** — treat it as the seed and begin questioning from there.
- **No argument** — pick the next appropriate card yourself and start grooming it immediately; only fall back to asking when auto-selection finds nothing. See **Selecting a card with no argument** below.

If a source card was used, read it before asking the first question.

## Pre-researched cards

`create-story` researches a card before writing it, recording a `## Research` section (stamped with a date and commit hash) and a `## Open Questions` section listing every decision it found — unanswered. When the source card carries a `## Research` section, **skip original research** — it has already been done so the user can get straight to the decisions:

1. **Staleness check, not re-research.** Run `git diff --stat <stamped-hash>..HEAD -- <files cited in Research>` (plus `git log --oneline <stamped-hash>..HEAD -- <files>` if the diff is non-empty). Re-read only the files that changed, and only enough to correct the findings they affect. If the stamped hash is unreachable (rebased away), fall back to spot-checking the cited files still exist and the named functions are still where Research says. Do this quietly; mention it in one line only if it changed something ("Research is from 2026-09-12; `play-shell.mjs` has since gained X, which reshapes question 3").
2. **Open with the questions.** Your first message after the staleness check is the first Open Question — not a recap of the research. Work through the list in order, still one question at a time. Because create-story leaves the questions deliberately neutral, this is where you add your recommendation and reasoning to each one.
3. **The list is a starting point, not a script.** Drop a question whose answer fell out of an earlier answer, and follow up where an answer opens a new decision. New code investigation is still expected when an answer leads somewhere the Research section did not cover — the skip applies to the original research, not to everything after it.

Cards without a `## Research` section (older cards, quick captures, free-form descriptions) are groomed the usual way, researching as the questioning goes.

The `## Research` and `## Open Questions` sections are inputs only — they do not appear in the groomed card. Carry every research fact that matters to implementation into Implementation Details, and every answered question into the spec.

## Selecting a card with no argument

**Do not present a list and wait when a card can be resolved automatically.** **Self-selection only ever considers the `planned/` lane** — cards committed to the active feature but not yet groomed. A card in `backlog/` is not committed to the rollout, and one in `groomed/` or beyond is already specified; neither is a candidate, regardless of where it sits on the feature checklist. Resolve it in this order:

1. Run `git branch --show-current` and find the active feature card whose `id` matches the branch (check `.kanban/boards/features/in-progress/` first — see **Resolve the active feature** below).
2. Take the **topmost unchecked (`[ ]`) entry** across the feature card's `## Stories` and `## Tickets` lists (Stories first, then Tickets, in the order written) **whose card is in `planned/`**. Skip past every entry whose card sits in any other lane.
3. **Follow the dependency chain** from that candidate (see below) until an independent card is reached.
4. Announce the choice in one line — _"No card specified — grooming [<slug>](.kanban/boards/features/planned/<filename>) (top planned item on `<feature-id>`)"_, adding _"…reached via dependency from `<original>`"_ when the chain was followed — then read the card and ask the first question.

If there is no active feature card for the branch, fall back to the numbered list below, restricted to `.kanban/boards/features/planned/*.md`.

### When the planned lane is empty — stop

If `planned/` holds no card (or the feature checklist has no unchecked planned entry left), there is nothing to groom. Say so and **stop** — do not pull a card up from `backlog/`, and do not start grooming from scratch on your own:

> Nothing is planned on `<feature-id>` — everything committed to the rollout is already groomed or further along. The next step is implementation, not grooming. Run `/implement-story` to start on the next groomed card.

### Dependency chain resolution

A candidate card may declare that other work must land first. Dependencies are prose, not a frontmatter field: scan the candidate's `## Notes` and `## Goal` for phrasing such as _depends on_, _blocked on/by_, _prerequisite_, or _must land after_, and for the card filenames or `[[wikilinks]]` they name.

For each dependency, in the order written:

- **Already satisfied** — the named card is in `done/`, is no longer on the board (archived), or the card's own text says the dependency has already landed. Ignore it.
- **Explicitly out of scope** — the named card is not part of the active feature and the text does not call it a hard blocker. Ignore it, and mention the assumption when announcing the choice.
- **Already groomed** — the named card is in `groomed/` or `in-progress/`. It needs no grooming pass, so it does not block _this_ skill: keep the current candidate and note that the dependency is specified but not yet implemented.
- **Unmet and planned** — the named card is in `planned/`. Make it the new candidate and repeat this resolution against _its_ dependencies.
- **Unmet and in `backlog/`** — the dependency is not committed to the rollout at all. **Stop** and tell the user which card blocks the chain and that it has to be pulled into the feature first (`/groom-feature`) before this one can be groomed.

Stop when a candidate has no unmet dependencies; that is the card to groom. Track visited filenames and stop if the chain revisits one — report the cycle and ask the user which card to break it on rather than looping.

If the chain leads outside the active feature, still take the card — a blocker is a blocker — but say so when announcing the choice.

### Fallback list

Glob `.kanban/boards/features/planned/*.md`, read frontmatter from all files, and present a numbered list sorted by `priority` (high → medium → low → unknown) before asking the user which story to groom:

```
High priority:
  1. Story Name — one-sentence goal
  2. Story Name — one-sentence goal

Medium priority:
  3. Story Name — one-sentence goal

Low priority:
  4. Story Name — one-sentence goal

(unset)
  5. Story Name — one-sentence goal
```

Ask: _"Which story would you like to groom? Enter a number, or describe a new story from scratch."_ If the user picks a number, load that file and proceed as if it was passed as an argument. If the user describes a new story, treat it as a free-form description and do **not** use any existing card.

## Resolve the active feature

Before the first question, run `git branch --show-current` and look for a card whose `id` matches the branch name and whose `labels` contain `feature` — check `.kanban/boards/features/in-progress/` first, then the other lanes.

- If a feature card is found, that is the **active feature**. Note whether it is `in-progress`.
- If the source card already carries `metadata.feature`, keep that value — never reassign a card that already belongs to a feature.
- If the source card is unaffiliated and an active feature exists, the card is **adopted** into it: set `metadata.feature: '<active-feature-id>'` when writing. Mention this in the final summary so the user sees it happening.
- If no feature card matches the branch, skip linking entirely.

## Questioning process

- Ask **one question at a time**. Each question should build on the previous answer and dig into a relevant detail.
- Cover: user-facing behavior, edge cases, data shapes, dependencies on existing features, constraints, and anything that would block a developer from starting.
- **Investigate before asking**: (On a pre-researched card, start from its Research section — see **Pre-researched cards**.) When you are unsure how an existing feature is implemented, search the source code and report your findings to the user instead of asking them. Reserve questions for decisions and intent that cannot be determined from code alone.
- **Check the old DM tools**: When the story rebuilds something from `pf2e-remaster-dm-tools`, read the old implementation (and the matching campaign data in `pf2e-drakonis-data`) under `reference/` before the first question, summarize what it did, and ask only about what should change in the new document-first, column-based UI. See `.claude/rules/planning.md` for where the references live.
- **Read the composition guide for UI work**: If the story adds or changes client-side UI, read the custom-ui library's `COMPOSITION.md` guide before specifying any layout, `size`, `widthScale`, `gap`, or `padding` (skip this if the file does not exist). Take those choices from the guide and from comparable existing screens, not from whatever controls happen to sit nearby — the guide starts every control at the default `medium` size, and a non-default `size` is a deliberate density change for a whole segment. List any non-default `size` in the summary's Assumptions with its reason, so the user can veto it at approval.
- If a new sub-story surfaces that is clearly out of scope, do **not** spec it here. Tell the user: _"That sounds like a separate story — run `/create-story` to capture it, then we can groom it independently."_
- Continue until you are confident the spec is thorough enough to hand off.

## Finalizing the spec

When the Q&A is complete, generate a structured summary before writing any file. If an open question surfaces while drafting the summary, do **not** include it — return to the questioning phase, resolve it, then re-attempt the summary.

Present the summary in this format:

1. **Goal** — one or two sentences restating the desired outcome in your own words.
2. **Scope** — bullet list of what is in scope and, if helpful, what is explicitly out of scope.
3. **Work** — the planned work grouped by phase. Each phase gets a short milestone label and a flat bullet list of the concrete work items in that phase. Use plain sentences, not checkboxes. Maintenance or server-only stories with no phases use a single flat list under a **Work** heading.
4. **Assumptions** — every detail you filled in that the user did not specify. For each, state what you decided and why (convention match, simplicity, existing pattern). This section must be present even if minimal.
5. **Category** — the card's category label: `story` (substantial unit of work), `polish` (small usability/visual win), `idea` (uncommitted brainstorm), `blocker` (breaking bug), or `defect` (non-breaking bug). Preserve the source card's label if it has one; otherwise propose the best fit. Grooming is the natural moment to confirm or reassign — a groomed card should rarely remain `idea`. Never assign `feature`.
6. **Feature** — the active feature this card belongs to, if any. State plainly whether the card is already linked, is being adopted now, or stays unaffiliated.

End the summary with:

> Does this look right? Reply with any changes, or say **"approved"** to save the spec.

Each time the user requests a change, acknowledge it in one sentence, show only the updated item(s), and repeat the approval prompt. Reprint the full summary only if the user asks. Repeat until the user says "approved" (case-insensitive).

On approval, save the spec to `groomed` by default — do **not** ask which lane to use. Skip straight to implementation only if the user has **explicitly** requested immediate implementation, either in this approval message (e.g. "approved, implement it now") or earlier when invoking this skill. Absent that explicit request, always land the card in `groomed`.

### Saving the spec

1. Derive a kebab-case slug from the story name.
2. Write the new file to `.kanban/boards/features/groomed/<slug>.md` with the full frontmatter (`version: 1`, `boardId: "features"`, `status: "groomed"`, `priority` preserved from source (or `medium` if none), `assignee: null`, `dueDate: null`, current `modified` timestamp, `completedAt: null`, `labels: ['<category>']` (the approved category label), `attachments: []`, `order: "a0"`, and `metadata.feature` if linked) and the spec body.
3. If a source card existed (from `backlog/` or `planned/`): run `node scripts/move-feature.mjs <source-filename> <source-lane> groomed` to remove the source file and move its attachment. (The destination was already written in step 2, so the script will only delete the source.)
4. Run `npx prettier . --write` to format the new spec file.

### If immediate implementation was requested

Never write the new file straight to `in-progress`. The card must land in `groomed` first (steps 1–4 above) — this guarantees a card is never left sitting in `in-progress` without an active session tending its implementation. Once the file is in `groomed/`:

5. Invoke the `implement-story` skill with `<slug>.md` as the argument — do not just tell the user to run it manually. `implement-story` is responsible for moving the card to `in-progress` and beginning execution.

Otherwise (the default case), link the saved card as `[<slug>](.kanban/boards/features/groomed/<slug>.md)` and tell the user to run `/implement-story <slug>.md` when ready to begin.

Status transitions move the file to the appropriate status subdirectory. Always use `node scripts/move-feature.mjs <filename> <from-lane> <to-lane>` for any file move — never use direct file copy/move/delete commands.

## Output file structure

The markdown body (everything after the YAML frontmatter block) must follow this format:

```markdown
# <Story Title>

## Goal

<Concise description of the desired outcome. No implementation steps.>

## Tasks

### Phase 1 — <Short milestone description>

- [ ] Complete initial implementation
  - Task description one
  - Task description two

### Phase 2 — <Short milestone description>

- [ ] Complete initial implementation
  - Task description one

## Implementation Details

<Code snippets, data shapes, class definitions, constraints, and design decisions captured during grooming. This section provides context but does not dictate step-by-step instructions unless a critical restriction applies.>
```

Do **not** include a `**Priority:**` line in the body — priority lives in YAML frontmatter only.

## Per-Phase Progress Tracking

Progress is tracked **per phase**, not per task:

- Each phase carries exactly **one** tracked checkbox, labeled `Complete initial implementation`.
- The concrete tasks are plain **nested bullets** beneath it — implementation notes, not tracked items. They carry no checkboxes.
- Leave the phase checkbox unchecked (`- [ ]`).
- Maintenance or server-only stories with no phases use a flat list with a single `Complete initial implementation` checkbox.

Post-phase fixes are added later (by `implement-story`) as sibling checkboxes at the same level as `Complete initial implementation`, named after the fix. Do not create a `#### Fixes and Changes` subheader — that convention is retired.

## Task Standards

Each nested task bullet focuses on a single outcome that can be verified — either by automated tests or a brief observable check (e.g. what to open or curl). If a piece of work is not independently verifiable, bundle it with the adjacent work that completes the testable unit.

Phases end at a user-visible or testable milestone. Every answer from the Q&A that affects implementation must be captured somewhere in the spec — no context should be lost between sessions.

**Always append a docs-review bullet** as the final nested bullet of the last phase. See below.

### Subagent-ready task standards

Each phase will be handed off to a cold subagent with no memory of prior phases or the grooming dialogue. Every task bullet must be self-contained enough for that agent to implement correctly without asking questions:

- **File references**: Name the exact file path and, where relevant, the specific function, class, or render section to change (e.g. "in `document-view.mjs`, inside the `renderLink()` helper"). Never assume the implementer knows the codebase layout.
- **API ownership**: When two components share a boundary, state explicitly which side owns each behavior (e.g. "the document view parses resource links and emits `onOpenResource`; the column layout decides where the new column opens — the document view does not manage columns itself").
- **Term definitions**: Any domain-specific term used in a task (e.g. "resource link", "pinned column", "stat block") must be defined in the Implementation Details section. Never use project jargon in a task without a corresponding definition there.
- **Multi-file tasks**: If a task touches more than one file, list every affected file explicitly — never write "and related files" or "all callers".
- **Review/update tasks**: Tasks that say "review and update" a doc must name the specific sections to change and state what constitutes done (e.g. "add an `onOpenResource` row to the DocumentView props table; remove the retired `pinned` prop row").
- **Breaking changes**: If a task removes or renames a public prop or exported function, state the old name, the new name or replacement, and list every caller file that needs updating.
- **Test tasks**: Specify what to assert, not just "add a test" (e.g. "assert that clicking a creature link opens one creature column, and clicking it again focuses that column instead of opening a duplicate").

## Docs-Review Bullet (always append)

Every generated task list must end with a docs-review bullet nested under the final phase's `Complete initial implementation`. Infer which living docs are likely affected from the spec content, and name them explicitly:

```
  - Review and update affected living docs: <comma-separated list of likely affected docs>
```

**Mapping story scope → affected docs:**

| Story touches…                                                                                     | Likely affected docs        |
| -------------------------------------------------------------------------------------------------- | --------------------------- |
| Project management, board, card format, skills                                                     | `.claude/rules/planning.md` |
| A named app area (document view, columns, rules, creatures, combat, campaign data, audio/media, …) | `docs/features/<area>.md`   |
| Any other topic already covered by a file in `docs/` or `.claude/rules/`                           | that file                   |

This project's living docs are still being written. Glob `docs/**/*.md` and `.claude/rules/*.md` to see what exists, and when a card adds a new living doc, add a row for it to this table (in both `groom-story` and `create-ticket`) and to the table in `update-docs`.

A story may affect multiple docs — list all that apply. When in doubt, err toward listing more rather than fewer.

**Feature doc creation:** If the story touches a named app area and that area's `docs/features/<area>.md` file does not yet exist, add a bullet before the docs-review bullet to create it:

```
  - Create `docs/features/<area>.md` documenting the user flow, component interactions, server endpoints, and key data shapes for the <area> feature area
```

## Rules

- Do **not** modify any code.
- Every written card must carry exactly one category label (`story`, `polish`, `idea`, `blocker`, or `defect`) in `labels`. The registry lives in `.kanban.json`; do not invent new category names, and never assign `feature`.
- Use `metadata.feature`, never a bare top-level `feature:` field. Kanban Lite strips unknown top-level frontmatter keys when the board rewrites a card.
- Do **not** skip the conflict check when starting from scratch (no source file): briefly scan `.kanban/boards/features/backlog/`, `.kanban/boards/features/planned/`, and `.kanban/boards/features/groomed/` for cards that cover similar ground before the first question. In the same pass, read `project-management/abandoned.md` for an entry covering the same ground. That index is **advisory** — it never blocks grooming. If an entry matches, read the card's `## Abandoned <date>` section in `.kanban/boards/features/abandoned/`, present what was tried, what ruled it out, and the reconsider-if condition, and ask whether to proceed before the first question. If the user proceeds, carry the prior attempt into the spec's Implementation Details so the approach is not re-derived and re-abandoned. Also **amend or remove the matched ledger entry** — a go-ahead contradicts the warning it carries, and a stale entry cautioning against shipped work is worse than none.
