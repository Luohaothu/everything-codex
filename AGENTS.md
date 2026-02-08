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

1. Plan first -- use `/plan` skill
2. TDD approach -- use `/tdd` skill (RED -> GREEN -> REFACTOR)
3. Code review -- use `/code-review` skill
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

If a security issue is found: STOP -> use `/security-review` skill -> fix CRITICAL issues -> rotate exposed secrets -> review for similar issues.

## Workflows & Prompts

Reusable execution playbooks live in `workflows/`. Use them to follow a structured process:

| Workflow | Purpose |
|----------|---------|
| `workflows/plan.md` | Structured planning process |
| `workflows/tdd.md` | Test-driven development cycle |
| `workflows/code-review.md` | Review process with severity levels |
| `workflows/orchestrate.md` | End-to-end feature workflow |
| `workflows/refactor-clean.md` | Safe dead-code removal |
| `workflows/verify.md` | Pre-commit / pre-PR verification gate |

Fill-in-the-blank templates live in `prompts/`:

| Template | Purpose |
|----------|---------|
| `prompts/plan-template.md` | Structured plan output |
| `prompts/review-template.md` | Code review findings |

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
- `.go` files -> consider `/golang-rules` for Go-specific patterns
- `.py` files -> consider `/python-rules` for Python-specific patterns
- `.ts`/`.tsx` files -> consider `/typescript-rules` for TypeScript-specific patterns
