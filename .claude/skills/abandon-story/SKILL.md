---
name: abandon-story
description: Shelves a story or ticket that will not be built, interviewing for the reason, recording it on the card, and indexing it in project-management/abandoned.md so future card creation can surface the prior attempt. USE FOR: dropping a card that turned out to be the wrong approach; closing out a failed implementation attempt; shelving work that is no longer worth building; recording why something was not built.
---

# Abandon Story

You are shelving a story or ticket that will not be built. The card moves to the
`abandoned` lane, and — this is the part that matters — **the reason is recorded
in two places**: in full on the card, and as one indexed line in
`project-management/abandoned.md`.

The reason is the entire product of this skill. A card that reaches `abandoned`
without one is worse than useless: it occupies the lane, teaches nothing, and
leaves the next person to rediscover the same wall. At the time this skill was
written, 8 of 10 cards already in the lane recorded no reason at all. Do not add
to that.

This skill abandons **one card**. It does not abandon features — a feature card
stays `in-progress` for the life of its branch and is removed by
`archive-feature`. If the user wants to drop a whole rollout, say so and stop.

## Steps

### 1. Resolve the card

If invoked with a filename, find it across `.kanban/boards/features/*/` (skip
`done/` and `abandoned/`). If invoked with no argument, Glob `backlog/`,
`planned/`, `groomed/`, and `in-progress/`, read each card's frontmatter and
`## Goal`, and present a numbered list grouped by lane. Ask which to abandon.

Read the whole card before asking anything. Its `## Notes`, `## Tasks`, and
`## Implementation Details` often already contain the reasoning — especially if
an implementation was attempted and reverted. Never ask the user for something
the card already says.

### 2. Check for an implementation attempt

Before the interview, establish whether code was written:

- `git log --oneline -- <the files the card names>` for commits touching them.
- `git status --short` for uncommitted work.
- Grep for identifiers the card introduced (a new attribute, helper, or file) to
  confirm whether anything survives on the branch.

Report what you find in one or two sentences. "Implemented and reverted, nothing
survives on this branch" and "never started" lead to very different records, and
the user should not have to tell you which one it was.

### 3. Interview for the reason

Ask **one question at a time**. Do not batch. You need three things, and you
should stop as soon as you have them:

1. **What ruled it out.** Not "why are we stopping" — what specifically makes
   this not worth building. Push past the first answer if it is a symptom rather
   than a cause. "The implementation kept breaking" is a symptom; "line
   boundaries aren't addressable in this DOM" is a cause.
2. **The reason class** — one of the closed set below. Propose the one you think
   fits and let the user correct it; do not make them memorize the taxonomy.
3. **The reconsider-if condition.** What would have to change for this to become
   viable again. This is the load-bearing field: it is what keeps the ledger a
   guard rather than a graveyard. If the honest answer is "nothing — this is
   permanently wrong," write that; a permanent no is a legitimate and useful
   answer.

**If the work was abandoned because it shipped some other way, it gets its card
section but no ledger line.** The index warns against paths already tried and
found wanting; "we did it elsewhere" is not a warning, and every such entry is
noise on a file whose only value is being fast to scan. This case is common —
check for it before the interview and say so plainly rather than manufacturing a
wall that was never hit. If a superseded card _also_ failed on its own merits,
index that failure and leave the supersession out of the line.

| Reason class     | Means                                  |
| ---------------- | -------------------------------------- |
| `wrong-layer`    | Not solvable where it was scoped       |
| `not-worth-it`   | Solvable; value below cost             |
| `obsolete`       | The thing it targeted no longer exists |
| `failed-attempt` | Tried, reverted, root cause understood |

**A card parked for board hygiene is not an abandonment.** Cards sometimes land
in the lane because no other lane fits them — the work shipped under a different
card, or the card predates the current system. These get a short note on the card
saying so and **no ledger line**. Do not run the interview or manufacture a reason
for one; ask whether the card was genuinely dropped before assuming it was.

