---
name: implement-feature
description: Executes all tasks in a .kanban/boards/features/ card with status "in-progress", phase by phase, running the full test suite at the end of each phase; continues automatically unless asked to stop between phases. USE FOR: implementing a feature from an in-progress spec; resuming a partially completed feature.
---

# Implement Feature

Execute all unchecked tasks in the specified `.kanban/boards/features/<filename>.md`, following the rules in `.claude/rules/`. Work phase by phase, stopping at the end of each phase to run tests and get user confirmation.

## Invocation

The user must provide an explicit filename. If no filename is given, Glob `.kanban/boards/features/in-progress/*.md` and list those files for the user to choose one.

If a filename is given and the file is not found in `in-progress/` but exists in `groomed/`, run:
```
node scripts/move-feature.mjs <filename> groomed in-progress
```
then proceed with the file at its new location in `in-progress/`.

## Pre-flight: uncommitted changes check — runs before implementation starts

Before touching any code, run `git status --short` and inspect the output.

- **If there are staged or unstaged changes** in files outside `.kanban/` (e.g., source files, config, tests): ask the user — *"There are uncommitted changes in [list the affected files]. Commit them first before starting? (yes / no / skip)"*
  - **Yes** — invoke the `stage-and-commit` skill, wait for it to complete, then proceed.
  - **No / Skip** — proceed without committing (user accepts the risk of mixed history).
- **If the only changes are inside `.kanban/`** (board files, kanban config) — proceed silently; those files are managed by this skill itself.

## Phase confirmation mode

Determine once at the start whether to run in **auto-continue** or **confirm-per-phase** mode:

- **Auto-continue** (default): if the user's invocation contained no explicit request to stop between phases (e.g. plain `/implement-feature filename.md`), assume permission to work through all phases without pausing. After each phase, still report the phase summary (goal, changes, manual-testing steps), but immediately begin the next phase — do **not** ask *"Ready to start Phase N+1?"*.
- **Confirm-per-phase**: if the user explicitly asked to go phase by phase (e.g. *"do it one phase at a time"*, *"stop after each phase"*), pause after each phase summary and wait for the user to confirm before proceeding.

The mode is set once and not changed mid-run unless the user asks.

## Ad-hoc change protocol — runs before everything else

Whenever the user asks for a change, correction, or improvement that is not already a task in the spec file, the following sequence is **mandatory and non-negotiable**. It takes priority over all other instructions, including momentum toward implementation.

**Step 1 — Output this line before touching any file:**
> Spec update [Phase N — Fixes and Changes]: `<one-sentence task description>`

**Step 2 — Write the task to the spec file.**
Append a `#### Fixes and Changes` subheader at the end of the current phase (if one does not already exist), then add the request as a new unchecked task beneath it.

**Step 3 — Mark it in-progress (`[/]`) when you begin it**, following the same Rule 1 discipline as any other task. It will be marked complete after the next commit.

This protocol applies to every ad-hoc request without exception — including rollbacks, removals, renames, and "small" one-line fixes. If you find yourself about to call an edit tool without having first output the `Spec update` line and written the task, stop and do steps 1 and 2 first.

## Execution model

### Phase-based features
Tasks are organized under `### Phase N — <description>` headings. Each phase is delegated to a general-purpose subagent via the `Agent` tool. The orchestrator (this skill) retains ownership of progress tracking, test-running, and reporting.

#### Per-phase subagent delegation

Before spawning the agent, mark every unchecked task in the phase as in-progress (`[/]`) in the spec file.

Construct the agent prompt to include:
1. **Phase tasks** — the exact unchecked task list for this phase, copied verbatim from the spec.
2. **Implementation Details section** — the full `## Implementation Details` block from the spec.
3. **Relevant file context** — for each file named in the phase tasks, read the relevant sections and include them so the agent does not need to discover them cold.
4. **Project rules** — instruct the agent to read and follow every file in `.claude/rules/`.
5. **Scope constraint** — explicitly tell the agent: "Do not modify any file not named in the task list. Do not add features beyond what the tasks describe."
6. **Return format** — instruct the agent to return: a bullet list of every file it changed and a one-sentence summary of what it did per task.

After the agent returns:
1. Verify the reported changes look correct (spot-check a modified file if anything is surprising).
2. Run the full test suite (`npm test`).
3. If tests fail: read the output, fix the issue inline (do not re-delegate to the subagent), re-run until green.
4. Once tests are green, report to the user:
   - **Phase goal** — one sentence restating what this phase was meant to achieve.
   - **Changes made** — brief bullet list of what was modified (from the agent's return).
   - **Server restart required** — include this line if any server-side file was modified: *"Server changes were made — restart the server before testing."* Omit if no server files were touched.
   - **Manual testing** — concrete steps to verify in the browser or via curl if the phase touched user-visible behavior. Omit for purely internal phases.
5. In **confirm-per-phase** mode: end with *"Phase N complete. Ready to start Phase N+1?"* and wait. In **auto-continue** mode: state *"Phase N complete — continuing to Phase N+1."* and proceed immediately.

#### When not to delegate
Do not spawn a subagent for a phase if:
- The phase is a single trivial task (one file, one property change) — implement it inline.
- The phase is docs-only (the final docs-review task) — implement it inline.
- A prior subagent left the codebase in a broken state that needs hands-on diagnosis — fix inline, then resume delegation for subsequent phases.

### Maintenance / server-only features
Features with no phase headings (flat task list) run all tasks in a single pass inline (no subagent delegation), then run the full test suite at the end.

## Hard rules — never violate these

**Rule 1 — Physical file stays in sync.**
The moment work on a task **begins**, mark it in-progress with `[/]` in `.kanban/boards/features/in-progress/<filename>.md` immediately. Do **not** automatically mark tasks as complete (`[x]`) — task completion is handled by `stage-and-commit` after a commit lands. If the user explicitly asks to mark a task complete (outside of a commit flow), check it off with `[x]` at that point. If the session is interrupted, the file must reflect the true state of progress: started tasks show `[/]`, unstarted tasks show `[ ]`.

**Rule 2 — Ad-hoc protocol is mandatory (see above).**
The ad-hoc change protocol defined at the top of this skill is the enforcement mechanism for this rule. Following it is not optional even when the user's request feels small or obvious.

## After each task that modifies code

Run the tests that cover the changed files immediately after completing any task that edits source files (use the test runner's changed-files mode if it has one, e.g. `npx vitest run --changed`; otherwise run the full suite). Interpret the result:

- **Passes, no tests matched** — no tests cover the changed files; treat as a silent pass and continue.
- **Passes, tests listed** — all matched tests passed; report the count and continue.
- **Fails** — fix the issue and re-run before moving to the next task.

Phase-end test runs always use the full suite (`npm test`).

If `package.json` has no `test` script yet, say so in the phase report instead of claiming tests passed.

## Completion

When all tasks in all phases are checked off, report completion and suggest running `/archive-feature <filename>.md`.
