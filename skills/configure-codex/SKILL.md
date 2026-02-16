---
name: configure-codex
description: Interactive installer for everything-codex. Guides users through selecting and installing skills, AGENTS.md templates, and execution policy rules.
---

# Configure Everything Codex

An interactive, step-by-step installation guide for the everything-codex project.

## When to Activate

- User says "configure codex", "install everything-codex", or similar
- User wants to selectively install skills or rules
- User wants to verify or fix an existing installation

## Step 0: Clone Repository

```bash
rm -rf /tmp/everything-codex
git clone https://github.com/Luohaothu/everything-codex.git /tmp/everything-codex
```

Set `ECX_ROOT=/tmp/everything-codex` as the source for all subsequent operations.

---

## Step 1: Choose Installation Level

Ask the user where to install:
- **User-level** (`~/.codex/` for config, `~/.codex/skills/` for skills) — Applies to all projects
- **Project-level** (`.codex/skills/` in project root) — Applies to current project only

---

## Step 2: Select & Install Skills

### Skill Categories

Use interactive prompts to let the user choose:

- **Core Workflow** — plan, code-review, tdd, security-review, verify, checkpoint
- **Framework & Language** — Django, Spring Boot, Go, Python, TypeScript patterns
- **Database** — PostgreSQL, ClickHouse, JPA/Hibernate
- **Multi-Model** — orchestrate, multi-plan, multi-execute, multi-workflow
- **Learning** — continuous-learning-v2, learn, evolve, instinct management
- **All skills** — Install everything

### Execute Installation

```bash
# Skills install to ~/.codex/skills/ (user-level) or .codex/skills/ (project-level)
SKILLS_DIR="$HOME/.codex/skills"  # or .codex/skills for project-level
for skill_dir in $ECX_ROOT/skills/*/; do
    skill_name=$(basename "$skill_dir")
    mkdir -p "$SKILLS_DIR/$skill_name"
    cp -r "$skill_dir"* "$SKILLS_DIR/$skill_name/"
done
```

---

## Step 3: Install AGENTS.md and Rules

```bash
# Root AGENTS.md
cp $ECX_ROOT/AGENTS.md ~/.codex/AGENTS.md

# Language-specific AGENTS.md templates
for lang in golang python typescript; do
    mkdir -p ~/.codex/$lang
    cp $ECX_ROOT/$lang/AGENTS.md ~/.codex/$lang/
done

# Execution policy rules
mkdir -p ~/.codex/rules
cp $ECX_ROOT/rules/*.rules ~/.codex/rules/
```

---

## Step 4: Post-Installation Verification

1. Verify all installed skill directories contain SKILL.md
2. Check that SKILL.md files have proper frontmatter (`name` and `description`)
3. Verify no `tools` or `model` fields in frontmatter
4. Report any issues found

---

## Step 5: Installation Summary

```
## Installation Complete

### Skills Installed ([count])
Location: ~/.codex/skills/

### AGENTS.md Installed
- ~/.codex/AGENTS.md
- ~/.codex/golang/AGENTS.md
- ~/.codex/python/AGENTS.md
- ~/.codex/typescript/AGENTS.md

### Rules Installed
- ~/.codex/rules/*.rules

### Verification
- [count] skills validated
- [count] issues found
```

Clean up the cloned repository:
```bash
rm -rf /tmp/everything-codex
```

---

## Troubleshooting

### "Skills not being picked up"
- Verify `~/.codex/skills/<name>/SKILL.md` exists
- Check that SKILL.md has YAML frontmatter with `name` and `description`

### "Rules not working"
- Check `~/.codex/rules/` contains `.rules` files
- Verify Starlark syntax is correct
- Restart Codex CLI after installing rules
