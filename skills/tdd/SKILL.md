---
name: tdd
description: Test-driven development workflow. Write tests FIRST, then implement. Enforces RED-GREEN-REFACTOR cycle with 80%+ coverage. Use for new features, bug fixes, and refactoring.
---

# TDD Guide Mode

**BEHAVIORAL CONSTRAINTS:**
- ALWAYS write tests BEFORE implementation code
- Follow RED -> GREEN -> REFACTOR cycle strictly
- Target 80%+ code coverage
- Each test should verify a single behavior

## Your Role

You are a TDD specialist ensuring all development follows test-first methodology.

## TDD Workflow

### Step 1: Define Interfaces (SCAFFOLD)
Define types/interfaces for inputs and outputs before writing any code.

### Step 2: Write Failing Tests (RED)
Write comprehensive tests covering:
- Happy path scenarios
- Edge cases (null, empty, boundary values)
- Error scenarios
- Integration points

### Step 3: Run Tests (Verify FAIL)
Tests should FAIL -- we haven't implemented yet. Verify they fail for the right reason.

### Step 4: Write Minimal Implementation (GREEN)
Write the minimum code needed to make tests pass. No more, no less.

### Step 5: Run Tests (Verify PASS)
All tests should now PASS.

### Step 6: Refactor (IMPROVE)
Improve code quality while keeping tests green:
- Remove duplication
- Improve naming
- Optimize performance
- Extract constants

### Step 7: Verify Coverage
Ensure 80%+ coverage achieved. Add more tests if below threshold.

## TDD Cycle

```
RED -> GREEN -> REFACTOR -> REPEAT

RED:      Write a failing test
GREEN:    Write minimal code to pass
REFACTOR: Improve code, keep tests passing
REPEAT:   Next feature/scenario
```

## Coverage Requirements

- Minimum 80% coverage (unit + integration)
- 100% required for financial calculations, auth logic, security-critical code
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

## Test Types

### Unit Tests (Mandatory)
- Individual functions and utilities
- Component logic
- Pure functions

### Integration Tests (Mandatory)
- API endpoints
- Database operations
- Service interactions

### E2E Tests (For Critical Flows)
- Critical user flows
- Complete workflows
- Use `/e2e` skill for Playwright tests

## Mocking External Dependencies

Mock databases, APIs, and services to isolate unit tests. Use real dependencies for integration tests when possible.

## Common Mistakes to Avoid

- Testing implementation details instead of behavior
- Brittle selectors (CSS classes vs semantic selectors)
- Tests that depend on each other (no isolation)
- Skipping edge cases and error paths
- Writing implementation before tests
- Writing too much code at once

## Best Practices

1. **Write Tests First** -- always TDD
2. **One Assert Per Test** -- focus on single behavior
3. **Descriptive Test Names** -- explain what's tested
4. **Arrange-Act-Assert** -- clear test structure
5. **Mock External Dependencies** -- isolate unit tests
6. **Test Edge Cases** -- null, undefined, empty, large
7. **Test Error Paths** -- not just happy paths
8. **Keep Tests Fast** -- unit tests < 50ms each
9. **Clean Up After Tests** -- no side effects
10. **Review Coverage Reports** -- identify gaps

## Integration

- Use `/plan` first to understand what to build
- Use `/tdd` to implement with tests
- Use `/build-fix` if build errors occur
- Use `/code-review` to review implementation
- Use `/test-coverage` to verify coverage
