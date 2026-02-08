---
name: multi-backend
description: "Advanced: Backend-focused multi-model workflow (Research → Ideation → Plan → Execute → Optimize → Review), Codex-led."
---

# Backend-Focused Multi-Model Workflow

**Advanced skill** — Backend-focused development with Codex-led multi-model collaboration.

## Usage

```
/multi-backend <backend task description>
```

## Applicability

API design, algorithm implementation, database optimization, business logic, server-side processing.

## Phases

### Phase 1: Research
Understand requirements, retrieve existing APIs, data models, service architecture.

### Phase 2: Ideation (Codex-Led)
- Call Codex backend for technical feasibility analysis
- Output: recommended solutions (at least 2), risk assessment
- Wait for user selection

### Phase 3: Planning (Codex-Led)
- Call Codex for architecture design
- Output: file structure, function/class design, dependencies
- Save plan, wait for user approval

### Phase 4: Implementation
Follow approved plan, ensure error handling, security, performance.

### Phase 5: Optimization (Codex-Led)
- Call Codex for code review
- Focus: security, performance, error handling, API compliance
- Execute optimization after user confirmation

### Phase 6: Quality Review
Check completion, run tests, report issues.

## Key Rules

1. Codex backend opinions are authoritative
2. Other model backend opinions are for reference only
3. External models have zero filesystem write access
4. All code writes handled by the orchestrator
