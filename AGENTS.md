# AGENTS.md

This repository is a Codex-first template. All contributions must preserve Codex-native workflows and structure.

## Goals
- Keep the project **Codex-only**. Do not introduce Claude/OpenCode specific assets.
- Keep instructions executable and concise.
- Favor deterministic automation via CI validators.

## Required Structure
- `AGENTS.md`: repository-wide operating rules.
- `.codex/config.toml`: Codex runtime defaults.
- `.codex/skills/*/SKILL.md`: reusable skills.
- `workflows/*.md`: reusable execution playbooks.
- `prompts/*.md`: reusable prompt templates.

## Engineering Rules
- Make minimal, focused diffs.
- Prefer non-interactive commands in automation.
- Add tests or validators whenever behavior or structure changes.
- Keep docs aligned with implementation in the same PR.

## Verification Before Merge
Run these commands locally:

```bash
npm run validate
npm run test
npm run lint
```

If any step fails, fix it before creating or updating a PR.
