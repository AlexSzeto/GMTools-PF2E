---
name: archive-feature
description: Archives a completed in-progress feature card to project-management/archived/. USE FOR: after all tasks in an in-progress card are checked off; closing out a completed feature before starting the next one.
---

# Archive Feature

Move a completed feature card from `.kanban/boards/features/` to `project-management/archived/`.

## Invocation

The user must provide an explicit filename. If no filename is given, Glob `.kanban/boards/features/in-progress/*.md` and list those files for the user to choose one.

## Steps

1. **Read the card.** Verify it exists at `.kanban/boards/features/in-progress/<filename>.md`. If not found, tell the user and stop.

2. **Check for incomplete tasks.** If any tasks remain unchecked, surface them and ask the user how to proceed before continuing:
   - **Complete them now** — implement the remaining tasks, then return to this step.
   - **Drop them** — remove them from the file before archiving.
   - **Move them** — create or append to a new card for a follow-on feature.

3. **Run the archive script.** Execute:
   ```
   node scripts/archive-feature.mjs <filename>
   ```
   This script validates the `in-progress` status, strips the YAML frontmatter, writes the plain markdown to `project-management/archived/<number>-<filename>`, and deletes the card from `.kanban/boards/features/`.

4. **Confirm.** Report the archive number and filename printed by the script.
