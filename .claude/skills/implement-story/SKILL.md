---
name: implement-story
description: Executes a .kanban/boards/features/ card with status "in-progress", phase by phase, running the full test suite at the end of each phase and stopping for user confirmation before proceeding. USE FOR: implementing a story or ticket from an in-progress spec; resuming a partially completed card.
---

# Implement Story

Execute all unchecked phases in the specified `.kanban/boards/features/<filename>.md`, following the rules in `.claude/rules/`. Work phase by phase, stopping at the end of each phase to run tests and get user confirmation.

This skill implements a **single story or ticket**. It does not manage the branch or the parent feature — that is `implement-feature`'s job.

## Invocation

If the user names a card (filename or title), use it.

**If no card is named, pick the next appropriate one yourself and start on it immediately** — do not present a list and wait. **Self-selection only ever considers the `in-progress/` and `groomed/` lanes**: this skill implements an existing spec, so a card in `planned/` or `backlog/` is not a candidate no matter where it sits on the feature checklist. Resolve it in this order:

1. **Resume in-progress work first.** Glob `.kanban/boards/features/in-progress/*.md` and ignore the active feature card itself (`labels: ['feature']`). For each remaining card, check every tracked checkbox (per-phase `Complete initial implementation` boxes and any sibling fix checkboxes) — a card is only a candidate if **at least one** is `[ ]` or `[/]`. A work card whose tracked checkboxes are all `[x]` is not a candidate: it is finished but not yet moved to Done, so skip it silently and fall through to step 2 as if `in-progress/` held nothing usable (do not report it as a blocker — that is `/archive-story`'s job, not this skill's). If exactly one candidate remains, that is the card. If more than one remains, list them and ask which to resume — competing half-finished cards is the one case worth a question.
2. **Otherwise, walk the active feature's checklist for a groomed card.** Run `git branch --show-current`, find the feature card whose `id` matches the branch (check `.kanban/boards/features/in-progress/` first), and take the **topmost unchecked (`[ ]`) entry** across its `## Stories` and `## Tickets` lists (Stories first, then Tickets, in the order written) **whose card is in `groomed/`**. Skip past entries whose card sits in `planned/` or `backlog/` — those are ungroomed and out of reach here.
3. **Follow the dependency chain** from that candidate (see below) until an independent card is reached.
4. Announce the choice in one line — _"No card specified — starting on [<slug>](.kanban/boards/features/in-progress/<filename>) (top groomed item on `<feature-id>`)"_, adding _"…reached via dependency from `<original>`"_ when the chain was followed — then proceed without waiting for confirmation.

If there is no active feature card for the branch, fall back to the same rule against the lanes directly: resume a lone candidate (per the not-fully-checked filter above) in `in-progress/`, else list `.kanban/boards/features/groomed/*.md` for the user to choose.

### When both lanes are empty — stop

If `in-progress/` holds no candidate work card (none, or all fully checked) and `groomed/` is empty (or the feature checklist has no unchecked groomed entry left), there is nothing to implement. Say so and **stop** — do not reach into `planned/` or `backlog/`, and do not start grooming on your own:

> Nothing is groomed or in progress on `<feature-id>` — the next step is grooming, not implementation. Run `/groom-story` to spec the next planned card, then implement it.

### Dependency chain resolution

A candidate card may declare that other work must land first. Dependencies are prose, not a frontmatter field: scan the candidate's `## Notes` and `## Implementation Details` for phrasing such as _depends on_, _blocked on/by_, _prerequisite_, or _must land after_, and for the card filenames or `[[wikilinks]]` they name.

For each unmet dependency, in the order written:

- **Already satisfied** — the named card is in `done/`, is no longer on the board (archived), or the card's own text says the dependency has already landed. Ignore it.
- **Explicitly out of scope** — the named card is not part of the active feature and the text does not call it a hard blocker. Ignore it, and mention the assumption when announcing the choice.
- **Unmet and groomed** — the named card is in `groomed/` or `in-progress/`. Make it the new candidate and repeat this resolution against _its_ dependencies.
- **Unmet and ungroomed** — the named card is in `planned/` or `backlog/`. It cannot be implemented from here. **Stop** and tell the user which card blocks the chain and that it needs `/groom-story` first.

