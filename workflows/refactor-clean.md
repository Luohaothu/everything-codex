# Workflow: Refactor Clean

Safe dead-code removal and consolidation process.

## When to Use

- Codebase has accumulated unused exports, files, or dependencies
- After a large feature migration
- Regular maintenance cleanup

## Scope

- Remove dead code and redundant branches
- Consolidate duplicate patterns
- Clean unused dependencies
- Preserve behavior -- every removal must be verified by tests

## Steps

1. **Scan** -- run detection tools to identify candidates
2. **Verify** -- confirm each candidate is truly unused (check dynamic imports, reflection, config)
3. **Remove** in small, focused commits -- one logical group per commit
4. **Validate** after each removal -- build passes, tests pass, no new warnings

## Safety Rules

- Refactor in small commits -- each one independently revertable
- Re-run tests after every structural change
- Keep API compatibility unless explicitly approved by the team
- Never remove code that is referenced by external consumers without coordination

## Integration

- Use the `/refactor-clean` skill to activate cleanup mode
- Use `/verify` after each batch of removals
- Use `/code-review` to validate the cleanup
