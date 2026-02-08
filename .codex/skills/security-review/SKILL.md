---
name: security-review
description: Security baseline for input handling, secrets, and command execution safety.
---

# Security Review

## Mandatory Checks
- No secrets in source code, docs, fixtures, or tests.
- All external input is validated before use.
- Shell commands avoid untrusted interpolation.
- Privileged or destructive operations require explicit intent.

## Data Handling
- Keep least-privilege defaults.
- Minimize sensitive data logging.
- Do not expose internal error details to user-facing outputs.

## Quick Scan
Run before completion:

```bash
rg -n "sk-|api[_-]?key|secret|token" .
```

Investigate every hit; false positives must be obvious.
