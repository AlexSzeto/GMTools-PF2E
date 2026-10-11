---
version: 1
id: 'markdown-documents'
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
order: 'a1'
---

# Markdown Documents

## Goal

Campaign documents open fully formatted in the document column. The GM can edit the whole document as markdown, or edit a single snippet as markdown while the rest stays formatted. New documents can be created, edits autosave, and the footer shows the word count.

## Stories

## Tickets

## Notes

- Release 1, feature 2 of 4.
- A snippet is a block separated by two newlines (one blank line). A code fence containing blank lines stays one snippet, because campaign docs use fences for read-aloud text.
- Existing docs in `docs/` open unchanged, including relative image links.
- Autosave replaces the old two-second debounce; save notices appear in the footer notifications.
- The old Ace editor plus marked setup (`src/static/js/components/md-doc.js` in pf2e-remaster-dm-tools) is a reference only. The editor and markdown renderer are chosen at grooming, informed by custom-ui's Markdown support.
- Leaves room for the right-click menu that helpers and links use in the next two features.
