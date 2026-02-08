# Contributing to everything-codex

Thanks for wanting to contribute! This repo is a community resource for Codex CLI users.

## Table of Contents

- [What We're Looking For](#what-were-looking-for)
- [Quick Start](#quick-start)
- [Contributing Skills](#contributing-skills)
- [Contributing AGENTS.md Templates](#contributing-agentsmd-templates)
- [Contributing Execution Policies](#contributing-execution-policies)
- [Pull Request Process](#pull-request-process)

---

## What We're Looking For

### Skills
Workflow definitions and domain knowledge:
- Language best practices (Rust, C#, Swift, Kotlin)
- Framework patterns (Rails, Laravel, FastAPI, NestJS)
- Testing strategies (visual regression, load testing)
- DevOps workflows (Kubernetes, Terraform, CI/CD)
- Domain expertise (ML pipelines, data engineering, mobile)

### AGENTS.md Templates
Language or framework-specific AGENTS.md templates:
- New language templates (e.g., `rust/AGENTS.md`)
- Framework-specific guidelines
- Team workflow standards

### Execution Policies
Starlark `.rules` files for safety and enforcement:
- Language-specific safety rules
- Framework-specific restrictions
- CI/CD guardrails

---

## Quick Start

```bash
# 1. Fork and clone
gh repo fork affaan-m/everything-codex --clone
cd everything-codex

# 2. Create a branch
git checkout -b feat/my-contribution

# 3. Add your contribution (see sections below)

# 4. Test locally
./scripts/install.sh   # Install to verify
# Then test with Codex CLI

# 5. Submit PR
git add . && git commit -m "feat: add my-skill" && git push
```

---

## Contributing Skills

Skills are the primary way to add knowledge and workflows to Codex CLI.

### Directory Structure

```
skills/
|-- your-skill-name/
    |-- SKILL.md
```

### SKILL.md Template

```markdown
---
name: your-skill-name
description: Brief description shown in skill list
---

# Your Skill Title

Brief overview of what this skill covers.

## Core Concepts

Explain key patterns and guidelines.

## Code Examples

\`\`\`typescript
// Include practical, tested examples
function example() {
  // Well-commented code
}
\`\`\`

## Best Practices

- Actionable guidelines
- Do's and don'ts
- Common pitfalls to avoid

## When to Use

Describe scenarios where this skill applies.
```

### SKILL.md Format Rules

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Lowercase, hyphenated (matches directory name) |
| `description` | Yes | One line, shown in skill list |
| `tools` | No | Do NOT include — Codex does not support this field |
| `model` | No | Do NOT include — Codex does not support this field |

### Behavioral Constraints

If your skill needs to restrict what Codex does (read-only review, no file writes), express it as text in the skill body:

```markdown
## Behavioral Constraints

- This is a READ-ONLY review skill
- Do NOT modify any files directly
- Present findings as a report for the user to act on
```

### Skill Checklist

- [ ] Has YAML frontmatter with `name` and `description`
- [ ] No `tools` or `model` fields in frontmatter
- [ ] Focused on one domain/technology
- [ ] Includes practical code examples
- [ ] Under 500 lines
- [ ] Uses clear section headers
- [ ] Tested with Codex CLI

---

## Contributing AGENTS.md Templates

AGENTS.md files provide always-on instructions to Codex. We maintain language-specific templates.

### Adding a New Language Template

1. Create `<language>/AGENTS.md` in the repo root
2. Include:
   - Project detection (what files indicate this language)
   - Core coding standards for the language
   - References to relevant skills via `/skill-name`
   - Testing requirements specific to the language

### Template Structure

```markdown
# <Language> Development Standards

## When to Apply
This template applies when the project contains <detection files>.

## Coding Standards
[Language-specific standards]

## Testing
[Language-specific testing requirements]

## Available Skills
- `/language-patterns` - Idioms and best practices
- `/language-testing` - Testing patterns
- `/language-review` - Code review
```

---

## Contributing Execution Policies

Starlark `.rules` files define what Codex can and cannot do.

### File Location

```
rules/<name>.rules
```

### Rules Format

```python
# description of the rule
prefix_rule(
    pattern=["dangerous-command"],
    decision="forbidden",
    justification="Why this is blocked"
)
```

### Decision Types

| Decision | Effect |
|----------|--------|
| `allow` | Automatically approve |
| `prompt` | Ask user for confirmation |
| `forbidden` | Block the action |

---

## Pull Request Process

### 1. PR Title Format

```
feat(skills): add rust-patterns skill
feat(rules): add docker-safety execution policy
docs: improve contributing guide
fix(skills): update React patterns
```

### 2. PR Description

```markdown
## Summary
What you're adding and why.

## Type
- [ ] Skill
- [ ] AGENTS.md template
- [ ] Execution policy (.rules)
- [ ] Documentation

## Testing
How you tested this with Codex CLI.

## Checklist
- [ ] SKILL.md has valid frontmatter (name + description only)
- [ ] No Claude Code references (use "Codex" terminology)
- [ ] Tested with Codex CLI
- [ ] No sensitive info (API keys, paths)
- [ ] Clear descriptions
```

### 3. Review Process

1. Maintainers review within 48 hours
2. Address feedback if requested
3. Once approved, merged to main

---

## Guidelines

### Do
- Keep contributions focused and modular
- Include clear descriptions
- Test before submitting
- Follow existing patterns
- Document dependencies

### Don't
- Include sensitive data (API keys, tokens, paths)
- Add `tools` or `model` to SKILL.md frontmatter
- Include Claude Code-specific references (hooks, plugins, etc.)
- Submit untested contributions
- Create duplicates of existing functionality

---

## File Naming

- Use lowercase with hyphens: `python-patterns`
- Be descriptive: `tdd-workflow` not `workflow`
- Directory name must match `name` field in SKILL.md

---

## Questions?

- **Issues:** [github.com/affaan-m/everything-codex/issues](https://github.com/affaan-m/everything-codex/issues)

---

Thanks for contributing!
