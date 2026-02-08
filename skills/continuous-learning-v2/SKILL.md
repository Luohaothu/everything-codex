---
name: continuous-learning-v2
description: Instinct-based learning system that creates atomic instincts with confidence scoring and evolves them into skills.
---

# Continuous Learning v2 - Instinct-Based Architecture

An advanced learning system that turns your coding sessions into reusable knowledge through atomic "instincts" — small learned behaviors with confidence scoring.

## The Instinct Model

An instinct is a small learned behavior:

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
source: "session-observation"
---

# Prefer Functional Style

## Action
Use functional patterns over classes when appropriate.

## Evidence
- Observed 5 instances of functional pattern preference
- User corrected class-based approach to functional
```

**Properties:**
- **Atomic** — one trigger, one action
- **Confidence-weighted** — 0.3 = tentative, 0.9 = near certain
- **Domain-tagged** — code-style, testing, git, debugging, workflow
- **Evidence-backed** — tracks what observations created it

## How It Works

```
Session Activity
      │
      │ Use /learn to capture patterns
      ▼
┌─────────────────────────────────────────┐
│          PATTERN DETECTION              │
│   • User corrections → instinct         │
│   • Error resolutions → instinct        │
│   • Repeated workflows → instinct       │
└─────────────────────────────────────────┘
      │
      │ Creates/updates
      ▼
┌─────────────────────────────────────────┐
│         instincts/personal/             │
│   • prefer-functional.md (0.7)          │
│   • always-test-first.md (0.9)          │
│   • use-zod-validation.md (0.6)         │
└─────────────────────────────────────────┘
      │
      │ /evolve clusters
      ▼
┌─────────────────────────────────────────┐
│              evolved/                   │
│   • skills/testing-workflow.md          │
│   • skills/refactor-specialist.md       │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Initialize Directory Structure

```bash
mkdir -p ~/.codex/instincts/{personal,inherited}
mkdir -p ~/.codex/evolved/skills
```

### 2. Use the Instinct Skills

```
/learn               # Extract patterns from current session
/instinct-status     # Show learned instincts with confidence
/evolve              # Cluster related instincts into skills
/instinct-export     # Export instincts for sharing
/instinct-import     # Import instincts from others
```

## File Structure

```
~/.codex/
├── instincts/
│   ├── personal/           # Auto-learned instincts
│   └── inherited/          # Imported from others
└── evolved/
    └── skills/             # Generated skills
```

## Confidence Scoring

| Score | Meaning | Behavior |
|-------|---------|----------|
| 0.3 | Tentative | Suggested but not enforced |
| 0.5 | Moderate | Applied when relevant |
| 0.7 | Strong | Auto-approved for application |
| 0.9 | Near-certain | Core behavior |

**Confidence increases** when:
- Pattern is repeatedly observed
- User doesn't correct the suggested behavior
- Similar instincts from other sources agree

**Confidence decreases** when:
- User explicitly corrects the behavior
- Pattern isn't observed for extended periods
- Contradicting evidence appears

## Privacy

- Observations stay **local** on your machine
- Only **instincts** (patterns) can be exported
- No actual code or conversation content is shared
- You control what gets exported
