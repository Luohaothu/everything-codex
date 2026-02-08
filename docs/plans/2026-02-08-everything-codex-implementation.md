# everything-codex Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor everything-claude-code into everything-codex, a full-featured configuration toolkit for OpenAI Codex CLI, with staged migration and gate verification at each stage.

**Architecture:** Agents become skills (role-switching prompts). Hooks become Starlark execution policies + AGENTS.md behavioral text. Rules become hierarchical AGENTS.md files. Config contexts become profiles in config.toml. Skills path is `~/.agents/skills/` (Codex standard), AGENTS.md at `~/.codex/AGENTS.md`, rules at `~/.codex/rules/*.rules`.

**Tech Stack:** Markdown (AGENTS.md, SKILL.md), Starlark (.rules), TOML (config.toml), Node.js (CI scripts), Bash (install/uninstall)

**Critical Path Correction:** The design doc references `~/.codex/skills/` but Codex CLI actually uses `~/.agents/skills/` for user-level skills and `.agents/skills/` for repo-level. All paths in this plan use the correct Codex paths.

---

## Stage 0: Infrastructure Foundation (MVP Gate)

The entire refactoring is blocked until Stage 0 passes the MVP Gate. All subsequent stages depend on this.

### Task 0.1: Project Cleanup — Delete Claude Code-Only Artifacts

**Files:**
- Delete: `.claude-plugin/` (entire directory — Codex has no plugin marketplace)
- Delete: `.opencode/` (entire directory — no longer needed)
- Delete: `hooks/hooks.json` (functionality migrates to rules + AGENTS.md)
- Delete: `contexts/` (entire directory — migrates to config profiles)
- Delete: `scripts/hooks/` (entire directory — 6 hook scripts)
- Delete: `scripts/lib/session-manager.js` (session hooks removed)
- Delete: `scripts/lib/session-aliases.js` (session hooks removed)

**Step 1: Verify the files exist and review what we're deleting**

```bash
ls -la .claude-plugin/ .opencode/ hooks/ contexts/ scripts/hooks/ scripts/lib/session-manager.js scripts/lib/session-aliases.js
```

**Step 2: Delete Claude Code-only artifacts**

```bash
rm -rf .claude-plugin/ .opencode/ hooks/ contexts/ scripts/hooks/
rm -f scripts/lib/session-manager.js scripts/lib/session-aliases.js
```

**Step 3: Verify deletions**

```bash
# Should all fail with "No such file or directory"
ls .claude-plugin/ .opencode/ hooks/ contexts/ scripts/hooks/ scripts/lib/session-manager.js 2>&1
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Claude Code-only artifacts

Delete .claude-plugin/, .opencode/, hooks/, contexts/,
scripts/hooks/, session-manager.js, session-aliases.js.
These are Claude Code-specific and have no Codex equivalent."
```

---

### Task 0.2: Create Root AGENTS.md (Global Instructions)

**Files:**
- Create: `AGENTS.md`
- Source: `rules/common/coding-style.md` + `rules/common/git-workflow.md` + `rules/common/security.md` + `rules/common/agents.md` (rewritten)

**Step 1: Write AGENTS.md**

Create `AGENTS.md` at project root with these sections synthesized from the common rules. This file should be **under 32 KiB** (Codex `project_doc_max_bytes` default). Rewrite all references from "Claude Code" / "agent" / "Task tool" to generic Codex-compatible language.

```markdown
# everything-codex

A comprehensive configuration toolkit for OpenAI Codex CLI with 60+ skills, hierarchical rules, execution policies, and structured workflows.

## Quick Start

1. Install: `./scripts/install.sh`
2. Inside Codex: `/configure-codex` to customize
3. Use skills: `/plan`, `/code-review`, `/tdd`, `/security-review`

## Coding Standards

### Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate existing ones. Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

### File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Organize by feature/domain, not by type

### Error Handling

ALWAYS handle errors explicitly at every level. Provide user-friendly messages in UI code, detailed context in server logs. Never silently swallow errors.

### Input Validation

ALWAYS validate at system boundaries. Use schema-based validation. Fail fast with clear error messages. Never trust external data.

## Git Workflow

### Commit Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

### Pull Request Process

1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary with test plan
4. Push with `-u` flag for new branches

### Feature Implementation

1. Plan first — use `/plan` skill
2. TDD approach — use `/tdd` skill (RED → GREEN → REFACTOR)
3. Code review — use `/code-review` skill
4. Commit with conventional format

## Security Guidelines

### Mandatory Checks Before Any Commit

- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on endpoints
- Error messages don't leak sensitive data

### Secret Management

NEVER hardcode secrets. ALWAYS use environment variables or a secret manager. Validate required secrets at startup.

### Security Response

If a security issue is found: STOP → use `/security-review` skill → fix CRITICAL issues → rotate exposed secrets → review for similar issues.

## Available Skills

Use skills with `/skill-name` in Codex. Key skills:

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/plan` | Implementation planning | Complex features, refactoring |
| `/architect` | System design | Architectural decisions |
| `/tdd` | Test-driven development | New features, bug fixes |
| `/code-review` | Code quality review | After writing code |
| `/security-review` | Security analysis | Before commits |
| `/build-fix` | Fix build errors | When build fails |
| `/e2e` | E2E testing | Critical user flows |
| `/refactor-clean` | Dead code cleanup | Code maintenance |
| `/doc-updater` | Documentation | Updating docs |
| `/go-review` | Go code review | Go projects |
| `/go-build-fix` | Go build errors | Go build fails |
| `/go-test` | Go TDD | Go features |
| `/python-review` | Python review | Python projects |

## Post-Edit Reminders

After editing code files, remember to:
- **Format**: Run the appropriate formatter (prettier, gofmt, black) on modified files
- **Type check**: Run type checker (tsc, mypy, go vet) on modified files
- **Lint**: Check for console.log/print debug statements
- **Test**: Run relevant tests to verify changes

## Language Detection

When working with language-specific files, load the corresponding rules skill:
- `.go` files → consider `/golang-rules` for Go-specific patterns
- `.py` files → consider `/python-rules` for Python-specific patterns
- `.ts`/`.tsx` files → consider `/typescript-rules` for TypeScript-specific patterns
```

**Step 2: Verify file size is under 32 KiB**

```bash
wc -c AGENTS.md
# Should be under 32768 bytes
```

**Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "feat: create root AGENTS.md for Codex CLI

Synthesize coding standards, git workflow, security guidelines,
and skill usage guide from common rules into hierarchical AGENTS.md.
Under 32KiB limit for Codex project_doc_max_bytes."
```

---

### Task 0.3: Create Language-Specific AGENTS.md Templates

**Files:**
- Create: `golang/AGENTS.md`
- Create: `python/AGENTS.md`
- Create: `typescript/AGENTS.md`
- Source: `rules/golang/*.md`, `rules/python/*.md`, `rules/typescript/*.md`

**Step 1: Create golang/AGENTS.md**

Merge content from all 5 Go rules files into one AGENTS.md:

