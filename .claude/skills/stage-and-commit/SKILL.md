---
name: stage-and-commit
description: "Stages all codebase changes, generates a commit message, and commits. USE FOR: after editing files; after completing tasks; after any code change in a session; at the end of an implement-feature run; whenever the codebase is modified. Auto-invoked after every codebase change — always run this after editing, creating, or deleting files. Derives the commit message from in-progress ([/]) tasks in .kanban/boards/features/in-progress/, falling back to change context or asking the user. After a successful commit, marks all [/] tasks as [x]. When auto-invoked by the model, always ask the user to confirm before committing. When the user explicitly triggers this skill (e.g. typed /stage-and-commit), commit immediately without asking."
---

# Stage and Commit

Stage all current codebase changes, generate a meaningful commit message, then commit — either immediately (if the user explicitly triggered this skill) or after user approval (if auto-invoked by the model).

## When to Invoke

This skill should be invoked **automatically by the model** at the end of any turn that modifies files — whether from an individual request or as the final step of an `implement-feature` run. It is also available as a manual slash command (`/stage-and-commit`).

## Procedure

### 1. Check for Changes

Run `git status --short` to detect staged and unstaged changes.

- If there are no changes, output: "Nothing to commit." and stop.

### 2. Determine Commit Message

Apply these rules in order, using the first source that yields a meaningful message:

**A. In-progress kanban tasks** — Glob `.kanban/boards/features/in-progress/*.md` and read all files found. Look for tasks currently marked in-progress (`[/]`). Summarise those tasks into a concise imperative phrase (e.g. `add column resize handles`). Use multiple phrases joined by `;` if more than one distinct task is in-progress. If the in-progress tasks exist but their descriptions are too vague to produce a meaningful message, skip to **D**.

**B. Skill argument** — If the user supplied text as a skill argument, use it directly as the commit message (apply light formatting: lowercase first word, trim trailing punctuation).

**C. Context of changes** — If neither source is available, run `git diff --cached --stat` and `git diff --stat` to see which files changed, then write a short phrase describing what was changed (e.g. `update link parsing in document view`). Keep it under 72 characters.

**D. Ask the user** — If none of the above yields a specific, meaningful message, ask the user directly: *"What should the commit message be?"* Wait for their response before continuing.

### 3. Stage All Changes

Run:
```
git add -A
```

### 4. Determine Whether to Commit Immediately or Ask

**If the user explicitly triggered this skill** (they typed `/stage-and-commit` or directly asked to commit), proceed to Step 5 immediately.

**If this skill was auto-invoked by the model** (after editing files, at the end of a task run, etc.), output the proposed commit message and ask for approval:

> Commit message: `<message>`
> Ready to commit? (yes / no)

Wait for the user's response before continuing. If they say no or provide a revised message, update the commit message accordingly or stop if they decline.

### 5. Commit

Run:
```
git commit -m "<message>"
```

Output confirmation:
> Committed: `<message>`

### 6. Mark In-Progress Tasks Complete

After a successful commit, re-read all `.kanban/boards/features/in-progress/*.md` files and replace every `[/]` marker with `[x]`. Write each modified file back. This step is always performed after a successful commit — do not skip it even if no kanban files were staged.

## Commit Message Style

- Imperative mood, lowercase, no trailing period (e.g. `add creature stat block column`, `fix rules search ranking`)
- 50 characters or fewer for the subject
- No generic words alone: `fix`, `update`, `cleanup`, `misc`, `wip` are only acceptable as qualifiers alongside a specific subject (e.g. `fix column close button`)
- When multiple tasks are summarised, join with `;` (e.g. `add pinned columns; fix link hover preview`)

## Completion Check

- Commit message is specific and describes what actually changed
- All changes are staged (`git add -A` was run)
- `git commit` was run with the message
- If auto-invoked, user approved before the commit happened
- All `[/]` tasks in `.kanban/boards/features/in-progress/` were marked `[x]` after the commit
