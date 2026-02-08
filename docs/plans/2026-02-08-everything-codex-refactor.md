# Everything-Codex Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor everything-claude-code into everything-codex — a pure OpenAI Codex CLI toolkit with the same positioning, fully leveraging Codex-native features (AGENTS.md hierarchy, skills, Starlark execution policies, config profiles).

**Architecture:** Three-layer approach: (1) AGENTS.md hierarchy for behavioral rules, (2) skills for specialized workflows and on-demand knowledge, (3) Starlark `.rules` for command execution safety. All 13 agents + 31 commands merge into ~60 skills. Hooks decompose into execution policies + AGENTS.md instructions.

**Tech Stack:** Markdown (AGENTS.md, SKILL.md), Starlark (execution policies), TOML (config.toml, requirements.toml), Shell (install scripts)

**Worktree:** `/Volumes/nvme/projects/everything-codex/.worktrees/refactor-to-codex/`
**Branch:** `refactor/everything-codex`

---

## Task 1: Delete Claude Code-specific directories

**Files:**
- Delete: `.claude-plugin/` (4 files — plugin.json, marketplace.json, PLUGIN_SCHEMA_NOTES.md, README.md)
- Delete: `.opencode/` (48 files — entire OpenCode migration)
- Delete: `hooks/` (hooks.json — lifecycle hooks)
- Delete: `contexts/` (dev.md, review.md, research.md — migrated to config profiles)
- Delete: `plugins/` (README.md — placeholder)
- Delete: `schemas/` (if exists — Claude Code schema files)

**Step 1: Remove directories**

```bash
cd /Volumes/nvme/projects/everything-codex/.worktrees/refactor-to-codex
rm -rf .claude-plugin .opencode hooks contexts plugins schemas
```

**Step 2: Verify removal**

```bash
ls -d .claude-plugin .opencode hooks contexts plugins schemas 2>&1
```
Expected: All "No such file or directory"

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove Claude Code-specific directories

Remove .claude-plugin/, .opencode/, hooks/, contexts/, plugins/, schemas/
These are replaced by Codex-native mechanisms:
- hooks -> Starlark execution policies + AGENTS.md instructions
- contexts -> config.toml profiles
- .claude-plugin -> git-based distribution
- .opencode -> no longer needed (pure Codex target)"
```

---

## Task 2: Delete original agents/ and commands/ directories

These will be recreated as skills/ entries in later tasks. Delete the source directories now to avoid confusion.

**Files:**
- Delete: `agents/` (13 .md files)
- Delete: `commands/` (31 .md files)

**Step 1: Ensure content is preserved in git history**

The content will be recreated as skills. Git history preserves the originals.

```bash
cd /Volumes/nvme/projects/everything-codex/.worktrees/refactor-to-codex
rm -rf agents commands
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove agents/ and commands/ directories

Content will be recreated as Codex skills in skills/ directory.
Agents become role-switching skills with behavioral constraints.
Commands become slash-command-invocable skills."
```

---

## Task 3: Delete old rules/ directory

The old `rules/` contains markdown coding guidelines. Codex uses `rules/` for Starlark execution policies (different purpose). Delete old, create new later.

**Files:**
- Delete: `rules/` (24 files — common/, golang/, python/, typescript/, README.md)

**Step 1: Save content references before deleting**

Content will be used in Tasks 5 (AGENTS.md) and Task 8 (language rules skills). Git history preserves originals.

```bash
cd /Volumes/nvme/projects/everything-codex/.worktrees/refactor-to-codex
rm -rf rules
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove old rules/ directory (markdown guidelines)

rules/ will be recreated with Starlark execution policies.
Markdown coding guidelines move to:
- AGENTS.md (common rules)
- skills/golang-rules/, python-rules/, typescript-rules/ (language-specific)"
```

---

## Task 4: Clean up root-level Claude Code artifacts

**Files:**
- Delete: `package.json` (npm config for Claude Code plugin validation)
- Delete: `package-lock.json`
- Delete: `commitlint.config.js` (commit linting config — optional, keep if desired)
- Delete: `eslint.config.js` (ESLint config — not needed for config-only project)
- Delete: `.markdownlint.json` (keep if user wants markdown linting)
- Delete: `examples/CLAUDE.md` (Claude Code specific)
- Delete: `examples/user-CLAUDE.md` (Claude Code specific)
- Delete: `examples/statusline.json` (Claude Code specific)
- Delete: `examples/sessions/` (Claude Code session format)
- Delete: `the-longform-guide.md` (Claude Code specific guide)
- Delete: `the-shortform-guide.md` (Claude Code specific guide)
- Delete: `SPONSORS.md` (keep if applicable)

**Step 1: Remove files**

```bash
cd /Volumes/nvme/projects/everything-codex/.worktrees/refactor-to-codex
rm -f package.json package-lock.json commitlint.config.js eslint.config.js .markdownlint.json
rm -f the-longform-guide.md the-shortform-guide.md
rm -rf examples/
```

**Step 2: Create new examples/ directory structure**

```bash
mkdir -p examples
```

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove Claude Code root-level artifacts

Remove npm configs, linting configs, Claude-specific guides and examples.
Will be replaced with Codex-specific examples and config."
```

---

## Task 5: Create root AGENTS.md

The core behavioral instructions file. Merges content from `rules/common/coding-style.md`, `git-workflow.md`, `security.md`, and `agents.md` (rewritten for skills).

