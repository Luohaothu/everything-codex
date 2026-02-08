# Capability Degradation: Claude Code vs. Codex CLI

This document explicitly lists capabilities that were lost, gained, or mitigated in the migration from `everything-claude-code` (Claude Code CLI) to `everything-codex` (OpenAI Codex CLI).

## Lost Capabilities

These features existed in Claude Code and have no direct equivalent in Codex CLI.

### Programmatic Lifecycle Hooks

**What was lost**: Claude Code supported six hook event types -- `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`, and `PreCompact`. Hooks executed JavaScript scripts automatically at specific lifecycle points, enabling programmatic enforcement of formatting, linting, session persistence, and command interception.

**Impact**: High. Automated formatting after every file edit, automatic session context loading, and programmatic build analysis are no longer possible. The model must rely on textual instructions (AGENTS.md) to remember to format code, and CI pipelines must catch what the model misses.

**Partial mitigations**: See the "Mitigated Capabilities" section below for how specific hook functions are addressed.

### Plugin System

**What was lost**: Claude Code had a `.claude-plugin/` directory for packaging and distributing third-party extensions as plugins.

**Impact**: Low. The plugin ecosystem was not widely adopted. Skills and MCP servers cover the primary extension use cases.

**Mitigation**: None needed. Skills provide on-demand knowledge loading. MCP servers provide tool integration. Between the two, most plugin functionality is achievable.

### Agent Tool and Model Isolation

**What was lost**: Claude Code agents had YAML frontmatter fields `tools:` and `model:` that provided runtime-enforced isolation. A read-only agent with `tools: [Read, Grep, Glob]` could not write files, and a cost-optimized agent with `model: claude-haiku-4` used a cheaper model automatically.

**Impact**: High for tool isolation, medium for model selection.

- **Tool isolation**: Codex skills use behavioral constraints as text (e.g., "Do NOT modify any files -- analysis only"). The model follows these instructions but they are not enforced by the runtime. A skill marked as read-only could still write files if the model disregards its constraints.
- **Model selection**: Codex CLI uses the model configured in `config.toml` or the active profile for all operations. There is no per-skill model override. Users can switch models via profiles (`codex -p dev`) but not per-skill invocation.

**Mitigation**: Behavioral constraints in SKILL.md body text. For model selection, use config.toml profiles.

### OpenCode Support

**What was lost**: The `.opencode/` directory provided compatibility with the OpenCode CLI tool.

**Impact**: None for Codex users. OpenCode support was removed as the project now targets Codex CLI exclusively.

**Mitigation**: None needed.

### Chinese Translations

**What was lost**: `README.zh-CN.md` and Chinese documentation in `docs/zh-CN/` are retained as legacy reference but not updated for the new Codex structure.

**Impact**: Low. Chinese-speaking users will find outdated references to Claude Code concepts in the translated docs.

**Mitigation**: Translations can be updated in a future release. The English documentation is the source of truth.

### Session Lifecycle Hooks (Memory Persistence)

**What was lost**: `SessionStart` hooks loaded previous session context automatically. `SessionEnd` hooks persisted session state, summaries, and learned patterns for continuity across sessions.

**Impact**: Medium. Session continuity is degraded -- the model no longer automatically remembers context from previous sessions.

**Mitigation**: Manual via `/sessions` skill. Codex CLI has native session log support. Users can explicitly invoke `/sessions` to review and load context from previous sessions.

---

## Gained Capabilities

These features are new in `everything-codex` and did not exist in `everything-claude-code`.

### AGENTS.md Hierarchy

**What was gained**: A layered instruction system that discovers and merges AGENTS.md files from `~/.codex/` through the directory tree to the current working directory. More specific directories can add to or override broader rules.

**Advantage over Claude Code**: Claude Code's `rules/*.md` files were flat -- all loaded from a single directory level with no hierarchy or override mechanism. AGENTS.md hierarchy enables per-project and per-directory rule customization without modifying global configuration.

### Starlark Execution Policies

**What was gained**: Declarative command-control rules using Starlark `prefix_rule()` syntax. Rules specify `allow`, `prompt`, or `forbidden` decisions for shell commands matched by prefix pattern.

**Advantage over Claude Code**: Claude Code hooks were imperative JavaScript scripts. Starlark policies are declarative and auditable -- each rule is a single function call with a pattern, decision, and justification. The Codex runtime enforces these at the command execution level, providing stronger guarantees than pre-tool-use hooks for the patterns they can match.

### config.toml Profiles

**What was gained**: Named configuration profiles in `config.toml` that can be activated with `codex -p <name>`. Profiles can set model, approval policy, and other settings.

**Advantage over Claude Code**: Claude Code contexts (`contexts/dev.md`, `contexts/review.md`) were markdown files loaded as additional instructions. Codex profiles are structured configuration that changes runtime behavior (model selection, approval policy, sandbox settings) -- not just instructions.

### Language-Specific AGENTS.md Templates

**What was gained**: Pre-built AGENTS.md files for Go, Python, and TypeScript that encode language-specific coding standards, testing practices, security scanning, and post-edit actions.

