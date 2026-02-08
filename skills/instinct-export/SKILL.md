---
name: instinct-export
description: Export instincts for sharing with teammates or other projects. Strips sensitive data and outputs shareable YAML.
---

# Instinct Export Skill

Export instincts to a shareable format for teammates, other projects, or backups.

## Usage

```
/instinct-export                           # Export all personal instincts
/instinct-export --domain testing          # Export only testing instincts
/instinct-export --min-confidence 0.7      # Only high-confidence instincts
/instinct-export --output team-instincts.yaml
```

## What to Do

1. Read instincts from `~/.codex/instincts/personal/`
2. Filter based on flags
3. Strip sensitive information (session IDs, file paths, old timestamps)
4. Generate export file

## Output Format (YAML)

```yaml
version: "2.0"
export_date: "2026-02-08T10:30:00Z"

instincts:
  - id: prefer-functional-style
    trigger: "when writing new functions"
    action: "Use functional patterns over classes"
    confidence: 0.8
    domain: code-style
    observations: 8
```

## Privacy

Exports include: trigger patterns, actions, confidence scores, domains, observation counts.

Exports do NOT include: actual code snippets, file paths, session transcripts, personal identifiers.

## Flags

- `--domain <name>`: Export only specified domain
- `--min-confidence <n>`: Minimum confidence threshold (default: 0.3)
- `--output <file>`: Output file path
- `--format <yaml|json|md>`: Output format (default: yaml)