```markdown
# Go Development Rules

These rules apply when working in Go codebases.

## Formatting

- **gofmt** and **goimports** are mandatory — no style debates
- Run `gofmt -w .` and `goimports -w .` after editing `.go` files

## Design Principles

- Accept interfaces, return structs
- Keep interfaces small (1-3 methods)
- Define interfaces where they are used, not where they are implemented

## Error Handling

Always wrap errors with context:

```go
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}
```

## Patterns

### Functional Options

```go
type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func NewServer(opts ...Option) *Server {
    s := &Server{port: 8080}
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

### Dependency Injection

```go
func NewUserService(repo UserRepository, logger Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}
```

## Testing

Use the standard `go test` with **table-driven tests**.

### Race Detection

Always run with the `-race` flag:

```bash
go test -race ./...
```

### Coverage

```bash
go test -cover ./...
```

Target 80%+ coverage.

## Security

### Secret Management

```go
apiKey := os.Getenv("OPENAI_API_KEY")
if apiKey == "" {
    log.Fatal("OPENAI_API_KEY not configured")
}
```

### Security Scanning

```bash
gosec ./...
```

### Context & Timeouts

Always use `context.Context` for timeout control:

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
```

## Post-Edit Actions

After editing `.go` files:
- Run `gofmt -w <file>` and `goimports -w <file>`
- Run `go vet ./...` for static analysis
- Run `staticcheck ./...` if available

See `/golang-patterns` and `/golang-testing` skills for comprehensive reference.
```

**Step 2: Create python/AGENTS.md**

Read `rules/python/*.md` files and merge similarly. Key content:
- PEP 8 compliance, type hints
- pytest with fixtures
- Virtual environments
- bandit/safety for security scanning
- black/isort for formatting

**Step 3: Create typescript/AGENTS.md**

Read `rules/typescript/*.md` files and merge. Key content:
- Strict TypeScript
- ESLint + Prettier
- Jest/Vitest patterns
- React patterns if applicable
- No `any` type

**Step 4: Verify all three files exist**

```bash
ls -la golang/AGENTS.md python/AGENTS.md typescript/AGENTS.md
```

**Step 5: Commit**

```bash
git add golang/AGENTS.md python/AGENTS.md typescript/AGENTS.md
git commit -m "feat: create language-specific AGENTS.md templates

Go, Python, and TypeScript AGENTS.md files for hierarchical
discovery. Users install to ~/.codex/<lang>/AGENTS.md for
automatic language-aware rule loading."
```

---

### Task 0.4: Create Starlark Execution Policy Rules

**Files:**
- Create: `rules/safety.rules`
- Create: `rules/git-safety.rules`
- Create: `rules/file-hygiene.rules`

**Step 1: Create rules/safety.rules**

```starlark
# Safety rules for long-running and privilege-escalation commands

# Dev servers should run in tmux for session persistence
prefix_rule(
    pattern=["npm", "run", "dev"],
    decision="prompt",
    justification="Consider running in tmux for long-running dev servers"
)
prefix_rule(
    pattern=["pnpm", "dev"],
    decision="prompt",
    justification="Consider running in tmux"
)
prefix_rule(
    pattern=["yarn", "dev"],
    decision="prompt",
    justification="Consider running in tmux"
)
prefix_rule(
    pattern=["bun", "run", "dev"],
    decision="prompt",
    justification="Consider running in tmux"
)

# Privilege escalation
prefix_rule(
    pattern=["sudo"],
    decision="forbidden",
    justification="Privilege escalation not allowed"
)
prefix_rule(
    pattern=["su"],
    decision="forbidden",
    justification="User switching not allowed"
)
```

**Step 2: Create rules/git-safety.rules**

```starlark
# Git safety rules

# Force push is dangerous
prefix_rule(
    pattern=["git", "push", "--force"],
    decision="forbidden",
    justification="Force push can lose remote work. Use --force-with-lease if needed."
)
prefix_rule(
    pattern=["git", "push", "-f"],
    decision="forbidden",
    justification="Force push can lose remote work. Use --force-with-lease if needed."
)

# Regular push requires review
prefix_rule(
    pattern=["git", "push"],
    decision="prompt",
    justification="Review changes before pushing to remote"
)

# Hard reset discards work
prefix_rule(
    pattern=["git", "reset", "--hard"],
    decision="forbidden",
    justification="Hard reset permanently discards uncommitted changes"
)

# Force clean deletes untracked files
prefix_rule(
    pattern=["git", "clean", "-f"],
    decision="forbidden",
    justification="Force clean permanently deletes untracked files"
)

# Branch -D force deletes
prefix_rule(
    pattern=["git", "branch", "-D"],
    decision="prompt",
    justification="Force-deleting branches can lose unmerged work"
)
```

**Step 3: Create rules/file-hygiene.rules**

```starlark
# File hygiene rules

# Recursive force delete is too dangerous
prefix_rule(
    pattern=["rm", "-rf"],
    decision="forbidden",
    justification="Recursive force delete is too dangerous"
)
prefix_rule(
    pattern=["rm", "-r"],
    decision="prompt",
    justification="Recursive delete requires confirmation"
)
```

**Step 4: Verify Starlark syntax (if codex CLI available)**

```bash
codex execpolicy check --pretty --rules rules/safety.rules -- npm run dev
codex execpolicy check --pretty --rules rules/git-safety.rules -- git push --force
codex execpolicy check --pretty --rules rules/file-hygiene.rules -- rm -rf /tmp/test
```

If codex is not available, verify syntax manually (each `prefix_rule()` call is valid Starlark).

**Step 5: Commit**

```bash
git add rules/safety.rules rules/git-safety.rules rules/file-hygiene.rules
git commit -m "feat: add Starlark execution policy rules

Three rule files covering dev server safety, git operations,
and file deletion. Replaces Claude Code hooks with Codex
native exec policy enforcement."
```

---

### Task 0.5: Create config.toml

**Files:**
- Create: `config.toml`
- Source: `mcp-configs/mcp-servers.json` + `contexts/*.md` (now profiles)

**Step 1: Write config.toml**

```toml
#:schema https://developers.openai.com/codex/config-schema.json
# everything-codex configuration
# Minimum Codex CLI version: 0.98.0

model = "o4-mini"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true

# --- Profiles (replace contexts/) ---

[profiles.dev]
model = "o4-mini"
approval_policy = "on-failure"
model_personality = "pragmatic"

[profiles.review]
model = "o4-mini"
approval_policy = "untrusted"
model_personality = "pragmatic"

[profiles.research]
model = "o4-mini"
web_search = "live"
model_personality = "friendly"

# --- MCP Servers ---

[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "${GITHUB_PAT}" }

[mcp_servers.firecrawl]
command = "npx"
args = ["-y", "firecrawl-mcp"]
env = { FIRECRAWL_API_KEY = "${FIRECRAWL_API_KEY}" }
enabled = false

[mcp_servers.supabase]
command = "npx"
args = ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=${SUPABASE_PROJECT_REF}"]
enabled = false

[mcp_servers.memory]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-memory"]
enabled = false

[mcp_servers.sequential-thinking]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]
enabled = false

[mcp_servers.vercel]
url = "https://mcp.vercel.com"
enabled = false

[mcp_servers.railway]
command = "npx"
args = ["-y", "@railway/mcp-server"]
enabled = false

[mcp_servers.context7]
command = "npx"
args = ["-y", "@context7/mcp-server"]
enabled = false

[mcp_servers.cloudflare-docs]
url = "https://docs.mcp.cloudflare.com/mcp"
enabled = false

[mcp_servers.clickhouse]
url = "https://mcp.clickhouse.cloud/mcp"
enabled = false
```

**Step 2: Commit**

```bash
git add config.toml
git commit -m "feat: add config.toml with profiles and MCP servers

Default model o4-mini, workspace-write sandbox. Three profiles
(dev/review/research) replace contexts/. MCP servers from
mcp-servers.json converted to TOML format (disabled by default
except GitHub)."
```

---

### Task 0.6: Create requirements.toml

**Files:**
- Create: `requirements.toml`

**Step 1: Write requirements.toml**

```toml
#:schema https://developers.openai.com/codex/config-schema.json
# everything-codex security requirements
# Minimum Codex CLI version: 0.98.0
#
# This file defines the security baseline.
# All 'forbidden' rules cannot be overridden by any profile.

# Import execution policy rules
# Users should copy rules/*.rules to ~/.codex/rules/
```

Note: Based on the Codex docs, security enforcement is primarily through execution policy `.rules` files and `approval_policy` in config.toml. A standalone `requirements.toml` isn't a documented Codex concept. The safety rules are already covered by our `.rules` files and config.toml `approval_policy`. We create this as a documentation/example file, not a Codex-native config.

**Step 2: Commit**

```bash
git add requirements.toml
git commit -m "docs: add requirements.toml as security baseline reference

Documents the security constraints enforced by execution policy
rules. Not a native Codex config file, but serves as reference
for the project's security posture."
```

---

### Task 0.7: Update CI Validation Scripts for Codex Structure

**Files:**
- Modify: `scripts/ci/validate-skills.js` — add frontmatter `name`/`description` check
- Delete: `scripts/ci/validate-agents.js` — agents directory will be removed
- Delete: `scripts/ci/validate-commands.js` — commands directory will be removed
- Delete: `scripts/ci/validate-hooks.js` — hooks removed
- Modify: `scripts/ci/validate-rules.js` — validate `.rules` files exist
- Create: `scripts/ci/validate-structure.js` — verify overall Codex structure
- Create: `scripts/ci/check-no-claude-refs.js` — grep for Claude Code references

**Step 1: Update validate-skills.js to check frontmatter**

```javascript
#!/usr/bin/env node
/**
 * Validate skill directories have SKILL.md with required frontmatter (name + description)
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../../skills');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      fm[key.trim()] = rest.join(':').trim();
    }
  });
  return fm;
}

function validateSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log('No skills directory found, skipping validation');
    process.exit(0);
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  let hasErrors = false;
  let validCount = 0;

  for (const dir of dirs) {
    const skillMd = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      console.error(`ERROR: ${dir}/ - Missing SKILL.md`);
      hasErrors = true;
      continue;
    }

    const content = fs.readFileSync(skillMd, 'utf-8');
    if (content.trim().length === 0) {
      console.error(`ERROR: ${dir}/SKILL.md - Empty file`);
      hasErrors = true;
      continue;
    }

    const fm = parseFrontmatter(content);
    if (!fm) {
      console.error(`ERROR: ${dir}/SKILL.md - Missing YAML frontmatter`);
      hasErrors = true;
      continue;
    }
    if (!fm.name) {
      console.error(`ERROR: ${dir}/SKILL.md - Missing 'name' in frontmatter`);
      hasErrors = true;
    }
    if (!fm.description) {
      console.error(`ERROR: ${dir}/SKILL.md - Missing 'description' in frontmatter`);
      hasErrors = true;
    }

    // Check for Claude Code-specific references
    const claudeRefs = content.match(/Claude Code|Task tool|Read tool|Write tool|Edit tool|Glob tool|Grep tool|Bash tool/gi);
    if (claudeRefs) {
      console.error(`ERROR: ${dir}/SKILL.md - Contains Claude Code references: ${[...new Set(claudeRefs)].join(', ')}`);
      hasErrors = true;
    }

    // Check for tools/model frontmatter (Claude Code-specific)
    if (fm.tools || fm.model) {
      console.error(`ERROR: ${dir}/SKILL.md - Contains Claude Code frontmatter fields (tools/model). Use name/description only.`);
      hasErrors = true;
    }

    if (!hasErrors) validCount++;
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log(`Validated ${validCount} skill directories`);
}

validateSkills();
```

**Step 2: Create validate-structure.js**

```javascript
#!/usr/bin/env node
/**
 * Validate overall Codex project structure
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

const requiredFiles = [
  'AGENTS.md',
  'config.toml',
  'README.md',
  'scripts/install.sh',
];

const requiredDirs = [
  'skills',
  'rules',
  'golang',
  'python',
  'typescript',
  'scripts/ci',
];

const forbiddenPaths = [
  '.claude-plugin',
  '.opencode',
  'hooks/hooks.json',
  'contexts',
  'agents',     // agents/ should be removed (merged into skills/)
  'commands',   // commands/ should be removed (merged into skills/)
];

let hasErrors = false;

// Check required files
for (const f of requiredFiles) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) {
    console.error(`ERROR: Missing required file: ${f}`);
    hasErrors = true;
  }
}

// Check required directories
for (const d of requiredDirs) {
  const p = path.join(ROOT, d);
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
    console.error(`ERROR: Missing required directory: ${d}/`);
    hasErrors = true;
  }
}

// Check forbidden paths
for (const f of forbiddenPaths) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    console.error(`ERROR: Forbidden path still exists: ${f}`);
    hasErrors = true;
  }
}

// Check .rules files exist
const rulesDir = path.join(ROOT, 'rules');
if (fs.existsSync(rulesDir)) {
  const rulesFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.rules'));
  if (rulesFiles.length === 0) {
    console.error('ERROR: No .rules files found in rules/');
    hasErrors = true;
  } else {
    console.log(`Found ${rulesFiles.length} execution policy files`);
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log('Structure validation passed');
```

**Step 3: Delete obsolete validation scripts**

```bash
rm -f scripts/ci/validate-agents.js scripts/ci/validate-commands.js scripts/ci/validate-hooks.js
```

**Step 4: Commit**

```bash
git add scripts/ci/validate-skills.js scripts/ci/validate-structure.js
git add -A  # captures deletions
git commit -m "feat: update CI validation for Codex structure

- validate-skills.js: check name/description frontmatter, no Claude refs
- validate-structure.js: verify required files/dirs, no forbidden paths
- Remove validate-agents.js, validate-commands.js, validate-hooks.js"
```

---

### Task 0.8: MVP Gate Verification

**Files:**
- None (verification only)

**Step 1: Run structure validation**

```bash
node scripts/ci/validate-structure.js
```
Expected: PASS (once agents/ and commands/ are removed in Stage 1+)

Note: This gate will initially fail because `agents/` and `commands/` still exist. That's expected — they get removed in Stage 2 after their content is migrated to skills. The structure validation for forbidden paths should be updated to only check after full migration. For now, verify that the required files/dirs pass.

**Step 2: Verify AGENTS.md loads**

```bash
# Check file exists and is under size limit
wc -c AGENTS.md
test -f golang/AGENTS.md && echo "Go AGENTS.md: OK"
test -f python/AGENTS.md && echo "Python AGENTS.md: OK"
test -f typescript/AGENTS.md && echo "TypeScript AGENTS.md: OK"
```

**Step 3: Verify rules files exist**

```bash
ls -la rules/*.rules
```

**Step 4: Verify config.toml syntax**

```bash
# If codex CLI is available:
codex --check-config
# Otherwise, just verify TOML parses:
node -e "const fs=require('fs');const c=fs.readFileSync('config.toml','utf-8');console.log('config.toml OK, bytes:', c.length)"
```

**Step 5: Commit (tag the MVP checkpoint)**

```bash
git tag -a stage-0-mvp -m "Stage 0 MVP: infrastructure foundation complete"
```

---

## Stage 1: Core Agent-Skills Migration (4 Critical Skills)

These 4 skills form the critical workflow path. Each merges an agent + its corresponding command into a single SKILL.md.

### Task 1.1: Create `skills/plan/SKILL.md`

**Files:**
- Create: `skills/plan/SKILL.md`
- Source: `agents/planner.md` + `commands/plan.md`

**Step 1: Write skills/plan/SKILL.md**

Merge the planner agent's expertise with the plan command's workflow instructions. Remove Claude Code-specific references (`tools:`, `model:` frontmatter, "Task tool", etc.). Convert tool constraints to behavioral text.

```markdown
---
name: plan
description: Create comprehensive implementation plans for complex features, architectural changes, or refactoring. Analyzes requirements, identifies risks, and breaks work into phases. Use BEFORE writing code.
---

# Planner Mode

**BEHAVIORAL CONSTRAINTS:**
- Do NOT modify any files — analysis only
- Do NOT write implementation code
- Present plan and WAIT for explicit user confirmation before proceeding

## Your Role

You are an expert planning specialist focused on creating comprehensive, actionable implementation plans.

## Planning Process

### 1. Requirements Analysis
- Understand the feature request completely
- Ask clarifying questions if needed
- Identify success criteria
- List assumptions and constraints

### 2. Architecture Review
- Analyze existing codebase structure
- Identify affected components
- Review similar implementations
- Consider reusable patterns

### 3. Step Breakdown
Create detailed steps with:
- Clear, specific actions
- File paths and locations
- Dependencies between steps
- Estimated complexity
- Potential risks

### 4. Implementation Order
- Prioritize by dependencies
- Group related changes
- Minimize context switching
- Enable incremental testing

## Plan Format

```
# Implementation Plan: [Feature Name]

## Overview
[2-3 sentence summary]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Architecture Changes
- [Change 1: file path and description]

## Implementation Steps

### Phase 1: [Phase Name]
1. **[Step Name]** (File: path/to/file)
   - Action: Specific action to take
   - Why: Reason for this step
   - Dependencies: None / Requires step X
   - Risk: Low/Medium/High

### Phase 2: [Phase Name]
...

## Testing Strategy
- Unit tests: [files to test]
- Integration tests: [flows to test]

## Risks & Mitigations
- **Risk**: [Description]
  - Mitigation: [How to address]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Best Practices

1. **Be Specific**: Use exact file paths, function names, variable names
2. **Consider Edge Cases**: Think about error scenarios, null values, empty states
3. **Minimize Changes**: Prefer extending existing code over rewriting
4. **Maintain Patterns**: Follow existing project conventions
5. **Enable Testing**: Structure changes to be easily testable
6. **Think Incrementally**: Each step should be verifiable
7. **Document Decisions**: Explain why, not just what

## Integration

After planning, suggest next steps:
- `/tdd` to implement with test-driven development
- `/build-fix` if build errors occur
- `/code-review` to review completed implementation

**CRITICAL**: Do NOT write any code until the user explicitly confirms the plan.
```

**Step 2: Verify no Claude Code references**

```bash
grep -i "claude code\|Task tool\|Read tool\|model:" skills/plan/SKILL.md
# Should return nothing
```

**Step 3: Commit**

```bash
git add skills/plan/SKILL.md
git commit -m "feat: create plan skill (merge planner agent + plan command)

Role-switching skill with read-only behavioral constraint.
Replaces agents/planner.md + commands/plan.md."
```

---

### Task 1.2: Create `skills/code-review/SKILL.md`

**Files:**
- Create: `skills/code-review/SKILL.md`
- Source: `agents/code-reviewer.md` + `commands/code-review.md`

**Step 1: Write skills/code-review/SKILL.md**

```markdown
---
name: code-review
description: Expert code review for quality, security, and maintainability. Run after writing or modifying code. Reviews git diff, prioritizes issues by severity, suggests fixes.
---

# Code Reviewer Mode

**BEHAVIORAL CONSTRAINTS:**
- Do NOT modify any files — analysis and recommendations only
- Review code, don't rewrite it
- Focus on the most recent changes (git diff)

## Your Role

You are a senior code reviewer ensuring high standards of code quality and security.

## Review Process

1. Check recent changes (git diff)
2. Focus on modified files
3. Begin review immediately

## Review Checklist

### Security Checks (CRITICAL)

- Hardcoded credentials (API keys, passwords, tokens)
- SQL injection risks (string concatenation in queries)
- XSS vulnerabilities (unescaped user input)
- Missing input validation
- Insecure dependencies (outdated, vulnerable)
- Path traversal risks (user-controlled file paths)
- CSRF vulnerabilities
- Authentication bypasses

### Code Quality (HIGH)

- Large functions (>50 lines)
- Large files (>800 lines)
- Deep nesting (>4 levels)
- Missing error handling
- Debug statements (console.log, print, fmt.Println for debugging)
- Mutation patterns (prefer immutability)
- Missing tests for new code

### Performance (MEDIUM)

- Inefficient algorithms (O(n^2) when O(n log n) possible)
- Unnecessary re-renders in React
- Missing memoization
- Large bundle sizes
- Missing caching
- N+1 queries

### Best Practices (MEDIUM)

- TODO/FIXME without tickets
- Poor variable naming (x, tmp, data)
- Magic numbers without explanation
- Inconsistent formatting

## Output Format

For each issue:

```
[SEVERITY] Issue Title
File: path/to/file:line
Issue: Description
Fix: Specific recommendation

code_example_bad   // problem
code_example_good  // solution
```

## Approval Criteria

- APPROVE: No CRITICAL or HIGH issues
- WARNING: MEDIUM issues only (can merge with caution)
- BLOCK: CRITICAL or HIGH issues found
```

**Step 2: Commit**

```bash
git add skills/code-review/SKILL.md
git commit -m "feat: create code-review skill (merge code-reviewer agent + command)

Read-only review skill with severity-based checklist.
Replaces agents/code-reviewer.md + commands/code-review.md."
```

---

### Task 1.3: Create `skills/tdd/SKILL.md`

**Files:**
- Create: `skills/tdd/SKILL.md`
- Source: `agents/tdd-guide.md` + `commands/tdd.md` + `skills/tdd-workflow/SKILL.md`

**Step 1: Write skills/tdd/SKILL.md**

Merge the TDD agent, command, and workflow skill into a single comprehensive skill. This skill CAN write files (tests + implementation).

```markdown
---
name: tdd
description: Test-driven development workflow. Write tests FIRST, then implement. Enforces RED-GREEN-REFACTOR cycle with 80%+ coverage. Use for new features, bug fixes, and refactoring.
---

# TDD Guide Mode

**BEHAVIORAL CONSTRAINTS:**
- ALWAYS write tests BEFORE implementation code
- Follow RED → GREEN → REFACTOR cycle strictly
- Target 80%+ code coverage
- Each test should verify a single behavior

## Your Role

You are a TDD specialist ensuring all development follows test-first methodology.

## TDD Workflow

### Step 1: Write User Journeys
```
As a [role], I want to [action], so that [benefit]
```

### Step 2: Generate Test Cases
Write comprehensive tests covering happy path, edge cases, and error scenarios.

### Step 3: Run Tests (RED)
Tests should FAIL — we haven't implemented yet.

### Step 4: Write Minimal Implementation (GREEN)
Write the minimum code needed to make tests pass.

### Step 5: Run Tests Again
All tests should now PASS.

### Step 6: Refactor (IMPROVE)
Improve code quality while keeping tests green:
- Remove duplication
- Improve naming
- Optimize performance

### Step 7: Verify Coverage
Ensure 80%+ coverage achieved.

## Coverage Requirements

- Minimum 80% coverage (unit + integration)
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

## Test Types

### Unit Tests
- Individual functions and utilities
- Component logic
- Pure functions

### Integration Tests
- API endpoints
- Database operations
- Service interactions

### E2E Tests
- Critical user flows
- Complete workflows

## Common Mistakes to Avoid

- Testing implementation details instead of behavior
- Brittle selectors (CSS classes vs semantic selectors)
- Tests that depend on each other (no isolation)
- Skipping edge cases and error paths

## Best Practices

1. **Write Tests First** — always TDD
2. **One Assert Per Test** — focus on single behavior
3. **Descriptive Test Names** — explain what's tested
4. **Arrange-Act-Assert** — clear test structure
5. **Mock External Dependencies** — isolate unit tests
6. **Test Edge Cases** — null, undefined, empty, large
7. **Test Error Paths** — not just happy paths
8. **Keep Tests Fast** — unit tests < 50ms each
9. **Clean Up After Tests** — no side effects
10. **Review Coverage Reports** — identify gaps
```

**Step 2: Remove the now-merged tdd-workflow skill**

```bash
rm -rf skills/tdd-workflow/
```

**Step 3: Commit**

```bash
git add skills/tdd/SKILL.md
git add -A  # capture tdd-workflow deletion
git commit -m "feat: create tdd skill (merge tdd-guide agent + tdd command + tdd-workflow)

Comprehensive TDD skill with RED-GREEN-REFACTOR cycle.
Merges agents/tdd-guide.md + commands/tdd.md + skills/tdd-workflow/.
Deletes now-redundant skills/tdd-workflow/."
```

---

### Task 1.4: Create `skills/security-review/SKILL.md`

**Files:**
- Modify: `skills/security-review/SKILL.md` (already exists, needs rewrite)
- Source: `agents/security-reviewer.md` + existing `skills/security-review/SKILL.md`

**Step 1: Read existing security-review skill**

```bash
cat skills/security-review/SKILL.md
```

**Step 2: Rewrite skills/security-review/SKILL.md**

Merge the security-reviewer agent content with the existing skill. Remove Claude Code references. Add behavioral constraint (read-only).

The SKILL.md should contain:
- Frontmatter: `name: security-review`, `description: ...`
- Behavioral constraint: read-only, do NOT modify files
- OWASP Top 10 checklist
- Secret detection patterns
- Input validation checks
- Authentication/authorization review
- Cloud infrastructure security (from existing `cloud-infrastructure-security.md`)
- Output format with severity levels

**Step 3: Verify no Claude Code references**

```bash
grep -i "claude\|Task tool" skills/security-review/SKILL.md
```

**Step 4: Commit**

```bash
git add skills/security-review/SKILL.md
git commit -m "feat: rewrite security-review skill (merge security-reviewer agent)

Read-only security audit skill with OWASP Top 10, secret detection,
and cloud infrastructure security checks."
```

---

### Task 1.5: Stage 1 Gate — Smoke Test Core Skills

**Step 1: Verify all 4 core skills exist with proper frontmatter**

```bash
for skill in plan code-review tdd security-review; do
  echo "--- $skill ---"
  head -5 skills/$skill/SKILL.md
  echo ""
done
```

**Step 2: Run validation**

```bash
node scripts/ci/validate-skills.js
```

**Step 3: Verify no Claude Code references in core skills**

```bash
grep -ri "claude code\|Task tool\|Read tool\|tools:" skills/plan/ skills/code-review/ skills/tdd/ skills/security-review/
# Should return nothing
```

**Step 4: Tag checkpoint**

```bash
git tag -a stage-1-core-skills -m "Stage 1: core skills (plan, code-review, tdd, security-review) complete"
```

---

## Stage 2: Remaining Agent-Skills + Command-Skills Migration

### Task 2.1: Create Remaining 9 Agent-Derived Skills

For each of the following, create `skills/<name>/SKILL.md` by merging the agent + any corresponding command:

| # | Skill | Sources | Constraint |
|---|-------|---------|-----------|
| 1 | `skills/architect/SKILL.md` | `agents/architect.md` | Read-only |
| 2 | `skills/build-fix/SKILL.md` | `agents/build-error-resolver.md` + `commands/build-fix.md` | Can write |
| 3 | `skills/database-review/SKILL.md` | `agents/database-reviewer.md` | Read-only |
| 4 | `skills/doc-updater/SKILL.md` | `agents/doc-updater.md` + `commands/update-docs.md` + `commands/update-codemaps.md` | Can write |
| 5 | `skills/e2e/SKILL.md` | `agents/e2e-runner.md` + `commands/e2e.md` | Can write |
| 6 | `skills/go-build-fix/SKILL.md` | `agents/go-build-resolver.md` + `commands/go-build.md` | Can write |
| 7 | `skills/go-review/SKILL.md` | `agents/go-reviewer.md` + `commands/go-review.md` | Read-only |
| 8 | `skills/python-review/SKILL.md` | `agents/python-reviewer.md` + `commands/python-review.md` | Read-only |
| 9 | `skills/refactor-clean/SKILL.md` | `agents/refactor-cleaner.md` + `commands/refactor-clean.md` | Can write |

**For each skill, follow this pattern:**

**Step 1: Read the source agent and command files**

**Step 2: Create SKILL.md with:**
- Frontmatter: `name` and `description` only (no `tools`, no `model`)
- Behavioral constraint section
- Core expertise content (preserve checklists, workflows, patterns)
- Remove all Claude Code references

**Step 3: Verify no Claude Code references**

**Step 4: Commit each skill individually or in logical groups**

```bash
git add skills/architect/SKILL.md skills/build-fix/SKILL.md skills/database-review/SKILL.md
git commit -m "feat: create architect, build-fix, database-review skills

Migrate agents to role-switching skills with behavioral constraints."

git add skills/doc-updater/SKILL.md skills/e2e/SKILL.md
git commit -m "feat: create doc-updater and e2e skills"

git add skills/go-build-fix/SKILL.md skills/go-review/SKILL.md skills/go-test/SKILL.md
git commit -m "feat: create Go-specific skills (go-build-fix, go-review, go-test)"

git add skills/python-review/SKILL.md skills/refactor-clean/SKILL.md
git commit -m "feat: create python-review and refactor-clean skills"
```

---

### Task 2.2: Create `skills/go-test/SKILL.md`

**Files:**
- Create: `skills/go-test/SKILL.md`
- Source: `commands/go-test.md`

This is a command-only conversion (no agent equivalent). Create SKILL.md with Go-specific TDD workflow: table-driven tests, `-race` flag, subtests, benchmarks.

**Step 1: Read source**

```bash
cat commands/go-test.md
```

**Step 2: Create SKILL.md with Go TDD workflow**

**Step 3: Commit**

```bash
git add skills/go-test/SKILL.md
git commit -m "feat: create go-test skill from command"
```

---

### Task 2.3: Convert Remaining 13 Command-Only Skills

Convert each remaining command to a skill. These commands have no corresponding agent.

| # | Command Source | New Skill | Notes |
|---|---------------|-----------|-------|
| 1 | `commands/eval.md` | `skills/eval/SKILL.md` | Merge with `skills/eval-harness/` |
| 2 | `commands/verify.md` | `skills/verify/SKILL.md` | Merge with `skills/verification-loop/` |
| 3 | `commands/checkpoint.md` | `skills/checkpoint/SKILL.md` | Direct convert |
| 4 | `commands/learn.md` | `skills/learn/SKILL.md` | Direct convert |
| 5 | `commands/test-coverage.md` | `skills/test-coverage/SKILL.md` | Direct convert |
| 6 | `commands/sessions.md` | `skills/sessions/SKILL.md` | Rewrite for Codex native sessions |
| 7 | `commands/evolve.md` | `skills/evolve/SKILL.md` | Direct convert |
| 8 | `commands/instinct-status.md` | `skills/instinct-status/SKILL.md` | Direct convert |
| 9 | `commands/instinct-export.md` | `skills/instinct-export/SKILL.md` | Direct convert |
| 10 | `commands/instinct-import.md` | `skills/instinct-import/SKILL.md` | Direct convert |
| 11 | `commands/skill-create.md` | `skills/skill-create/SKILL.md` | Direct convert |
| 12 | `commands/setup-pm.md` | `skills/setup-pm/SKILL.md` | Direct convert |
| 13 | `commands/pm2.md` | `skills/pm2/SKILL.md` | Direct convert |

**For eval**: Merge `commands/eval.md` + `skills/eval-harness/SKILL.md` → `skills/eval/SKILL.md`, then delete `skills/eval-harness/`.

**For verify**: Merge `commands/verify.md` + `skills/verification-loop/SKILL.md` → `skills/verify/SKILL.md`, then delete `skills/verification-loop/`.

**For sessions**: Rewrite to reference Codex native session logs instead of Claude Code session hooks.

**For each:**
1. Read source command
2. Create SKILL.md with `name`/`description` frontmatter
3. Remove Claude Code references
4. Commit

```bash
git add skills/eval/SKILL.md skills/verify/SKILL.md skills/checkpoint/SKILL.md skills/learn/SKILL.md
git commit -m "feat: create eval, verify, checkpoint, learn skills from commands

Eval merges eval command + eval-harness skill.
Verify merges verify command + verification-loop skill."

git add skills/test-coverage/SKILL.md skills/sessions/SKILL.md
git commit -m "feat: create test-coverage and sessions skills"

git add skills/evolve/SKILL.md skills/instinct-status/SKILL.md skills/instinct-export/SKILL.md skills/instinct-import/SKILL.md
git commit -m "feat: create instinct management skills"

git add skills/skill-create/SKILL.md skills/setup-pm/SKILL.md skills/pm2/SKILL.md
git commit -m "feat: create skill-create, setup-pm, pm2 skills"
```

---

### Task 2.4: Create Orchestration Skills (Rewrites)

**Files:**
- Create: `skills/orchestrate/SKILL.md`
- Create: `skills/multi-plan/SKILL.md`
- Create: `skills/multi-execute/SKILL.md`
- Create: `skills/multi-workflow/SKILL.md`
- Source: `commands/orchestrate.md` (new) + `commands/multi-plan.md` + `commands/multi-execute.md` + `commands/multi-workflow.md`

**Step 1: Create skills/orchestrate/SKILL.md**

Rewrite as a sequential skill workflow guide (no multi-agent orchestration):

```markdown
---
name: orchestrate
description: Full feature workflow orchestrating plan, tdd, code-review, and security-review skills in sequence. Use for complete feature implementation from design to review.
---

# Full Feature Workflow

Orchestrate a complete feature implementation through sequential skill invocations.

## Workflow Phases

### Phase 1: Planning
Use `/plan` to analyze requirements and create implementation plan.
Wait for user confirmation before proceeding.

### Phase 2: Test-Driven Development
Use `/tdd` to write tests first, then implement.
Follow RED → GREEN → REFACTOR cycle.

### Phase 3: Code Review
Use `/code-review` to review code quality.
Address CRITICAL and HIGH issues before continuing.

### Phase 4: Security Review
Use `/security-review` for security audit.
Fix any CRITICAL security issues.

## Between Phases

After each phase, provide:
- Summary of what was accomplished
- Any issues found and how they were resolved
- Handoff context for the next phase
```

**Step 2: Convert multi-plan, multi-execute, multi-workflow similarly**

Mark these as advanced/experimental skills.

**Step 3: Commit**

```bash
git add skills/orchestrate/SKILL.md skills/multi-plan/SKILL.md skills/multi-execute/SKILL.md skills/multi-workflow/SKILL.md
git commit -m "feat: create orchestration skills (orchestrate, multi-plan, multi-execute, multi-workflow)

Sequential workflow orchestration replacing multi-agent patterns.
Marked as advanced skills."
```

---

### Task 2.5: Delete Original agents/ and commands/ Directories

**Files:**
- Delete: `agents/` (entire directory — all 13 agents now in skills/)
- Delete: `commands/` (entire directory — all 32 commands now in skills/)

**Step 1: Verify all content has been migrated**

```bash
# List all agents and verify each has a corresponding skill
for agent in agents/*.md; do
  name=$(basename "$agent" .md)
  echo "$name → $(ls skills/*/SKILL.md 2>/dev/null | grep -i "$name" || echo "CHECK MANUALLY")"
