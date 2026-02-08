---
name: learn
description: Extract reusable patterns from current session and save them as learned skills for future use.
---

# Learn Skill

Analyze the current session and extract patterns worth saving as reusable skills.

## When to Use

Run `/learn` when you've solved a non-trivial problem during a session.

## What to Extract

1. **Error Resolution Patterns** — What error, root cause, and fix?
2. **Debugging Techniques** — Non-obvious steps, tool combinations
3. **Workarounds** — Library quirks, API limitations, version-specific fixes
4. **Project-Specific Patterns** — Codebase conventions, architecture decisions

## Output Format

Create a skill file at `~/.codex/skills/learned/<pattern-name>/SKILL.md`:

```markdown
---
name: <pattern-name>
description: <what this pattern solves>
---

# <Descriptive Pattern Name>

**Extracted:** <Date>
**Context:** <When this applies>

## Problem
<What problem this solves>

## Solution
<The pattern/technique/workaround>

## Example
<Code example if applicable>

## When to Use
<Trigger conditions>
```

## Process

1. Review the session for extractable patterns
2. Identify the most valuable/reusable insight
3. Draft the skill file
4. Ask user to confirm before saving
5. Save to `~/.codex/skills/learned/`

## Guidelines

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages)
- Focus on patterns that save time in future sessions
- Keep skills focused — one pattern per skill
