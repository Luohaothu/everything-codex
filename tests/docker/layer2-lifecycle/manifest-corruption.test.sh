#!/usr/bin/env bash
# Layer 2: Manifest corruption test
# install -> truncate manifest -> uninstall
# uninstall should succeed and leave installed files intact (no delete targets).

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
echo "=== Manifest Corruption Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?
assert_ok "install exits successfully" test "$install_exit" -eq 0

MANIFEST="$HOME/.codex/.everything-codex-manifest"
assert_ok "pre-condition: manifest exists" test -f "$MANIFEST"

RULE_FILE="$(find "$HOME/.codex/rules" -maxdepth 1 -type f -name '*.rules' 2>/dev/null | head -1)"
WORKFLOW_FILE="$(find "$HOME/.codex/workflows" -maxdepth 1 -type f -name '*.md' 2>/dev/null | head -1)"
PROMPT_FILE="$(find "$HOME/.codex/prompts" -maxdepth 1 -type f -name '*.md' 2>/dev/null | head -1)"

assert_ok "pre-condition: rule file present" test -n "$RULE_FILE"
assert_ok "pre-condition: workflow file present" test -n "$WORKFLOW_FILE"
assert_ok "pre-condition: prompt file present" test -n "$PROMPT_FILE"

# Corrupt manifest by truncating it to empty.
: > "$MANIFEST"
assert_ok "manifest truncated to empty" test "$(wc -l < "$MANIFEST" | tr -d ' ')" -eq 0

uninstall_output=$(bash "$WORKSPACE/scripts/uninstall.sh" 2>&1)
uninstall_exit=$?
assert_ok "uninstall still exits successfully" test "$uninstall_exit" -eq 0

# With empty manifest, uninstall has no delete targets, so installed files remain.
assert_ok "AGENTS.md remains" test -f "$HOME/.codex/AGENTS.md"
if [ -n "$RULE_FILE" ]; then
    assert_ok "rule file remains" test -f "$RULE_FILE"
fi
if [ -n "$WORKFLOW_FILE" ]; then
    assert_ok "workflow file remains" test -f "$WORKFLOW_FILE"
fi
if [ -n "$PROMPT_FILE" ]; then
    assert_ok "prompt file remains" test -f "$PROMPT_FILE"
fi
assert_ok "config.toml.example remains" test -f "$HOME/.codex/config.toml.example"
assert_ok "manifest removed by uninstall" test ! -f "$MANIFEST"

if [ "$install_exit" -ne 0 ]; then
    echo "$install_output"
fi
if [ "$uninstall_exit" -ne 0 ]; then
    echo "$uninstall_output"
fi

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