done

# List all commands and verify each has a corresponding skill
for cmd in commands/*.md; do
  name=$(basename "$cmd" .md)
  echo "$name → $(ls skills/*/SKILL.md 2>/dev/null | grep -i "$name" || echo "CHECK MANUALLY")"
done
```

**Step 2: Delete directories**

```bash
rm -rf agents/ commands/
```

**Step 3: Verify deletion**

```bash
test ! -d agents && echo "agents/ removed OK"
test ! -d commands && echo "commands/ removed OK"
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove agents/ and commands/ directories

All 13 agents and 32 commands have been migrated to skills/.
Agent expertise is preserved as role-switching behavioral constraints.
Command workflows are preserved in skill instructions."
```

---

### Task 2.6: Delete Merged Skills

**Files:**
- Delete: `skills/eval-harness/` (merged into `skills/eval/`)
- Delete: `skills/verification-loop/` (merged into `skills/verify/`)
- Delete: `skills/tdd-workflow/` (merged into `skills/tdd/` — already done in Task 1.3)

**Step 1: Delete merged skill directories**

```bash
rm -rf skills/eval-harness/ skills/verification-loop/
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove merged skill directories

eval-harness merged into eval, verification-loop merged into verify."
```

---

### Task 2.7: Stage 2 Gate — Skill Discovery + Validation

**Step 1: Run skill validation**

```bash
node scripts/ci/validate-skills.js
```

**Step 2: Count total skills**

```bash
ls -d skills/*/SKILL.md | wc -l
# Expected: ~55-60 skills
```

**Step 3: Verify no Claude Code references across all skills**

```bash
grep -ri "claude code\|Task tool\|\.claude/agents\|\.claude/commands" skills/
# Should return nothing
```

**Step 4: Run structure validation**

```bash
node scripts/ci/validate-structure.js
```

**Step 5: Tag checkpoint**

```bash
git tag -a stage-2-all-skills -m "Stage 2: all agents and commands migrated to skills"
```

---

## Stage 3: Pattern Skills Migration (29 Existing Skills)

### Task 3.1: Clean Up Existing Skills Frontmatter

**Files:**
- Modify: All 20 "direct migration" skills to ensure `name`/`description` frontmatter and remove Claude Code references

The following skills need frontmatter review and Claude Code reference cleanup:

`golang-patterns`, `golang-testing`, `python-patterns`, `python-testing`, `backend-patterns`, `frontend-patterns`, `coding-standards`, `django-patterns`, `django-security`, `django-tdd`, `springboot-patterns`, `springboot-security`, `springboot-tdd`, `jpa-patterns`, `postgres-patterns`, `clickhouse-io`, `iterative-retrieval`, `project-guidelines-example`, `continuous-learning`

Also check: `java-coding-standards`, `django-verification`, `springboot-verification`

**For each:**
1. Read SKILL.md
2. Ensure frontmatter has only `name` and `description` (remove `tools`, `model` if present)
3. Replace any Claude Code references with generic terms
4. Save

**Step 1: Batch scan for issues**

```bash
for dir in skills/*/; do
  skill=$(basename "$dir")
  file="$dir/SKILL.md"
  if [ -f "$file" ]; then
    # Check for Claude Code-specific frontmatter
    if grep -q "^tools:" "$file" 2>/dev/null || grep -q "^model:" "$file" 2>/dev/null; then
      echo "FIX FRONTMATTER: $skill"
    fi
    # Check for Claude Code references
    if grep -qi "claude code\|Task tool\|Read tool\|\.claude/" "$file" 2>/dev/null; then
      echo "FIX REFERENCES: $skill"
    fi
  fi
