---
name: sync-skills
description: "Keep project-local skills for other agents synchronized from this repository's .claude skills. Use when .claude/skills changes, when Codex skills are stale, or when preparing this project so Codex can use the same project workflow skills as Claude."
---

# Sync Skills

Treat `.claude/skills` and `.claude/rules` as the canonical sources for project workflow instructions.

Run:

```bash
node scripts/sync-codex-skills.mjs
```

This regenerates `.codex/skills`, `.agents/skills`, `.codex/rules`, and `.agents/rules` from `.claude/skills` and `.claude/rules` by deleting the project-local mirrors and copying the Claude sources into them. Both mirrors are gitignored, so they are local to each checkout.

The `sync-skills` skill itself is excluded from the sync — it is Claude-only and should not appear in `.agents/skills` or `.codex/skills`.

After syncing, run `git status --short` to confirm nothing outside the mirrors changed.
