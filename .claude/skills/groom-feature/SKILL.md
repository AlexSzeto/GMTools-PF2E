---
name: groom-feature
description: Develops a thorough, developer-ready feature spec through interactive Q&A, then writes it to .kanban/boards/features/ with status "groomed" or "in-progress". USE FOR: turning a planned idea into a full spec; grooming an existing planned card; starting implementation planning for a well-understood feature.
---

# Groom Feature

You are developing a full feature specification through iterative dialogue, one question at a time. The end goal is a detailed spec that can be handed off to any developer or agent without ambiguity.

## Inputs

The skill may be invoked with:
- **A filename from `.kanban/boards/features/backlog/` or `.kanban/boards/features/planned/`** — read that file first and use its goal/notes as the starting context. Check `backlog/` first, then `planned/` if not found there.
- **A free-form description** — treat it as the seed and begin questioning from there.
- **No argument** — Glob both `.kanban/boards/features/backlog/*.md` and `.kanban/boards/features/planned/*.md`, read frontmatter from all files, and present a numbered list sorted by `priority` (high → medium → low → unknown) before asking the user which feature to groom:

```
High priority:
  1. Feature Name — one-sentence goal
  2. Feature Name — one-sentence goal

Medium priority:
  3. Feature Name — one-sentence goal

Low priority:
  4. Feature Name — one-sentence goal

(unset)
  5. Feature Name — one-sentence goal
```

Ask: *"Which feature would you like to groom? Enter a number, or describe a new feature from scratch."* If the user picks a number, load that file and proceed as if it was passed as an argument. If the user describes a new feature, treat it as a free-form description and do **not** use any existing card.

If a source card was used, read it before asking the first question.

## Questioning process

- Ask **one question at a time**. Each question should build on the previous answer and dig into a relevant detail.
- Cover: user-facing behavior, edge cases, data shapes, dependencies on existing features, constraints, and anything that would block a developer from starting.
- **Investigate before asking**: When you are unsure how an existing feature is implemented, search the source code and report your findings to the user instead of asking them. Reserve questions for decisions and intent that cannot be determined from code alone.
- **Check the old DM tools**: When the feature rebuilds something from `pf2e-remaster-dm-tools`, read the old implementation (and the matching campaign data in `pf2e-drakonis-data`) under `reference/` before the first question, summarize what it did, and ask only about what should change in the new document-first, column-based UI. See `.claude/rules/planning.md` for where the references live.
- If a new sub-feature surfaces that is clearly out of scope, do **not** spec it here. Tell the user: *"That sounds like a separate feature — run `/create-feature` to capture it, then we can groom it independently."*
- Continue until you are confident the spec is thorough enough to hand off.

## Finalizing the spec

When the Q&A is complete, generate a structured summary before writing any file. If an open question surfaces while drafting the summary, do **not** include it — return to the questioning phase, resolve it, then re-attempt the summary.

Present the summary in this format:

1. **Goal** — one or two sentences restating the desired outcome in your own words.
2. **Scope** — bullet list of what is in scope and, if helpful, what is explicitly out of scope.
3. **Work** — the planned tasks grouped by phase. Each phase gets a short milestone label and a flat bullet list of the concrete work items in that phase. Use plain sentences, not checkboxes. Maintenance or server-only features with no phases use a single flat list under a **Work** heading.
4. **Assumptions** — every detail you filled in that the user did not specify. For each, state what you decided and why (convention match, simplicity, existing pattern). This section must be present even if minimal.

End the summary with:

> Does this look right? Reply with any changes, or say **"approved"** to save the spec.

Each time the user requests a change, acknowledge it in one sentence, show only the updated item(s), and repeat the approval prompt. Reprint the full summary only if the user asks. Repeat until the user says "approved" (case-insensitive).

On approval, ask: **"Save to `groomed` for later, or start implementing now (`in-progress`)?"**

### Option A — Save as groomed

1. Derive a kebab-case slug from the feature name.
2. Write the new file to `.kanban/boards/features/groomed/<slug>.md` with the full frontmatter (`version: 1`, `boardId: "features"`, `status: "groomed"`, `priority` preserved from source (or `medium` if none), `assignee: null`, `dueDate: null`, current `modified` timestamp, `completedAt: null`, `labels: []`, `attachments: []`, `order: "a0"`) and the spec body.
3. If a source card existed (from `backlog/` or `planned/`): run `node scripts/move-feature.mjs <source-filename> <source-lane> groomed` to remove the source file and move its attachment. (The destination was already written in step 2, so the script will only delete the source.)
4. Tell the user to run `/implement-feature <slug>.md` when ready to begin.

### Option B — Start now (in-progress)