**Advantage over Claude Code**: Claude Code had language-specific rule files, but they were loaded uniformly regardless of context. Language AGENTS.md templates provide the same content through the hierarchy system, allowing per-project language customization.

### Consolidated Language Rules Skills

**What was gained**: Three new skills -- `/golang-rules`, `/python-rules`, `/typescript-rules` -- that package comprehensive language-specific rules as on-demand knowledge. Each consolidates what was previously spread across 4-5 separate rule files.

**Advantage over Claude Code**: In Claude Code, language rules were always loaded (consuming context window). In Codex, the root AGENTS.md provides concise reminders and these skills provide detailed reference on demand, making better use of the context budget.

### Expanded Skill Count

**What was gained**: 61 skills (up from approximately 28 in v1.x). The increase comes from converting 13 agents and 18 standalone commands into skills, adding 3 language rules skills, and adding new utility skills (`configure-codex`, `multi-backend`, `multi-frontend`).

### Clean Install/Uninstall with Backup

**What was gained**: `scripts/install.sh` creates timestamped backups before installation, supports five merge strategies for existing AGENTS.md files, records an install manifest, and supports rollback. `scripts/uninstall.sh` uses the manifest for clean removal.

**Advantage over Claude Code**: The original project had no formal install/uninstall mechanism. Users manually copied files.

---

## Mitigated Capabilities

These capabilities were lost in the migration but have explicit workarounds or partial replacements.

### Hook-Based Formatting --> CI Scripts

**Original**: `PostToolUse` hooks ran `prettier`, `gofmt`, or `black` automatically after every file edit.

**Mitigation**:
1. **AGENTS.md text**: The root AGENTS.md and language-specific AGENTS.md files include "Post-Edit Actions" sections that instruct the model to run formatters after editing files.
2. **CI script**: `scripts/ci/check-format.sh` verifies formatting in CI pipelines, catching any files the model failed to format.

**Gap**: Formatting is no longer guaranteed on every edit. It depends on the model following instructions. CI catches issues at PR time, not at edit time.

### Hook-Based Debug Detection --> CI Scripts

**Original**: `PostToolUse`/`Stop` hooks detected `console.log`, `print()`, and other debug statements left in code.

**Mitigation**:
1. **AGENTS.md text**: The TypeScript AGENTS.md template states "No `console.log` statements in production code."
2. **CI script**: `scripts/ci/check-console-log.sh` scans for debug statements in CI pipelines.

**Gap**: Same as formatting -- detection is deferred to CI rather than immediate.

### Session Management Hooks --> /sessions Skill

**Original**: `SessionStart` loaded previous session context. `SessionEnd` persisted state and learned patterns.

**Mitigation**: The `/sessions` skill provides manual session management. Users invoke it to review session history and carry forward context. Codex CLI also maintains native session logs that persist across invocations.

**Gap**: Session continuity is no longer automatic. Users must explicitly invoke `/sessions` or rely on Codex's native session log.

### Continuous Learning Hooks --> /learn Skill

**Original**: `SessionEnd` hooks evaluated session patterns and updated learned rules automatically.

**Mitigation**: The `/learn` skill provides manual learning capture. Users invoke it after a session to extract and record patterns, decisions, and insights.

**Gap**: Learning is no longer automatic. Users must explicitly invoke `/learn`. The `continuous-learning-v2` skill has been updated to work without hook dependencies.

---

## Summary Table

| Category | Capability | Status | Replacement |
|---|---|---|---|
| **Lost** | Programmatic hooks (6 event types) | No equivalent | AGENTS.md text + CI scripts + execution policies |
| **Lost** | Plugin system (.claude-plugin/) | No equivalent | Skills + MCP servers |
| **Lost** | Agent tool isolation (tools: frontmatter) | No equivalent | Behavioral text constraints in SKILL.md |
| **Lost** | Agent model selection (model: frontmatter) | No equivalent | config.toml profiles |
| **Lost** | OpenCode support (.opencode/) | Removed | N/A |
| **Lost** | Chinese translation updates | Deferred | Future release |
| **Lost** | Automatic session persistence | No equivalent | Manual `/sessions` skill |
| **Gained** | AGENTS.md hierarchy | New | -- |
| **Gained** | Starlark execution policies | New | -- |
| **Gained** | config.toml profiles | New | -- |
| **Gained** | Language AGENTS.md templates | New | -- |
| **Gained** | Language rules skills (3) | New | -- |
| **Gained** | 61 skills (up from ~28) | Expanded | -- |
| **Gained** | Clean install/uninstall with backup | New | -- |
| **Mitigated** | Auto-formatting after edit | Degraded | AGENTS.md text + `check-format.sh` |
| **Mitigated** | Debug statement detection | Degraded | AGENTS.md text + `check-console-log.sh` |
| **Mitigated** | Session continuity | Degraded | Manual `/sessions` skill |
| **Mitigated** | Continuous learning | Degraded | Manual `/learn` skill |
