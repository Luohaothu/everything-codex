#!/usr/bin/env bash
# Layer 2: Reinstall test
# Runs install.sh twice and verifies backup + manifest update behavior.

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

mtime_of() {
    local path="$1"
    if stat -c %Y "$path" >/dev/null 2>&1; then
        stat -c %Y "$path"
        return
    fi
    stat -f %m "$path"
}

echo ""
echo "=== Reinstall Test ==="
echo ""

rm -rf "$HOME/.codex" "$HOME/.agents"

first_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
first_exit=$?
assert_ok "first install exits successfully" test "$first_exit" -eq 0

MANIFEST="$HOME/.codex/.everything-codex-manifest"
assert_ok "pre-condition: manifest exists after first install" test -f "$MANIFEST"

# Mark original files so backup content can be verified.
AGENTS_FILE="$HOME/.codex/AGENTS.md"
RULE_FILE="$(find "$HOME/.codex/rules" -maxdepth 1 -type f -name '*.rules' 2>/dev/null | head -1)"

if [ -f "$AGENTS_FILE" ]; then
    echo "REINSTALL_BACKUP_MARKER" >> "$AGENTS_FILE"
fi
if [ -n "$RULE_FILE" ] && [ -f "$RULE_FILE" ]; then
    echo "REINSTALL_RULE_MARKER" >> "$RULE_FILE"
fi

manifest_before_mtime=0
if [ -f "$MANIFEST" ]; then
    manifest_before_mtime=$(mtime_of "$MANIFEST")
fi

# Ensure mtime comparison is deterministic.
sleep 1

second_output=$(printf "4\n" | bash "$WORKSPACE/scripts/install.sh" 2>&1)
second_exit=$?
assert_ok "second install exits successfully" test "$second_exit" -eq 0

if [ "$first_exit" -ne 0 ]; then
    echo "$first_output"
fi
if [ "$second_exit" -ne 0 ]; then
    echo "$second_output"
fi

echo "Verifying reinstall..."

backup_count=$(find "$HOME/.codex" -maxdepth 1 -name ".backup-*" -type d 2>/dev/null | wc -l | tr -d ' ')
assert_ok "backup directory created" test "$backup_count" -ge 1

latest_backup="$(ls -dt "$HOME/.codex"/.backup-* 2>/dev/null | head -1)"
assert_ok "latest backup path resolved" test -n "$latest_backup"

if [ -n "$latest_backup" ]; then
    assert_ok "backup contains original AGENTS marker" grep -q "REINSTALL_BACKUP_MARKER" "$latest_backup/AGENTS.md"

    if [ -n "$RULE_FILE" ]; then
        rule_base="$(basename "$RULE_FILE")"
        assert_ok "backup contains original rules marker" grep -q "REINSTALL_RULE_MARKER" "$latest_backup/rules/$rule_base"
    else
        echo "  ✗ pre-condition: no rules file found to validate backup"
        ((failed++))
    fi
fi

assert_ok "AGENTS.md still exists" test -f "$HOME/.codex/AGENTS.md"
assert_ok "manifest still exists" test -f "$MANIFEST"
assert_ok "config.toml.example still exists" test -f "$HOME/.codex/config.toml.example"
assert_ok "rules directory still exists" test -d "$HOME/.codex/rules"
assert_ok "workflows directory still exists" test -d "$HOME/.codex/workflows"
assert_ok "prompts directory still exists" test -d "$HOME/.codex/prompts"
assert_ok "skills directory still exists" test -d "$HOME/.agents/skills"

manifest_after_mtime=0
if [ -f "$MANIFEST" ]; then
    manifest_after_mtime=$(mtime_of "$MANIFEST")
fi
assert_ok "manifest updated on reinstall" test "$manifest_after_mtime" -gt "$manifest_before_mtime"

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
