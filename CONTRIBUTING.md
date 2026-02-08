# Contributing to Everything Codex

## Scope
This repository accepts contributions that improve Codex-native workflows, skills, prompts, and CI validation.

## Required Before Opening a PR
Run locally:

```bash
npm run validate
npm run test
npm run lint
```

If any command fails, fix it before opening the PR.

## Contribution Areas
- New skills in `.codex/skills/<skill-name>/SKILL.md`
- Workflow improvements in `workflows/*.md`
- Prompt templates in `prompts/*.md`
- Validation improvements in `scripts/ci/*.js` and `tests/`
- Documentation updates in `README.md`, `README.zh-CN.md`, and `docs/`

## Rules
- Keep changes focused and minimal.
- Update docs with behavior changes.
- Add tests/validators for structural changes.
- Do not introduce Claude/OpenCode-specific files or commands.

## Commit Style
Use conventional commit prefixes:
- `feat:` new capabilities
- `fix:` bug fixes
- `docs:` documentation
- `refactor:` internal cleanup
- `test:` test updates
- `chore:` tooling and maintenance

## Pull Request Checklist
- [ ] Scope is clear and limited.
- [ ] Validation, tests, and lint pass locally.
- [ ] User-facing docs updated.
- [ ] No legacy platform artifacts were added.
