# Review Template

## Summary

[One sentence: APPROVE / WARNING / BLOCK with reason]

## Findings

### CRITICAL

1. **[Issue Title]** `file:line`
   - **Issue:** [Description of the problem]
   - **Impact:** [What can go wrong]
   - **Fix:** [Specific recommendation]

### HIGH

1. **[Issue Title]** `file:line`
   - **Issue:** [Description]
   - **Fix:** [Recommendation]

### MEDIUM

1. **[Issue Title]** `file:line`
   - **Issue:** [Description]
   - **Fix:** [Recommendation]

### LOW

1. **[Issue Title]** `file:line`
   - **Suggestion:** [Optional improvement]

## Open Questions

- [Question that needs team discussion]

## Verification

| Check | Status | Notes |
|-------|--------|-------|
| Build | PASS/FAIL | |
| Types | PASS/FAIL | |
| Lint | PASS/FAIL | |
| Tests | PASS/FAIL | Coverage: X% |
| Security | PASS/FAIL | |

## Decision

- [ ] **APPROVE** -- no CRITICAL/HIGH issues
- [ ] **WARNING** -- MEDIUM issues only, can merge with caution
- [ ] **BLOCK** -- CRITICAL/HIGH issues must be resolved