**Files:**
- Create: `AGENTS.md`

**Step 1: Write AGENTS.md**

Create `AGENTS.md` with these sections (content adapted from original rules/common/ files, all Claude Code references removed):

```markdown
# Everything Codex — Global Instructions

Production-ready configurations and skills for OpenAI Codex CLI.

## Coding Standards

### Immutability
ALWAYS create new objects, NEVER mutate existing ones. Immutable data prevents hidden side effects and enables safe concurrency.

### File Organization
MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Organize by feature/domain, not by type

### Error Handling
- Handle errors explicitly at every level
- Provide user-friendly error messages in UI-facing code
- Log detailed error context server-side
- Never silently swallow errors

### Input Validation
- Validate all user input at system boundaries
- Use schema-based validation where available
- Fail fast with clear error messages

## Git Workflow

### Commit Format
```
<type>: <description>

<optional body>
```
Types: feat, fix, refactor, docs, test, chore, perf, ci

### Pull Request Workflow
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary with test plan
4. Push with `-u` flag if new branch

### Feature Implementation
1. Plan first — use `/plan` skill
2. TDD approach — use `/tdd` skill (RED → GREEN → REFACTOR)
3. Code review — use `/code-review` skill after writing code
4. Security review — use `/security-review` for auth/payment/PII

## Security Guidelines

### Mandatory Checks Before Commit
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized output)
- CSRF protection enabled
- Authentication/authorization verified
- Error messages don't leak sensitive data

### Secret Management
- NEVER hardcode secrets in source code
- ALWAYS use environment variables or secret managers
- Validate required secrets are present at startup

## Available Skills

Use `/` in Codex to invoke skills. Key skills:

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| /plan | Implementation planning | Complex features, refactoring |
| /architect | System design | Architectural decisions |
| /tdd | Test-driven development | New features, bug fixes |
| /code-review | Code review | After writing code |
| /security-review | Security analysis | Before commits |
| /build-fix | Fix build errors | When build fails |
| /e2e | E2E testing | Critical user flows |
| /refactor-clean | Dead code cleanup | Code maintenance |
| /orchestrate | Multi-phase workflow | Full feature implementation |

## After Editing Files

These behaviors replace automated hooks — follow them manually:

- **After editing JS/TS files**: Run `npx prettier --write <file>`
- **After editing .ts/.tsx files**: Run `npx tsc --noEmit` to check types
- **Before committing**: Grep modified files for `console.log` and remove
- **After creating a PR**: Display the PR URL and review command
- **Before running long commands**: Consider using tmux for persistence
```

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "feat: create root AGENTS.md with global instructions

Merges rules/common/ content (coding-style, git-workflow, security, agents)
into Codex AGENTS.md format. All Claude Code references removed.
Includes skill usage guide and post-edit behavior reminders."
```

---

## Task 6: Create language-specific AGENTS.md templates

**Files:**
- Create: `golang/AGENTS.md`
- Create: `python/AGENTS.md`
- Create: `typescript/AGENTS.md`

**Step 1: Create golang/AGENTS.md**

Merge content from `rules/golang/coding-style.md`, `testing.md`, `patterns.md`, `security.md`:

```markdown
# Go Development Guidelines

## Formatting
- **gofmt** and **goimports** are mandatory — no style debates

## Design Principles
- Accept interfaces, return structs
- Keep interfaces small (1-3 methods)
- Define interfaces where they are used, not where implemented

## Error Handling
Always wrap errors with context:
```go
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}
```

## Testing
- Use standard `go test` with table-driven tests
- Always run with `-race` flag: `go test -race ./...`
- Check coverage: `go test -cover ./...`

## Security
- Use `context.Context` for timeout control
- Use `gosec` for static security analysis: `gosec ./...`
- Load secrets from environment: `os.Getenv("API_KEY")`

## Patterns
Use functional options for constructors:
```go
type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}
```

