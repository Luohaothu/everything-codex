# everything-codex

[![Stars](https://img.shields.io/github/stars/Luohaothu/everything-codex?style=flat)](https://github.com/Luohaothu/everything-codex/stargazers)
[![Forks](https://img.shields.io/github/forks/Luohaothu/everything-codex?style=flat)](https://github.com/Luohaothu/everything-codex/network/members)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)

> **62 skills** | **6 workflows** | **6 languages supported** | **Starlark execution policies** | **Hierarchical AGENTS.md**

---

**A comprehensive configuration toolkit for [OpenAI Codex CLI](https://github.com/openai/codex).**

Production-ready skills, execution policies, AGENTS.md templates, and structured workflows evolved over 10+ months of intensive daily use building real products.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Luohaothu/everything-codex.git
cd everything-codex

# 2. Install
./scripts/install.sh

# 3. Use skills in Codex
/plan "Add user authentication"
/code-review
/tdd
/security-review
```

The installer copies skills to `~/.agents/skills/`, rules to `~/.codex/rules/`, workflows to `~/.codex/workflows/`, prompts to `~/.codex/prompts/`, and AGENTS.md to `~/.codex/AGENTS.md` with backup and merge support.

---

## What's Inside

```
everything-codex/
|-- AGENTS.md              # Root AGENTS.md with coding standards
|-- config.toml            # Codex CLI configuration with profiles + MCP servers
|-- llms.txt               # Machine-readable project context for AI tools
|
|-- skills/                # 62 skills (workflow definitions + domain knowledge)
|   |-- plan/                     # Implementation planning
|   |-- tdd/                      # Test-driven development
|   |-- code-review/              # Quality and security review
|   |-- security-review/          # Vulnerability analysis
|   |-- architect/                # System design decisions
|   |-- build-fix/                # Fix build errors
|   |-- e2e/                      # Playwright E2E testing
|   |-- refactor-clean/           # Dead code cleanup
|   |-- doc-updater/              # Documentation sync
|   |-- eval/                     # Evaluation framework (EDD)
|   |-- verify/                   # Build/lint/test/security checks
|   |-- checkpoint/               # Git-based workflow checkpoints
|   |-- learn/                    # Extract patterns from sessions
|   |-- sessions/                 # Session management
|   |-- test-coverage/            # Coverage analysis
|   |-- configure-codex/          # Interactive installation wizard
|   |-- orchestrate/              # Sequential skill workflow
|   |-- multi-plan/               # Multi-model collaborative planning
|   |-- multi-execute/            # Multi-model code execution
|   |-- multi-workflow/           # Full multi-model development workflow
|   |-- multi-backend/            # Backend-focused orchestration
|   |-- multi-frontend/           # Frontend-focused orchestration
|   |-- go-review/                # Go code review
|   |-- go-test/                  # Go TDD workflow
|   |-- go-build-fix/             # Go build error resolution
|   |-- python-review/            # Python code review
|   |-- database-review/          # PostgreSQL optimization
|   |-- pm2/                      # PM2 process manager
|   |-- skill-create/             # Generate skills from git history
|   |-- continuous-learning/      # Pattern extraction from sessions
|   |-- continuous-learning-v2/   # Instinct-based learning system
|   |-- strategic-compact/        # Session management strategies
|   |-- iterative-retrieval/      # Progressive context refinement
|   |-- document-processing/      # Document parsing + extraction workflows
|   |-- coding-standards/         # TypeScript/JavaScript patterns
|   |-- backend-patterns/         # API and database patterns
|   |-- frontend-patterns/        # React/Next.js patterns
|   |-- golang-patterns/          # Go idioms and best practices
|   |-- golang-testing/           # Go testing patterns
|   |-- golang-rules/             # Go language rules (consolidated)
|   |-- python-patterns/          # Python idioms
|   |-- python-testing/           # Python testing with pytest
|   |-- python-rules/             # Python language rules (consolidated)
|   |-- typescript-rules/         # TypeScript language rules (consolidated)
|   |-- django-patterns/          # Django patterns
|   |-- django-security/          # Django security
|   |-- django-tdd/               # Django TDD
|   |-- django-verification/      # Django verification
|   |-- springboot-patterns/      # Spring Boot patterns
|   |-- springboot-security/      # Spring Boot security
|   |-- springboot-tdd/           # Spring Boot TDD
|   |-- springboot-verification/  # Spring Boot verification
|   |-- java-coding-standards/    # Java coding standards
|   |-- jpa-patterns/             # JPA/Hibernate patterns
|   |-- postgres-patterns/        # PostgreSQL patterns
|   |-- clickhouse-io/            # ClickHouse analytics
|   |-- instinct-status/          # View learned instincts
|   |-- instinct-import/          # Import instincts
|   |-- instinct-export/          # Export instincts
|   |-- evolve/                   # Cluster instincts into skills
|   |-- setup-pm/                 # Package manager configuration
|   |-- project-guidelines-example/ # Example project guidelines
|
|-- workflows/             # Execution playbooks combining skills
|   |-- plan.md                   # Structured planning process
|   |-- tdd.md                    # Test-driven development cycle
|   |-- code-review.md            # Review process with severity levels
|   |-- orchestrate.md            # End-to-end feature workflow
|   |-- refactor-clean.md         # Safe dead-code removal
|   |-- verify.md                 # Pre-commit / pre-PR gate
|
|-- prompts/               # Reusable output templates
|   |-- plan-template.md          # Plan document structure
|   |-- review-template.md        # Review findings structure
|
|-- golang/                # Go project AGENTS.md template
|-- python/                # Python project AGENTS.md template
|-- typescript/            # TypeScript project AGENTS.md template
|
|-- rules/                 # Codex execution policies + markdown rules
|   |-- safety.rules             # Core safety execution policy
|   |-- git-safety.rules         # Git operation safety rules
|   |-- file-hygiene.rules       # File cleanliness rules
|   |-- common/                  # Language-agnostic markdown rules
|   |-- golang/                  # Go-specific rules
|   |-- python/                  # Python-specific rules
|   |-- typescript/              # TypeScript-specific rules
|
|-- scripts/               # Installation and CI scripts
|   |-- install.sh               # Installer with backup/merge/manifest
|   |-- uninstall.sh             # Manifest-based uninstall + rollback
|   |-- ci/                      # CI enforcement scripts
|       |-- check-format.sh      # gofmt + prettier + black
|       |-- check-console-log.sh # Detect debug statements
|
|-- examples/              # Example configurations
|   |-- project-AGENTS.md        # Example project-level AGENTS.md
|   |-- config.toml              # Example Codex CLI config
|
|-- docs/                  # Documentation
```

---

## Key Concepts

### Skills

Skills are the primary building block. Each skill is a `SKILL.md` file that provides workflow definitions, domain knowledge, or behavioral constraints to Codex CLI.

```markdown
---
name: plan
description: Restate requirements, assess risks, and create step-by-step implementation plan.
---

# Implementation Planning

## Workflow
1. Restate requirements in your own words
2. Identify risks and dependencies
3. Create step-by-step plan
4. WAIT for user CONFIRM before coding
```

Skills are stored at `~/.agents/skills/<name>/SKILL.md` (user-level) or `.agents/skills/` (project-level).

### AGENTS.md

AGENTS.md is the hierarchical instruction system. Codex reads:
1. `~/.codex/AGENTS.override.md` (highest priority)
2. `~/.codex/AGENTS.md` (global)
3. Per-directory `AGENTS.md` from git root to working directory

Use AGENTS.md for always-on standards (coding style, error handling, testing requirements). Use skills for on-demand domain knowledge.

### Execution Policies (Starlark Rules)

`.rules` files define what Codex can and cannot do:

```python
# safety.rules
prefix_rule(
    pattern=["rm -rf /", "rm -rf ~", "dd if="],
    decision="forbidden",
    justification="Prevent destructive system commands"
)
```

Rules are stored at `~/.codex/rules/*.rules`.

### Profiles (config.toml)

Profiles replace contexts for different workflows:

```toml
[profiles.dev]
model = "o4-mini"
approval_policy = "on-failure"

[profiles.review]
model = "o4-mini"
approval_policy = "untrusted"
```

---

## Available Skills (61)

### Core Workflow

| Skill | Description |
|-------|-------------|
| `/plan` | Implementation planning with risk assessment |
| `/tdd` | Test-driven development (RED/GREEN/IMPROVE) |
| `/code-review` | Quality, security, and maintainability review |
| `/security-review` | Vulnerability analysis and OWASP checklist |
| `/verify` | Build/lint/test/security verification loop |
| `/eval` | Evaluation framework with pass@k metrics |
| `/checkpoint` | Git-based workflow checkpoints |

### Code Quality

| Skill | Description |
|-------|-------------|
| `/architect` | System design and architectural review |
| `/build-fix` | Fix build errors with minimal diffs |
| `/refactor-clean` | Dead code detection and removal |
| `/e2e` | Playwright E2E test generation |
| `/test-coverage` | Coverage analysis and test generation |
| `/doc-updater` | Documentation and codemap sync |

### Language-Specific

| Skill | Description |
|-------|-------------|
| `/go-review` | Go code review (idioms, concurrency, errors) |
| `/go-test` | Go TDD with table-driven tests |
| `/go-build-fix` | Go build/vet error resolution |
| `/python-review` | Python code review (PEP 8, type hints) |
| `/database-review` | PostgreSQL query optimization |

### Orchestration

| Skill | Description |
|-------|-------------|
| `/orchestrate` | Sequential skill workflow (plan/tdd/review/security) |
| `/multi-plan` | Multi-model collaborative planning |
| `/multi-execute` | Multi-model code execution |
| `/multi-workflow` | Full multi-model development workflow |
| `/multi-backend` | Backend-focused orchestration |
| `/multi-frontend` | Frontend-focused orchestration |

### Learning & Sessions

| Skill | Description |
|-------|-------------|
| `/learn` | Extract patterns from current session |
| `/instinct-status` | View learned instincts with confidence |
| `/instinct-import` | Import instincts from others |
| `/instinct-export` | Export instincts for sharing |
| `/evolve` | Cluster instincts into new skills |
| `/skill-create` | Generate skills from git history |
| `/sessions` | Session management |
| `/strategic-compact` | Session management strategies |
| `/configure-codex` | Interactive installation wizard |

### Domain Knowledge (22 skills)

Language patterns, framework best practices, and testing strategies for TypeScript, Python, Go, Django, Spring Boot, PostgreSQL, ClickHouse, and JPA.

---

## Workflows

Workflows are higher-level execution playbooks that combine skills into end-to-end processes. They live in `workflows/` and describe **when** and **how** to apply skills in sequence.

| Workflow | Purpose |
|----------|---------|
| `plan.md` | Structured planning process with output contract |
| `tdd.md` | RED/GREEN/REFACTOR cycle with coverage targets |
| `code-review.md` | Review priorities and severity classification |
| `orchestrate.md` | End-to-end feature flow (plan → tdd → review → verify) |
| `refactor-clean.md` | Safe dead-code removal with validation steps |
| `verify.md` | Pre-commit and pre-PR verification gate |

**Skills vs Workflows:** Skills define _what_ to do (domain knowledge, behavioral constraints). Workflows define _when_ and _in what order_ to apply skills.

### Prompt Templates

Reusable output templates in `prompts/` ensure consistent formatting:

| Template | Purpose |
|----------|---------|
| `plan-template.md` | Structured plan document with phases, risks, rollback |
| `review-template.md` | Review findings with severity levels and verification |

---

## Ecosystem Tools

### Skill Creator

Two ways to generate Codex skills from your repository:

**Option A: Local Analysis (Built-in)**

```bash
/skill-create                    # Analyze current repo
/skill-create --instincts        # Also generate instincts
```

**Option B: GitHub App (Advanced)**

For 10k+ commits, auto-PRs, team sharing:

[Install GitHub App](https://github.com/apps/skill-creator) | [ecc.tools](https://ecc.tools)

### Continuous Learning v2

The instinct-based learning system automatically captures your patterns:

```bash
/instinct-status        # Show learned instincts with confidence
/instinct-import <file> # Import instincts from others
/instinct-export        # Export your instincts for sharing
/evolve                 # Cluster related instincts into skills
```

---

## Installation

### Automated (Recommended)

```bash
git clone https://github.com/Luohaothu/everything-codex.git
cd everything-codex
./scripts/install.sh
```

The installer:
- Backs up existing `~/.codex/` and `~/.agents/skills/` before changes
- Offers merge strategies for existing AGENTS.md (append/include/replace/skip/dry-run)
- Copies 62 skills to `~/.agents/skills/`
- Copies execution policies to `~/.codex/rules/`
- Copies workflow playbooks to `~/.codex/workflows/`
- Copies prompt templates to `~/.codex/prompts/`
- Records a manifest for clean uninstall

### Manual

```bash
git clone https://github.com/Luohaothu/everything-codex.git

# Copy AGENTS.md
cp everything-codex/AGENTS.md ~/.codex/AGENTS.md

# Copy skills
cp -r everything-codex/skills/* ~/.agents/skills/

# Copy execution policies
cp everything-codex/rules/*.rules ~/.codex/rules/

# Copy workflows and prompts
cp -r everything-codex/workflows/* ~/.codex/workflows/
cp -r everything-codex/prompts/* ~/.codex/prompts/

# Copy language-specific AGENTS.md (pick your stack)
cp everything-codex/golang/AGENTS.md ~/.codex/golang/AGENTS.md
cp everything-codex/python/AGENTS.md ~/.codex/python/AGENTS.md
cp everything-codex/typescript/AGENTS.md ~/.codex/typescript/AGENTS.md

# Copy config (optional)
cp everything-codex/config.toml ~/.codex/config.toml
```

### Uninstall

```bash
# Remove installed files (manifest-based)
./scripts/uninstall.sh

# Or rollback to last backup
./scripts/uninstall.sh --rollback
```

---

## Package Manager Detection

Automatically detects your preferred package manager (npm, pnpm, yarn, or bun):

1. **Environment variable**: `CODEX_PACKAGE_MANAGER`
2. **Project config**: `.codex/package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: Detection from lock files
5. **Fallback**: First available

Or use the `/setup-pm` skill in Codex.

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ideas for Contributions

- Language-specific skills (Rust, C#, Swift, Kotlin)
- Framework-specific configs (Rails, Laravel, FastAPI, NestJS)
- DevOps skills (Kubernetes, Terraform, AWS, Docker)
- Testing strategies (visual regression, load testing)
- Domain-specific knowledge (ML, data engineering, mobile)

---

## Important Notes

### Context Window Management

Don't enable all MCP servers at once. Your context window can shrink significantly with too many tools.

Rule of thumb:
- Keep under 10 MCPs enabled per project
- Under 80 tools active
- Disable unused servers in `config.toml` with `enabled = false`

### Customization

These configs work for the maintainer's workflow. You should:
1. Start with what resonates
2. Modify for your stack
3. Remove what you don't use
4. Add your own patterns

---

## Background

These configurations are the result of 10+ months of intensive daily use building real products. Originally developed as [everything-claude-code](https://github.com/affaan-m/everything-claude-code) by affaan-m, now refactored to target the [OpenAI Codex CLI](https://github.com/openai/codex). This fork is maintained at [Luohaothu/everything-codex](https://github.com/Luohaothu/everything-codex).

---

## License

MIT - Use freely, modify as needed, contribute back if you can.

---

**Star this repo if it helps. Build something great.**