done
```

**Step 2: Fix each flagged skill**

**Step 3: Run validation**

```bash
node scripts/ci/validate-skills.js
```

**Step 4: Commit**

```bash
git add skills/
git commit -m "fix: clean up skill frontmatter and remove Claude Code references

Ensure all skills have name/description only frontmatter.
Remove tools/model fields and Claude Code-specific references."
```

---

### Task 3.2: Rewrite Skills That Need Changes

**Files to rewrite:**

| Skill | Reason |
|-------|--------|
| `skills/continuous-learning-v2/SKILL.md` | Remove hook dependency, make manual-only |
| `skills/strategic-compact/SKILL.md` | Codex has no /compact, change to manual suggestion |
| `skills/configure-ecc/SKILL.md` | Rename to `configure-codex`, paths to `~/.codex/` and `~/.agents/skills/` |

**Step 1: Rewrite continuous-learning-v2**

Remove all hook references. Change from automatic to manual invocation via `/learn`.

**Step 2: Rewrite strategic-compact**

Remove /compact references. Change to: "Consider starting a new session if context is getting large."

**Step 3: Rename and rewrite configure-ecc → configure-codex**

```bash
mv skills/configure-ecc/ skills/configure-codex/
```

Update SKILL.md:
- `name: configure-codex`
- All paths from `~/.claude/` → `~/.codex/` and `~/.agents/skills/`
- Reference Codex CLI instead of Claude Code

**Step 4: Delete the script helper if it references Claude Code**

Check `skills/strategic-compact/suggest-compact.sh` and `skills/continuous-learning/evaluate-session.sh` for Claude Code references.

**Step 5: Commit**

```bash
git add skills/continuous-learning-v2/ skills/strategic-compact/ skills/configure-codex/
git add -A  # capture rename
git commit -m "feat: rewrite skills for Codex compatibility

