# Workflow: Code Review

Structured review process for catching issues before they ship.

## When to Use

- After completing any code change
- Before creating a PR
- When reviewing someone else's contribution

## Review Priorities

1. **Correctness** -- does it do what it should? Are there regressions?
2. **Security** -- secrets, injection, auth bypass, data exposure
3. **Maintainability** -- readability, naming, complexity, duplication
4. **Test coverage** -- are new paths tested? Edge cases covered?
5. **Performance** -- obvious bottlenecks, N+1 queries, unnecessary allocations

## Steps

1. **Read the diff** -- understand what changed and why
2. **Check security** -- hardcoded secrets, SQL injection, XSS, CSRF, path traversal
3. **Check correctness** -- logic errors, missing error handling, boundary conditions
4. **Check quality** -- large functions (>50 lines), deep nesting (>4 levels), duplication
5. **Check tests** -- are new behaviors tested? Are edge cases covered?
6. **Summarize findings** ordered by severity using `prompts/review-template.md`

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Security vulnerability or data loss risk | Must fix before merge |
| HIGH | Correctness bug or missing validation | Must fix before merge |
| MEDIUM | Maintainability or performance concern | Should fix, can merge with caution |
| LOW | Style or minor improvement | Optional |

## Integration

- Use the `/code-review` skill to activate reviewer mode
- Use `/security-review` for deeper security analysis
- Use `/verify` to run automated checks
