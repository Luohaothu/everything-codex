# Everything Codex

Codex-first engineering template for teams that want repeatable planning, implementation, review, and verification workflows.

## What This Repo Provides
- Repository-level operating rules in `AGENTS.md`.
- Codex runtime defaults in `.codex/config.toml`.
- Reusable skills under `.codex/skills/`.
- Reusable workflow playbooks under `workflows/`.
- CI validators that enforce Codex-only structure.

## Quick Start
1. Install Codex CLI:

```bash
npm i -g @openai/codex
```

2. Clone this repository and enter it.
3. Run Codex interactively:

```bash
codex
```

4. Run Codex non-interactively with this template:

```bash
codex exec "Follow workflows/plan.md and propose an implementation plan for adding feature flags."
```

## Daily Workflow
1. Plan with `workflows/plan.md`.
2. Implement with `workflows/tdd.md`.
3. Review with `workflows/code-review.md`.
4. Final gate with `workflows/verify.md`.

## Repository Layout
```text
.
├── AGENTS.md
├── .codex/
│   ├── config.toml
│   └── skills/
├── workflows/
├── prompts/
├── scripts/ci/
├── tests/
└── docs/migration/
```

## Verification
```bash
npm run validate
npm run test
npm run lint
```

## Migration
This project intentionally removed Claude/OpenCode assets.

Migration notes: `docs/migration/from-claude-opencode.md`

## License
MIT (`LICENSE`).
