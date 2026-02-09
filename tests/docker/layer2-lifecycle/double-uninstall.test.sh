#!/usr/bin/env bash
# Layer 2: Double uninstall test
# install -> uninstall -> uninstall again
# second uninstall should fail with clear message and no crash.

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
echo "=== Double Uninstall Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?
assert_ok "install exits successfully" test "$install_exit" -eq 0

first_uninstall_output=$(bash "$WORKSPACE/scripts/uninstall.sh" 2>&1)
first_uninstall_exit=$?
assert_ok "first uninstall exits successfully" test "$first_uninstall_exit" -eq 0

second_uninstall_output=$(bash "$WORKSPACE/scripts/uninstall.sh" 2>&1)
second_uninstall_exit=$?
assert_ok "second uninstall exits with code 1" test "$second_uninstall_exit" -eq 1
assert_ok "second uninstall reports missing manifest" grep -q "No install manifest found" <(printf "%s" "$second_uninstall_output")
assert_ok "second uninstall output is non-empty" test -n "$second_uninstall_output"

if [ "$install_exit" -ne 0 ]; then
    echo "$install_output"
fi
if [ "$first_uninstall_exit" -ne 0 ]; then
    echo "$first_uninstall_output"
fi
if [ "$second_uninstall_exit" -ne 1 ]; then
    echo "$second_uninstall_output"
fi

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
