---
name: archive-story
description: "Archives finished stories or tickets by verifying every tracked checkbox on a card is complete, then moving it from the in-progress lane to done and refreshing its parent feature's checklist. With no argument, sweeps every non-feature card in in-progress and moves each one that is fully implemented and committed — incomplete cards are always audited first and left in place, never accidentally swept. USE FOR: archiving a story or ticket after its last phase lands; marking a card done; moving a card to the Done lane; batch-clearing every finished card out of In Progress; confirming a card is actually finished before archiving the feature."
---

# Archive Story

Move finished **stories or tickets** from `in-progress` to `done`, after verifying each card is genuinely complete.

This is the sanctioned way to make the In Progress → Done move. `implement-story` deliberately stops short of it, and `archive-feature` refuses to run while any child is outside `done` — this skill is the step between them.

**Archiving a story is not the same shape as archiving a feature.** `archive-feature` distills a whole rollout into a summary file and deletes its cards from the board; `archive-story` only moves one card to `done` and leaves it there, intact, for `archive-feature` to distill later. The names are parallel because both close out their tier; the mechanics are not.

## Invocation

**No argument** (`/archive-story`) — or an argument of `all` / `--all`, or phrasing clearly meaning "archive everything that's done" / "sweep in-progress" — runs **Sweep Mode** below across the whole `in-progress/` lane. This is the default invocation because Sweep Mode never moves an incomplete card: every candidate goes through the same completeness audit as the single-card flow (Step 1), so it's safe to run even when `in-progress/` holds unfinished work.

**A card title or `id`** targets a single card, the same way as every other lane skill (`/archive-story gm-party-table.md`, `/archive-story gm-party-table`, or `/archive-story GM Party Table`).

Resolve it by globbing `.kanban/boards/features/in-progress/*.md` and matching, in order:

1. Exact filename or basename match against the argument.
2. `id` frontmatter field match.
3. Case-insensitive match of the card's `# ` heading against the argument.

If the argument matches **more than one** card, list the matches and ask.

If the card is not in `in-progress/`:

- **Already in `done/`** — report that it is already complete and stop. Do not re-move it.
- **In `groomed/` or `planned/`** — the card never entered implementation. Stop and say so; ask whether they meant to run `/implement-story <filename>` first.
- **Nowhere on the board** — report that no matching card exists, and list the `in-progress/` cards.

## Guard — this skill never completes a feature card

If the resolved card's `labels` contain `feature`, **stop**. Feature cards never move to `done`: they stay `in-progress` for the whole life of the branch and are deleted by `archive-feature` when the summary is written. Tell the user this and point them at `/archive-feature`.

## Step 1 — Verify the card is complete

Read the card in full and scan every tracked checkbox — the per-phase `Complete initial implementation` boxes and any sibling fix checkboxes beside them. Nested task bullets carry no checkboxes and are not counted.

The card passes only when **every** tracked checkbox is `[x]`.

If any checkbox is `[ ]` or `[/]`, **do not move the card**. Report them grouped by phase:

> `gm-party-table.md` is not complete:
>
> - Phase 3 — Live sync: `[/]` Complete initial implementation
> - Phase 4 — Empty states: `[ ]` Complete initial implementation
>
> Finish these with `/implement-story gm-party-table.md`, or tell me to complete the card anyway.

A `[/]` box most often means the work landed but was never committed — `stage-and-commit` is what flips `[/]` → `[x]`. Say so when you see one, and offer to run `/stage-and-commit` first.

The user may override and complete the card anyway; that is their call. If they do, record why in the card's `## Notes` (create the section if absent) before moving it — e.g. `Phase 4 descoped at completion: empty states deferred to a follow-up card.` — so `archive-feature` picks it up as deferred work rather than losing it.

## Step 2 — Check for uncommitted work

Run `git status --short`.

If anything outside `.kanban/` is modified, ask whether to commit first:

> There are uncommitted changes in [files]. Commit them before completing the card? (yes / no)

- **Yes** — invoke `stage-and-commit`, wait for it to finish, then re-read the card (its checkboxes may have just flipped to `[x]`) and re-run Step 1.
- **No** — proceed; the lane move will be committed alongside whatever else is pending.

Changes confined to `.kanban/` need no prompt.

## Step 3 — Move the card

```
node scripts/move-feature.mjs <filename> in-progress done
```

The script updates `status`, `modified`, and `order`. It does **not** set `completedAt` — edit the moved card at `.kanban/boards/features/done/<filename>` and set:

```yaml
completedAt: '<ISO 8601 UTC timestamp — now>'
```

Leave the rest of the frontmatter and the entire body untouched. A completed card is a record; do not tidy, summarize, or prune it. `archive-feature` is what distills it later.

## Step 4 — Refresh the parent feature checklist

Read the card's `metadata.feature`. If it is absent, resolve the **active feature**: find the card whose `id` matches `git branch --show-current` and whose `labels` contain `feature`. If one exists, add the link to the moved card's frontmatter:

```yaml
metadata:
  feature: '<active-feature-id>'
```

The work was finished on this branch, so it ships with this feature. Cards written straight into a lane during implementation skip `create-ticket`'s linking. Without this step, they reach `archive-feature` as strays. This is the one frontmatter field this skill adds beyond `completedAt`. Mention the adoption in the Step 6 report. If no feature card matches the branch, the card stays unaffiliated and this step ends here.

