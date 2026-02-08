# Rules

## Structure

Rules are organized into **execution policies** (`.rules` files) plus **markdown guidelines** in language-specific directories:

```
rules/
|-- safety.rules           # Core safety execution policy
|-- git-safety.rules       # Git operation safety rules
|-- file-hygiene.rules     # File cleanliness rules
|-- common/                # Language-agnostic markdown guidelines
|   |-- coding-style.md
|   |-- git-workflow.md
|   |-- testing.md
|   |-- performance.md
|   |-- patterns.md
|   |-- security.md
|-- typescript/            # TypeScript/JavaScript specific
|-- python/                # Python specific
|-- golang/                # Go specific
```

### Execution Policies (`.rules`)

Starlark files that define what Codex can and cannot do. These are enforced at the CLI level.

```python
# safety.rules
prefix_rule(
    pattern=["rm -rf /", "rm -rf ~"],
    decision="forbidden",
    justification="Prevent destructive system commands"
)
```

Installed to: `~/.codex/rules/`

### Markdown Guidelines

Language-agnostic principles in `common/` plus language-specific extensions. These are referenced by AGENTS.md and skills.

- **common/** contains universal principles — no language-specific code examples.
- **Language directories** extend the common rules with framework-specific patterns, tools, and code examples.

## Installation

```bash
# Via install.sh (recommended)
./scripts/install.sh

# Manual: Copy execution policies
cp rules/*.rules ~/.codex/rules/

# Manual: Copy markdown guidelines (for reference, typically loaded via skills)
cp -r rules/common/* ~/.codex/rules/
cp -r rules/typescript/* ~/.codex/rules/   # pick your stack
cp -r rules/python/* ~/.codex/rules/
cp -r rules/golang/* ~/.codex/rules/
```

## Rules vs Skills

- **Rules** (`.rules` files) define hard enforcement policies that Codex applies automatically.
- **Markdown rules** define standards, conventions, and checklists referenced by AGENTS.md.
- **Skills** (`skills/` directory) provide deep, actionable reference material for specific tasks.

Rules tell Codex what is *forbidden*. AGENTS.md tells Codex *how to behave*. Skills tell Codex *how to do things*.

## Adding a New Language

To add support for a new language (e.g., `rust/`):

1. Create a `rules/rust/` directory
2. Add files that extend the common rules:
   - `coding-style.md` — formatting tools, idioms, error handling patterns
   - `testing.md` — test framework, coverage tools, test organization
   - `patterns.md` — language-specific design patterns
   - `security.md` — secret management, security scanning tools
3. Each file should start with:
   ```
   > This file extends [common/xxx.md](../common/xxx.md) with <Language> specific content.
   ```
4. Optionally create a consolidated `skills/<language>-rules/SKILL.md` skill.
5. Create a `<language>/AGENTS.md` template in the repo root.
