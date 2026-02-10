#!/usr/bin/env bash
# Layer 2: Rollback without backup test
# Fresh install in clean environment, then rollback should fail safely.

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

echo ""
echo "=== Rollback No Backup Test ==="
echo ""

# Ensure truly clean environment before first install.
rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?
assert_ok "install exits successfully" test "$install_exit" -eq 0

MANIFEST="$HOME/.codex/.everything-codex-manifest"
RULE_FILE="$(find "$HOME/.codex/rules" -maxdepth 1 -type f -name '*.rules' 2>/dev/null | head -1)"
WORKFLOW_FILE="$(find "$HOME/.codex/workflows" -maxdepth 1 -type f -name '*.md' 2>/dev/null | head -1)"
PROMPT_FILE="$(find "$HOME/.codex/prompts" -maxdepth 1 -type f -name '*.md' 2>/dev/null | head -1)"

assert_ok "pre-condition: manifest exists" test -f "$MANIFEST"
assert_ok "pre-condition: no backup directories exist" test "$(find "$HOME/.codex" -maxdepth 1 -name '.backup-*' -type d 2>/dev/null | wc -l | tr -d ' ')" -eq 0

rollback_output=$(bash "$WORKSPACE/scripts/uninstall.sh" --rollback 2>&1)
rollback_exit=$?
assert_ok "rollback exits with code 1" test "$rollback_exit" -eq 1
assert_ok "rollback reports missing backup" grep -q "No backup found" <(printf "%s" "$rollback_output")

assert_ok "installed manifest remains" test -f "$MANIFEST"
assert_ok "installed AGENTS remains" test -f "$HOME/.codex/AGENTS.md"
assert_ok "installed rule file remains" test -n "$RULE_FILE"
if [ -n "$RULE_FILE" ]; then
    assert_ok "rule file still exists" test -f "$RULE_FILE"
fi
assert_ok "installed workflow file remains" test -n "$WORKFLOW_FILE"
if [ -n "$WORKFLOW_FILE" ]; then
    assert_ok "workflow file still exists" test -f "$WORKFLOW_FILE"
fi
assert_ok "installed prompt file remains" test -n "$PROMPT_FILE"
if [ -n "$PROMPT_FILE" ]; then
    assert_ok "prompt file still exists" test -f "$PROMPT_FILE"
fi
assert_ok "config.toml.example remains" test -f "$HOME/.codex/config.toml.example"

if [ "$install_exit" -ne 0 ]; then
    echo "$install_output"
fi
if [ "$rollback_exit" -ne 1 ]; then
    echo "$rollback_output"
fi

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
