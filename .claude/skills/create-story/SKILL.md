---
name: create-story
description: Captures a freeform story idea as a card in .kanban/boards/features/ with status "backlog" or "planned" (user's choice). Checks for conflicts with existing backlog, planned, and groomed cards, surfaces any prior abandoned attempt covering the same ground, then researches the codebase up front and records its findings plus every decision grooming will need — written as open questions, never answered — so groom-story can start straight on the decisions. Confirms before writing, and auto-links the card to the active feature when it lands in Planned. When the user asks to "save as a stub", skips the research and writes the card from the original prompt alone. USE FOR: capturing a new idea quickly; breaking down a brainstorm document into individual story files; preserving an idea that surfaced during grooming of another card.
---

# Create Story

You are capturing a story idea into `.kanban/boards/features/`. The goal is to get the idea recorded **and ready to groom** — not to specify it. Full grooming happens later via `groom-story`.

**Research now, decide later.** Like `create-ticket`, this skill does the independent code research up front: it finds the code the story touches, learns how it works today, and works out which decisions the story forces. Unlike `create-ticket`, it **makes none of those decisions**. Every decision is written onto the card as an open question, with the options and the facts that bear on them, and left for the user to settle in grooming. The point is time-shifting: research is slow, and doing it here means `groom-story` opens on the first real question instead of making the user wait while it re-reads the codebase. A card that carries a `## Research` section tells `groom-story` to skip its own original research.

**Stub mode.** When the user asks for the story to be **saved as a stub** (or a quick capture with no research), the skill reverts to its pre-research behavior: the card is written from the user's original prompt alone, with no `## Research` or `## Open Questions`. Steps 1–4 (collect, conflict check, abandoned check, active feature) and the priority/category/lane question still run; step 5 is skipped entirely. A stub carries no research stamp, so `groom-story` treats it as an unresearched card and does its own research when it is groomed.

A **story** is a single unit of work (a UX story, an enhancement, an idea). It is not a feature — features are branch-level rollouts created by `create-feature`. If the user describes a whole rollout ("the new user experience push", "the combat tracker rebuild"), tell them to use `/create-feature` instead.

## Steps

1. **Collect the idea.** If the user has not already described the story, ask for a one-sentence description of what they want to build.

2. **Check for conflicts.** Glob `.kanban/boards/features/backlog/*.md`, `.kanban/boards/features/planned/*.md`, and `.kanban/boards/features/groomed/*.md` and read the YAML frontmatter + `## Goal` section of each file. If any existing card covers the same or overlapping ground:
   - Present the conflicting file(s) by name and goal.
   - Ask the user: merge into the existing file, or create a new one anyway?
   - If merging: append the new idea to the existing file under a clearly labelled section, then stop.

3. **Check the abandoned index.** Read `project-management/abandoned.md` and look for an entry covering the same ground. This index is **advisory** — it never blocks the card. If an entry matches:
   - Read that card's `## Abandoned <date>` section in `.kanban/boards/features/abandoned/` for the full reasoning (or note that the card has been pruned and only the ledger line survives).
   - Present the prior attempt: what was tried, what ruled it out, and the entry's reconsider-if condition.
   - Ask the user whether to proceed anyway. Prior abandonment reflects the codebase as it was when the work was attempted, which may no longer hold — this is context for their decision, not a verdict.
   - If they proceed, note the prior attempt in the new card's `## Notes` so the next reader inherits it. If they proceed, **amend or remove the matched ledger entry** — a go-ahead contradicts the warning it carries, and a stale entry that cautions against shipped work is worse than none.

4. **Resolve the active feature.** Run `git branch --show-current` and look for a card whose `id` matches the branch name and whose `labels` contain `feature` — check `.kanban/boards/features/in-progress/` first, then the other lanes. Record the id if found. If no feature card matches the branch, there is no active feature and linking is skipped.

5. **Research the story.** _Skipped in stub mode — go straight to step 6._ Silently investigate every area the story touches — do **not** ask the user anything during this step:
   - Locate the relevant source files, docs (`docs/`, `.claude/rules/`), and comparable existing features with Glob and Grep, and read the key sections.
   - Establish how the affected area works today: current behavior, data shapes, integration points, and the conventions any implementation would have to follow (component patterns, API shapes, schema/migration impact).
   - If the story adds or changes client-side UI, read the custom-ui library's `COMPOSITION.md` guide (skip if absent) and note which recipes and comparable screens apply.
   - If the story rebuilds or changes something the old DM tools did, read the old implementation in `reference/pf2e-remaster-dm-tools/` and the matching campaign data in `reference/pf2e-drakonis-data/` (see `.claude/rules/planning.md`), and record what it did as Research facts. How the new document-first, column-based UI should differ is an Open Question, not a fact.
   - Identify every **decision** an implementer would need answered before starting — user-facing behavior, edge cases, scope boundaries, data shape choices, which existing pattern to follow where more than one fits. This is the list of questions `groom-story` would otherwise discover one by one.
   - Note anything the research turns up that looks like a separate story; it goes in `## Notes` as a suggested follow-up, not into this card's questions.

   **Do not decide anything.** Facts go in Research; anything a person would have to choose goes in Open Questions — including details `create-ticket` would quietly assume from convention. When an option matches an existing convention, say so as a fact about that option ("matches how the rules column does it"), but never mark an option as recommended or chosen. Recommendations belong to the grooming dialogue, where the user can push back on them.

   Scale the depth to the idea: a one-line `polish` card may need a few file reads and two questions; a substantial `story` may need a broad sweep. When the input is a brainstorm document being broken into several cards, research each card separately — independent cards may be researched in parallel by background subagents, each returning its Research and Open Questions sections.

6. **Assign priority, category, and lane.** Ask the user (one message, all three questions): _"What priority is this story — high, medium, or low? Which category — `story` (substantial unit of work), `polish` (small usability/visual win), `idea` (uncommitted brainstorm), `blocker` (breaking bug), or `defect` (non-breaking bug)? And should it go to the **Backlog** or **Planned** lane?"_ Suggest `idea` as the default category when the request reads like a brainstorm, and Backlog as the default lane. Precede the question with a short preview of the research — the files it centers on and the count and one-line titles of the open questions — so the user can correct a misread scope before the card is written (in stub mode there is no research, so show only the proposed title and Goal paragraph). If an active feature was found in step 4, mention it: _"Planned will link it to the active feature `<feature-id>`."_ Wait for their answer before writing the file.

7. **Write the card.** If creating a new file:
   - Derive a kebab-case slug from the story name (e.g. `creature-link-column`).
   - Write to `.kanban/boards/features/<lane>/<slug>.md` (where `<lane>` is `backlog` or `planned`, per the user's choice) with YAML frontmatter followed by the markdown body — the `status` field must match the chosen lane:

```markdown
---
version: 1
id: '<slug>'
boardId: 'features'
status: '<backlog | planned>'
priority: '<high | medium | low>'
assignee: null
dueDate: null
created: '<current UTC time in ISO 8601 format>'
modified: '<current UTC time in ISO 8601 format>'
completedAt: null
labels: ['<story | polish | idea | blocker | defect>']
attachments: []
order: 'a0'
metadata:
  feature: '<active-feature-id>'
---

# <Story Title>

## Goal

<One to three sentences describing the desired outcome. No implementation details.>

## Notes

<Any rough ideas or constraints the user mentioned, prior-attempt notes, and suggested follow-up stories. Leave blank if none.>

## Research

Researched <YYYY-MM-DD> at `<short commit hash from git rev-parse --short HEAD>`.

<Facts only. Group by area. For each: the exact file paths (and functions/sections) involved, how it works today, and the conventions or constraints an implementation must respect. Name comparable existing features worth copying from. Note schema/migration impact if any data file is affected.>

## Open Questions

1. **<Short decision title>** — <The decision to be made, in one sentence.>
   - _Context:_ <the research facts that bear on it>
   - _Options:_ <each viable option with its trade-off, neutrally; flag convention matches as facts, not recommendations>
2. ...
```

Order the questions so earlier answers unblock later ones — scope and user-facing behavior first, data shapes and edge cases after. Each question must be answerable by the user without re-reading the code; that is what the Context line is for.

The research stamp (date + commit) is what lets `groom-story` judge whether the research is still current when the card is groomed weeks later.

**Stub cards** stop after `## Notes` — omit `## Research` and `## Open Questions` entirely, headings included. Build the card from the user's original prompt only:

- **Title**: a short name for the idea, taken from the prompt's own wording.
- **Goal**: the prompt itself, reshaped into the Goal format — one to three sentences stating the desired outcome, in the third person. Fix grammar, drop conversational framing ("can you make a story for…", "save as a stub"), and split a run-on into sentences, but keep the user's words and scope: add no detail, assumption, or file reference the prompt did not contain, and drop none it did. Implementation detail the user wrote into the prompt moves to `## Notes` verbatim rather than being discarded.
- **Notes**: only implementation detail moved out of the prompt, plus a prior-attempt note from step 3 if the user proceeded past an abandoned match. Otherwise leave it blank.

**Feature linking:** include the `metadata` block **only** when the card is written to `planned` _and_ an active feature was resolved in step 4. Omit the entire `metadata` key otherwise — a backlog card is unaffiliated until a feature adopts it.

8. **Run Prettier.** Run `npx prettier . --write` to format the new card.

9. **Confirm.** Tell the user the card was created, linking it as `[<slug>](.kanban/boards/features/<lane>/<slug>.md)`, note the feature link if one was applied, and suggest running `/groom-story <slug>.md` when they are ready to develop a full spec.

## Rules

- Do **not** write a `**Priority:**` line in the markdown body — priority lives in YAML frontmatter only.
- Every card must carry exactly one category label in `labels`. The registry lives in `.kanban.json`; do not invent new category names. Never assign `feature` — that label belongs to feature cards only.
- Use `metadata.feature`, never a bare top-level `feature:` field. Kanban Lite strips unknown top-level frontmatter keys when the board rewrites a card.
- Do **not** write tasks, phases, implementation details, or technical specs into the card — that is the job of `groom-story`. Research findings (how the code works today) are allowed; decisions about how it should change are not.
- In stub mode, do **not** read code or docs to enrich the card — the stub records what the user said, nothing more.
- Do **not** answer, recommend, or pre-select an option on any Open Question. A question with a chosen answer is an assumption the user never got to veto.
- Do **not** ask the user questions during the research step — the decisions are collected for grooming, not settled here.
- Do **not** create a backlog card for an idea that should go straight to grooming. If the user has a well-formed spec already in hand, tell them to use `groom-story` directly.
- Do **not** modify any code.