## Related Skills
- `/golang-patterns` — comprehensive Go idioms
- `/golang-testing` — detailed Go testing patterns
- `/go-review` — Go code review
- `/go-build-fix` — fix Go build errors
- `/go-test` — Go TDD workflow
```

**Step 2: Create python/AGENTS.md**

Merge `rules/python/*.md`:

```markdown
# Python Development Guidelines

## Style
- Follow PEP 8
- Use type hints for all function signatures
- Use `black` for formatting, `isort` for imports

## Testing
- Use `pytest` with fixtures and parametrize
- Run: `pytest -v --tb=short`
- Coverage: `pytest --cov=. --cov-report=term-missing`

## Error Handling
```python
try:
    result = do_something()
except SpecificError as e:
    logger.error("Failed to do something: %s", e)
    raise
```

## Security
- Use `bandit` for security scanning: `bandit -r .`
- Never use `eval()` or `exec()` with user input
- Use parameterized queries, never string formatting for SQL

## Related Skills
- `/python-patterns` — Pythonic idioms and patterns
- `/python-testing` — pytest patterns and TDD
- `/python-review` — Python code review
```

**Step 3: Create typescript/AGENTS.md**

Merge `rules/typescript/*.md`:

```markdown
# TypeScript Development Guidelines

## Style
- Use strict TypeScript (`strict: true` in tsconfig)
- Prefer `interface` over `type` for object shapes
- Use ESLint + Prettier for formatting

## Testing
- Use Jest or Vitest for unit tests
- Run: `npx vitest run` or `npx jest`
- Coverage: `npx vitest run --coverage`

## Error Handling
```typescript
try {
  const result = await fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    logger.error('Network failure:', error.message);
  }
  throw error;
}
```

## Security
- Validate all API inputs with Zod or similar
- Sanitize HTML output to prevent XSS
- Use environment variables for secrets

## Related Skills
- `/coding-standards` — TypeScript/React coding standards
- `/frontend-patterns` — React and Next.js patterns
- `/backend-patterns` — Node.js backend patterns
```

**Step 4: Commit**

```bash
mkdir -p golang python typescript
# (write files)
git add golang/ python/ typescript/
git commit -m "feat: create language-specific AGENTS.md templates

Go, Python, TypeScript hierarchical AGENTS.md files.
Codex auto-discovers these based on working directory.
Merged from rules/golang/, rules/python/, rules/typescript/."
```

---

## Task 7: Create Starlark execution policy rules

**Files:**
- Create: `rules/safety.rules`
- Create: `rules/git-safety.rules`
- Create: `rules/file-hygiene.rules`

**Step 1: Write rules/safety.rules**

```starlark
# Block dev servers outside tmux — ensures log access
prefix_rule(
    pattern=["npm", "run", "dev"],
    decision="prompt",
    justification="Dev servers should run in tmux for log persistence. Use: tmux new-session -d -s dev 'npm run dev'"
)

prefix_rule(
    pattern=["pnpm", "dev"],
    decision="prompt",
    justification="Dev servers should run in tmux for log persistence"
)

prefix_rule(
    pattern=["yarn", "dev"],
    decision="prompt",
    justification="Dev servers should run in tmux for log persistence"
)
```

**Step 2: Write rules/git-safety.rules**

```starlark
# Require confirmation before git push
prefix_rule(
    pattern=["git", "push"],
    decision="prompt",
    justification="Review changes before pushing to remote"
)

# Forbid force push
prefix_rule(
    pattern=["git", "push", "--force"],
    decision="forbidden",
    justification="Force push can lose work. Use --force-with-lease if needed."
)

# Forbid hard reset
prefix_rule(
    pattern=["git", "reset", "--hard"],
    decision="forbidden",
    justification="Hard reset discards uncommitted changes permanently"
)
```

**Step 3: Write rules/file-hygiene.rules**

```starlark
# Forbid dangerous recursive deletes
prefix_rule(
    pattern=["rm", "-rf"],
    decision="prompt",
    justification="Recursive force delete is dangerous. Verify the target path."
)

prefix_rule(
    pattern=["rm", "-r"],
    decision="prompt",
    justification="Recursive delete requires confirmation"
)
```

**Step 4: Commit**

```bash
mkdir -p rules
# (write files)
git add rules/
git commit -m "feat: create Starlark execution policy rules

safety.rules — dev server tmux reminders
git-safety.rules — push confirmation, forbid force push/hard reset
file-hygiene.rules — dangerous delete confirmation

Replaces PreToolUse hooks from Claude Code."
```

---

## Task 8: Create config.toml

**Files:**
- Create: `config.toml`

**Step 1: Write config.toml**

Convert `mcp-configs/mcp-servers.json` to TOML + add profiles from `contexts/`:

```toml
# Everything Codex — Codex CLI Configuration
# Copy sections you need to ~/.codex/config.toml

model = "o4-mini"

# ============================================================
# MCP Servers
# Replace YOUR_*_HERE placeholders with actual values
# Keep under 10 MCPs enabled to preserve context window
# ============================================================

[mcp.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
[mcp.github.env]
GITHUB_PERSONAL_ACCESS_TOKEN = "${GITHUB_PAT}"

[mcp.firecrawl]
command = "npx"
args = ["-y", "firecrawl-mcp"]
[mcp.firecrawl.env]
FIRECRAWL_API_KEY = "${FIRECRAWL_API_KEY}"

[mcp.supabase]
command = "npx"
args = ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=YOUR_PROJECT_REF"]

[mcp.memory]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-memory"]

[mcp.sequential-thinking]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]

[mcp.railway]
command = "npx"
args = ["-y", "@railway/mcp-server"]

[mcp.context7]
command = "npx"
args = ["-y", "@context7/mcp-server"]

[mcp.magic]
command = "npx"
args = ["-y", "@magicuidesign/mcp@latest"]

[mcp.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/your/projects"]

# HTTP-based MCP servers
# [mcp.vercel]
# url = "https://mcp.vercel.com"

# [mcp.cloudflare-docs]
# url = "https://docs.mcp.cloudflare.com/mcp"

# [mcp.clickhouse]
# url = "https://mcp.clickhouse.cloud/mcp"

# ============================================================
# Config Profiles (invoke with: codex -p <profile>)
# ============================================================

[profiles.dev]
# Development mode: code first, explain after
# Prefer working solutions over perfect solutions
# Run tests after changes, keep commits atomic

[profiles.review]
# Code review mode: read thoroughly before commenting
# Prioritize by severity: critical > high > medium > low
# Check for security, performance, readability, test coverage

[profiles.research]
# Research mode: understand before acting
# Read widely before concluding, document findings
# Don't write code until understanding is clear
```

**Step 2: Commit**

```bash
git add config.toml
git commit -m "feat: create config.toml with MCP servers and profiles

Converts mcp-configs/mcp-servers.json to Codex TOML format.
Adds dev/review/research profiles (from contexts/).
15 MCP server configurations included as templates."
```

---

## Task 9: Create requirements.toml

**Files:**
- Create: `requirements.toml`

**Step 1: Write requirements.toml**

```toml
# Everything Codex — Organization-Level Security Constraints
# Copy to ~/.codex/requirements.toml for enforcement

[security]
# Prevent secrets from being committed to code
no_secrets_in_code = true
# Require parameterized queries for database access
require_parameterized_queries = true

[approval]
# Require approval for network operations
network_access = "prompt"
# Require approval for file deletions
file_delete = "prompt"
```

**Step 2: Commit**

```bash
git add requirements.toml
git commit -m "feat: create requirements.toml for security constraints

Codex-native organization-level security enforcement.
New capability not available in Claude Code."
```

---

## Task 10: Convert 13 agents to skills (agent-derived skills)

This is the largest single task. Each agent becomes a skill with role-switching prompt and behavioral constraints.

**Files:**
- Create: `skills/plan/SKILL.md` (from agents/planner.md + commands/plan.md)
- Create: `skills/code-review/SKILL.md` (from agents/code-reviewer.md + commands/code-review.md)
- Create: `skills/security-review/SKILL.md` (from agents/security-reviewer.md + skills/security-review/SKILL.md)
- Create: `skills/security-review/references/cloud-infrastructure-security.md` (from skills/security-review/cloud-infrastructure-security.md)
- Create: `skills/tdd/SKILL.md` (from agents/tdd-guide.md + commands/tdd.md + skills/tdd-workflow/SKILL.md)
- Create: `skills/architect/SKILL.md` (from agents/architect.md)
- Create: `skills/build-fix/SKILL.md` (from agents/build-error-resolver.md + commands/build-fix.md)
- Create: `skills/database-review/SKILL.md` (from agents/database-reviewer.md)
- Create: `skills/doc-updater/SKILL.md` (from agents/doc-updater.md + commands/update-docs.md + commands/update-codemaps.md)
- Create: `skills/e2e/SKILL.md` (from agents/e2e-runner.md + commands/e2e.md)
- Create: `skills/go-build-fix/SKILL.md` (from agents/go-build-resolver.md + commands/go-build.md)
- Create: `skills/go-review/SKILL.md` (from agents/go-reviewer.md + commands/go-review.md)
- Create: `skills/python-review/SKILL.md` (from agents/python-reviewer.md + commands/python-review.md)
- Create: `skills/refactor-clean/SKILL.md` (from agents/refactor-cleaner.md + commands/refactor-clean.md)

**Conversion pattern for each agent:**

1. Read the original agent .md file from git history: `git show HEAD~4:agents/<name>.md`
2. Read the corresponding command .md file: `git show HEAD~4:commands/<name>.md`
3. Create `skills/<name>/SKILL.md` with Codex format:

```markdown
---
name: <skill-name>
description: <from agent description, Claude Code references removed>
---

# <Role Name> Mode

**BEHAVIORAL CONSTRAINTS:**
- [Derived from agent tools field]
- Read-only agents: "DO NOT modify any files. Only read, search, and analyze."
- Write agents: "You may modify files to implement changes."

## Your Role
[Agent body content, Claude Code references removed]

## When to Use
[From command's "When to Use" section]

## Workflow
[Merged from command's workflow description]
```

**Step 1: Create all 14 skill directories and SKILL.md files**

Use the conversion pattern above for each agent. Key transformations:
- `tools: ["Read", "Grep", "Glob"]` → "CONSTRAINT: Do NOT modify files"
- `tools: ["Read", "Grep", "Glob", "Bash"]` (code-reviewer) → "CONSTRAINT: Read and analyze only"
- `tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]` → "You may modify files"
- Remove `model: opus/sonnet/haiku` field entirely
- Replace "Claude Code" with "Codex" or remove
- Replace "Task tool" / "agent" references with "skill" references
- Replace `~/.claude/agents/` with `~/.codex/skills/`

**Step 2: Commit**

```bash
git add skills/plan/ skills/code-review/ skills/security-review/ skills/tdd/ \
  skills/architect/ skills/build-fix/ skills/database-review/ skills/doc-updater/ \
  skills/e2e/ skills/go-build-fix/ skills/go-review/ skills/python-review/ \
  skills/refactor-clean/
git commit -m "feat: convert 13 agents to Codex skills

Each agent becomes a skill with:
- Codex SKILL.md format (name/description frontmatter)
- Role-switching prompt with behavioral constraints
- Merged content from corresponding command files
- All Claude Code references removed"
```

---

## Task 11: Convert 18 remaining commands to skills

**Files:**
- Create: `skills/orchestrate/SKILL.md` (REWRITE — multi-agent chain becomes sequential skill guide)
- Create: `skills/eval/SKILL.md` (merge commands/eval.md + skills/eval-harness/SKILL.md)
- Create: `skills/verify/SKILL.md` (merge commands/verify.md + skills/verification-loop/SKILL.md)
- Create: `skills/checkpoint/SKILL.md` (from commands/checkpoint.md)
- Create: `skills/learn/SKILL.md` (from commands/learn.md)
- Create: `skills/test-coverage/SKILL.md` (from commands/test-coverage.md)
- Create: `skills/go-test/SKILL.md` (from commands/go-test.md)
- Create: `skills/sessions/SKILL.md` (REWRITE — adapt for Codex native session logs)
- Create: `skills/evolve/SKILL.md` (from commands/evolve.md)
- Create: `skills/instinct-status/SKILL.md` (from commands/instinct-status.md)
- Create: `skills/instinct-export/SKILL.md` (from commands/instinct-export.md)
- Create: `skills/instinct-import/SKILL.md` (from commands/instinct-import.md)
- Create: `skills/skill-create/SKILL.md` (from commands/skill-create.md)
- Create: `skills/setup-pm/SKILL.md` (from commands/setup-pm.md)
- Create: `skills/multi-plan/SKILL.md` (from commands/multi-plan.md — mark as advanced)
- Create: `skills/multi-execute/SKILL.md` (from commands/multi-execute.md)
- Create: `skills/multi-workflow/SKILL.md` (from commands/multi-workflow.md)
- Create: `skills/pm2/SKILL.md` (from commands/pm2.md)

**Conversion pattern:**
1. Read command from git history: `git show HEAD~5:commands/<name>.md`
2. Change frontmatter: `description:` → `name:` + `description:`
3. Remove Claude Code references
4. Replace agent invocations with skill references

**Step 1: Create orchestrate skill (major rewrite)**

The orchestrate command originally chains agents: `planner -> tdd-guide -> code-reviewer -> security-reviewer`. Rewrite as sequential skill workflow:

```markdown
---
name: orchestrate
description: Sequential multi-skill workflow for complex tasks. Guides through planning, implementation, review, and security audit phases.
---

# Orchestrate: Multi-Phase Workflow

Sequential skill workflow for complex tasks.

## Usage
`/orchestrate [workflow-type] [task-description]`

## Workflow Types

### feature
Full feature implementation:
`/plan → /tdd → /code-review → /security-review`

### bugfix
Bug investigation and fix:
`/plan → /tdd → /code-review`

### refactor
Safe refactoring:
`/architect → /code-review → /tdd`

### security
Security-focused review:
`/security-review → /code-review → /architect`

## Execution

Execute phases sequentially. Complete each before moving to the next.

### Phase 1: Planning
Activate `/plan` skill. Analyze requirements, create step-by-step plan.
DO NOT modify files. Present plan and wait for user confirmation.

### Phase 2: Implementation
Activate `/tdd` skill. Write tests first (RED), implement to pass (GREEN), refactor.

### Phase 3: Code Review
Activate `/code-review` skill. Review all changes for quality and security.
DO NOT modify files. Present findings by severity.

### Phase 4: Security Audit
Activate `/security-review` skill. Audit for OWASP Top 10.
Present security findings and recommendations.

### Handoff Between Phases
After each phase, produce a handoff summary:
- What was done
- Key findings/decisions
- Files modified
- Open questions for next phase

## Final Report
After all phases, produce orchestration report with:
- Summary of all phases
- Files changed
- Test results
- Security status
- Recommendation: SHIP / NEEDS WORK / BLOCKED
```

**Step 2: Create sessions skill (rewrite for Codex)**

```markdown
---
name: sessions
description: Manage Codex CLI sessions. List, view, and resume previous sessions using native session logs.
---

# Session Management

Codex stores session logs in `~/.codex/sessions/` as JSON Lines files.

## Commands

### List recent sessions
```bash
ls -lt ~/.codex/sessions/ | head -20
```

### View a session
```bash
cat ~/.codex/sessions/<session-file> | jq '.'
```

### Resume last session
Codex supports session resumption natively. Use `codex --resume` to continue where you left off.
```

**Step 3: Create remaining skills from commands**

For each remaining command, apply the standard conversion pattern.

**Step 4: Commit**

```bash
git add skills/orchestrate/ skills/eval/ skills/verify/ skills/checkpoint/ \
  skills/learn/ skills/test-coverage/ skills/go-test/ skills/sessions/ \
  skills/evolve/ skills/instinct-status/ skills/instinct-export/ \
  skills/instinct-import/ skills/skill-create/ skills/setup-pm/ \
  skills/multi-plan/ skills/multi-execute/ skills/multi-workflow/ skills/pm2/
git commit -m "feat: convert 18 commands to Codex skills

orchestrate — rewritten as sequential skill workflow
sessions — adapted for Codex native session logs
multi-* — marked as advanced/optional
All other commands directly converted with format changes"
```

---

## Task 12: Migrate existing 20 direct-transfer skills

**Files:**
- Modify: All 20 existing `skills/*/SKILL.md` files

These skills transfer almost directly. Changes needed:
1. Ensure YAML frontmatter has both `name` and `description`
2. Remove any Claude Code-specific references
3. Replace `~/.claude/` paths with `~/.codex/`

**Skills to migrate:**
`golang-patterns`, `golang-testing`, `python-patterns`, `python-testing`, `backend-patterns`, `frontend-patterns`, `coding-standards`, `django-patterns`, `django-security`, `django-tdd`, `django-verification`, `springboot-patterns`, `springboot-security`, `springboot-tdd`, `springboot-verification`, `java-coding-standards`, `jpa-patterns`, `postgres-patterns`, `clickhouse-io`, `iterative-retrieval`

**Step 1: For each skill, verify and update frontmatter**

Check each SKILL.md has:
```yaml
---
name: <skill-name>
description: <description>
---
```

**Step 2: Search and replace Claude Code references**

```bash
grep -rl "Claude Code\|claude-code\|~/.claude/" skills/ | head -20
```

Replace all occurrences:
- "Claude Code" → "Codex" (or remove if context-specific)
- "~/.claude/" → "~/.codex/"
- "CLAUDE.md" → "AGENTS.md"
- "agent" → "skill" (when referring to invocation)

**Step 3: Commit**

```bash
git add skills/
git commit -m "feat: migrate 20 existing skills to Codex format