Otherwise find the feature card whose `id` matches (check `in-progress/` first, then the other lanes) and regenerate its `## Stories` and `## Tickets` sections using the same procedure as `stage-and-commit` Step 6:

1. Glob every lane and collect cards whose `metadata.feature` equals the feature's `id`.
2. Cards labeled `story`, `polish`, or `idea` go under **Stories**; `blocker` or `defect` go under **Tickets**.
3. A card is `[x]` iff its lane is `done`.
4. Preserve any existing checklist entry whose file no longer exists in any lane — it was archived; keep it `[x]`.
5. Write each entry as `- [<state>] \`<filename>.md\` — <Card Title>`, checked entries first.
6. Keep an empty section's heading; omit only its body.

Leave the feature card's `## Goal` and `## Notes` alone.

If no feature card matches, skip silently.

## Step 5 — Commit

Invoke `stage-and-commit` so the lane move and the checklist refresh land together. A reasonable message is `complete <card-title>`.

## Step 6 — Report

Output:

- The card that moved, linked at its new path — `[<slug>](.kanban/boards/features/done/<filename>)`.
- The parent feature's tally after the refresh — e.g. _"`gm-party-table` feature: 4 of 7 stories done, 1 of 2 tickets done."_
- **If every child of the feature is now `done`**, say so and suggest `/archive-feature` as the next step.
- Anything recorded under `## Notes` as an override in Step 1.

## Sweep Mode

The default when `/archive-story` is invoked with no argument — also reachable explicitly via `/archive-story all` or `/archive-story --all`, or an equivalent request to clear out every finished card at once. This automates the single-card flow above across the whole `in-progress/` lane instead of asking which card to complete.

1. **Collect candidates.** Glob `.kanban/boards/features/in-progress/*.md`. Drop any card whose `labels` contain `feature` — the guard above applies per card, silently, with no need to stop or explain (a sweep is expected to skip feature cards; that isn't noteworthy).

2. **Check for uncommitted work once, up front.** Run `git status --short`. If anything outside `.kanban/` is modified, ask whether to commit first, same as Step 2 of the single-card flow:

   > There are uncommitted changes in [files]. Commit them before sweeping in-progress? (yes / no)
   - **Yes** — invoke `stage-and-commit`, wait for it to finish, then re-glob the candidate list (checkboxes may have just flipped to `[x]`, and `stage-and-commit` may have already flipped in-progress `[/]` boxes to `[x]`).
   - **No** — proceed; this means some candidates may still show `[/]` for work that is in fact committed under something else, so re-check checkbox state per card rather than assuming.

   This is a single check for the whole sweep, not one per card — sweep mode never prompts to commit multiple times.

3. **Classify each candidate** using Step 1's rule (every tracked checkbox — per-phase `Complete initial implementation` boxes and sibling fix checkboxes — must be `[x]`):
   - **Ready**: every tracked checkbox is `[x]`. Queue it for the move.
   - **Not ready**: any checkbox is `[ ]` or `[/]`. Skip it silently — do not ask the user to override per card. Sweep mode only auto-completes cards that are unambiguously done; it never makes the judgement call Step 1 describes for a partial card.

   If **no** candidate is ready, report that nothing in `in-progress/` is complete yet and stop — do not run `stage-and-commit` for a no-op sweep.

4. **Move every ready card** via `node scripts/move-feature.mjs <filename> in-progress done`, then set `completedAt` to the current ISO 8601 UTC timestamp on each moved card, exactly as in Step 3 of the single-card flow.

5. **Refresh parent feature checklists once per distinct feature.** Collect the `metadata.feature` of every card moved in this sweep (including cards outside the sweep — the refresh procedure in Step 4 of the single-card flow already re-derives full membership from all lanes, so run it once per distinct feature id touched, not once per card).

6. **Commit once.** Invoke `stage-and-commit` a single time for the whole sweep, covering every lane move and every checklist refresh together. A reasonable message is `complete N cards: <title>, <title>, ...` (or name them all if the list is short).

7. **Report** a single summary: which cards moved (title + new path), which were skipped and why (grouped by phase, same format as Step 1's single-card report — this is worth surfacing so the user knows what's still open), and each touched feature's updated tally. If every child of a feature is now `done`, call it out and suggest `/archive-feature`.

Sweep mode never overrides a not-ready card — the "user may override" allowance in Step 1 is a single-card, explicit-request-only escape hatch and does not apply here.

## Rules

- **Only on explicit user invocation of this skill.** Do not call `/archive-story` (single-card or sweep) automatically at the end of an `implement-story` run, and do not chain into it after a commit — it is not run implicitly by any other skill. Declaring work finished is the user's judgement call; this skill is the mechanism, not the trigger. Once the user invokes it, Sweep Mode running by default with no argument is fine — it audits every candidate before moving anything, so it carries none of the risk that made auto-invocation unsafe.
- **Never move a feature card to `done`.**
- **Never move a card backwards.** Reopening a `done` card is `implement-story`'s job.
- **Never edit the card body** beyond the Step 1 override note. The frontmatter changes are `completedAt` and, for an unlinked card, `metadata.feature` (Step 4).
- **Never open a pull request or archive the feature** — that is `archive-feature`.
- **Sweep mode never auto-overrides a partial card.** Only cards with every tracked checkbox already `[x]` are moved; anything else is reported and left in `in-progress/` for the user to finish or explicitly override one at a time via the single-card flow.