- continuous-learning-v2: remove hook dependency, manual only
- strategic-compact: remove /compact, manual session management
- configure-ecc renamed to configure-codex with Codex paths"
```

---

### Task 3.3: Create Language Rules Skills (3 New Skills)

**Files:**
- Create: `skills/golang-rules/SKILL.md`
- Create: `skills/python-rules/SKILL.md`
- Create: `skills/typescript-rules/SKILL.md`
- Source: `rules/golang/*.md`, `rules/python/*.md`, `rules/typescript/*.md`

These skills package language-specific rules for on-demand loading, complementing the AGENTS.md templates.

**Step 1: Create skills/golang-rules/SKILL.md**

```markdown
---
name: golang-rules
description: Go language coding rules, testing patterns, security practices, and post-edit actions. Load when working on Go projects for language-specific guidance.
---

# Go Language Rules

[Consolidate all content from rules/golang/*.md — coding-style, testing, patterns, security, hooks — into a single comprehensive skill]
```

**Step 2: Create python-rules and typescript-rules similarly**

**Step 3: Commit**

```bash
git add skills/golang-rules/ skills/python-rules/ skills/typescript-rules/
git commit -m "feat: create language rules skills (golang, python, typescript)

Package language-specific rules as on-demand skills.
Complement AGENTS.md templates with detailed patterns."
```

---

### Task 3.4: Stage 3 Gate — Pattern Skills Validation

**Step 1: Run validation**

```bash
node scripts/ci/validate-skills.js
```

**Step 2: Full Claude Code reference scan**

```bash
grep -ri "claude code\|\.claude/\|Task tool\|Read tool\|Write tool\|Edit tool\|Glob tool\|Grep tool" skills/ AGENTS.md golang/ python/ typescript/
# Should return nothing
```

**Step 3: Tag checkpoint**

```bash
git tag -a stage-3-all-patterns -m "Stage 3: all pattern skills migrated and cleaned"
```

---

## Stage 4: Installation, Scripts, and Documentation

### Task 4.1: Create install.sh

**Files:**
- Create: `scripts/install.sh`

**Step 1: Write install.sh**

Key behaviors:
- Backup existing `~/.codex/` before any changes
- AGENTS.md merge strategy (append/include/replace/skip/dry-run)
- Copy skills to `~/.agents/skills/` (correct Codex path, not `~/.codex/skills/`)
- Copy rules to `~/.codex/rules/`
- Copy config.toml as example
- Record install manifest for clean uninstall
- Post-install verification

```bash
#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="$HOME/.codex"
AGENTS_SKILLS_DIR="$HOME/.agents/skills"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$CODEX_DIR/.backup-$(date +%Y%m%d%H%M%S)"
INSTALL_MANIFEST="$CODEX_DIR/.everything-codex-manifest"

echo "everything-codex installer"
echo "========================="
echo ""

# 0. Backup
if [ -d "$CODEX_DIR" ] || [ -d "$AGENTS_SKILLS_DIR" ]; then
    echo "Backing up existing configuration..."
    mkdir -p "$BACKUP_DIR"
    [ -f "$CODEX_DIR/AGENTS.md" ] && cp "$CODEX_DIR/AGENTS.md" "$BACKUP_DIR/"
    [ -d "$CODEX_DIR/rules" ] && cp -r "$CODEX_DIR/rules" "$BACKUP_DIR/"
    [ -d "$AGENTS_SKILLS_DIR" ] && cp -r "$AGENTS_SKILLS_DIR" "$BACKUP_DIR/skills"
    for lang in golang python typescript; do
        if [ -d "$CODEX_DIR/$lang" ]; then
            mkdir -p "$BACKUP_DIR/$lang"
            cp -r "$CODEX_DIR/$lang" "$BACKUP_DIR/"
        fi
    done
    echo "Backup saved to: $BACKUP_DIR"
fi

# 1. AGENTS.md — merge, not overwrite
mkdir -p "$CODEX_DIR"
if [ -f "$CODEX_DIR/AGENTS.md" ]; then
    echo ""
    echo "Existing AGENTS.md detected. Choose merge strategy:"
    echo "  1) append  - Add everything-codex rules to end of existing file"
    echo "  2) include - Add reference comment to existing file"
    echo "  3) replace - Replace with everything-codex version (original backed up)"
    echo "  4) skip    - Do not modify (default)"
    echo "  5) dry-run - Show diff only"
    read -rp "Choice [1-5, default=4]: " choice
    case "${choice:-4}" in
        1) printf '\n# --- everything-codex rules ---\n\n' >> "$CODEX_DIR/AGENTS.md"
           cat "$PROJECT_DIR/AGENTS.md" >> "$CODEX_DIR/AGENTS.md"
           echo "Appended to AGENTS.md" ;;
        2) printf '\n# everything-codex rules: see ~/.codex/.everything-codex/AGENTS.md\n' >> "$CODEX_DIR/AGENTS.md"
           echo "Added reference to AGENTS.md" ;;
        3) cp "$PROJECT_DIR/AGENTS.md" "$CODEX_DIR/AGENTS.md"
           echo "Replaced AGENTS.md" ;;
        4) echo "Skipped AGENTS.md" ;;
        5) diff "$CODEX_DIR/AGENTS.md" "$PROJECT_DIR/AGENTS.md" || true ;;
    esac
else
    cp "$PROJECT_DIR/AGENTS.md" "$CODEX_DIR/AGENTS.md"
    echo "Installed AGENTS.md"
fi

# 2. Language AGENTS.md templates
for lang in golang python typescript; do
    mkdir -p "$CODEX_DIR/$lang"
    if [ -f "$CODEX_DIR/$lang/AGENTS.md" ]; then
        echo "Existing $lang/AGENTS.md, skipping (use --force to overwrite)"
    else
        cp "$PROJECT_DIR/$lang/AGENTS.md" "$CODEX_DIR/$lang/AGENTS.md"
        echo "Installed $lang/AGENTS.md"
    fi
done

# 3. Skills → ~/.agents/skills/
mkdir -p "$AGENTS_SKILLS_DIR"
echo "Installing skills..."
for skill_dir in "$PROJECT_DIR"/skills/*/; do
    skill_name=$(basename "$skill_dir")
    target="$AGENTS_SKILLS_DIR/$skill_name"
    mkdir -p "$target"
    cp -r "$skill_dir"* "$target/"