Updated frontmatter to name/description format.
Replaced Claude Code references with Codex equivalents.
Content preserved — these skills are platform-agnostic."
```

---

## Task 13: Migrate 5 skills requiring rewrite

**Files:**
- Modify: `skills/continuous-learning/SKILL.md` (remove hook dependencies)
- Modify: `skills/continuous-learning-v2/SKILL.md` (remove hook triggers, manual mode)
- Rewrite: `skills/strategic-compact/SKILL.md` (Codex has no /compact)
- Rewrite: `skills/configure-ecc/SKILL.md` → move to `skills/configure-codex/SKILL.md`
- Delete: `skills/eval-harness/SKILL.md` (merged into skills/eval/ in Task 11)
- Delete: `skills/verification-loop/SKILL.md` (merged into skills/verify/ in Task 11)
- Delete: `skills/tdd-workflow/SKILL.md` (merged into skills/tdd/ in Task 10)
- Delete: `skills/project-guidelines-example/SKILL.md` (Claude Code specific)

**Step 1: Rewrite continuous-learning**

Remove hook references (`SessionEnd`, `evaluate-session.sh`). Make it a manual invocation skill:

```markdown
---
name: continuous-learning
description: Extract reusable patterns from coding sessions and save as skills for future use.
---

# Continuous Learning

