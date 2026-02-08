---
name: eval
description: Formal evaluation framework implementing eval-driven development (EDD). Define evals before coding, run continuously, track pass@k metrics.
---

# Eval-Driven Development

A formal evaluation framework implementing eval-driven development (EDD) principles. Evals are the "unit tests of AI development."

## Philosophy

- Define expected behavior BEFORE implementation
- Run evals continuously during development
- Track regressions with each change
- Use pass@k metrics for reliability measurement

## Usage

```
/eval define <feature-name>   # Create eval definition
/eval check <feature-name>    # Run and check evals
/eval report <feature-name>   # Generate full report
/eval list                    # Show all evals
```

## Eval Types

### Capability Evals

Test if a new capability works:

```markdown
[CAPABILITY EVAL: feature-name]
Task: Description of what should be accomplished
Success Criteria:
  - [ ] Criterion 1
  - [ ] Criterion 2
Expected Output: Description of expected result
```

### Regression Evals

Ensure changes don't break existing functionality:

```markdown
[REGRESSION EVAL: feature-name]
Baseline: SHA or checkpoint name
Tests:
  - existing-test-1: PASS/FAIL
  - existing-test-2: PASS/FAIL
Result: X/Y passed
```

## Grader Types

### Code-Based Grader (Deterministic)

```bash
# Check if file contains expected pattern
grep -q "export function handleAuth" src/auth.ts && echo "PASS" || echo "FAIL"

# Check if tests pass
npm test -- --testPathPattern="auth" && echo "PASS" || echo "FAIL"
```

### Model-Based Grader (Open-ended)

```markdown
[MODEL GRADER PROMPT]
Evaluate the following code change:
1. Does it solve the stated problem?
2. Is it well-structured?
3. Are edge cases handled?
Score: 1-5
```

### Human Grader

```markdown
[HUMAN REVIEW REQUIRED]
Change: Description
Risk Level: LOW/MEDIUM/HIGH
```

## Metrics

### pass@k — "At least one success in k attempts"
- pass@1: First attempt success rate
- pass@3: Success within 3 attempts
- Target: pass@3 > 90%

### pass^k — "All k trials succeed"
- pass^3: 3 consecutive successes
- Use for critical paths

## Eval Workflow

### 1. Define (Before Coding)

```markdown
## EVAL DEFINITION: feature-xyz

### Capability Evals
1. Can create new user account
2. Can validate email format

### Regression Evals
1. Existing login still works
2. Session management unchanged

### Success Metrics
- pass@3 > 90% for capability evals
- pass^3 = 100% for regression evals
```

### 2. Implement
Write code to pass the defined evals.

### 3. Evaluate
Run each eval, record PASS/FAIL.

### 4. Report

```
EVAL REPORT: feature-xyz
========================
Capability: 3/3 passed (pass@3: 100%)
Regression: 3/3 passed (pass^3: 100%)
Status: SHIP IT
```

## Eval Storage

```
.codex/evals/
  feature-xyz.md      # Eval definition
  feature-xyz.log     # Eval run history
  baseline.json       # Regression baselines
```

## Best Practices

1. Define evals BEFORE coding
2. Run evals frequently
3. Track pass@k over time
4. Use code graders when possible (deterministic > probabilistic)
5. Human review for security
6. Keep evals fast
7. Version evals with code
