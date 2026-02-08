---
name: orchestrate
description: Full feature workflow orchestrating plan, tdd, code-review, and security-review skills in sequence. Use for complete feature implementation from design to review.
---

# Full Feature Workflow

Orchestrate a complete feature implementation through sequential skill invocations.

## Usage

```
/orchestrate feature <description>    # Full feature workflow
/orchestrate bugfix <description>     # Bug fix workflow
/orchestrate refactor <description>   # Refactoring workflow
/orchestrate security <description>   # Security-focused review
```

## Workflow Types

### Feature

```
/plan → /tdd → /code-review → /security-review
```

### Bugfix

```
(investigate) → /tdd → /code-review
```

### Refactor

```
/plan → /code-review → /tdd
```

### Security

```
/security-review → /code-review → /plan
```

## Workflow Phases

### Phase 1: Planning
Use `/plan` to analyze requirements and create implementation plan.
Wait for user confirmation before proceeding.

### Phase 2: Test-Driven Development
Use `/tdd` to write tests first, then implement.
Follow RED → GREEN → REFACTOR cycle.

### Phase 3: Code Review
Use `/code-review` to review code quality.
Address CRITICAL and HIGH issues before continuing.

### Phase 4: Security Review
Use `/security-review` for security audit.
Fix any CRITICAL security issues.

## Between Phases

After each phase, provide:
- Summary of what was accomplished
- Any issues found and how they were resolved
- Handoff context for the next phase

## Handoff Document

```markdown
## HANDOFF: [previous-phase] → [next-phase]

### Context
Summary of what was done

### Findings
Key discoveries or decisions

### Files Modified
List of files touched

### Open Questions
Unresolved items for next phase
```

## Tips

1. Start with planning for complex features
2. Always include code review before merge
3. Use security review for auth/payment/PII
4. Keep handoffs concise
5. Run verification between phases if needed
