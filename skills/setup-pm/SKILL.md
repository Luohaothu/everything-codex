---
name: setup-pm
description: Configure your preferred package manager (npm/pnpm/yarn/bun) with detection priority and project/global settings.
---

# Package Manager Setup

Configure your preferred package manager for this project or globally.

## Usage

```bash
/setup-pm --detect           # Detect current package manager
/setup-pm --global pnpm      # Set global preference
/setup-pm --project bun      # Set project preference
/setup-pm --list              # List available package managers
```

## Detection Priority

1. **Environment variable**: `PACKAGE_MANAGER`
2. **Project config**: `.codex/package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb
5. **Global config**: `~/.codex/package-manager.json`
6. **Fallback**: First available (pnpm > bun > yarn > npm)

## Configuration Files

### Global
```json
// ~/.codex/package-manager.json
{ "packageManager": "pnpm" }
```

### Project
```json
// .codex/package-manager.json
{ "packageManager": "bun" }
```
