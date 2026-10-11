---
version: 1
id: 'workspace-shell'
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
order: 'a0'
---

# Workspace Shell

## Goal

Opening GMTools shows the confirmed layout for the campaign named in GM data: a top menu (same as the old pf2e tools), then a file browser, a resizable document column and further resource columns, then a footer for word count and notifications. Floating panels and full-sized non-document panels open from the menu, and the open layout is restored after a reload.

## Stories

## Tickets

## Notes

- Release 1, feature 1 of 4. Release 1 is approved; later releases are tentative and re-evaluated once it ships.
- Express server and Preact/htm client, with the AnyTale custom-ui library vendored in. Codeberg is blocked from cloud sessions, so AnyTale arrives as a zip upload and is unpacked under `reference/` (gitignored).
- GM data lives server side as a JSON file. Until campaign switching ships, it names the campaign folder to load. Campaign folders are read in place in the `pf2e-drakonis-data` layout (`docs/`, `images/`, `audio/`, `maps/`, `files/`, `card-illustrations/`, `data.json`).
- The shell builds the shared interaction model so later features only add panels and actions:
  - Floating panels open as an overlay dismissed by a click outside, unless pinned; a pinned panel stays floating and can be minimized.
  - Left-clicking a link views its target; right-clicking lists its actions, and each action opens a floating panel.
- The columns layout is app-ui only, built for GMTools-PF2E, not a custom-ui component.
- The file browser only lists files here. Categories and favorites arrive with `document-types-and-links`.
- Session restore replaces the old `/dm/session` open-docs persistence.
