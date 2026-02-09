#!/usr/bin/env bash
# Layer 2: Rollback test
# install -> modify rules -> reinstall -> uninstall --rollback
# verifies ~/.codex content restoration behavior.

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

hash_of() {
    local path="$1"
    if sha256sum "$path" >/dev/null 2>&1; then
        sha256sum "$path" | awk '{print $1}'
        return
    fi
    shasum -a 256 "$path" | awk '{print $1}'
}

echo ""
echo "=== Rollback Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

first_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
first_exit=$?
assert_ok "step 1: first install exits successfully" test "$first_exit" -eq 0

RULE_FILE="$(find "$HOME/.codex/rules" -maxdepth 1 -type f -name '*.rules' 2>/dev/null | head -1)"
if [ -z "$RULE_FILE" ] || [ ! -f "$RULE_FILE" ]; then
    echo "  ✗ step 1: rules file not found"
    ((failed++))
fi

original_hash=""
modified_hash=""
if [ -n "$RULE_FILE" ] && [ -f "$RULE_FILE" ]; then
    original_hash="$(hash_of "$RULE_FILE")"
    echo "ROLLBACK_RULE_MARKER" >> "$RULE_FILE"
    modified_hash="$(hash_of "$RULE_FILE")"
    assert_ok "step 2: rules file changed before reinstall" test "$original_hash" != "$modified_hash"
fi

second_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
second_exit=$?
assert_ok "step 3: second install exits successfully" test "$second_exit" -eq 0

if [ -n "$RULE_FILE" ] && [ -f "$RULE_FILE" ] && [ -n "$original_hash" ]; then
    hash_after_reinstall="$(hash_of "$RULE_FILE")"
    assert_ok "step 3: reinstall reset rule to installer version" test "$hash_after_reinstall" = "$original_hash"
    assert_ok "step 3: marker removed after reinstall" test "$(grep -c 'ROLLBACK_RULE_MARKER' "$RULE_FILE" || true)" -eq 0
fi

rollback_output=$(bash "$WORKSPACE/scripts/uninstall.sh" --rollback 2>&1)
rollback_exit=$?
assert_ok "step 4: rollback exits successfully" test "$rollback_exit" -eq 0

if [ "$first_exit" -ne 0 ]; then
    echo "$first_output"
fi
if [ "$second_exit" -ne 0 ]; then
    echo "$second_output"
fi
if [ "$rollback_exit" -ne 0 ]; then
    echo "$rollback_output"
fi

echo "Verifying rollback restoration in ~/.codex..."

assert_ok "~/.codex exists after rollback" test -d "$HOME/.codex"
assert_ok "rules directory exists after rollback" test -d "$HOME/.codex/rules"
assert_ok "workflows directory exists after rollback" test -d "$HOME/.codex/workflows"
assert_ok "prompts directory exists after rollback" test -d "$HOME/.codex/prompts"
assert_ok "config.toml.example exists after rollback" test -f "$HOME/.codex/config.toml.example"

if [ -n "$RULE_FILE" ] && [ -f "$RULE_FILE" ] && [ -n "$modified_hash" ]; then
    hash_after_rollback="$(hash_of "$RULE_FILE")"
    assert_ok "modified rules content restored by rollback" test "$hash_after_rollback" = "$modified_hash"
    assert_ok "marker present after rollback" grep -q "ROLLBACK_RULE_MARKER" "$RULE_FILE"
fi

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
