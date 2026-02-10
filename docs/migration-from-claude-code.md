# Migration from Claude Code to Codex CLI

This document maps every concept from the original `everything-claude-code` project (Claude Code CLI toolkit) to its equivalent in `everything-codex` (OpenAI Codex CLI toolkit). Use it as a reference when porting workflows, understanding the new structure, or troubleshooting missing functionality.

## Concept Mapping

### agents/ --> skills/ (with behavioral constraints)

**Claude Code**: 14 agent `.md` files in `agents/`, each with YAML frontmatter specifying `tools:` (allowed tool list) and `model:` (model selection). Agents ran as isolated subagents with tool/model constraints enforced by the runtime.

**Codex CLI**: Agent files are consolidated into `skills/` as `SKILL.md` files. Frontmatter contains only `name` and `description` -- there are no `tools` or `model` fields. Tool restrictions are expressed as behavioral constraints in the SKILL.md body text (e.g., "Do NOT modify any files -- analysis only").

**Migration table**:

| Claude Code Agent | Codex Skill | Behavioral Constraint |
|---|---|---|
| `agents/planner.md` | `skills/plan/SKILL.md` | Read-only: do not modify files |
| `agents/code-reviewer.md` | `skills/code-review/SKILL.md` | Read-only: analyze, do not modify |
| `agents/security-reviewer.md` | `skills/security-review/SKILL.md` | Read-only: security audit |
| `agents/tdd-guide.md` | `skills/tdd/SKILL.md` | Read-write: write tests and implementation |
| `agents/architect.md` | `skills/architect/SKILL.md` | Read-only: design analysis |
| `agents/build-error-resolver.md` | `skills/build-fix/SKILL.md` | Read-write: fix builds |
| `agents/database-reviewer.md` | `skills/database-review/SKILL.md` | Read-only |
| `agents/doc-updater.md` | `skills/doc-updater/SKILL.md` | Read-write: update docs |
| `agents/e2e-runner.md` | `skills/e2e/SKILL.md` | Read-write: generate and run tests |
| `agents/go-build-resolver.md` | `skills/go-build-fix/SKILL.md` | Read-write |
| `agents/go-reviewer.md` | `skills/go-review/SKILL.md` | Read-only |
| `agents/python-reviewer.md` | `skills/python-review/SKILL.md` | Read-only |
| `agents/refactor-cleaner.md` | `skills/refactor-clean/SKILL.md` | Read-write |

**Key difference**: Claude Code enforced tool restrictions at the runtime level. Codex relies on textual behavioral constraints that the model follows as instructions. This is a soft enforcement model -- see `docs/capability-degradation.md` for details.

---

### commands/ --> skills/

**Claude Code**: 31 command `.md` files in `commands/`. Commands were invoked as `/command-name` and provided structured workflows.

**Codex CLI**: Commands are merged into `skills/` as `SKILL.md` files. The invocation syntax remains the same (`/skill-name`). Some commands were merged with their corresponding agent into a single skill; others were converted directly.

**Merged commands** (agent + command became one skill):

| Command | Merged Into |
|---|---|
| `commands/plan.md` | `skills/plan/SKILL.md` (with planner agent) |
| `commands/code-review.md` | `skills/code-review/SKILL.md` (with code-reviewer agent) |
| `commands/tdd.md` | `skills/tdd/SKILL.md` (with tdd-guide agent + tdd-workflow skill) |
| `commands/build-fix.md` | `skills/build-fix/SKILL.md` (with build-error-resolver agent) |
| `commands/go-build.md` | `skills/go-build-fix/SKILL.md` (with go-build-resolver agent) |
| `commands/go-review.md` | `skills/go-review/SKILL.md` (with go-reviewer agent) |
| `commands/python-review.md` | `skills/python-review/SKILL.md` (with python-reviewer agent) |
| `commands/e2e.md` | `skills/e2e/SKILL.md` (with e2e-runner agent) |
| `commands/refactor-clean.md` | `skills/refactor-clean/SKILL.md` (with refactor-cleaner agent) |
| `commands/update-docs.md` + `commands/update-codemaps.md` | `skills/doc-updater/SKILL.md` |

**Directly converted commands** (became standalone skills):

`eval`, `verify`, `checkpoint`, `learn`, `test-coverage`, `go-test`, `evolve`, `instinct-status`, `instinct-export`, `instinct-import`, `skill-create`, `setup-pm`, `pm2`, `orchestrate`, `sessions`, `multi-plan`, `multi-execute`, `multi-workflow`

---

### hooks/hooks.json --> rules/*.rules + AGENTS.md + scripts/ci/

