---
name: coding-standards
description: Baseline coding standards for maintainable and readable changes in Codex-driven projects.
---

# Coding Standards

## Core Principles
- Prefer simple, explicit code over clever abstractions.
- Keep functions small and side effects obvious.
- Use descriptive names for symbols and files.
- Avoid duplicated logic; extract shared utilities when repetition appears.

## Change Quality Checklist
- New behavior has a test or validator update.
- Error paths are handled with clear messages.
- Public docs reflect user-visible changes.
- Dead code and stale comments are removed.

## Review Checklist
- Is this the smallest diff that solves the problem?
- Are inputs validated before use?
- Are failure modes and edge cases covered?
- Would a new contributor understand this in one pass?