Manually extract patterns from your work and save as reusable skills.

## Usage
After completing a task, invoke `/learn` to reflect on patterns used.

[... rest of adapted content ...]
```

**Step 2: Rewrite configure-ecc → configure-codex**

```bash
mv skills/configure-ecc skills/configure-codex
```

Rewrite SKILL.md to target `~/.codex/` paths and Codex directory structure.

**Step 3: Rewrite strategic-compact**

Since Codex has no `/compact` command, rewrite as general context management advice:

```markdown
---
name: strategic-compact
description: Manual context management strategies for long Codex sessions.
---

# Strategic Context Management

Codex manages context automatically, but for long sessions:

1. Break complex tasks into smaller sessions
2. Use `/checkpoint` to save progress
3. Start new sessions with clear context when switching topics
4. Keep relevant files open rather than loading everything
```

**Step 4: Delete merged/obsolete skills**

```bash
rm -rf skills/eval-harness skills/verification-loop skills/tdd-workflow skills/project-guidelines-example
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: rewrite 5 skills requiring adaptation

continuous-learning — removed hook dependencies, manual mode
continuous-learning-v2 — removed hook triggers
strategic-compact — adapted for Codex context management
configure-ecc → configure-codex — retargeted to ~/.codex/
Removed merged skills: eval-harness, verification-loop, tdd-workflow"
```

---

## Task 14: Create 3 new language rules skills

**Files:**
- Create: `skills/golang-rules/SKILL.md`
- Create: `skills/python-rules/SKILL.md`
- Create: `skills/typescript-rules/SKILL.md`

These merge the 5 per-language rule files (coding-style, testing, patterns, security, hooks) into single comprehensive skills.

**Step 1: Create golang-rules skill**

Merge `rules/golang/coding-style.md` + `testing.md` + `patterns.md` + `security.md` + `hooks.md`:

```markdown
---
name: golang-rules
description: Comprehensive Go coding rules — style, testing, patterns, security. Supplements golang/AGENTS.md with detailed guidance.
---

