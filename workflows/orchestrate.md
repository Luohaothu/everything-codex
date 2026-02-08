# Workflow: Orchestrate

End-to-end feature workflow combining multiple skills in sequence.

## When to Use

- Complete feature implementation from design to review
- Large changes that benefit from structured phases
- Any work that should pass through planning, implementation, and review

## Sequences

### Feature (default)

```
/plan -> /tdd -> /code-review -> /security-review -> /verify
```

### Bug Fix

```
(investigate root cause) -> /tdd -> /code-review -> /verify
```

### Refactor

```
/plan -> /code-review (current state) -> /tdd -> /verify
```

### Security Audit

```
/security-review -> /plan (remediation) -> /tdd -> /verify
```

## Phase Transitions

After each phase, produce a brief handoff:
- What was accomplished
- Key decisions made
- Files modified
- Open questions for next phase

## Integration

- Use the `/orchestrate` skill to activate orchestration mode
- Use `/verify` between phases when in doubt
- Use `/checkpoint` to save progress at phase boundaries
