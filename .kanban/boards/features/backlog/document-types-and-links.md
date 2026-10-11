---
version: 1
id: 'document-types-and-links'
boardId: 'features'
status: 'backlog'
priority: 'high'
assignee: null
dueDate: null
created: '2026-10-11T01:36:00Z'
modified: '2026-10-11T01:36:00Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'a3'
---

# Document Types and Links

## Goal

Every document has a type such as character, location, faction or session. The file browser groups documents by type and keeps favorites at the top. Left-clicking a document link opens it in an adjacent column, and right-clicking lists its actions. Typed documents get a formatted preview as a floating panel. A floating relationship search panel finds related documents and adds links to them, and a helper detects names of known characters, locations and so on and links them.

## Stories

## Tickets

## Notes

- Release 1, feature 4 of 4.
- Favorites replace the old pinning (docs, cards, rules, images) and are stored in GM data.
- Existing docs have no type and land in an Uncategorized group until set. The old `data.json` docs list (label, path, tags) can seed the first pass.
- Grooming decisions: how a type is stored (front matter vs. folder per type) and the link syntax (markdown links vs. `[[name]]` style).
- Each type's preview panel shows that type's key fields (for example a character's role and faction, a location's region); fields per type are decided at grooming.
- The name-linking helper reuses the helper framework from `text-generation-helpers`, and suggests links for the GM to confirm rather than editing silently, because common words can match names.