# Go Coding Rules

## Formatting
- gofmt and goimports are mandatory

[... merged content from all 5 golang rule files ...]
```

**Step 2: Create python-rules and typescript-rules similarly**

**Step 3: Commit**

```bash
git add skills/golang-rules/ skills/python-rules/ skills/typescript-rules/
git commit -m "feat: create language rules skills from merged rule files

golang-rules — merged from rules/golang/*.md (5 files)
python-rules — merged from rules/python/*.md (5 files)
typescript-rules — merged from rules/typescript/*.md (5 files)
Supplements language AGENTS.md with detailed patterns."
```

---

## Task 15: Migrate scripts

**Files:**
- Delete: `scripts/hooks/` (6 files — functionality moved to rules + AGENTS.md)
- Delete: `scripts/lib/session-manager.js` (Codex native sessions)
- Delete: `scripts/lib/session-aliases.js` (Codex native sessions)
- Delete: `scripts/ci/validate-agents.js` (no more agents/ directory)
- Delete: `scripts/ci/validate-commands.js` (no more commands/ directory)
- Delete: `scripts/ci/validate-hooks.js` (no more hooks/)
- Delete: `scripts/ci/validate-rules.js` (rules are now Starlark, different validation)
- Keep: `scripts/lib/package-manager.js`
- Keep: `scripts/lib/utils.js`
- Keep: `scripts/setup-package-manager.js`
- Keep: `scripts/skill-create-output.js`
- Keep: `scripts/ci/validate-skills.js` (update for Codex format)
- Create: `scripts/ci/validate-structure.js` (validate overall Codex structure)

**Step 1: Delete obsolete scripts**

```bash
rm -rf scripts/hooks
rm -f scripts/lib/session-manager.js scripts/lib/session-aliases.js
rm -f scripts/ci/validate-agents.js scripts/ci/validate-commands.js
rm -f scripts/ci/validate-hooks.js scripts/ci/validate-rules.js
```

**Step 2: Update validate-skills.js**

Modify to check for Codex SKILL.md format (name + description in frontmatter).

**Step 3: Create validate-structure.js**

Validates overall project structure:
- AGENTS.md exists at root
- config.toml exists
- rules/*.rules files are valid
- All skills have SKILL.md with name/description frontmatter

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: migrate scripts for Codex structure

Removed: hooks/, session-manager, session-aliases, old CI validators
Updated: validate-skills.js for Codex SKILL.md format
Added: validate-structure.js for overall Codex structure validation"
```

---

## Task 16: Create install/uninstall scripts

**Files:**
- Create: `scripts/install.sh`
- Create: `scripts/uninstall.sh`

**Step 1: Write install.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="${HOME}/.codex"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Installing Everything Codex to ${CODEX_DIR}..."

# Create directories
mkdir -p "${CODEX_DIR}/skills" "${CODEX_DIR}/rules"

# Copy AGENTS.md (global)
cp "${SCRIPT_DIR}/AGENTS.md" "${CODEX_DIR}/AGENTS.md"

# Copy language AGENTS.md templates
for lang in golang python typescript; do
    if [ -d "${SCRIPT_DIR}/${lang}" ]; then
        mkdir -p "${CODEX_DIR}/${lang}"
        cp "${SCRIPT_DIR}/${lang}/AGENTS.md" "${CODEX_DIR}/${lang}/AGENTS.md"
    fi
done

# Copy skills
cp -r "${SCRIPT_DIR}/skills/"* "${CODEX_DIR}/skills/"

# Copy execution policy rules
cp "${SCRIPT_DIR}/rules/"*.rules "${CODEX_DIR}/rules/" 2>/dev/null || true

# Copy config templates
cp "${SCRIPT_DIR}/config.toml" "${CODEX_DIR}/config.toml.example"
cp "${SCRIPT_DIR}/requirements.toml" "${CODEX_DIR}/requirements.toml.example"

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Review ~/.codex/config.toml.example and copy what you need to ~/.codex/config.toml"
echo "  2. Replace YOUR_*_HERE placeholders with actual values"
echo "  3. Use /configure-codex skill for interactive setup"
echo ""
echo "Installed:"
echo "  - AGENTS.md (global instructions)"
echo "  - $(ls -d ${CODEX_DIR}/skills/*/ 2>/dev/null | wc -l | tr -d ' ') skills"
echo "  - $(ls ${CODEX_DIR}/rules/*.rules 2>/dev/null | wc -l | tr -d ' ') execution policy rules"
echo "  - Language templates: golang, python, typescript"
```

**Step 2: Write uninstall.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="${HOME}/.codex"

echo "This will remove Everything Codex files from ${CODEX_DIR}"
echo "Your personal config.toml will NOT be touched."
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Remove skills installed by everything-codex
# (list specific skill directories to avoid removing user's custom skills)
SKILLS=(plan code-review security-review tdd architect build-fix database-review
        doc-updater e2e go-build-fix go-review go-test python-review refactor-clean
        orchestrate eval verify checkpoint learn test-coverage sessions evolve
        instinct-status instinct-export instinct-import skill-create setup-pm
        configure-codex multi-plan multi-execute multi-workflow pm2
        golang-rules python-rules typescript-rules
        golang-patterns golang-testing python-patterns python-testing
        backend-patterns frontend-patterns coding-standards
        django-patterns django-security django-tdd django-verification
        springboot-patterns springboot-security springboot-tdd springboot-verification
        java-coding-standards jpa-patterns postgres-patterns clickhouse-io
        continuous-learning continuous-learning-v2 strategic-compact iterative-retrieval)

for skill in "${SKILLS[@]}"; do
    rm -rf "${CODEX_DIR}/skills/${skill}"
done

# Remove rules
rm -f "${CODEX_DIR}/rules/safety.rules"
rm -f "${CODEX_DIR}/rules/git-safety.rules"
rm -f "${CODEX_DIR}/rules/file-hygiene.rules"

# Remove language AGENTS.md (but NOT user's root AGENTS.md)
rm -f "${CODEX_DIR}/golang/AGENTS.md"
rm -f "${CODEX_DIR}/python/AGENTS.md"
rm -f "${CODEX_DIR}/typescript/AGENTS.md"
rmdir "${CODEX_DIR}/golang" "${CODEX_DIR}/python" "${CODEX_DIR}/typescript" 2>/dev/null || true

# Remove config examples
rm -f "${CODEX_DIR}/config.toml.example"
rm -f "${CODEX_DIR}/requirements.toml.example"

echo "Uninstalled Everything Codex."
echo "Your ~/.codex/config.toml and ~/.codex/AGENTS.md were preserved."
```

