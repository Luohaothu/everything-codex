---
name: instinct-import
description: Import instincts from teammates, other projects, or backup files. Handles duplicates and conflicts automatically.
---

# Instinct Import Skill

Import instincts from external sources with conflict resolution.

## Usage

```
/instinct-import team-instincts.yaml
/instinct-import --dry-run team-instincts.yaml
/instinct-import --force team-instincts.yaml
```

## What to Do

1. Fetch the instinct file (local path or URL)
2. Parse and validate the format
3. Check for duplicates with existing instincts
4. Merge or add new instincts
5. Save to `~/.codex/instincts/inherited/`

## Merge Strategies

### For Duplicates
- **Higher confidence wins**: Keep the one with higher confidence
- **Merge evidence**: Combine observation counts
- **Update timestamp**: Mark as recently validated

### For Conflicts
- **Skip by default**: Don't import conflicting instincts
- **Flag for review**: Mark both as needing attention
- **Manual resolution**: User decides which to keep

## Import Report

```
Import complete!

Added: 8 instincts
Updated: 1 instinct
Skipped: 3 instincts (2 duplicates, 1 conflict)

New instincts saved to: ~/.codex/instincts/inherited/
```

## Flags

- `--dry-run`: Preview without importing
- `--force`: Import even if conflicts exist
- `--merge-strategy <higher|local|import>`: How to handle duplicates
- `--min-confidence <n>`: Only import instincts above threshold
