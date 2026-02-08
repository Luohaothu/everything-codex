# Workflow: Plan

Use this workflow when requirements are complex, span multiple files, or involve architectural decisions.

## When to Use

- New feature with unclear scope
- Cross-cutting changes (auth, logging, caching)
- Refactoring that touches multiple modules
- Any change where you'd say "let me think about this first"

## Steps

1. **Restate goals and non-goals** -- confirm understanding before designing
2. **List constraints and assumptions** -- tech stack, performance, compatibility
3. **Identify affected files and components** -- use codebase search to map impact
4. **Create phased implementation steps** with acceptance criteria per phase
5. **Identify risks and rollback approach** -- what can go wrong, how to recover
6. **WAIT for user confirmation** before writing any code

## Output Contract

Produce a plan document following the template in `prompts/plan-template.md`.

## Integration

- Use the `/plan` skill to activate planner mode
- After approval, proceed with `/tdd` to implement test-first
- Use `/verify` before marking each phase complete
