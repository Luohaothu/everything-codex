#!/usr/bin/env bash
# Layer 2: Manifest integrity test
# Fresh install, then verify each manifest entry exists and is non-empty.

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
echo "=== Manifest Integrity Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

install_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
install_exit=$?
assert_ok "install exits successfully" test "$install_exit" -eq 0

MANIFEST="$HOME/.codex/.everything-codex-manifest"
assert_ok "manifest exists" test -f "$MANIFEST"

if [ "$install_exit" -ne 0 ]; then
    echo "$install_output"
fi

if [ ! -f "$MANIFEST" ]; then
    echo ""
    echo "=== Test Results ==="
    echo "Passed: $passed"
    echo "Failed: $failed"
    echo "Total:  $((passed + failed))"
    echo ""
    exit 1
fi

total_files=0
missing_files=0
empty_files=0

while IFS= read -r file; do
    [ -n "$file" ] || continue
    ((total_files++))
    if [ ! -f "$file" ]; then
        echo "  MISSING: $file"
        ((missing_files++))
    elif [ ! -s "$file" ]; then
        echo "  EMPTY: $file"
        ((empty_files++))
    fi
done < "$MANIFEST"

assert_ok "manifest has entries (> 0)" test "$total_files" -gt 0
assert_ok "all manifest files exist" test "$missing_files" -eq 0
assert_ok "all manifest files non-empty" test "$empty_files" -eq 0

echo ""
echo "Manifest summary: total=$total_files missing=$missing_files empty=$empty_files"

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