done
echo "Installed $(ls -d "$PROJECT_DIR"/skills/*/ | wc -l | tr -d ' ') skills"

# 4. Rules → ~/.codex/rules/
mkdir -p "$CODEX_DIR/rules"
cp "$PROJECT_DIR"/rules/*.rules "$CODEX_DIR/rules/"
echo "Installed execution policy rules"

# 5. Config examples
cp "$PROJECT_DIR/config.toml" "$CODEX_DIR/config.toml.example"
echo "Installed config.toml.example"

# 6. Install manifest
: > "$INSTALL_MANIFEST"
find "$AGENTS_SKILLS_DIR" -type f >> "$INSTALL_MANIFEST"
find "$CODEX_DIR/rules" -name "*.rules" -type f >> "$INSTALL_MANIFEST"
echo "$CODEX_DIR/config.toml.example" >> "$INSTALL_MANIFEST"
echo "Manifest written to $INSTALL_MANIFEST"

# 7. Post-install verification
echo ""
echo "Running verification..."
if command -v codex &>/dev/null; then
    codex --check-config 2>/dev/null && echo "Config: OK" || echo "Config: check failed (may need manual review)"
else
    echo "codex CLI not found, skipping config check"
fi

echo ""
echo "Installation complete!"
echo "Backup at: $BACKUP_DIR"
echo "To uninstall: $(dirname "$0")/uninstall.sh"
echo "To rollback: $0 --rollback"
```

**Step 2: Make executable**

```bash
chmod +x scripts/install.sh
```

**Step 3: Commit**

```bash
git add scripts/install.sh
git commit -m "feat: add install.sh with backup, merge, and manifest

Installs skills to ~/.agents/skills/, rules to ~/.codex/rules/,
AGENTS.md with merge strategy. Backs up existing config and
records manifest for clean uninstall."
```

---

### Task 4.2: Create uninstall.sh

**Files:**
- Create: `scripts/uninstall.sh`

**Step 1: Write uninstall.sh with manifest-based cleanup and rollback**

```bash
#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="$HOME/.codex"
INSTALL_MANIFEST="$CODEX_DIR/.everything-codex-manifest"

if [ "${1:-}" = "--rollback" ]; then
    LATEST_BACKUP=$(ls -dt "$CODEX_DIR"/.backup-* 2>/dev/null | head -1)
    if [ -z "$LATEST_BACKUP" ]; then
        echo "No backup found. Cannot rollback."
        exit 1
    fi
    echo "Rolling back from $LATEST_BACKUP..."
    cp -r "$LATEST_BACKUP"/* "$CODEX_DIR/" 2>/dev/null || true
    echo "Rollback complete."
    exit 0
fi

if [ ! -f "$INSTALL_MANIFEST" ]; then
    echo "No install manifest found. Was everything-codex installed?"
    exit 1
fi

echo "Uninstalling everything-codex..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        rm -f "$file"
    fi
done < "$INSTALL_MANIFEST"

# Clean up empty directories
find "$HOME/.agents/skills" -type d -empty -delete 2>/dev/null || true

rm -f "$INSTALL_MANIFEST"
echo "Uninstall complete."
echo "Note: AGENTS.md files were not removed. Delete manually if desired."
```

**Step 2: Make executable and commit**

```bash
chmod +x scripts/uninstall.sh
git add scripts/uninstall.sh
git commit -m "feat: add uninstall.sh with manifest-based cleanup and rollback"
```

---

### Task 4.3: Create CI Check Scripts

**Files:**
- Create: `scripts/ci/check-format.sh`
- Create: `scripts/ci/check-console-log.sh`

These replace PostToolUse hooks as CI-layer enforcement.

**Step 1: Create check-format.sh**

```bash
#!/usr/bin/env bash
# Check code formatting across modified files
set -euo pipefail

errors=0

# Check Go files
if command -v gofmt &>/dev/null; then
    unformatted=$(gofmt -l . 2>/dev/null || true)
    if [ -n "$unformatted" ]; then
        echo "ERROR: Unformatted Go files:"
        echo "$unformatted"
        errors=1
    fi
fi

# Check JS/TS files with prettier (if available)
if command -v npx &>/dev/null && [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
    npx prettier --check "**/*.{ts,tsx,js,jsx}" 2>/dev/null || errors=1
