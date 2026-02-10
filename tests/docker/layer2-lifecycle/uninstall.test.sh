#!/usr/bin/env bash
# Layer 2: Uninstall test
# Runs uninstall.sh and verifies manifest-driven cleanup behavior.

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
echo "=== Uninstall Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?
assert_ok "pre-condition: install exits successfully" test "$install_exit" -eq 0

MANIFEST="$HOME/.codex/.everything-codex-manifest"
assert_ok "pre-condition: manifest exists" test -f "$MANIFEST"

manifest_count=0
MANIFEST_SNAPSHOT="$(mktemp)"
if [ -f "$MANIFEST" ]; then
    cp "$MANIFEST" "$MANIFEST_SNAPSHOT"
    manifest_count=$(wc -l < "$MANIFEST_SNAPSHOT" | tr -d ' ')
fi
assert_ok "pre-condition: manifest has entries" test "$manifest_count" -gt 0

uninstall_output=$(bash "$WORKSPACE/scripts/uninstall.sh" 2>&1)
uninstall_exit=$?
assert_ok "uninstall exits successfully" test "$uninstall_exit" -eq 0

if [ "$install_exit" -ne 0 ]; then
    echo "$install_output"
fi
if [ "$uninstall_exit" -ne 0 ]; then
    echo "$uninstall_output"
fi

echo "Verifying uninstall..."

remaining=0
if [ -f "$MANIFEST_SNAPSHOT" ]; then
    while IFS= read -r f; do
        [ -n "$f" ] || continue
        if [ -f "$f" ]; then
            ((remaining++))
        fi
    done < "$MANIFEST_SNAPSHOT"
fi
assert_ok "manifest-listed files removed" test "$remaining" -eq 0

assert_ok "manifest file removed" test ! -f "$MANIFEST"

if [ -d "$HOME/.agents/skills" ]; then
    empty_dirs=$(find "$HOME/.agents/skills" -type d -empty 2>/dev/null | wc -l | tr -d ' ')
else
    empty_dirs=0
fi
assert_ok "empty skill dirs cleaned" test "$empty_dirs" -eq 0

assert_ok "AGENTS.md preserved" test -f "$HOME/.codex/AGENTS.md"

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

rm -f "$MANIFEST_SNAPSHOT"

exit $((failed > 0 ? 1 : 0))
