---
name: verify
description: Run comprehensive verification on current codebase state. Checks build, types, lint, tests, security, and git status.
---

# Verification Skill

Run comprehensive verification on current codebase state.

## Usage

```
/verify              # Full verification (default)
/verify quick        # Build + types only
/verify pre-commit   # Checks relevant for commits
/verify pre-pr       # Full checks plus security scan
```

## Verification Phases

### Phase 1: Build Check

Run the build command for this project. If it fails, report errors and STOP.

### Phase 2: Type Check

Run the type checker for this project:
- TypeScript: `npx tsc --noEmit`
- Python: `pyright .` or `mypy .`
- Go: `go vet ./...`

Report all errors with file:line.

### Phase 3: Lint Check

Run the project linter. Report warnings and errors.

### Phase 4: Test Suite

Run all tests with coverage:
- Report pass/fail count
- Report coverage percentage
- Target: 80% minimum

### Phase 5: Security Scan

Check for:
- Hardcoded secrets (API keys, tokens)
- Console.log / debug statements in source
- Sensitive data in committed files

### Phase 6: Diff Review

Show what changed since last commit:
- Files modified
- Unintended changes
- Missing error handling

## Output Format

```
VERIFICATION: [PASS/FAIL]

Build:    [OK/FAIL]
Types:    [OK/X errors]
Lint:     [OK/X issues]
Tests:    [X/Y passed, Z% coverage]
Security: [OK/X found]
Diff:     [X files changed]

Ready for PR: [YES/NO]
```

If any critical issues, list them with fix suggestions.

## Continuous Mode

Run verification at these checkpoints:
- After completing each function
- After finishing a component
- Before moving to next task
- Before creating a PR
