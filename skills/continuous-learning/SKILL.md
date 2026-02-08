---
name: continuous-learning
description: Automatically extract reusable patterns from coding sessions and save them as learned skills for future use.
---

# Continuous Learning Skill

Evaluates coding sessions to extract reusable patterns that can be saved as learned skills.

## How It Works

Run `/learn` at the end of a session or after solving a non-trivial problem:

1. **Session Evaluation**: Checks if session has enough substance
2. **Pattern Detection**: Identifies extractable patterns
3. **Skill Extraction**: Saves useful patterns to `~/.codex/skills/learned/`

## Pattern Types

| Pattern | Description |
|---------|-------------|
| `error_resolution` | How specific errors were resolved |
| `user_corrections` | Patterns from user corrections |
| `workarounds` | Solutions to framework/library quirks |
| `debugging_techniques` | Effective debugging approaches |
| `project_specific` | Project-specific conventions |

## Related

- `/learn` skill - Manual pattern extraction mid-session
- `continuous-learning-v2` - Advanced instinct-based learning system
