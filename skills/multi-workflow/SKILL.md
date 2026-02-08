---
name: multi-workflow
description: "Advanced: Full multi-model collaborative development workflow (Research → Ideation → Plan → Execute → Optimize → Review) with quality gates."
---

# Multi-Model Collaborative Workflow

**Advanced skill** — Full development workflow with multi-model collaboration and quality gates.

## Usage

```
/multi-workflow <task description>
```

## Phases

### Phase 1: Research & Analysis
`[Mode: Research]`
- Enhance prompt and retrieve project context
- Score requirement completeness (>= 7/10 to proceed)

### Phase 2: Solution Ideation
`[Mode: Ideation]`
- Parallel analysis from multiple model backends
- Synthesize into solution options (at least 2)
- Wait for user selection

### Phase 3: Detailed Planning
`[Mode: Plan]`
- Collaborative architecture planning
- Save plan to `.codex/plan/<task-name>.md`
- Wait for user approval

### Phase 4: Implementation
`[Mode: Execute]`
- Follow approved plan strictly
- Maintain project code standards
- Request feedback at key milestones

### Phase 5: Code Optimization
`[Mode: Optimize]`
- Multi-model parallel code review
- Integrate feedback
- Execute optimization after user confirmation

### Phase 6: Quality Review
`[Mode: Review]`
- Check completion against plan
- Run tests to verify functionality
- Report issues and recommendations

## Key Rules

1. Phase sequence cannot be skipped (unless user explicitly instructs)
2. External models have zero filesystem write access
3. All modifications by the orchestrator
4. Force stop when score < 7 or user does not approve
