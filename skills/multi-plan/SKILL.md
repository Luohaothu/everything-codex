---
name: multi-plan
description: "Advanced: Multi-model collaborative planning using external model backends for analysis and architecture design."
---

# Multi-Model Collaborative Planning

**Advanced skill** — Uses external model backends (Codex, Gemini) for collaborative analysis and planning.

## Usage

```
/multi-plan <task description>
```

## Workflow

### Phase 1: Context Retrieval
- Enhance prompt using MCP tools (if available)
- Retrieve project context via semantic search
- Verify requirement completeness (score >= 7/10 to proceed)

### Phase 2: Multi-Model Analysis
- Distribute requirements to multiple model backends in parallel
- Each backend analyzes from its perspective (backend logic vs frontend UX)
- Cross-validate results: identify consensus and divergence

### Phase 3: Plan Synthesis
- Synthesize analyses into step-by-step implementation plan
- Include: task type, technical solution, implementation steps, key files, risks
- Save plan to `.codex/plan/<feature-name>.md`

## Plan Output Format

```markdown
## Implementation Plan: <Task Name>

### Technical Solution
<Synthesized solution>

### Implementation Steps
1. Step 1 - Expected deliverable
2. Step 2 - Expected deliverable

### Key Files
| File | Operation | Description |
|------|-----------|-------------|

### Risks and Mitigation
| Risk | Mitigation |
|------|------------|
```

## Key Rules

1. Plan only, no implementation
2. External models have zero filesystem write access
3. All modifications by the orchestrator
4. Present plan for user approval before execution
