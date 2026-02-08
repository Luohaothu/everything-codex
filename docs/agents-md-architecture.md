# AGENTS.md Architecture

This document describes how `everything-codex` uses the Codex CLI's hierarchical AGENTS.md system to deliver layered behavioral instructions, and how AGENTS.md interacts with skills and execution policies.

## Overview

Codex CLI reads AGENTS.md files at startup and injects their content as system-level instructions. Unlike a flat rule set, AGENTS.md files are discovered hierarchically -- from the user's global config down through the directory tree to the current working directory. This enables layered, context-sensitive rules.

everything-codex uses this hierarchy to deliver:

- **Global standards** (coding style, git workflow, security) via the root AGENTS.md
- **Language-specific rules** (Go, Python, TypeScript) via per-directory AGENTS.md templates
- **Project-level overrides** via per-project AGENTS.md files that users create themselves

## Hierarchical Discovery

Codex CLI discovers AGENTS.md files in the following order, from lowest to highest priority:

```
1. ~/.codex/AGENTS.md                    (global defaults)
2. <git-root>/AGENTS.md                  (project root)
3. <git-root>/src/AGENTS.md              (subdirectory)
4. <git-root>/src/module/AGENTS.md       (deeper subdirectory)
5. ~/.codex/AGENTS.override.md           (global override -- highest priority)
```

At each directory level from the git repository root to the current working directory, Codex looks for AGENTS.md files. The file name resolution at each level follows a priority order:

1. `AGENTS.override.md` -- highest priority override
2. `AGENTS.md` -- standard instructions
3. `TEAM_GUIDE.md` -- team-oriented alternative name
4. `.agents.md` -- hidden file variant

### Size Limit

The combined content of all discovered AGENTS.md files must not exceed **32 KiB**. Content beyond this limit is silently truncated. This means AGENTS.md files should be concise and focused -- detailed reference material belongs in skills, not in AGENTS.md.

### Merge Strategy

Each level in the hierarchy adds to the accumulated instructions. Content from more specific (deeper) directories supplements content from broader (shallower) directories. When instructions at a deeper level contradict a shallower level, the deeper level takes precedence because it appears later in the combined instruction set.

In practice:

- `~/.codex/AGENTS.md` establishes baseline standards
- A project-level `AGENTS.md` can add project-specific conventions or override global defaults
- A subdirectory `AGENTS.md` can add module-specific rules
- `~/.codex/AGENTS.override.md` always wins, regardless of directory depth

## everything-codex AGENTS.md Layout

### Global Layer: Root AGENTS.md

Installed to `~/.codex/AGENTS.md` by `scripts/install.sh`. Contains universal standards that apply to all projects:

| Section | Content |
|---|---|
| Quick Start | Project overview and skill invocation guide |
| Coding Standards | Immutability, file organization, error handling, input validation |
| Git Workflow | Commit format, PR process, feature implementation steps |
| Security Guidelines | Pre-commit checklist, secret management, security response |
| Available Skills | Table of key skills with usage guidance |
| Post-Edit Reminders | Format, type-check, lint, and test reminders (replaces PostToolUse hooks) |
| Language Detection | Hints for loading language-specific rules skills |

The root AGENTS.md is deliberately concise. Detailed patterns, testing strategies, and framework-specific knowledge are pushed into skills to stay within the 32 KiB budget.

### Language-Specific Layer: Templates

Installed to `~/.codex/<language>/AGENTS.md`. These templates provide language-specific standards:

**`~/.codex/golang/AGENTS.md`** -- Go development rules:
- gofmt/goimports requirements
- Interface design (accept interfaces, return structs)
- Error wrapping with `fmt.Errorf("...: %w", err)`
- Table-driven tests with `-race` flag
- `gosec` security scanning
- Post-edit actions (gofmt, go vet, staticcheck)

**`~/.codex/python/AGENTS.md`** -- Python development rules:
- PEP 8 conventions and type annotations
- Immutable dataclasses and NamedTuples
- black/isort/ruff formatting pipeline
- pytest with coverage and markers
- bandit security scanning
- Post-edit actions (black, isort, ruff, mypy)

**`~/.codex/typescript/AGENTS.md`** -- TypeScript/JavaScript development rules:
- Strict TypeScript, immutable patterns
- Zod schema validation
- Prettier/ESLint formatting pipeline
- Playwright E2E testing
- No console.log in production
- Post-edit actions (prettier, eslint, tsc)

### How Language Templates Work

Language-specific AGENTS.md files are loaded based on the working directory path, not based on file type detection. They activate when Codex is operating in a directory that contains the corresponding AGENTS.md.

For typical usage, language rules reach the model through three paths:

1. **Direct path match**: If the user works inside `~/.codex/golang/`, the Go AGENTS.md loads automatically. This is uncommon in practice.

