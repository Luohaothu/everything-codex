#!/usr/bin/env bash
# Layer 2: Fresh install test
# Runs install.sh on a clean HOME and verifies expected artifacts.

# Note: -e is intentionally omitted so assertions can accumulate failures.
set -uo pipefail

WORKSPACE="${WORKSPACE:-/workspace}"
passed=0
failed=0

assert_ok() {
    local desc="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "  ✓ $desc"
        ((passed++))
    else
        echo "  ✗ $desc"
        ((failed++))
    fi
}

max_int() {
    local a="$1"
    local b="$2"
    if [ "$a" -gt "$b" ]; then
        echo "$a"
    else
        echo "$b"
    fi
}

echo ""
echo "=== Fresh Install Test ==="
echo ""

# Dynamic baseline from repository + fixed minimum thresholds.
source_rules=$(find "$WORKSPACE/rules" -maxdepth 1 -type f -name "*.rules" 2>/dev/null | wc -l | tr -d ' ')
source_workflows=$(find "$WORKSPACE/workflows" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
source_prompts=$(find "$WORKSPACE/prompts" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
source_skills=$(find "$WORKSPACE/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')

required_rules=$(max_int "$source_rules" 3)
required_workflows=$(max_int "$source_workflows" 5)
required_prompts=$(max_int "$source_prompts" 1)
required_skills=$(max_int "$source_skills" 50)

# Clean HOME to ensure fresh state.
rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?

assert_ok "install exits successfully" test "$install_exit" -eq 0

if [ "$install_exit" -ne 0 ]; then
    echo "$install_output"
fi

echo ""
echo "Verifying installation artifacts..."

assert_ok "~/.codex/AGENTS.md exists" test -f "$HOME/.codex/AGENTS.md"

rules_count=$(find "$HOME/.codex/rules" -maxdepth 1 -type f -name "*.rules" 2>/dev/null | wc -l | tr -d ' ')
assert_ok "rules installed (>= $required_rules)" test "$rules_count" -ge "$required_rules"

wf_count=$(find "$HOME/.codex/workflows" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
assert_ok "workflows installed (>= $required_workflows)" test "$wf_count" -ge "$required_workflows"

prompt_count=$(find "$HOME/.codex/prompts" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
assert_ok "prompts installed (>= $required_prompts)" test "$prompt_count" -ge "$required_prompts"

skill_count=$(find "$HOME/.agents/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
assert_ok "skills installed (>= $required_skills)" test "$skill_count" -ge "$required_skills"

MANIFEST="$HOME/.codex/.everything-codex-manifest"
assert_ok "manifest exists" test -f "$MANIFEST"

manifest_lines=0
if [ -f "$MANIFEST" ]; then
    manifest_lines=$(wc -l < "$MANIFEST" | tr -d ' ')
fi
assert_ok "manifest has entries (> 0)" test "$manifest_lines" -gt 0

assert_ok "config.toml.example exists" test -f "$HOME/.codex/config.toml.example"

for lang in golang python typescript; do
    assert_ok "$lang/AGENTS.md exists" test -f "$HOME/.codex/$lang/AGENTS.md"
done

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
