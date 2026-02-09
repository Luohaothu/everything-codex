#!/usr/bin/env bash
# Layer 2: Unsafe manifest path test
# install -> inject unsafe manifest path -> uninstall
# uninstall should skip unsafe path with warning and keep external file.

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
echo "=== Unsafe Manifest Path Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?
assert_ok "pre-condition: install exits successfully" test "$install_exit" -eq 0

MANIFEST="$HOME/.codex/.everything-codex-manifest"
assert_ok "pre-condition: manifest exists" test -f "$MANIFEST"

UNSAFE_TARGET="/tmp/everything-codex-unsafe-target-$$.txt"
printf 'do-not-delete\n' > "$UNSAFE_TARGET"
assert_ok "pre-condition: unsafe target exists" test -f "$UNSAFE_TARGET"

# Intentionally no trailing newline to validate uninstall loop handles EOF-final entries.
printf '%s' "$UNSAFE_TARGET" >> "$MANIFEST"
assert_ok "unsafe path appended to manifest" grep -q "$UNSAFE_TARGET" "$MANIFEST"

uninstall_output=$(bash "$WORKSPACE/scripts/uninstall.sh" 2>&1)
uninstall_exit=$?
assert_ok "uninstall exits successfully" test "$uninstall_exit" -eq 0
assert_ok "uninstall warns about unsafe path" grep -q "Warning: skipping unsafe manifest path: $UNSAFE_TARGET" <(printf "%s" "$uninstall_output")
assert_ok "unsafe target not deleted" test -f "$UNSAFE_TARGET"

# Verify normal uninstall behavior is still intact for valid manifest entries.
assert_ok "config.toml.example removed by uninstall" test ! -f "$HOME/.codex/config.toml.example"
assert_ok "manifest removed by uninstall" test ! -f "$MANIFEST"

if [ "$install_exit" -ne 0 ]; then
    echo "$install_output"
fi
if [ "$uninstall_exit" -ne 0 ]; then
    echo "$uninstall_output"
fi

rm -f "$UNSAFE_TARGET"

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
