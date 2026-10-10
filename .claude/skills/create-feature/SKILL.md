---
name: create-feature
description: Captures a freeform feature idea as a card in .kanban/boards/features/ with status "backlog". Checks for conflicts with existing backlog, planned, and groomed cards before writing. USE FOR: capturing a new idea quickly; breaking down a brainstorm document into individual feature files; preserving an idea that surfaced during grooming of another feature.
---

# Create Feature

You are capturing a feature idea into `.kanban/boards/features/`. This is a low-ceremony step — the goal is to get the idea recorded, not to fully specify it. Full grooming happens later via `groom-feature`.

## Steps

1. **Collect the idea.** If the user has not already described the feature, ask for a one-sentence description of what they want to build.

2. **Check for conflicts.** Glob `.kanban/boards/features/backlog/*.md`, `.kanban/boards/features/planned/*.md`, and `.kanban/boards/features/groomed/*.md` and read the YAML frontmatter + `## Goal` section of each file. If any existing card covers the same or overlapping ground:
   - Present the conflicting file(s) by name and goal.
   - Ask the user: merge into the existing file, or create a new one anyway?
   - If merging: append the new idea to the existing file under a clearly labelled section, then stop.

3. **Assign priority.** Ask the user: *"What priority is this feature — high, medium, or low?"* Wait for their answer before writing the file.

4. **Write the card.** If creating a new file:
   - Derive a kebab-case slug from the feature name (e.g. `creature-link-column`).
   - Write to `.kanban/boards/features/backlog/<slug>.md` with YAML frontmatter followed by the markdown body:

```markdown
---
version: 1
id: "<slug>"
boardId: "features"
status: "backlog"
priority: "<high | medium | low>"
assignee: null
dueDate: null
created: "<current UTC time in ISO 8601 format>"
modified: "<current UTC time in ISO 8601 format>"
completedAt: null
labels: []
attachments: []
order: "a0"
---
# <Feature Title>

## Goal

<One to three sentences describing the desired outcome. No implementation details.>

## Notes

<Any rough ideas, constraints, or open questions the user mentioned. Leave blank if none.>
```

   If the idea rebuilds something from the old DM tools (`pf2e-remaster-dm-tools`), note which old feature it replaces in `## Notes` (e.g. "Replaces the initiative tracker on the old DM screen") so grooming knows where to look. Do not research the reference code at this stage.

5. **Confirm.** Tell the user the card was created at `.kanban/boards/features/backlog/<slug>.md` and suggest running `/groom-feature <slug>.md` when they are ready to develop a full spec.

## Rules

- Do **not** write a `**Priority:**` line in the markdown body — priority lives in YAML frontmatter only.
- Do **not** write tasks, implementation details, or technical specs into a `backlog` card — that is the job of `groom-feature`.
- Do **not** create a backlog card for an idea that should go straight to grooming. If the user has a well-formed spec already in hand, tell them to use `groom-feature` directly.
- Do **not** modify any code.