**Step 3: Make executable and commit**

```bash
chmod +x scripts/install.sh scripts/uninstall.sh
git add scripts/install.sh scripts/uninstall.sh
git commit -m "feat: create install.sh and uninstall.sh scripts

install.sh — copies skills, rules, AGENTS.md, config templates to ~/.codex/
uninstall.sh — removes only everything-codex files, preserves user configs"
```

---

## Task 17: Delete old mcp-configs/ directory

Content has been migrated to config.toml (Task 8).

**Files:**
- Delete: `mcp-configs/` (mcp-servers.json)

**Step 1: Remove and commit**

```bash
rm -rf mcp-configs
git add -A
git commit -m "refactor: remove mcp-configs/ (migrated to config.toml)"
```

---

## Task 18: Create examples

**Files:**
- Create: `examples/AGENTS.md` (example project-level AGENTS.md)
- Create: `examples/config.toml` (example personal config)
- Create: `examples/requirements.toml` (example requirements)

**Step 1: Write example AGENTS.md**

```markdown
# My Project Instructions

## Project Overview
This is a Next.js web application with Supabase backend.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Supabase (PostgreSQL + Auth + Realtime)
- Tailwind CSS

## Conventions
- Use Server Components by default
- Client Components only when needed (interactivity, hooks)
- All API routes in app/api/
- Database queries through Supabase client, never raw SQL

## Testing
- Run: `npm test`
- E2E: `npx playwright test`
- Coverage minimum: 80%
```

