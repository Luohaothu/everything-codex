---
name: tdd-workflow
description: Test-first workflow for feature work, bug fixes, and refactors.
---

# TDD Workflow

## Sequence
1. Write or update a failing test that expresses the target behavior.
2. Run the smallest relevant test command and confirm failure.
3. Implement the minimal change needed to pass.
4. Re-run tests and refactor only with green tests.
5. Run full validation before completion.

## Test Expectations
- Cover success path, edge path, and failure path.
- Assert behavior, not implementation details.
- Keep each test focused on one requirement.

## Completion Gate
A change is not complete until:
- Target tests pass.
- Regression checks pass.
- Validators and linters are green.
