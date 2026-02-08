---
name: checkpoint
description: Create or verify workflow checkpoints using git commits and state tracking. Use for progress tracking during long implementation sessions.
---

# Checkpoint Skill

Create or verify checkpoints in your workflow.

## Usage

```
/checkpoint create <name>   # Create named checkpoint
/checkpoint verify <name>   # Verify against checkpoint
/checkpoint list            # Show all checkpoints
/checkpoint clear           # Remove old checkpoints
```

## Create Checkpoint

1. Run `/verify quick` to ensure current state is clean
2. Create a git commit or stash with checkpoint name
3. Log checkpoint to `.codex/checkpoints.log`
4. Report checkpoint created

## Verify Checkpoint

Compare current state to a checkpoint:
- Files added/modified since checkpoint
- Test pass rate now vs then
- Coverage now vs then
- Build status

```
CHECKPOINT COMPARISON: <name>
============================
Files changed: X
Tests: +Y passed / -Z failed
Coverage: +X% / -Y%
Build: [PASS/FAIL]
```

## Workflow

```
[Start]     → /checkpoint create "feature-start"
[Implement] → /checkpoint create "core-done"
[Test]      → /checkpoint verify "core-done"
[Refactor]  → /checkpoint create "refactor-done"
[PR]        → /checkpoint verify "feature-start"
```