fi

# Check Python files with black (if available)
if command -v black &>/dev/null; then
    black --check . 2>/dev/null || errors=1
fi

exit $errors
```

**Step 2: Create check-console-log.sh**

```bash
#!/usr/bin/env bash
# Detect debug statements in staged/modified files
set -euo pipefail

errors=0

# Get modified files
files=$(git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || true)

for file in $files; do
    if [ ! -f "$file" ]; then continue; fi
    case "$file" in
        *.ts|*.tsx|*.js|*.jsx)
            if grep -n "console\.log\|console\.debug" "$file" 2>/dev/null; then
                echo "WARNING: Debug statement in $file"
                errors=1
            fi
            ;;
        *.py)
            if grep -n "^[^#]*\bprint(" "$file" 2>/dev/null; then
                echo "WARNING: Print statement in $file"
                errors=1
            fi
            ;;
    esac
done

exit $errors
```

**Step 3: Make executable and commit**

```bash
chmod +x scripts/ci/check-format.sh scripts/ci/check-console-log.sh
git add scripts/ci/check-format.sh scripts/ci/check-console-log.sh
git commit -m "feat: add CI check scripts for formatting and debug statements

Replace PostToolUse hooks with CI-layer enforcement.
check-format.sh: gofmt + prettier + black
check-console-log.sh: detect console.log/print in modified files"
```

---

### Task 4.4: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Rewrite README.md for Codex CLI**

Key changes:
- Title: everything-codex (not everything-claude-code)
- Description: Configuration toolkit for OpenAI Codex CLI
- Installation: `./scripts/install.sh` (not plugin install)
- Skill count updated
- Remove all Claude Code references
- Update directory structure to match new layout
- Update examples to use Codex CLI

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for everything-codex

Update title, description, installation, directory structure,
and examples for OpenAI Codex CLI. Remove Claude Code references."
```

---

### Task 4.5: Update CONTRIBUTING.md

**Files:**
- Modify: `CONTRIBUTING.md`

**Step 1: Update for Codex**

- Remove agent/command contribution templates
- Add skill contribution template
- Update AGENTS.md contribution guidelines
- Add Starlark rules contribution guidelines
- Update file naming conventions

**Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: update CONTRIBUTING.md for Codex skill format"
```

---

### Task 4.6: Clean Up Remaining Files

**Files:**
- Delete: `rules/common/hooks.md` (hooks removed, advice now in AGENTS.md)
- Delete: `rules/common/agents.md` (agent orchestration now in AGENTS.md)
- Delete: `rules/*/hooks.md` (3 files — hook-specific rules no longer relevant)
- Modify: `rules/README.md` (update for new structure)
- Delete: `mcp-configs/` (migrated to config.toml)
- Delete: `the-shortform-guide.md` (Claude Code specific)
- Delete: `the-longform-guide.md` (Claude Code specific)
- Delete: `llms.txt` (OpenCode specific)
- Delete: `README.zh-CN.md` (needs full rewrite, remove for now)
- Delete: `SPONSORS.md` (optional, keep if still relevant)
- Update: `package.json` name field
- Update: `.gitignore` if needed

**Step 1: Delete obsolete files**

```bash
rm -f rules/common/hooks.md rules/common/agents.md
rm -f rules/golang/hooks.md rules/python/hooks.md rules/typescript/hooks.md
rm -rf mcp-configs/
rm -f the-shortform-guide.md the-longform-guide.md llms.txt README.zh-CN.md
```

**Step 2: Update package.json name**

Change `"name"` from `"everything-claude-code"` to `"everything-codex"`.

**Step 3: Update rules/README.md**

Describe the new structure: common rules + language rules + `.rules` execution policies.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up obsolete files and update project metadata

Remove hooks-related rules, mcp-configs (migrated to config.toml),
Claude Code guides, OpenCode llms.txt. Update package.json name."
```

---

### Task 4.7: Create Example Files

**Files:**
- Create: `examples/AGENTS.md`
- Create: `examples/config.toml`
- Update: `examples/CLAUDE.md` → rename to `examples/project-AGENTS.md`

**Step 1: Create example AGENTS.md**

A minimal project-level AGENTS.md example showing how users customize for their project.

**Step 2: Create example config.toml**

Minimal config with comments explaining each field.

**Step 3: Rename and update example**

```bash
mv examples/CLAUDE.md examples/project-AGENTS.md
# Update content to reference Codex
```

**Step 4: Delete Claude Code specific examples**

```bash
rm -f examples/user-CLAUDE.md examples/statusline.json
rm -rf examples/sessions/
```

**Step 5: Commit**

```bash
git add -A
git commit -m "docs: update examples for Codex (AGENTS.md, config.toml)"
```

---

### Task 4.8: Create Documentation

**Files:**
- Create: `docs/migration-from-claude-code.md`
- Create: `docs/agents-md-architecture.md`
- Create: `docs/capability-degradation.md`

**Step 1: Write migration guide**

Map every Claude Code concept to its Codex equivalent:
- `agents/` → `skills/` with behavioral constraints
- `commands/` → `skills/` with SKILL.md
- `hooks/hooks.json` → `rules/*.rules` + AGENTS.md text
- `rules/*.md` → `AGENTS.md` hierarchy
- `contexts/` → `config.toml` profiles
- `.claude-plugin/` → (removed, no equivalent)

**Step 2: Write AGENTS.md architecture doc**

Explain the hierarchical discovery, merge strategy, language-specific templates.

**Step 3: Write capability degradation doc**

Explicitly list what's lost and what's gained.

**Step 4: Commit**

```bash
git add docs/migration-from-claude-code.md docs/agents-md-architecture.md docs/capability-degradation.md
git commit -m "docs: add migration guide, architecture doc, capability degradation"
```

---

### Task 4.9: Stage 4 Final Gate — End-to-End Verification

**Step 1: Run all CI validations**

```bash
node scripts/ci/validate-structure.js
node scripts/ci/validate-skills.js
```

**Step 2: Full Claude Code reference scan**

```bash
grep -ri "claude code\|\.claude/\|claude-plugin\|opencode" skills/ AGENTS.md golang/ python/ typescript/ config.toml scripts/install.sh scripts/uninstall.sh README.md CONTRIBUTING.md
# Should return nothing (except maybe docs/migration-from-claude-code.md which is expected)
```

**Step 3: Verify install/uninstall in temp environment**

```bash
# Create temp HOME
export HOME_BACKUP="$HOME"
export HOME=$(mktemp -d)
bash scripts/install.sh <<< "3"  # replace strategy
test -f "$HOME/.codex/AGENTS.md" && echo "AGENTS.md: OK"
test -d "$HOME/.agents/skills/plan" && echo "Skills: OK"
test -f "$HOME/.codex/rules/safety.rules" && echo "Rules: OK"
bash scripts/uninstall.sh
test ! -d "$HOME/.agents/skills/plan" && echo "Uninstall: OK"
export HOME="$HOME_BACKUP"
```

**Step 4: Count final skill count**

```bash
ls -d skills/*/SKILL.md | wc -l
```

**Step 5: Final tag**

```bash
git tag -a v2.0.0-rc1 -m "everything-codex v2.0.0-rc1: full Codex CLI migration"
```

---

## Final Directory Structure (Expected)

```
everything-codex/
├── AGENTS.md                          # Global instructions (< 32 KiB)
├── golang/
│   └── AGENTS.md                      # Go-specific rules template
├── python/
│   └── AGENTS.md                      # Python-specific rules template
├── typescript/
│   └── AGENTS.md                      # TypeScript-specific rules template
├── config.toml                        # Codex config (MCP + profiles)
├── requirements.toml                  # Security baseline reference
├── rules/                             # Starlark execution policies
│   ├── safety.rules
│   ├── git-safety.rules
│   ├── file-hygiene.rules
│   └── README.md
├── skills/                            # ~60 skills
│   ├── plan/SKILL.md                  # From: planner agent + plan command
│   ├── code-review/SKILL.md           # From: code-reviewer agent + command
│   ├── tdd/SKILL.md                   # From: tdd-guide agent + command + workflow
│   ├── security-review/SKILL.md       # From: security-reviewer agent + skill
│   ├── architect/SKILL.md             # From: architect agent
│   ├── build-fix/SKILL.md             # From: build-error-resolver agent
│   ├── database-review/SKILL.md       # From: database-reviewer agent
│   ├── doc-updater/SKILL.md           # From: doc-updater agent
│   ├── e2e/SKILL.md                   # From: e2e-runner agent
│   ├── go-build-fix/SKILL.md          # From: go-build-resolver agent
│   ├── go-review/SKILL.md             # From: go-reviewer agent
│   ├── go-test/SKILL.md               # From: go-test command
│   ├── python-review/SKILL.md         # From: python-reviewer agent
│   ├── refactor-clean/SKILL.md        # From: refactor-cleaner agent
│   ├── orchestrate/SKILL.md           # From: rewritten
│   ├── eval/SKILL.md                  # From: eval command + eval-harness
│   ├── verify/SKILL.md                # From: verify command + verification-loop
│   ├── checkpoint/SKILL.md
│   ├── learn/SKILL.md
│   ├── test-coverage/SKILL.md
│   ├── sessions/SKILL.md              # Rewritten for Codex native sessions
│   ├── evolve/SKILL.md
│   ├── instinct-status/SKILL.md
│   ├── instinct-export/SKILL.md
│   ├── instinct-import/SKILL.md
│   ├── skill-create/SKILL.md
│   ├── setup-pm/SKILL.md
│   ├── configure-codex/SKILL.md       # Renamed from configure-ecc
│   ├── multi-plan/SKILL.md
│   ├── multi-execute/SKILL.md
│   ├── multi-workflow/SKILL.md
│   ├── pm2/SKILL.md
│   ├── golang-rules/SKILL.md          # NEW: language rules skill
│   ├── python-rules/SKILL.md          # NEW: language rules skill
│   ├── typescript-rules/SKILL.md      # NEW: language rules skill
│   ├── golang-patterns/SKILL.md
│   ├── golang-testing/SKILL.md
│   ├── python-patterns/SKILL.md
│   ├── python-testing/SKILL.md
│   ├── backend-patterns/SKILL.md
│   ├── frontend-patterns/SKILL.md
│   ├── coding-standards/SKILL.md
│   ├── django-patterns/SKILL.md
│   ├── django-security/SKILL.md
│   ├── django-tdd/SKILL.md
│   ├── django-verification/SKILL.md
│   ├── springboot-patterns/SKILL.md
│   ├── springboot-security/SKILL.md
│   ├── springboot-tdd/SKILL.md
│   ├── springboot-verification/SKILL.md
│   ├── java-coding-standards/SKILL.md
│   ├── jpa-patterns/SKILL.md
│   ├── postgres-patterns/SKILL.md
│   ├── clickhouse-io/SKILL.md
│   ├── continuous-learning/SKILL.md
│   ├── continuous-learning-v2/SKILL.md
│   ├── strategic-compact/SKILL.md
│   ├── iterative-retrieval/SKILL.md
│   └── project-guidelines-example/SKILL.md
├── scripts/
│   ├── install.sh
│   ├── uninstall.sh
│   ├── lib/
│   │   ├── package-manager.js
│   │   └── utils.js
│   ├── ci/
│   │   ├── validate-skills.js
│   │   ├── validate-structure.js
│   │   ├── validate-rules.js
│   │   ├── check-format.sh
│   │   └── check-console-log.sh
│   ├── setup-package-manager.js
│   └── skill-create-output.js
├── examples/
│   ├── project-AGENTS.md
│   └── config.toml
├── docs/
│   ├── plans/
│   ├── migration-from-claude-code.md
│   ├── agents-md-architecture.md
│   └── capability-degradation.md
├── tests/
│   ├── run-all.js
│   └── lib/
├── rules/                             # Markdown rules (remaining)
│   ├── common/
│   │   ├── coding-style.md
│   │   ├── git-workflow.md
│   │   ├── testing.md
│   │   ├── performance.md
│   │   ├── patterns.md
│   │   └── security.md
│   ├── golang/
│   │   ├── coding-style.md
│   │   ├── testing.md
│   │   ├── patterns.md
│   │   └── security.md
│   ├── python/
│   │   └── (same 4 files)
│   ├── typescript/
│   │   └── (same 4 files)
│   └── README.md
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── .gitignore
└── .github/
```

---

## Definition of Done

1. **No Claude Code remnants**: `grep -ri "claude code\|\.claude/" skills/ AGENTS.md` returns nothing
2. **All skills have valid frontmatter**: `node scripts/ci/validate-skills.js` exits 0
3. **Structure valid**: `node scripts/ci/validate-structure.js` exits 0
4. **Install works**: `scripts/install.sh` completes without errors in clean environment
5. **Uninstall works**: `scripts/uninstall.sh` removes all installed files
6. **Rollback works**: `scripts/install.sh --rollback` restores backup
7. **60+ skills**: `ls -d skills/*/SKILL.md | wc -l` >= 55
8. **Rules enforce**: `.rules` files contain appropriate `forbidden`/`prompt` decisions
9. **AGENTS.md < 32 KiB**: `wc -c AGENTS.md` < 32768
10. **README updated**: No Claude Code references in README.md