1. Derive a kebab-case slug from the feature name.
2. Write the new file to `.kanban/boards/features/in-progress/<slug>.md` with `status: "in-progress"` and all required frontmatter fields.
3. If a source card existed (from `backlog/` or `planned/`): run `node scripts/move-feature.mjs <source-filename> <source-lane> in-progress` to remove the source file and move its attachment. (The destination was already written in step 2, so the script will only delete the source.)
4. Invoke the `implement-feature` skill with `<slug>.md` as the argument — do not just tell the user to run it manually.

Status transitions move the file to the appropriate status subdirectory. Always use `node scripts/move-feature.mjs <filename> <from-lane> <to-lane>` for any file move — never use direct file copy/move/delete commands.

## Output file structure

The markdown body (everything after the YAML frontmatter block) must follow this format:

```markdown
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

<Code snippets, data shapes, class definitions, constraints, and design decisions captured during grooming. This section provides context but does not dictate step-by-step instructions unless a critical restriction applies.>
```

Do **not** include a `**Priority:**` line in the body — priority lives in YAML frontmatter only.

## Task List Standards

- Each task focuses on a single outcome that can be verified — either by automated tests or a brief observable check (e.g. what to open or curl). If a piece of work is not independently verifiable, bundle it with the adjacent task(s) that complete the testable unit.
- If a bundled task becomes too large to describe in one sentence, break it into subtasks using a nested list (no checkboxes needed on subtasks — they are implementation notes, not tracked items).
- Phases end at a user-visible or testable milestone. Maintenance and server-only features may use a single flat list.
- Every answer from the Q&A that affects implementation must be captured somewhere in the spec — no context should be lost between sessions.
- Leave all task checkboxes unchecked.
- **Always append a docs-review task** as the final task of the last phase (or flat list). See below.

### Subagent-ready task standards

Each phase will be handed off to a cold subagent with no memory of prior phases or the grooming dialogue. Every task must be self-contained enough for that agent to implement correctly without asking questions:

- **File references**: Name the exact file path and, where relevant, the specific function, class, or render section to change (e.g. "in `document-view.mjs`, inside the `renderLink()` helper"). Never assume the implementer knows the codebase layout.
- **API ownership**: When two components share a boundary, state explicitly which side owns each behavior (e.g. "the document view parses resource links and emits `onOpenResource`; the column layout decides where the new column opens — the document view does not manage columns itself").
- **Term definitions**: Any domain-specific term used in a task (e.g. "resource link", "pinned column", "stat block") must be defined in the Implementation Details section. Never use project jargon in a task without a corresponding definition there.
- **Multi-file tasks**: If a task touches more than one file, list every affected file explicitly — never write "and related files" or "all callers".
- **Review/update tasks**: Tasks that say "review and update" a doc must name the specific sections to change and state what constitutes done (e.g. "add an `onOpenResource` row to the DocumentView props table; remove the retired `pinned` prop row").
- **Breaking changes**: If a task removes or renames a public prop or exported function, state the old name, the new name or replacement, and list every caller file that needs updating.
- **Test tasks**: Specify what to assert, not just "add a test" (e.g. "assert that clicking a creature link opens one creature column, and clicking it again focuses that column instead of opening a duplicate").

## Docs-Review Task (always append)

Every generated task list must end with a docs-review task. Infer which living docs are likely affected from the feature spec content, and name them explicitly in the task description:

```
- [ ] Review and update affected living docs: <comma-separated list of likely affected docs>
```

**Mapping feature scope → affected docs:**

| Feature touches… | Likely affected docs |
|---|---|
| Planning workflow, card format, skills | `.claude/rules/planning.md` |
| A named app area (document view, columns, rules, creatures, combat, campaign data, audio/media, …) | `docs/features/<area>.md` |
| Any other topic already covered by a file in `docs/` or `.claude/rules/` | that file |

This project's living docs are still being written. Glob `docs/**/*.md` and `.claude/rules/*.md` to see what exists, and when a feature adds a new living doc, add a row for it to this table (in both `groom-feature` and `create-hotfix`) and to the table in `update-docs`.

A feature may affect multiple docs — list all that apply. When in doubt, err toward listing more rather than fewer.

**Feature doc creation:** If the feature touches a named app area and that area's `docs/features/<area>.md` file does not yet exist, prepend a task before the docs-review task to create it:

```
- [ ] Create `docs/features/<area>.md` documenting the user flow, component interactions, server endpoints, and key data shapes for the <area> feature area
```

## Rules

- Do **not** modify any code.
- Do **not** skip the conflict check when starting from scratch (no source file): briefly scan `.kanban/boards/features/backlog/`, `.kanban/boards/features/planned/`, and `.kanban/boards/features/groomed/` for cards that cover similar ground before the first question.
