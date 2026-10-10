## Project Context

GMTools-PF2E rebuilds Alex's Pathfinder 2e (Remaster) DM tools around a **document-first, flexible-columns UI**: the GM reads a campaign document, and links inside it dynamically open related resources (rules, creatures, items, NPCs, images, audio, maps, notes) in adjacent columns.

Two repositories are the feature references for everything being rebuilt:

| Reference | What it holds |
|---|---|
| `AlexSzeto/pf2e-remaster-dm-tools` | The previous DM tools app: DM screen, documents, reference cards, rules search, initiative tracker, treasure/budget tracking, audio, images, maps, creature creator, name generator, card printer, player screen. |
| `AlexSzeto/pf2e-drakonis-data` | Campaign data the old app consumed (campaign folders with `docs/`, `images/`, `audio/`, `maps/`, `files/`, `card-illustrations/`). |

When a feature rebuilds something that existed before, read the old implementation and data shape before speccing or building it. Keep local clones of the references under `reference/` (gitignored), e.g. `reference/pf2e-remaster-dm-tools/` and `reference/pf2e-drakonis-data/`; clone them there if they are missing. Treat them as references for **behavior and data**, not as code to copy: the new app has its own architecture.

## Project Management Structure

All project planning lives in a single Kanban Lite board directory, organized into status subdirectories:

- `.kanban/boards/features/backlog/` — freeform ideas captured quickly, not yet fully specified (default destination for `create-feature`)
- `.kanban/boards/features/planned/` — functionally identical to `backlog/`; used for user-driven organization on the kanban board. Cards move between Backlog and Planned manually. Skills treat both as equivalent pre-grooming stages.
- `.kanban/boards/features/groomed/` — fully specified features ready to pull into development
- `.kanban/boards/features/in-progress/` — features currently being implemented
- `.kanban/boards/features/abandoned/` — features shelved at any stage of the lifecycle

Each card is a markdown file with YAML frontmatter. The `status` field in the frontmatter mirrors the subdirectory name.

Completed features are archived to `project-management/archived/` as plain markdown (no frontmatter), prefixed with a sequential number (e.g. `12-rules-link-column.md`).

All card filenames use kebab-case slugs. No sequential numbering in the active board.

The board configuration lives at `.kanban.json` at the repo root. Run the board UI with `kanban-lite serve --no-browser`.

### Moving cards

Never move, copy, or delete card files by hand. Use the scripts, which keep frontmatter (`status`, `modified`, `order`) and attachments in sync:

```
node scripts/move-feature.mjs <filename> <from-lane> <to-lane> [--rename <new-filename>]
node scripts/archive-feature.mjs <filename>
```

## Skill Lifecycle

```
create-feature → groom-feature → implement-feature → archive-feature
```

| Skill | Purpose |
|---|---|
| `create-feature` | Capture a freeform idea as a card with `status: "backlog"`. Checks for conflicts with existing backlog, planned, and groomed cards. |
| `groom-feature` | Develop a full spec from a `backlog` or `planned` card (or scratch) via Q&A. Moves the card to `groomed/` or `in-progress/`. |
| `create-hotfix` | Skip the Q&A: take a full brain-dump, investigate, and write an `in-progress` spec in one session. |
| `implement-feature` | Execute tasks from an `in-progress` card phase by phase. Accepts an explicit filename. |
| `archive-feature` | Strip frontmatter and archive a completed `in-progress` card to `project-management/archived/`. |
| `review-features` | List backlog, planned, and groomed cards as tables. |
| `stage-and-commit` | Commit changes, deriving the message from `[/]` tasks, then mark them `[x]`. |

## Feature Card Format

Every card in `.kanban/boards/features/` begins with YAML frontmatter:

```markdown
---
version: 1
id: "<slug>"
boardId: "features"
status: "backlog|planned|groomed|in-progress|abandoned"
priority: "critical|high|medium|low"
assignee: null
dueDate: null
created: "<ISO 8601 UTC timestamp>"
modified: "<ISO 8601 UTC timestamp>"
completedAt: null
labels: []
attachments: []
order: "a0"
---
# Feature Title

## Goal

Concise description of the desired outcome. No implementation steps.
```

`critical` is reserved for hotfixes (`create-hotfix`). Backlog and planned cards additionally have a `## Notes` section. Groomed and in-progress cards have `## Tasks` and `## Implementation Details` sections.

The `priority` field lives in YAML frontmatter only — never as a `**Priority:**` line in the markdown body.

### Groomed / In-progress body structure

```markdown
# Feature Title

## Goal

Concise description of the desired outcome. No implementation steps.

## Tasks

### Phase 1 — <Short milestone description>
- [ ] Task description

### Phase 2 — <Short milestone description>
- [ ] Task description

## Implementation Details

Code snippets, data shapes, constraints, and design decisions.
```

- **Title**: `# Feature Title`
- **Goal**: Concise outcome description. No implementation details.
- **Tasks**: Under `## Tasks`. Each task has a single, verifiable outcome. Tasks that are not independently verifiable are bundled with adjacent tasks. If a bundled task is too large for one sentence, use a nested subtask list (no checkboxes on subtasks).
- **Task markers**: `[ ]` not started, `[/]` in progress, `[x]` done. Only `stage-and-commit` turns `[/]` into `[x]`, after a commit lands.
- **Phases**: Tasks grouped under `### Phase N — <description>` headings. Each phase ends at a user-visible or testable milestone. Maintenance and server-only features may use a flat task list.
- **Implementation Details**: Code snippets, data formats, class definitions, and constraints. Provides context but does not dictate step-by-step instructions unless a critical restriction applies. When a feature rebuilds something from `pf2e-remaster-dm-tools`, name the reference files it is based on here.

## Ad-hoc Changes During Implementation

If a change request arrives while `implement-feature` is running, the change must be written as an unchecked task under a `#### Fixes and Changes` subheader at the end of the current phase before any code is touched.