Stop when a candidate has no unmet dependencies; that is the card to implement. Track visited filenames and stop if the chain revisits one — report the cycle and ask the user which card to break it on rather than looping.

If the chain leads outside the active feature, still take the card — a blocker is a blocker — but say so when announcing the choice.

If a filename is given and the file is not found in `in-progress/` but exists in `groomed/` or `planned/`, run:

```
node scripts/move-feature.mjs <filename> <source-lane> in-progress
```

then proceed with the file at its new location in `in-progress/`.

**Reopening a completed card.** If the card is in `done/`, this is a bug found in already-completed work. Move it back to `in-progress/` the same way and continue — reopening is sanctioned precisely so the original context stays on one card instead of being referenced second-hand from a new ticket. Record the work as a **sibling checkbox** named after the fix, next to the relevant phase's `Complete initial implementation`. The user moves the card back to `done` after verifying; never move it there yourself.

## Pre-flight: uncommitted changes check — runs before implementation starts

Before touching any code, run `git status --short` and inspect the output.

- **If there are staged or unstaged changes** in files outside `.kanban/` (e.g., source files, config, tests): ask the user — _"There are uncommitted changes in [list the affected files]. Commit them first before starting? (yes / no / skip)"_
  - **Yes** — invoke the `stage-and-commit` skill, wait for it to complete, then proceed.
  - **No / Skip** — proceed without committing (user accepts the risk of mixed history).
- **If the only changes are inside `.kanban/`** (board files, kanban config) — proceed silently; those files are managed by this skill itself.

## Phase confirmation mode

Determine once at the start whether to run in **auto-continue** or **confirm-per-phase** mode:

- **Auto-continue** (default): if the user's invocation contained no explicit request to stop between phases (e.g. plain `/implement-story filename.md`), assume permission to work through all phases without pausing. After each phase, still report the phase summary (goal, changes, manual-testing steps), but immediately begin the next phase — do **not** ask _"Ready to start Phase N+1?"_.
- **Confirm-per-phase**: if the user explicitly asked to go phase by phase (e.g. _"do it one phase at a time"_, _"stop after each phase"_), pause after each phase summary and wait for the user to confirm before proceeding.

The mode is set once and not changed mid-run unless the user asks.

## Ad-hoc change protocol — runs before everything else

Whenever the user asks for a change, correction, or improvement that is not already in the spec file, the following sequence is **mandatory and non-negotiable**. It takes priority over all other instructions, including momentum toward implementation.

**Step 1 — Output this line before touching any file:**

> Spec update [Phase N]: `<one-sentence description of the fix>`

**Step 2 — Write it to the spec file.**
Add the request as a new unchecked **sibling checkbox** at the same level as that phase's `Complete initial implementation` checkbox, named after the fix. Do **not** create a `#### Fixes and Changes` subheader — that convention is retired.

```markdown
### Phase 2 — Story-tier skills

- [x] Complete initial implementation
  - Rename the four story-tier skill folders
- [/] Restore the conflict check dropped from create-story
```

**Step 3 — Mark it in-progress (`[/]`) when you begin it**, following the same Rule 1 discipline as any other tracked checkbox. It will be marked complete after the next commit.

This protocol applies to every ad-hoc request without exception — including rollbacks, removals, renames, and "small" one-line fixes. If you find yourself about to call an edit tool without having first output the `Spec update` line and written the checkbox, stop and do steps 1 and 2 first.

## Execution model

### Phase-based cards

Work is organized under `### Phase N — <description>` headings. Each phase carries exactly **one** tracked checkbox (`Complete initial implementation`) with the concrete tasks as plain nested bullets beneath it. Each phase is delegated to a general-purpose subagent via the `Agent` tool. The orchestrator (this skill) retains ownership of progress tracking, test-running, and reporting.

#### Per-phase subagent delegation

Before spawning the agent, mark the phase's `Complete initial implementation` checkbox (and any unchecked sibling fix checkboxes being addressed) as in-progress (`[/]`) in the spec file.

Construct the agent prompt to include:

