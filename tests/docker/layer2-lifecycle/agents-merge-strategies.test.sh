#!/usr/bin/env bash
# Layer 2: AGENTS merge strategy test
# Covers append/include/replace/skip/dry-run behaviors.

# Note: -e is intentionally omitted so assertions can accumulate failures.
set -uo pipefail

WORKSPACE="${WORKSPACE:-/workspace}"
PROJECT_AGENTS="$WORKSPACE/AGENTS.md"
TARGET_AGENTS="$HOME/.codex/AGENTS.md"
passed=0
failed=0

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

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

reset_home() {
    rm -rf "$HOME/.codex" "$HOME/.agents"
    mkdir -p "$HOME/.codex"
}

echo ""
echo "=== AGENTS Merge Strategies Test ==="
echo ""

assert_ok "pre-condition: project AGENTS.md exists" test -f "$PROJECT_AGENTS"

project_lines=0
if [ -f "$PROJECT_AGENTS" ]; then
    project_lines=$(wc -l < "$PROJECT_AGENTS" | tr -d ' ')
fi

# 1) append
reset_home
cat > "$TARGET_AGENTS" <<'APPEND_BASE'
LOCAL_APPEND_LINE_1
LOCAL_APPEND_LINE_2
APPEND_BASE

append_output_file="$TMP_DIR/append.out"
printf "1\n" | bash "$WORKSPACE/scripts/install.sh" > "$append_output_file" 2>&1
append_exit=$?
assert_ok "append: install exits successfully" test "$append_exit" -eq 0
assert_ok "append: keeps original content" grep -q "LOCAL_APPEND_LINE_1" "$TARGET_AGENTS"
assert_ok "append: adds separator marker" grep -q "# --- everything-codex rules ---" "$TARGET_AGENTS"

append_tail_file="$TMP_DIR/append-tail.txt"
tail -n "$project_lines" "$TARGET_AGENTS" > "$append_tail_file"
assert_ok "append: appends everything-codex content at end" cmp -s "$append_tail_file" "$PROJECT_AGENTS"

# 2) include
reset_home
cat > "$TARGET_AGENTS" <<'INCLUDE_BASE'
LOCAL_INCLUDE_LINE
INCLUDE_BASE

include_output_file="$TMP_DIR/include.out"
printf "2\n" | bash "$WORKSPACE/scripts/install.sh" > "$include_output_file" 2>&1
include_exit=$?
assert_ok "include: install exits successfully" test "$include_exit" -eq 0
assert_ok "include: keeps original content" grep -q "LOCAL_INCLUDE_LINE" "$TARGET_AGENTS"
assert_ok "include: contains reference comment" grep -q "everything-codex rules: see" "$TARGET_AGENTS"

# 3) replace
reset_home
cat > "$TARGET_AGENTS" <<'REPLACE_BASE'
LOCAL_REPLACE_LINE
REPLACE_BASE

replace_output_file="$TMP_DIR/replace.out"
printf "3\n" | bash "$WORKSPACE/scripts/install.sh" > "$replace_output_file" 2>&1
replace_exit=$?
assert_ok "replace: install exits successfully" test "$replace_exit" -eq 0
assert_ok "replace: content equals project AGENTS.md" cmp -s "$TARGET_AGENTS" "$PROJECT_AGENTS"

# 4) skip
reset_home
cat > "$TARGET_AGENTS" <<'SKIP_BASE'
LOCAL_SKIP_LINE
SKIP_BASE

skip_before="$TMP_DIR/skip-before.md"
cp "$TARGET_AGENTS" "$skip_before"

skip_output_file="$TMP_DIR/skip.out"
printf "4\n" | bash "$WORKSPACE/scripts/install.sh" > "$skip_output_file" 2>&1
skip_exit=$?
assert_ok "skip: install exits successfully" test "$skip_exit" -eq 0
assert_ok "skip: AGENTS.md unchanged" cmp -s "$TARGET_AGENTS" "$skip_before"

# 5) dry-run
reset_home
cat > "$TARGET_AGENTS" <<'DRY_BASE'
LOCAL_DRY_RUN_LINE
DRY_BASE

dry_before="$TMP_DIR/dry-before.md"
cp "$TARGET_AGENTS" "$dry_before"

dry_output_file="$TMP_DIR/dry.out"
printf "5\n" | bash "$WORKSPACE/scripts/install.sh" > "$dry_output_file" 2>&1
dry_exit=$?
assert_ok "dry-run: install exits successfully" test "$dry_exit" -eq 0
assert_ok "dry-run: AGENTS.md unchanged" cmp -s "$TARGET_AGENTS" "$dry_before"
assert_ok "dry-run: stdout contains diff output" grep -Eq '^[0-9]+(,[0-9]+)?[acd][0-9]+' "$dry_output_file"

echo ""
echo "=== Test Results ==="
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $((passed + failed))"
echo ""

exit $((failed > 0 ? 1 : 0))
