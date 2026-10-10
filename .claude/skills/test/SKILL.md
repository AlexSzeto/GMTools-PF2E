---
name: test
description: Runs the project's test suite and reports pass/fail counts plus any failure output. USE FOR: verifying tests pass after code changes; checking test health before a PR; running tests on demand.
---

# Run Tests

Run `npm test` from the project root and capture the output.

1. If `package.json` has no `test` script, say so and stop — do not report a pass.
2. Execute: `npm test`
3. Parse the output to find pass/fail counts and any failure messages.
4. Report a concise summary:
   - Total tests run, how many passed, how many failed.
   - For each failure: the test name, the file it lives in, and the assertion that failed.
5. If all tests pass, say so and stop.
6. If any tests fail, display the failure output and ask the user how to proceed.
