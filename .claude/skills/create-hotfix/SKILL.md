---
name: create-hotfix
description: High-urgency spec creation that skips the back-and-forth Q&A of groom-feature. The user dumps everything they know in one go (ending with "that is all"), then the skill investigates the codebase, fills in missing details, and produces an editable outline. After user approval, it writes a fully groomed feature doc directly into .kanban/boards/features/ with status "in-progress" and prompts the user to begin implementation immediately. USE FOR: urgent fixes or features that need to move from idea to in-progress spec in one session; situations where the user already knows most of what needs to be done and wants to skip the dialogue step.
---

# Create Hotfix

You are creating an urgent, production-ready feature spec in a single session. There is no back-and-forth discovery phase — the user will front-load their full description, you will investigate the codebase, fill in the gaps, and together you will converge on an approved outline before writing the final spec.

## Phase 1 — Intake

Open with a single prompt that sets urgency expectations:

> **Hotfix intake open.** Describe everything that needs to be done — requirements, constraints, affected areas, any implementation notes you already have. When you are done, end your message with **"that is all"**.

Then wait. Do **not** ask any clarifying questions yet. The user may send multiple messages before saying "that is all". Accumulate all of their input as the working brief.

After the user's **first message** (if it does not already contain "that is all"), acknowledge receipt and remind them:

> Got it — keep going. When you have described everything, end your message with **"that is all"**.

Continue accumulating input until the user says "that is all" (case-insensitive, anywhere in their message), then immediately proceed to Phase 2.

## Phase 2 — Codebase Investigation

Before producing the outline, silently investigate every area the user mentioned. For each relevant piece:

- Locate the relevant source files using Glob and Grep.
- Read the key sections of those files to understand current behavior, data shapes, and integration points.
- Note any constraints, patterns, or conventions that will affect implementation (e.g., existing component structure, API conventions, data schema).
- If the work rebuilds or touches something from the old DM tools, read the old implementation in `reference/pf2e-remaster-dm-tools/` (and the campaign data in `reference/pf2e-drakonis-data/`) to recover behavior and data shapes. See `.claude/rules/planning.md`.
- Identify anything the user did **not** specify that is needed to implement the feature (missing data shapes, unclear edge cases, undecided UI behavior, etc.).

Make a best-guess decision for every unspecified detail based on the existing codebase conventions. Do not ask the user about these — record your assumptions and surface them in the outline.

## Phase 3 — Preliminary Outline

Present the outline as a structured but informal list — not the full feature doc format yet. It must cover:

1. **Goal** — one or two sentences restating the desired outcome in your own words (verify the user agrees with the framing).
2. **Scope** — bullet list of what is in scope and, if helpful, what is explicitly out of scope.
3. **Work items** — a flat or loosely grouped list of the concrete things that need to happen (not individual tasks, but logical chunks of work). Each item should be short (one sentence) but unambiguous.
4. **Your assumptions** — a clearly labelled section listing every detail you filled in that the user did not specify. For each assumption, state what you decided and why (e.g., convention match, simplicity, existing pattern). This section must be present even if minimal.
5. **Open questions** — if anything truly cannot be resolved from the codebase or convention, list it here. Keep this short; prefer assumptions over questions.

Format the outline with plain markdown — no feature doc headers, no checkbox task lists, no phase headings. Keep it scannable. The user should be able to read the whole outline in under two minutes.

End the outline with:

> Review the outline above. Reply with any changes you want (I'll update it), or say **"approved"** to generate the final spec.

## Phase 4 — Revision Loop

Each time the user requests a change:
1. Acknowledge the change in one sentence.
2. Print only the updated item(s) — do **not** reprint the full outline. Label each with its number and title so the user can locate it.
3. End again with the same approval prompt.

If the user explicitly asks to see the full outline reprinted, do so in full. Otherwise, keep responses to only the changed items.

Repeat until the user says "approved" (case-insensitive).

## Phase 5 — Feature Doc Generation

Convert the approved outline into a feature document at the same quality and format as a groomed spec:

### Output file structure

The file is written with YAML frontmatter followed by the markdown body:

```markdown
---
version: 1
id: "<slug>"
boardId: "features"
status: "in-progress"
priority: "critical"
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

<Concise description of the desired outcome. No implementation steps.>

## Tasks

### Phase 1 — <Short milestone description>
- [ ] Task description

### Phase 2 — <Short milestone description>
- [ ] Task description

(omit phases for maintenance/server-only features — use flat task list instead)

## Implementation Details

<Code snippets, data shapes, class definitions, constraints, and design decisions. This section provides context but does not dictate step-by-step instructions unless a critical restriction applies.>
```

### Task list standards

Apply all standards from `groom-feature`:

- Each task focuses on a single outcome that can be verified — either by automated tests or a brief observable check. Bundle non-independently-verifiable work with adjacent tasks.
- If a bundled task is too large to describe in one sentence, use a nested subtask list (no checkboxes on subtasks).
- Phases end at a user-visible or testable milestone. Maintenance and server-only features use a flat list.
- Leave all task checkboxes unchecked.
- Capture every assumption from the outline in the Implementation Details section.

### Docs-review task (always append)

Always append as the final task:

```
- [ ] Review and update affected living docs: <comma-separated list>
```

Mapping feature scope to affected docs:

| Feature touches… | Likely affected docs |
|---|---|
| Planning workflow, card format, skills | `.claude/rules/planning.md` |
| A named app area (document view, columns, rules, creatures, combat, campaign data, audio/media, …) | `docs/features/<area>.md` |
| Any other topic already covered by a file in `docs/` or `.claude/rules/` | that file |

This project's living docs are still being written. Glob `docs/**/*.md` and `.claude/rules/*.md` to see what exists, and when a feature adds a new living doc, add a row for it to this table (in both `groom-feature` and `create-hotfix`) and to the table in `update-docs`.

If the feature touches a named app area and that area's `docs/features/<area>.md` does not exist, prepend a task to create it before the docs-review task.

### Writing the file

1. Derive a kebab-case slug from the feature title.
2. Write the spec to `.kanban/boards/features/in-progress/<slug>.md` using the Write tool.

### Final message

After writing the file, send exactly:

> Spec written to `.kanban/boards/features/in-progress/<slug>.md`. Run `/implement-feature <slug>.md` to begin work immediately.

## Rules

- Do **not** modify any source code.
- Do **not** ask questions during Phase 1 — wait for "that is all".
- Do **not** ask questions during Phase 2 — investigate and assume.
- Do **not** skip the assumptions section in the outline — even if you are highly confident, name every decision the user did not make.
- Do **not** write the card anywhere but `.kanban/boards/features/in-progress/` — all active cards live in `.kanban/boards/features/`; `project-management/` holds only the archive.
- Do **not** invoke `implement-feature` automatically — the user must run it manually.
