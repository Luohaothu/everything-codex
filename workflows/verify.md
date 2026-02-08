# Workflow: Verify

Final gate before committing or creating a PR.

## When to Use

- Before any commit
- Between orchestration phases
- Before creating a pull request
- After resolving merge conflicts

## Checks (in order)

1. **Build** -- project compiles without errors
2. **Types** -- type checker passes (tsc, mypy, go vet)
3. **Lint** -- linter passes with no warnings
4. **Tests** -- full test suite passes with 80%+ coverage
5. **Security** -- no hardcoded secrets or debug statements
6. **Diff review** -- no unintended changes, no leftover TODOs

If any step fails, stop and fix before proceeding.

## Quick Variants

| Variant | Checks | When |
|---------|--------|------|
| `full` | All 6 steps | Before PR |
| `quick` | Build + Types | During development |
| `pre-commit` | Build + Lint + Security | Before commit |

## Integration

- Use the `/verify` skill to run verification
- Pairs with every other workflow as a final gate
