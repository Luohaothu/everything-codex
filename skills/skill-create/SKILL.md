---
name: skill-create
description: Analyze local git history to extract coding patterns and generate SKILL.md files that teach your team's practices.
---

# Skill Create

Analyze your repository's git history to extract coding patterns and generate SKILL.md files.

## Usage

```bash
/skill-create                    # Analyze current repo
/skill-create --commits 100      # Analyze last 100 commits
/skill-create --output ./skills  # Custom output directory
```

## Analysis Steps

### Step 1: Gather Git Data

```bash
# Get recent commits with file changes
git log --oneline -n 200 --name-only --pretty=format:"%H|%s|%ad" --date=short

# Get commit frequency by file
git log --oneline -n 200 --name-only | sort | uniq -c | sort -rn | head -20

# Get commit message patterns
git log --oneline -n 200 | cut -d' ' -f2- | head -50
```

### Step 2: Detect Patterns

| Pattern | Detection Method |
|---------|-----------------|
| Commit conventions | Regex on commit messages |
| File co-changes | Files that always change together |
| Workflow sequences | Repeated file change patterns |
| Architecture | Folder structure and naming conventions |
| Testing patterns | Test file locations, naming, coverage |

### Step 3: Generate SKILL.md

```markdown
---
name: <repo-name>-patterns
description: Coding patterns extracted from <repo-name>
---

# <Repo Name> Patterns

## Commit Conventions
<detected patterns>

## Code Architecture
<detected structure>

## Workflows
<detected file change patterns>

## Testing Patterns
<detected test conventions>
```

## Process

1. Ask user to confirm before saving
2. Generate SKILL.md to specified output directory
3. Report patterns found and confidence levels