2. **Project-level installation**: The `install.sh` script or `/configure-codex` skill can merge language-specific content into a project's own AGENTS.md based on detected project language (via `go.mod`, `pyproject.toml`, `package.json`, etc.).

3. **On-demand skill loading**: The root AGENTS.md includes a "Language Detection" section that instructs the model to suggest `/golang-rules`, `/python-rules`, or `/typescript-rules` skills when it detects the corresponding file types. This is the most reliable fallback.

## Skills Complement AGENTS.md

AGENTS.md and skills serve different purposes and complement each other:

| Aspect | AGENTS.md | Skills |
|---|---|---|
| Loading | Automatic at startup | On-demand via `/skill-name` |
| Purpose | Always-on standards and constraints | Detailed reference knowledge and workflows |
| Budget | Shared 32 KiB limit across all levels | No shared limit; loaded individually |
| Persistence | Active for entire session | Active once invoked in a conversation |
| Content | Concise rules, checklists, reminders | Comprehensive patterns, step-by-step processes |

**Design principle**: AGENTS.md contains "must always follow" rules (coding standards, security mandates, git workflow). Skills contain "load when needed" knowledge (TDD workflow steps, security audit checklists, architectural analysis frameworks).

### Example: Go Development

- `AGENTS.md` (always loaded): "Run `gofmt` after editing `.go` files. Wrap errors with `%w`."
- `/golang-rules` skill (on demand): Comprehensive Go-specific rules including formatting, design principles, error handling patterns, testing, and security.
- `/golang-patterns` skill (on demand): Detailed Go idioms -- functional options, dependency injection, concurrency patterns.
- `/golang-testing` skill (on demand): Table-driven test templates, benchmark patterns, mock strategies.

## Execution Policies Complement AGENTS.md

Starlark execution policies (`.rules` files) provide a separate, complementary enforcement layer:

| Aspect | AGENTS.md | Execution Policies (.rules) |
|---|---|---|
| Enforcement | Soft (model follows instructions) | Hard (runtime blocks/prompts commands) |
| Scope | Behavioral guidance | Shell command control |
| Syntax | Markdown text | Starlark `prefix_rule()` calls |
| Location | `~/.codex/AGENTS.md`, per-directory | `~/.codex/rules/*.rules`, `.codex/rules/*.rules` |

everything-codex ships three policy files:

- **`safety.rules`**: Blocks privilege escalation (`sudo`, `su`), prompts on long-running dev servers
- **`git-safety.rules`**: Blocks force push and hard reset, prompts on regular push and branch force-delete
- **`file-hygiene.rules`**: Blocks `rm -rf`, prompts on recursive delete

AGENTS.md and execution policies work together. For example:

- AGENTS.md says: "NEVER run `git push --force`"
- `git-safety.rules` enforces: `prefix_rule(pattern=["git", "push", "--force"], decision="forbidden", ...)`

The textual instruction guides the model's behavior. The execution policy catches cases where the model attempts the command anyway. This dual-layer approach provides defense in depth.

### Limitation of Execution Policies

Starlark `prefix_rule()` matches on command prefixes. It cannot intercept:

- Commands inside pipes (`find . | xargs rm -rf`)
- Commands inside subshells (`bash -c "rm -rf /tmp"`)
- Commands constructed dynamically

For these edge cases, AGENTS.md textual constraints serve as the primary defense. The root AGENTS.md includes explicit warnings about these patterns in its security guidelines.

## Installation and Customization

### Default Installation

`scripts/install.sh` installs the following AGENTS.md files:

```
~/.codex/
  AGENTS.md                # Global standards (always loaded)
  golang/AGENTS.md         # Go rules template
  python/AGENTS.md         # Python rules template
  typescript/AGENTS.md     # TypeScript rules template
```

If `~/.codex/AGENTS.md` already exists, the installer offers five merge strategies: append, include-reference, replace, skip, or dry-run diff. Existing files are never silently overwritten.

### Customization

Users can customize the AGENTS.md hierarchy:

- **Override globally**: Create `~/.codex/AGENTS.override.md` with personal preferences. This takes highest priority and is never modified by the installer.
- **Override per-project**: Create an `AGENTS.md` in the project root. This adds to or overrides global rules for that project.
- **Override per-directory**: Create `AGENTS.md` files in subdirectories for module-specific rules.
- **Disable language templates**: Delete `~/.codex/<language>/AGENTS.md` or use the uninstaller.

### Budget Management

To stay within the 32 KiB limit:

1. Keep AGENTS.md files focused on actionable rules, not reference material
2. Move detailed patterns and examples into skills
3. Use the language detection hints in root AGENTS.md rather than inlining all language rules
4. Avoid duplicating content across hierarchy levels
