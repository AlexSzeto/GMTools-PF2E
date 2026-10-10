---
name: archive-feature
description: Closes out a completed feature before merge — condenses the feature card and its finished stories and tickets into a single dated summary in project-management/archived/, removes the archived cards from the board, and drafts the PR title and description. USE FOR: wrapping up a feature branch; preparing a pull request; clearing a finished rollout off the board.
---

# Archive Feature

You are closing out a completed **feature** before it merges. The output is a single condensed summary — the durable record of what shipped and why it was built that way — plus a draft PR message.

This runs **pre-merge**, while the feature branch is still checked out. It archives the feature being closed, its own children, and **everything else sitting in `done/`**. When it finishes, the Done lane is empty. Only one feature is active per branch, so a card in Done on this branch either shipped with this feature or is a leftover from an earlier one. Neither belongs on the board after the merge.

## Why a summary rather than a card dump

The old archive kept every card as its own numbered file. Almost nobody read them — when past decisions were needed, git history got searched instead, because a glob of "cards around this number range" is not something you can point someone at. Git already preserves every card verbatim, so the archive's job is not preservation. It is **distillation**: one file per feature, written to be read by a future person or agent asking "what shipped in this release, and why is it built this way?"

Write for that reader. Prefer decisions and rationale over restating task lists.

## Step 1 — Resolve the feature

Run `git branch --show-current` and find the card whose `id` matches the branch name and whose `labels` contain `feature`. Expect it in `in-progress/`; fall back to the other lanes only if it is not there.

**The feature card is expected to still be `in-progress`, not `done`.** Only child cards move to Done as they finish. The feature card stays in progress for the whole life of the branch and is deleted here in Step 5 — archiving is what completes a feature, so it never needs a Done state of its own. If you do find the card in `done/`, proceed normally; it is a harmless deviation, not an error.

If no feature card matches the branch, stop and report it — this skill archives a feature, and without one there is nothing to close out. Suggest the user check they are on the right branch.

If the user passed an explicit filename, use that card instead, but warn if its `id` does not match the current branch.

## Step 2 — Collect the children

Glob every lane under `.kanban/boards/features/` and collect each card carrying `metadata.feature: '<feature-id>'`. Group by lane.

Then glob `.kanban/boards/features/done/*.md` and classify every card there that is not already a child:

- **Unaffiliated** (no `metadata.feature`): it landed on this branch, so it shipped with this feature. Treat it as a child: it goes in the summary and is deleted in Step 5. Mid-implementation cards written straight into a lane, and deliberately unlinked hotfixes, both end up here.
- **Linked to an already-archived feature** (a `project-management/archived/*-<that-id>.md` exists): it is a leftover from an archive run that missed it. If that summary does not already list it under "What shipped", append a one-line entry there, noting it was backfilled and today's date. Then delete it in Step 5. It does not go in this feature's summary.
- **Linked to a feature that is still live** (its card is still on the board): this should not happen with one feature per branch. List these cards and ask whether to adopt each one into this feature or leave it, using the decision UI.

Read every collected card in full. You need their goals, implementation details, and design decisions to write the summary — this is the last moment that content is on the board.

Also read the feature card's `## Notes` in full: scoping decisions and deferred items recorded during grooming belong in the summary.

## Step 3 — Check for unfinished work

Any child card **not** in `done` is unfinished. Also scan every card for unchecked (`[ ]`) or in-progress (`[/]`) checkboxes.

If anything is unfinished, list it grouped by card and lane, then ask how to proceed:

- **Finish it now** — stop and let the user run `/implement-story <filename>`. Re-run this skill afterwards.
- **Carry it forward** — the card stays on the board, unlinked from this feature or relinked to the next one. It is excluded from the summary's "What shipped" and recorded under "Deferred / descoped" instead.
- **Abandon it** — move the card to `abandoned/` via `move-feature.mjs`. Record it under "Deferred / descoped" with the reason.

Never archive an unfinished card as if it shipped. Wait for an explicit decision on each one.

## Step 4 — Write the summary

Write to `project-management/archived/<YYYY-MM-DD>-<feature-id>.md`, where the date is **today** (the completion date). Plain markdown, no YAML frontmatter:

```markdown
# <Feature Title>

Completed <YYYY-MM-DD> · branch `<feature-id>`

## Goal

<What the feature delivered, from the feature card's Goal — refined by what actually shipped, if scope moved.>

## What shipped

- **Story** — <Card Title>: <one-line outcome, in past tense>
- **Ticket** — <Card Title>: <one-line outcome, in past tense>

## Notable decisions

<Implementation decisions and their rationale, drawn from the children's Implementation Details and the feature card's Notes. Focus on choices a future reader would otherwise have to reverse-engineer: why an approach was picked over an obvious alternative, constraints discovered during work, patterns established that later code should follow. Group under `###` subheadings when there are more than a handful.>

## Deferred / descoped

<Anything considered and cut, with why. Include carried-forward and abandoned cards from Step 3. Write "Nothing deferred." if the scope held.>
```

Sizing: proportional to the feature. A rollout with three tickets warrants a short page; one with thirty cards warrants real structure under **Notable decisions**. Do not pad, and do not reproduce task lists — a task list is the least useful thing to a future reader.

## Step 5 — Clear the board

Delete the archived cards from the board:

1. **Every card in `done/`**: this feature's children, the adopted unaffiliated cards, and the leftovers from Step 2. Build the delete list from the `done/` glob, not from the lane each child was collected in.
2. Each card's attachment at `<lane>/attachments/<basename>.log`, if present.
3. The feature card itself.

Use `git rm` so the deletions are staged with the rest of the change and the content stays recoverable from history. Cards carried forward or abandoned in Step 3 are **not** deleted, and nor is a live-feature card the user chose to leave in Step 2.

**Verify before moving on.** Re-glob and confirm both of these:

- `.kanban/boards/features/done/` holds no `.md` cards, except any live-feature card left by choice in Step 2.
- No card in any lane still carries `metadata.feature: '<feature-id>'`, except cards carried forward in Step 3. Unlink those, or relink them to the next feature, before checking.

If either check fails, fix it before Step 6. A summary that lists a card while the board still holds it is the failure this check exists to catch. The 2026-07-24 archive left two summarized cards in Done for months.

## Step 6 — Draft the PR message

Output the draft in chat — do **not** create the PR.

**Always emit it as raw markdown inside a fenced code block**, so the user can copy the whole thing straight into GitHub without re-formatting it by hand. Make the fence longer than any fence inside the body — four backticks is the safe default, since a PR description usually carries inline code and often a triple-backtick block. The shape to fill in (shown here with a plain fence; the real output needs the longer one):

```
## Title

<concise imperative summary of the rollout>

## Description

<A short intro paragraph on what the feature delivers, framed from the user's side — what the app can now do that it could not before.>

## New Features

<The user-facing additions, grouped into a handful of themed bullets rather than one bullet per card. Focus on client-side surface: new pages, new controls, new persisted state a user creates and returns to. For a rules-column feature this is the new column, its search, and how links in the document open it — not the server plumbing behind them.>

## Technical Notes

<What a reviewer or a future implementer needs: reusable components and API endpoints added (name them — e.g. a new column component and its props contract, new `/api/rules/*` routes), intentional behaviour changes, data migrations and restart requirements, notable decisions, deferred items, and a pointer to the archive summary file.>
```

Never render the draft as blockquote lines, prose, or already-styled chat output — those all have to be unpicked before the text is usable. The fence contents must be exactly what belongs in the PR body.

Derive it from the summary you just wrote. Keep the title under ~70 characters.

## Step 7 — Confirm

1. Run `npx prettier . --write`.
2. Invoke `stage-and-commit` so the summary and the board cleanup land together.
3. Report: the summary path, how many stories and tickets it covers, anything carried forward or abandoned, and a reminder that the PR message above is ready to paste.

## Rules

- Do **not** archive a card that is not in `done` — resolve it in Step 3 first.
- **Leave the Done lane empty.** Unaffiliated Done cards are adopted into this summary. Leftovers from already-archived features are backfilled into their own summary and deleted. Only a card linked to a still-live feature is left, and only when the user chooses that.
- Do **not** create the pull request. Output the draft and let the user open it.
- Do **not** number the summary file. The completion date orders the archive.
