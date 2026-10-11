---
version: 1
id: 'text-generation-helpers'
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
order: 'a2'
---

# Text Generation Helpers

## Goal

While writing a document, the GM calls up a helper with a shortcut key combo or by right-clicking. Name helpers generate different types of names (people, places, taverns, factions, items and so on) from a short prompt, and the chosen name is inserted at the cursor.

## Stories

## Tickets

## Notes

- Release 1, feature 3 of 4. Names only: description helpers (rooms, NPC appearance, read-aloud text) were moved to a later feature by Alex on 2026-10-11.
- Replaces the old name generator page (`src/static/js/name-generator.js`), which asked a local Ollama (llama3.2) for 10 names as JSON with a meaning and short description each, and retried up to twice on malformed output.
- Calls go through the server instead of the browser hitting Ollama directly.
- Prompts include the campaign's name and description so results fit the setting.
- Builds the helper framework (trigger, menu, insert at cursor) that the name-linking helper in `document-types-and-links` reuses.
- The LLM backend is a grooming decision: local Ollama as before, or AnyTale's LLM endpoint.
