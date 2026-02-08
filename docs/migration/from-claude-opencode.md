# Migration Guide: From Claude/OpenCode to Everything Codex

## What Changed
This repository was converted to a Codex-only template. The following legacy assets were removed from the mainline:
- `.claude-plugin/`
- `.opencode/`
- Legacy `agents/`, `commands/`, and hook-centric project wiring

## New Canonical Locations
- Rules: `AGENTS.md`
- Config: `.codex/config.toml`
- Skills: `.codex/skills/*/SKILL.md`
- Workflows: `workflows/*.md`

## Migration Mapping
- Legacy slash command docs -> `workflows/*.md`
- Legacy skill catalog -> `.codex/skills/`
- Legacy setup docs -> `README.md` and `README.zh-CN.md`

## Recommended Migration Steps
1. Remove local references to `~/.claude` and `.opencode` for this repo.
2. Update automation to call `codex` / `codex exec`.
3. Adopt `npm run validate && npm run test && npm run lint` as merge gate.