**Step 2: Write example configs**

**Step 3: Commit**

```bash
git add examples/
git commit -m "feat: add example AGENTS.md, config.toml, requirements.toml"
```

---

## Task 19: Update documentation

**Files:**
- Rewrite: `README.md`
- Rewrite: `CONTRIBUTING.md`
- Rewrite: `llms.txt`
- Delete: `README.zh-CN.md` (recreate later with updated content)
- Delete: `docs/` (outdated Claude Code documentation — too large to update in-place)
- Create: `docs/migration-from-claude-code.md`
- Create: `docs/agents-md-architecture.md`

**Step 1: Rewrite README.md**

Focus on Codex CLI positioning, installation, skill list, AGENTS.md architecture.

**Step 2: Rewrite CONTRIBUTING.md**

Update contribution guidelines for Codex skill format, Starlark rules, AGENTS.md.

**Step 3: Rewrite llms.txt**

Update for Codex context.

**Step 4: Remove outdated docs/**

The docs/ directory has 295+ files of Claude Code-specific documentation in 3 languages. These are all outdated after the refactoring.

```bash
rm -rf docs/zh-CN docs/zh-TW
# Keep docs/ directory for new documentation
```

**Step 5: Create migration guide**

**Step 6: Commit**

```bash
git add -A
git commit -m "docs: rewrite all documentation for Codex CLI

README.md — complete rewrite for Codex positioning
CONTRIBUTING.md — updated for Codex skill/rules format
Removed outdated Claude Code documentation
Added migration guide and AGENTS.md architecture docs"
```

---

## Task 20: Final cleanup and verification

**Step 1: Verify directory structure**

```bash
find . -name "*.md" -path "*/agents/*" 2>/dev/null  # Should be empty
find . -name "*.md" -path "*/commands/*" 2>/dev/null  # Should be empty
ls .claude-plugin 2>/dev/null  # Should not exist
ls .opencode 2>/dev/null  # Should not exist
ls hooks 2>/dev/null  # Should not exist
```

**Step 2: Count skills**

```bash
find skills -name "SKILL.md" | wc -l
```
Expected: ~55-60 skills

**Step 3: Verify all skills have correct frontmatter**

```bash
for f in skills/*/SKILL.md; do
    if ! head -1 "$f" | grep -q "^---$"; then
        echo "MISSING FRONTMATTER: $f"
    fi
done
```

**Step 4: Verify no Claude Code references remain**

```bash
grep -rl "Claude Code\|claude-code\|\.claude/" --include="*.md" . | grep -v "docs/migration"
```
Expected: Empty (except migration guide which mentions Claude Code intentionally)

**Step 5: Final commit**

```bash
git add -A
git status
git commit -m "chore: final cleanup and verification

Verified:
- No Claude Code artifacts remain
- All skills have correct SKILL.md frontmatter
- Directory structure matches Codex conventions
- ~60 skills, 3 execution policies, hierarchical AGENTS.md"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Delete Claude Code directories | -5 dirs |
| 2 | Delete agents/ and commands/ | -2 dirs |
| 3 | Delete old rules/ | -1 dir |
| 4 | Clean up root artifacts | -10 files |
| 5 | Create root AGENTS.md | +1 file |
| 6 | Create language AGENTS.md | +3 files |
| 7 | Create Starlark rules | +3 files |
| 8 | Create config.toml | +1 file |
| 9 | Create requirements.toml | +1 file |
| 10 | Convert 13 agents to skills | +14 skill dirs |
| 11 | Convert 18 commands to skills | +18 skill dirs |
| 12 | Migrate 20 existing skills | ~20 file edits |
| 13 | Rewrite 5 special skills | ~5 file edits |
| 14 | Create 3 language rules skills | +3 skill dirs |
| 15 | Migrate scripts | ~10 file changes |
| 16 | Create install/uninstall | +2 files |
| 17 | Delete old mcp-configs/ | -1 dir |
| 18 | Create examples | +3 files |
| 19 | Update documentation | ~5 file changes |
| 20 | Final verification | 0 files |
