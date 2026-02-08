---
name: multi-execute
description: "Advanced: Multi-model collaborative execution. Acquires prototypes from external models, then refactors and implements production-grade code."
---

# Multi-Model Collaborative Execution

**Advanced skill** — Uses external model backends to generate code prototypes, then refactors into production-grade implementations.

## Usage

```
/multi-execute .codex/plan/<feature-name>.md
/multi-execute <direct task description>
```

## Workflow

### Phase 1: Read Plan
- Parse plan file or task description
- Extract: task type, steps, key files, session IDs
- Route: Frontend → Gemini, Backend → Codex, Fullstack → parallel

### Phase 2: Context Retrieval
- Retrieve project context for target files
- Ensure complete definitions and signatures available

### Phase 3: Prototype Acquisition
- Call external model backends for code prototypes
- Receive unified diff patches (models have zero write access)

### Phase 4: Code Implementation
- Parse received diffs
- Simulate applying to target files (mental sandbox)
- Refactor "dirty prototype" to production-grade code
- Apply changes with minimal scope
- Run self-verification (lint, typecheck, tests)

### Phase 5: Audit and Delivery
- Call external models for code review
- Integrate review feedback
- Execute necessary fixes
- Report changes, audit results, and recommendations

## Key Rules

1. **Code Sovereignty** — All file modifications by the orchestrator
2. **Dirty Prototype Refactoring** — External model output is a draft, must refactor
3. **Minimal Changes** — Only modify necessary code
4. **Mandatory Audit** — Must perform review after changes