1. **Phase work** — the phase heading and the full nested bullet list for this phase, copied verbatim from the spec, plus any unchecked sibling fix checkboxes.
2. **Implementation Details section** — the full `## Implementation Details` block from the spec.
3. **Relevant file context** — for each file named in the phase, read the relevant sections and include them so the agent does not need to discover them cold.
4. **Project rules** — instruct the agent to read and follow every file in `.claude/rules/`.
5. **Scope constraint** — explicitly tell the agent: "Do not modify any file not named in the task list. Do not add features beyond what the tasks describe."
6. **Return format** — instruct the agent to return: a bullet list of every file it changed and a one-sentence summary of what it did per bullet.

After the agent returns:

1. Verify the reported changes look correct (spot-check a modified file if anything is surprising).
2. Run the full test suite (`npm test`).
3. If tests fail: read the output, fix the issue inline (do not re-delegate to the subagent), re-run until green.
4. Run `npx prettier . --write` to format all modified files.
5. Once tests are green, report to the user:
   - **Phase goal** — one sentence restating what this phase was meant to achieve.
   - **Changes made** — brief bullet list of what was modified (from the agent's return).
   - **Server restart required** — include this line if any server-side file was modified: _"Server changes were made — restart the server before testing."_ Omit if no server files were touched.
   - **Manual testing** — concrete steps to verify in the browser or via curl if the phase touched user-visible behavior. Omit for purely internal phases.
6. In **confirm-per-phase** mode: end with _"Phase N complete. Ready to start Phase N+1?"_ and wait. In **auto-continue** mode: state _"Phase N complete — continuing to Phase N+1."_ and proceed immediately.

#### When not to delegate

Do not spawn a subagent for a phase if:

- The phase is a single trivial change (one file, one property) — implement it inline.
- The phase is docs-only — implement it inline.
- The phase modifies the skills, rules, or board tooling this workflow itself depends on — implement it inline, since a cold agent cannot safely rewrite the system it is running under.
- A prior subagent left the codebase in a broken state that needs hands-on diagnosis — fix inline, then resume delegation for subsequent phases.

### Maintenance / server-only cards

Cards with no phase headings (flat list with a single `Complete initial implementation` checkbox) run all work in a single pass inline (no subagent delegation), then run the full test suite at the end.

## Hard rules — never violate these

**Rule 1 — Physical file stays in sync.**
The moment work on a phase **begins**, mark its `Complete initial implementation` checkbox `[/]` in `.kanban/boards/features/in-progress/<filename>.md` immediately. Do **not** automatically mark checkboxes complete (`[x]`) — completion is handled by `stage-and-commit` after a commit lands. If the user explicitly asks to mark something complete (outside of a commit flow), check it off with `[x]` at that point. If the session is interrupted, the file must reflect the true state of progress: started phases show `[/]`, unstarted phases show `[ ]`.

**Rule 2 — Ad-hoc protocol is mandatory (see above).**
The ad-hoc change protocol defined at the top of this skill is the enforcement mechanism for this rule. Following it is not optional even when the user's request feels small or obvious.

## After work that modifies code

Run the tests that cover the changed files after completing a meaningful chunk of source edits (use the test runner's changed-files mode if it has one, e.g. `npx vitest run --changed`; otherwise run the full suite). Interpret the result:

- **Passes, no tests matched** — no tests cover the changed files; treat as a silent pass and continue.
- **Passes, tests listed** — all matched tests passed; report the count and continue.
- **Fails** — fix the issue and re-run before moving on.

Phase-end test runs always use the full suite (`npm test`). If `package.json` has no `test` script yet, say so in the phase report instead of claiming tests passed.

## Completion

When every phase checkbox is accounted for, report completion. Then instruct the user to move the completed card into the **Done** lane — either by dragging it on the board, or by running `/archive-story <filename>.md`, which verifies every tracked checkbox is `[x]`, moves the card, and refreshes its parent feature's checklist.

Moving In Progress → Done is a manual user action; do not move the card automatically. Once in Done, the card is counted as complete on its parent feature's checklist, and `archive-feature` will fold it into the feature summary at merge time.
