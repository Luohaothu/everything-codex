# Workflow: TDD

Test-driven development cycle for implementing features and fixing bugs.

## When to Use

- New features (after planning)
- Bug fixes (reproduce first, then fix)
- Refactoring (ensure behavior is preserved)

## Cycle

```
RED   ->  Write a failing test that defines the desired behavior
GREEN ->  Write the minimum code to make the test pass
REFACTOR -> Improve code quality while keeping tests green
REPEAT -> Next behavior
```

## Steps

1. **Define interfaces** -- types and contracts before implementation
2. **Write failing tests** -- happy path, edge cases, error scenarios
3. **Verify tests fail** for the right reason (not a syntax error)
4. **Implement minimal code** to make tests pass
5. **Verify tests pass**
6. **Refactor** -- clean up while tests stay green
7. **Check coverage** -- target 80%+ (100% for security-critical code)

## Coverage Targets

| Code Category | Minimum Coverage |
|---------------|-----------------|
| Business logic | 80% |
| Auth / security | 100% |
| Financial calculations | 100% |
| Utilities / helpers | 80% |
| UI components | 70% |

## Integration

- Use the `/tdd` skill to activate TDD mode
- Use `/plan` first if requirements are unclear
- Use `/code-review` after implementation
- Use `/test-coverage` to verify coverage gaps
