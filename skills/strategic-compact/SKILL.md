---
name: strategic-compact
description: Suggests starting new sessions at logical intervals to preserve context through task phases.
---

# Strategic Context Management

Manage context by starting new sessions at strategic points in your workflow rather than running into context limits.

## Why Strategic Session Boundaries?

Running out of context at arbitrary points causes:
- Loss of important task context mid-implementation
- No awareness of logical task boundaries
- Interrupted complex multi-step operations

Strategic session boundaries at logical milestones:
- **After exploration, before execution** — Fresh session with implementation plan
- **After completing a milestone** — Clean start for next phase
- **Before major context shifts** — New session for different task

## When to Start a New Session

Consider starting a new session when:

1. **After planning** — Plan is finalized, start fresh for implementation
2. **After debugging** — Error resolution complete, clear context for next task
3. **After major milestone** — Feature complete, start review in fresh session
4. **Context feels heavy** — Many files read, lots of tool output accumulated

## Best Practices

1. **Summarize before ending** — Document current state before starting new session
2. **Save plans to files** — Write implementation plans to `.codex/plan/` so they survive across sessions
3. **Commit frequently** — Git commits serve as recovery points
4. **Use checkpoints** — `/checkpoint create` before major transitions
5. **Don't split mid-implementation** — Keep related changes in same session
