#!/usr/bin/env bash
# Layer 2: Protected in-root manifest path test
# install -> inject ~/.codex/AGENTS.md into manifest -> uninstall
# uninstall should warn and keep protected path.

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
echo "=== Protected In-Root Manifest Path Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?
assert_ok "pre-condition: install exits successfully" test "$install_exit" -eq 0

MANIFEST="$HOME/.codex/.everything-codex-manifest"
PROTECTED_TARGET="$HOME/.codex/AGENTS.md"

assert_ok "pre-condition: manifest exists" test -f "$MANIFEST"
assert_ok "pre-condition: protected target exists" test -f "$PROTECTED_TARGET"

printf '%s\n' "$PROTECTED_TARGET" >> "$MANIFEST"
assert_ok "protected path appended to manifest" grep -q "$PROTECTED_TARGET" "$MANIFEST"

uninstall_output=$(bash "$WORKSPACE/scripts/uninstall.sh" 2>&1)
uninstall_exit=$?
assert_ok "uninstall exits successfully" test "$uninstall_exit" -eq 0
assert_ok "uninstall warns about disallowed in-root path" grep -q "Warning: skipping disallowed in-root manifest path: $PROTECTED_TARGET" <(printf "%s" "$uninstall_output")
assert_ok "protected target not deleted" test -f "$PROTECTED_TARGET"
assert_ok "config.toml.example removed by uninstall" test ! -f "$HOME/.codex/config.toml.example"
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
