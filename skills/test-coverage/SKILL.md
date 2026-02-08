---
name: test-coverage
description: Analyze test coverage, identify files below 80% threshold, and generate missing tests. Supports unit, integration, and E2E tests.
---

# Test Coverage Skill

Analyze test coverage and generate missing tests to reach 80%+ coverage.

## Workflow

1. Run tests with coverage reporting
2. Analyze coverage report
3. Identify files below 80% threshold
4. For each under-covered file:
   - Analyze untested code paths
   - Generate unit tests for functions
   - Generate integration tests for APIs
   - Generate E2E tests for critical flows
5. Verify new tests pass
6. Show before/after coverage metrics

## Focus Areas

- Happy path scenarios
- Error handling paths
- Edge cases (null, undefined, empty, boundary values)
- Branch coverage (if/else, switch cases)

## Coverage Commands

### JavaScript/TypeScript
```bash
npm test -- --coverage
pnpm test -- --coverage
```

### Go
```bash
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
```

### Python
```bash
pytest --cov=. --cov-report=term-missing
```

## Coverage Targets

| Code Type | Target |
|-----------|--------|
| Critical business logic | 100% |
| Public APIs | 90%+ |
| General code | 80%+ |
| Generated/vendor code | Exclude |
