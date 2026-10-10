# Abandoned Work

One line per abandoned story or ticket. This is an index, not a record — the full
reasoning lives in the card's `## Abandoned <date>` section, in
`.kanban/boards/features/abandoned/` while the card is still on the board and in
git history after it is pruned.

**Only failed or ruled-out work belongs here.** Work that was abandoned because
it shipped some other way is _not_ recorded — the index exists to warn against
paths already tried and found wanting, and a "we did it elsewhere" entry carries
no such warning while adding noise to every scan.

**An entry that a new implementation contradicts must be amended or removed.**
When a card covering indexed ground is given an explicit go-ahead, the entry it
matched is no longer true — leaving it in place would warn the next person away
from something the codebase now does. Amend it to reflect the narrowed reason, or
delete it outright if the go-ahead invalidates it entirely.

**This file is advisory.** It exists so that a new card covering old ground
surfaces the prior attempt and its reasoning _before_ the work is written, not so
that topics can be banned. A match here is a prompt to read the card and confirm
with the user — never grounds to refuse. Prior work being abandoned says
something about the state of the codebase when it was tried, which may no longer
hold.

Written by `/abandon-story`. Read by `create-story`, `create-ticket`,
`create-feature`, and `groom-story`.

## Format

```
- **<slug>** — <what it was>. `<reason-class>`: <the wall>. Reconsider if <condition>.
```

| Reason class          | Means                                        |
| --------------------- | -------------------------------------------- |
| `wrong-layer`         | Not solvable where it was scoped             |
| `not-worth-it`        | Solvable; value below cost                   |
| `obsolete`            | The thing it targeted no longer exists       |
| `failed-attempt`      | Tried, reverted, root cause understood       |
| `reason-not-recorded` | Abandoned before this index existed; unknown |

## Index
