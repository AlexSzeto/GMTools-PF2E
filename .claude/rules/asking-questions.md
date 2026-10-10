## Asking the User a Decision

Whenever a skill or a task needs the user to choose — a grooming question, a priority, a lane, a yes/no gate, how to handle an unfinished card — ask it through the **`AskUserQuestion` decision UI**. Not a lettered list (`(a)`, `(b)`), not a numbered list, and not prose with a "Recommendation" paragraph at the end. Those three formats have all been used for the same kind of question, and the UI is the one that lets the user answer in a click.

### Shape of the question

- **The recommended option comes first, and its label ends in `(Recommended)`.** Every decision carries a recommendation — that is the point of asking an agent that has read the code. Put the reasoning for it in that option's `description`, and each alternative's trade-off in its own `description`.
- **Context goes in the turn's text, the decision goes in the UI.** Research findings, a draft summary, a diff, or a list of affected cards is written out as normal message text immediately before the `AskUserQuestion` call; the question and its options stay short enough to read at a glance.
- **2–4 options, mutually exclusive.** Never add an "Other" option — the UI supplies a free-text one, which is how the user answers anything the options do not cover.
- **One question per call where a skill says "one question at a time"** (`groom-story`, `groom-feature`, `abandon-story`). Where a skill asks several independent things in one message (`create-story`'s priority / category / lane), send them as separate questions in a single call.
- **A quoted prompt in a skill is the question's wording, not its format.** `> Ready to commit? (yes / no)`, `(yes / groom first)`, `Apply this edit? (yes / no / modify)`, and `groom-story`'s `say "approved"` become a question whose options are those answers — the recommended one first.

### When to stay in a normal conversation turn

Drop to a plain question, with no options, only when **the answer has to be written** rather than picked:

- open-ended intent or explanation — `groom-feature`'s "what should a user be able to do when this merges", `abandon-story`'s "what ruled it out";
- content the user authors — a commit message (`stage-and-commit`'s fallback D), wording for a card, a name;
- a question where any honest option list would be a guess at what they might say.

If the likely answers can be enumerated and the user may occasionally want to write something else, it is still a decision — use the UI and let its free-text option catch the rest.

### Offering the next step

When a skill or task ends by pointing at a follow-up, such as "Run `/implement-story <slug>.md` to begin", "suggest running `/groom-story`", or "offer to run `/stage-and-commit` first", **offer that follow-up as an `AskUserQuestion` decision, not as a sentence**. The harness can reformat a slash command in prose as a console command, which can't be acted on. Picking an option in the decision UI can be acted on: the choice is the user's confirmation, and the agent then invokes the chosen skill itself through the `Skill` tool, with the same arguments the sentence would have named.

- **The skill's suggested follow-up is the recommended option**, first, labelled with what it does and the command it runs (e.g. `Implement now: /implement-story creature-link-column.md (Recommended)`).
- **Add the realistic alternatives**, with at most 4 options in total, such as another skill that commonly comes next (`/stage-and-commit`, `/groom-story`) or a **Stop here** option that ends the turn with nothing run.
- **A skill's "tell the user to run `/x`" line is the option, not the format**, just as a quoted prompt is the question's wording.
- **Nothing runs without the pick.** Never invoke the follow-up first and ask afterwards, and never treat the suggestion itself as approval.
- **Where there is no follow-up to offer**, as when a skill stops because there is nothing to do and names no command, end in prose as usual.

Out-of-scope work spotted along the way stays a background-task chip (`spawn_task`) or a `/create-story` suggestion, not a next-step option. The decision UI is for what comes next in this session.

### Not affected

- `create-story`'s `## Open Questions` section stays **neutral, with no recommendation** — that is card content written for grooming, not a question being asked. `groom-story` adds the recommendation when it asks each one, in the format above.
- Agents without `AskUserQuestion` (the Codex and Antigravity mirrors this file is synced to) present the same decision as a numbered list, recommended option first and labelled `(Recommended)`, each with its one-line reason.
