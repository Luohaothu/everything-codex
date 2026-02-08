---
name: multi-frontend
description: "Advanced: Frontend-focused multi-model workflow (Research → Ideation → Plan → Execute → Optimize → Review), Gemini-led."
---

# Frontend-Focused Multi-Model Workflow

**Advanced skill** — Frontend-focused development with Gemini-led multi-model collaboration.

## Usage

```
/multi-frontend <UI task description>
```

## Applicability

Component design, responsive layout, UI animations, style optimization, accessibility.

## Phases

### Phase 1: Research
Understand requirements, retrieve existing components, styles, design system.

### Phase 2: Ideation (Gemini-Led)
- Call Gemini for UI feasibility analysis
- Output: recommended solutions (at least 2), UX evaluation
- Wait for user selection

### Phase 3: Planning (Gemini-Led)
- Call Gemini for frontend architecture
- Output: component structure, UI flow, styling approach
- Save plan, wait for user approval

### Phase 4: Implementation
Follow approved plan, maintain design system, ensure responsiveness and accessibility.

### Phase 5: Optimization (Gemini-Led)
- Call Gemini for frontend review
- Focus: accessibility, responsiveness, performance, design consistency
- Execute optimization after user confirmation

### Phase 6: Quality Review
Check completion, verify responsiveness, report issues.

## Key Rules

1. Gemini frontend opinions are authoritative
2. Other model backend opinions are for reference only
3. External models have zero filesystem write access
4. All code writes handled by the orchestrator
