---
name: instinct-status
description: Show all learned instincts with their confidence levels, grouped by domain.
---

# Instinct Status Skill

Display all learned instincts with confidence scores, grouped by domain.

## Usage

```
/instinct-status
/instinct-status --domain code-style
/instinct-status --low-confidence
```

## What to Do

1. Read all instinct files from `~/.codex/instincts/personal/`
2. Read inherited instincts from `~/.codex/instincts/inherited/`
3. Display them grouped by domain with confidence bars

## Output Format

```
Instinct Status
==================

## Code Style (4 instincts)

### prefer-functional-style
Trigger: when writing new functions
Action: Use functional patterns over classes
Confidence: 80%
Source: session-observation

## Testing (2 instincts)

### test-first-workflow
Trigger: when adding new functionality
Action: Write test first, then implementation
Confidence: 90%
Source: session-observation

---
Total: 9 instincts (4 personal, 5 inherited)
```

## Flags

- `--domain <name>`: Filter by domain
- `--low-confidence`: Show only instincts with confidence < 0.5
- `--high-confidence`: Show only instincts with confidence >= 0.7
- `--source <type>`: Filter by source
- `--json`: Output as JSON