**Claude Code**: `hooks/hooks.json` defined programmatic lifecycle hooks across five event types: `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, and `SessionEnd`. Hooks executed JavaScript scripts automatically at specific lifecycle points.

**Codex CLI**: There is no equivalent hook system. Functionality is distributed across three mechanisms:

| Hook Type | Codex Replacement | Mechanism |
|---|---|---|
| **Safety hooks** (block dangerous commands) | `rules/*.rules` | Starlark execution policies with `prefix_rule()` |
| **Formatting/linting reminders** | `AGENTS.md` "Post-Edit Reminders" section | Textual instructions to the model |
| **Automated checks** (format, type-check, lint) | `scripts/ci/` scripts | CI pipeline scripts for PR validation |
| **Session lifecycle** (start, end) | Removed | Codex has native session management |

**Hook-by-hook migration**:

| Original Hook | Type | Migrated To |
|---|---|---|
| Block dev server outside tmux | PreToolUse | `rules/safety.rules` (`prompt` decision) |
| Git push review | PreToolUse | `rules/git-safety.rules` (`prompt` decision) |
| Block `rm -rf` | PreToolUse | `rules/file-hygiene.rules` (`forbidden` decision) |
| Suggest `/compact` | PreToolUse | Removed (Codex has no `/compact`) |
| Auto-format (prettier/gofmt/black) | PostToolUse | AGENTS.md text + `scripts/ci/check-format.sh` |
| TypeScript type check (tsc) | PostToolUse | AGENTS.md text + language AGENTS.md templates |
| console.log warning | PostToolUse/Stop | AGENTS.md text + `scripts/ci/check-console-log.sh` |
| Log PR URL | PostToolUse | AGENTS.md text |
| Async build analysis | PostToolUse | `scripts/ci/build-analysis.sh` (planned) |
| Load session context | SessionStart | Removed (Codex native sessions) |
| Persist session state | SessionEnd | Removed (Codex native sessions) |
| Evaluate session patterns | SessionEnd | Manual via `/learn` skill |

---

### rules/*.md --> AGENTS.md hierarchy + language AGENTS.md templates

**Claude Code**: Flat set of `.md` rule files in `~/.claude/rules/`, organized by topic (coding-style, testing, patterns, security, etc.) with language-specific variants. All rule files were loaded from a single directory level.

**Codex CLI**: Rules are expressed through a hierarchical AGENTS.md system:

| Claude Code Rule | Codex Equivalent | Location |
|---|---|---|
| `rules/common/coding-style.md` | Root `AGENTS.md` "Coding Standards" section | Project root |
| `rules/common/git-workflow.md` | Root `AGENTS.md` "Git Workflow" section | Project root |
| `rules/common/security.md` | Root `AGENTS.md` "Security Guidelines" section | Project root |
| `rules/common/testing.md` | Language-specific AGENTS.md templates | `golang/AGENTS.md`, `python/AGENTS.md`, `typescript/AGENTS.md` |
| `rules/common/patterns.md` | Language-specific AGENTS.md + pattern skills | Various |
| `rules/common/performance.md` | Removed (Codex-specific model info not applicable) | -- |
| `rules/golang/*.md` | `golang/AGENTS.md` template + `/golang-rules` skill | `~/.codex/golang/AGENTS.md` |
| `rules/python/*.md` | `python/AGENTS.md` template + `/python-rules` skill | `~/.codex/python/AGENTS.md` |
| `rules/typescript/*.md` | `typescript/AGENTS.md` template + `/typescript-rules` skill | `~/.codex/typescript/AGENTS.md` |

The rule source files (`rules/common/`, `rules/golang/`, etc.) are retained in the repository as reference material and as the source of truth for the consolidated AGENTS.md content and language rules skills.

---

### contexts/ --> config.toml profiles

**Claude Code**: Three context files (`contexts/dev.md`, `contexts/review.md`, `contexts/research.md`) that could be loaded to switch the assistant's behavior mode.

**Codex CLI**: Replaced by `[profiles.*]` sections in `config.toml`. Profiles are activated with `codex -p <profile>`.

| Claude Code Context | Codex Profile | Configuration |
|---|---|---|
| `contexts/dev.md` | `[profiles.dev]` | `model = "o4-mini"`, `approval_policy = "on-failure"` |
| `contexts/review.md` | `[profiles.review]` | `model = "o4-mini"`, `approval_policy = "untrusted"` |
| `contexts/research.md` | `[profiles.research]` | `model = "o4-mini"`, `web_search = "live"` |

---

### .claude-plugin/ --> Removed

**Claude Code**: Plugin system (`.claude-plugin/`) for distributing and loading third-party extensions.

**Codex CLI**: No equivalent plugin system exists. Functionality is covered by skills and MCP servers. The plugin directory has been deleted.

---

### mcp-configs/ --> config.toml [mcp_servers] section

**Claude Code**: MCP server configurations stored in `mcp-configs/mcp-servers.json` as a JSON file.

**Codex CLI**: MCP servers are configured in `config.toml` under `[mcp_servers.*]` sections using TOML syntax.

Example mapping:

```
# Claude Code (mcp-servers.json)
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}" }
  }
}

# Codex CLI (config.toml)
[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "${GITHUB_PAT}" }
```

The config.toml ships with 14 MCP server definitions. Most are disabled by default (`enabled = false`) to preserve context window budget. Enable them by setting `enabled = true` and configuring the required environment variables.

---

### ~/.claude/ --> ~/.codex/ (global config)

**Claude Code**: Global configuration directory at `~/.claude/`, containing `settings.json`, `rules/`, `skills/`, and other files.

**Codex CLI**: Global configuration directory at `~/.codex/`, containing:

| Path | Purpose |
|---|---|
| `~/.codex/AGENTS.md` | Global behavioral instructions |
| `~/.codex/AGENTS.override.md` | Override instructions (highest priority) |
| `~/.codex/config.toml` | Model, sandbox, profiles, MCP servers |
| `~/.codex/rules/*.rules` | Starlark execution policies |
| `~/.codex/golang/AGENTS.md` | Go-specific rules template |
| `~/.codex/python/AGENTS.md` | Python-specific rules template |
| `~/.codex/typescript/AGENTS.md` | TypeScript-specific rules template |

---

### ~/.claude/skills/ --> ~/.agents/skills/ (user skills)

**Claude Code**: Skills installed to `~/.claude/skills/<skill-name>/SKILL.md`.

**Codex CLI**: Skills installed to `~/.agents/skills/<skill-name>/SKILL.md`. The `~/.agents/` directory is the Codex CLI standard location for user-level skills.

---

## SKILL.md Format Changes

The SKILL.md frontmatter format has changed:

```yaml
# Claude Code SKILL.md
---
name: plan
description: Implementation planning
tools:
  - Task
  - Read
  - Grep
  - Glob
  - WebSearch
model: claude-sonnet-4-20250514
---

# Codex CLI SKILL.md
---
name: plan
description: Implementation planning
---
```

The `tools` and `model` fields are removed. Tool restrictions are expressed as behavioral constraints in the markdown body. There is no model selection -- Codex uses the model configured in `config.toml` or the active profile.

---

## Directory Structure Comparison

```
# Claude Code (everything-claude-code)       # Codex CLI (everything-codex)
├── agents/              (14 files)           ├── AGENTS.md              (root instructions)
├── commands/            (31 files)           ├── golang/AGENTS.md       (Go rules template)
├── hooks/hooks.json     (lifecycle hooks)    ├── python/AGENTS.md       (Python rules template)
├── rules/               (.md rule files)     ├── typescript/AGENTS.md   (TS rules template)
├── contexts/            (3 context files)    ├── config.toml            (profiles + MCP)
├── skills/              (29 skills)          ├── rules/                 (Starlark .rules)
├── .claude-plugin/      (plugin system)      ├── skills/                (62 skills)
├── mcp-configs/         (JSON MCP configs)   ├── scripts/ci/            (CI check scripts)
├── .opencode/           (OpenCode support)   ├── scripts/install.sh     (installer)
└── README.zh-CN.md      (Chinese docs)       └── scripts/uninstall.sh   (uninstaller)
```

---

## Quick Reference: What Moved Where

| If you used this in Claude Code... | Do this in Codex CLI... |
|---|---|
| `/plan` command | `/plan` skill (same invocation) |
| `/code-review` command | `/code-review` skill (same invocation) |
| Agent with `tools: [Read, Grep]` | Skill with "Do NOT modify files" in body text |
| Agent with `model: claude-haiku-4` | Use `codex -p <profile>` for model switching |
| `hooks/hooks.json` safety hooks | Edit `~/.codex/rules/*.rules` (Starlark) |
| `hooks/hooks.json` formatting hooks | Check AGENTS.md reminders + run CI scripts |
| `contexts/dev.md` | `codex -p dev` |
| `~/.claude/settings.json` | `~/.codex/config.toml` |
| `mcp-configs/mcp-servers.json` | `config.toml` `[mcp_servers.*]` sections |
| `.claude-plugin/` extensions | No equivalent -- use skills or MCP servers |
| `/compact` hook triggers | Removed (no `/compact` in Codex) |
| Session start/end hooks | Codex native sessions; manual `/sessions` skill |
