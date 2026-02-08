---
name: verification-loop
description: Final quality gate for Codex work before claiming completion.
---

# Verification Loop

## Ordered Checks
1. `npm run validate`
2. `npm run test`
3. `npm run lint`
4. `git status --short`
5. `git diff --stat`

## Report Format
Always summarize:
- Commands executed
- Pass/fail result per command
- Remaining risks or skipped checks

## Rule
Do not claim success without command evidence.
