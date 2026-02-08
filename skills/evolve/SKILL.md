---
name: evolve
description: Cluster related instincts into higher-level skills. Analyzes instinct patterns and generates consolidated skill files.
---

# Evolve Skill

Analyze instincts and cluster related ones into higher-level skills.

## Usage

```
/evolve                    # Analyze all instincts and suggest evolutions
/evolve --domain testing   # Only evolve instincts in testing domain
/evolve --dry-run          # Show what would be created
/evolve --threshold 5      # Require 5+ related instincts to cluster
```

## Evolution Process

1. Read all instincts from `~/.codex/instincts/`
2. Group instincts by domain similarity, trigger pattern overlap, and action sequence
3. For each cluster of 3+ related instincts, determine evolution type
4. Generate the appropriate skill file
5. Save to `~/.codex/evolved/skills/`

## Evolution Types

### Skill (Auto-Triggered)

When instincts describe behaviors that should happen automatically:
- Pattern-matching triggers
- Error handling responses
- Code style enforcement

Example: `prefer-functional` + `use-immutable` + `avoid-classes` → `functional-patterns` skill

## Output Format

```
Evolve Analysis
==================

Found N clusters ready for evolution:

## Cluster 1: <Name>
Instincts: <list>
Type: Skill
Confidence: X% (based on N observations)

Would create: <skill-name> skill
Files:
  - ~/.codex/evolved/skills/<name>/SKILL.md
```

## Flags

- `--execute`: Actually create the evolved structures (default is preview)
- `--dry-run`: Preview without creating
- `--domain <name>`: Only evolve instincts in specified domain
- `--threshold <n>`: Minimum instincts required to form cluster (default: 3)