If an implementation was attempted, also capture **what was tried and what broke**
concretely enough that the next person does not repeat it. Approaches that were
evaluated and rejected _without_ being built belong here too — a sound approach
that was passed over for scope reasons is valuable information, and the next
person will otherwise propose it again.

### 4. Present the draft for approval

Show both artifacts before writing anything:

- The `## Abandoned <YYYY-MM-DD>` section that will go on the card.
- The single ledger line that will go in `project-management/abandoned.md`.

End with:

> Does this capture it? Reply with any changes, or say **"approved"** to record it.

Repeat until approved.

### 5. Write

**Order matters — do not deviate.** Editing a card's `status:` field in place
causes the board watcher to move the file immediately, out from under any
subsequent edit. Let `move-feature.mjs` own the status change.

1. Insert the `## Abandoned <YYYY-MM-DD>` section into the card **in its current
   lane**, immediately after the `# Title` heading and before `## Goal`. Do
   **not** touch the `status:` field.
2. `node scripts/move-feature.mjs <filename> <from-lane> abandoned` — this sets
   `status`, `modified`, and `order`, and moves any attachment.
3. Append the ledger line to `project-management/abandoned.md`, in the
   alphabetical position of its slug — **unless** the card was abandoned because
   the work shipped some other way, in which case the card section is the whole
   record and no line is added.
4. `npx prettier <card-path> project-management/abandoned.md --write`.

Then tell the user the card is abandoned and indexed — linking it at its new
lane, `[<slug>](.kanban/boards/features/abandoned/<filename>)` — and that
`/sync-skills` should be run if other agents need the skill change.

## Card section format

```markdown
## Abandoned <YYYY-MM-DD>

Abandoned as **<reason class>** — one sentence stating what ruled it out.

<A paragraph or two of the actual reasoning. Enough that someone who never saw
this card understands the wall, not just that a wall existed.>

<If approaches were built or evaluated, a bullet per approach: what it was, what
happened to it, and whether it was sound. Include approaches rejected without
being built.>

**Reconsider only if** <the condition>. <Or: this is permanently ruled out,
because …>
```

## Ledger line format

One line per card in `project-management/abandoned.md`, alphabetical by slug:

```markdown
- **<slug>** — <one line of what it was>. `<reason-class>`: <the wall, in one
  clause>. Reconsider if <condition>.
```

Four fields, always in this order: slug (machine-matchable against a proposed
card), one line of what, reason class, reconsider-if.

Keep it to one line. The card holds the full account; the ledger exists to be
scanned, and a ledger that takes as long to read as the cards it indexes has no
reason to exist.

## Rules

- Never abandon a card without a recorded reason. If the user cannot articulate
  one, that is a signal the card should stay where it is, not that the reason
  field should be left thin. Say so.
- Never fabricate or infer a reason to fill the field. If a reason is genuinely
  unknown — as with backfilled historical cards — write `reason-not-recorded`
  explicitly. An honest gap is more useful than a plausible guess, and it marks
  the card as needing attention.
- Do **not** touch the `status:` field directly. `move-feature.mjs` owns it, and
  editing it in place triggers the board watcher mid-operation.
- Do **not** modify any source code. Abandoning a card never reverts an
  implementation — if code needs removing, that is a separate, explicit request.
- Do **not** abandon feature cards. Features are removed by `archive-feature`.
- The ledger is **advisory**. It records what was ruled out and why; it does not
  forbid anything. Never write a ledger line phrased as a prohibition or as a
  banned topic.
- Do **not** add a ledger entry for work that was superseded by a shipped
  alternative. The card still gets its `## Abandoned` section; the index does
  not get a line.
- An existing entry that a new implementation contradicts must be **amended or
  removed**, not left standing. If a card covering indexed ground is given an
  explicit go-ahead, the entry that matched it is no longer true — narrow it to
  whatever reason survives, or delete it outright. A stale entry warning against
  something the codebase now does is worse than no entry at all.
