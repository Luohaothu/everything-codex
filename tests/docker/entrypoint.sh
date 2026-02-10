#!/usr/bin/env bash
set -uo pipefail

WORKSPACE="${WORKSPACE:-/workspace}"
DOCKER_DIR="$WORKSPACE/tests/docker"
# Write reports to HOME (writable by testuser), not inside read-only /workspace
REPORTS_DIR="$HOME/reports"
REQUESTED_LAYER="${1:-${TEST_LAYER:-all}}"
LAYER=$(printf '%s' "$REQUESTED_LAYER" | tr '[:upper:]' '[:lower:]')

TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0
START_TIME=$(date +%s)

LAYER1_PASSED=0
LAYER1_FAILED=0
LAYER1_SKIPPED=0
LAYER2_PASSED=0
LAYER2_FAILED=0
LAYER2_SKIPPED=0
LAYER3_PASSED=0
LAYER3_FAILED=0
LAYER3_SKIPPED=0
CURRENT_LAYER=""

ensure_reports_dir_writable() {
    local probe_file
    mkdir -p "$REPORTS_DIR"
    probe_file="$REPORTS_DIR/.write-test-$$"
    if ! touch "$probe_file" 2>/dev/null; then
        echo "ERROR: Report directory is not writable: $REPORTS_DIR" >&2
        return 1
    fi
    rm -f "$probe_file"
    return 0
}

extract_metric() {
    local output="$1"
    local metric="$2"
    local value

    value=$(printf '%s\n' "$output" | awk -v metric="$metric" '
        {
            line = $0
            if (line ~ ("^[[:space:]]*" metric "[[:space:]]*:[[:space:]]*[0-9]+[[:space:]]*$")) {
                sub("^[[:space:]]*" metric "[[:space:]]*:[[:space:]]*", "", line)
                sub("[[:space:]]*$", "", line)
                last = line
            }
        }
        END {
            if (last != "") {
                print last
            }
        }
    ')
    if [ -n "${value:-}" ]; then
        echo "$value"
    else
        echo "0"
    fi
}

add_layer_counts() {
    local layer_name="$1"
    local passed="$2"
    local failed="$3"
    local skipped="$4"

    case "$layer_name" in
        static)
            LAYER1_PASSED=$((LAYER1_PASSED + passed))
            LAYER1_FAILED=$((LAYER1_FAILED + failed))
            LAYER1_SKIPPED=$((LAYER1_SKIPPED + skipped))
            ;;
        lifecycle)
            LAYER2_PASSED=$((LAYER2_PASSED + passed))
            LAYER2_FAILED=$((LAYER2_FAILED + failed))
            LAYER2_SKIPPED=$((LAYER2_SKIPPED + skipped))
            ;;
        integration)
            LAYER3_PASSED=$((LAYER3_PASSED + passed))
            LAYER3_FAILED=$((LAYER3_FAILED + failed))
            LAYER3_SKIPPED=$((LAYER3_SKIPPED + skipped))
            ;;
    esac
}

print_layer_results() {
    local layer_name="$1"
    local passed=0
    local failed=0
    local skipped=0

    case "$layer_name" in
        static)
            passed=$LAYER1_PASSED
            failed=$LAYER1_FAILED
            skipped=$LAYER1_SKIPPED
            ;;
        lifecycle)
            passed=$LAYER2_PASSED
            failed=$LAYER2_FAILED
            skipped=$LAYER2_SKIPPED
            ;;
        integration)
            passed=$LAYER3_PASSED
            failed=$LAYER3_FAILED
            skipped=$LAYER3_SKIPPED
            ;;
    esac

    echo ""
    echo "$layer_name results: Passed=$passed Failed=$failed Skipped=$skipped"
}

collect_tests() {
    local layer_dir="$1"
    local pattern="$2"

    if [ ! -d "$layer_dir" ]; then
        return 0
    fi

    find "$layer_dir" -maxdepth 1 -type f -name "$pattern" | sort
}

collect_layer3_tests() {
    local mode="$1"
    local layer_dir="$DOCKER_DIR/layer3-integration"
    local smoke_dir="$layer_dir/smoke"
    local full_dir="$layer_dir/full"
    local smoke_tests
    local full_tests
    local legacy_smoke_tests
    local legacy_all_tests

    if [ "$mode" = "smoke" ]; then
        smoke_tests=$(collect_tests "$smoke_dir" "*.test.js")
        if [ -n "$smoke_tests" ]; then
            # smoke/ is authoritative when present. Legacy root tests are fallback-only
            # and must not be merged to avoid duplicate execution.
            legacy_smoke_tests=$(collect_tests "$layer_dir" "smoke*.test.js")
            legacy_all_tests=$(collect_tests "$layer_dir" "*.test.js")
            if [ -n "$legacy_smoke_tests" ] || [ -n "$legacy_all_tests" ]; then
                echo "INFO: Layer3 smoke selected '$smoke_dir'; skipping legacy root tests in '$layer_dir' (fallback only)." >&2
            fi
            printf '%s\n' "$smoke_tests"
            return 0
        fi

        smoke_tests=$(collect_tests "$layer_dir" "smoke*.test.js")
        if [ -n "$smoke_tests" ]; then
            printf '%s\n' "$smoke_tests"
            return 0
        fi

        full_tests=$(collect_tests "$layer_dir" "*.test.js")
        if [ -n "$full_tests" ]; then
            printf '%s\n' "$full_tests"
        fi
        return 0
    fi

    full_tests=$(collect_tests "$full_dir" "*.test.js")
    if [ -n "$full_tests" ]; then
        # full/ is authoritative when present. Legacy root tests are fallback-only
        # and must not be merged to avoid duplicate execution.
        legacy_all_tests=$(collect_tests "$layer_dir" "*.test.js")
        if [ -n "$legacy_all_tests" ]; then
            echo "INFO: Layer3 full selected '$full_dir'; skipping legacy root tests in '$layer_dir' (fallback only)." >&2
        fi
        printf '%s\n' "$full_tests"
        return 0
    fi

    collect_tests "$layer_dir" "*.test.js"
}

prepare_lifecycle_home() {
    local test_file="$1"
    rm -rf "$HOME/.codex" "$HOME/.agents"
    if [[ "$(basename "$test_file")" != *no-backup* ]]; then
        mkdir -p "$HOME/.codex" "$HOME/.agents/skills"
    fi
}

run_test() {
    local test_file="$1"
    local runner="$2"
    local test_name output exit_code passed failed skipped

    test_name=$(basename "$test_file")
    output=""
    exit_code=0

    echo ""
    echo "--- Running $test_name ---"

    case "$runner" in
        node)
            output=$(node "$test_file" 2>&1)
            exit_code=$?
            ;;
        bash)
            output=$(bash "$test_file" 2>&1)
            exit_code=$?
            ;;
        *)
            echo "ERROR: Unsupported runner '$runner' for $test_name" >&2
            exit_code=127
            ;;
    esac

    if [ -n "$output" ]; then
        echo "$output"
    fi
    if [ "$exit_code" -ne 0 ]; then
        echo "=== TEST FAILED (exit=$exit_code): $test_name ===" >&2
    fi

    passed=$(extract_metric "$output" "Passed")
    failed=$(extract_metric "$output" "Failed")
    skipped=$(extract_metric "$output" "Skipped")

    if [ "$exit_code" -ne 0 ] && [ "$failed" -eq 0 ]; then
        failed=1
    fi
    if [ "$exit_code" -eq 0 ] && [ "$passed" -eq 0 ] && [ "$failed" -eq 0 ] && [ "$skipped" -eq 0 ]; then
        passed=1
    fi

    TOTAL_PASSED=$((TOTAL_PASSED + passed))
    TOTAL_FAILED=$((TOTAL_FAILED + failed))
    TOTAL_SKIPPED=$((TOTAL_SKIPPED + skipped))
    add_layer_counts "$CURRENT_LAYER" "$passed" "$failed" "$skipped"

    return "$exit_code"
}

run_layer_files() {
    local runner="$1"
    local layer_name="$2"
    local test_list="$3"
    local test_file=""
    local has_tests=0

    CURRENT_LAYER="$layer_name"

    echo ""
    echo "━━━ Layer: $layer_name ━━━"

    while IFS= read -r test_file; do
        [ -n "$test_file" ] || continue
        has_tests=1
        if [ "$layer_name" = "lifecycle" ]; then
            prepare_lifecycle_home "$test_file"
        fi
        run_test "$test_file" "$runner"
    done <<EOF
$test_list
EOF

    if [ "$has_tests" -eq 0 ]; then
        echo "No tests found for layer: $layer_name"
        print_layer_results "$layer_name"
        return 0
    fi

    print_layer_results "$layer_name"
    return 0
}

run_layer1_static() {
    local tests
    tests=$(collect_tests "$DOCKER_DIR/layer1-static" "*.test.js")
    run_layer_files node "static" "$tests"
}

run_layer2_lifecycle() {
    local tests
    tests=$(collect_tests "$DOCKER_DIR/layer2-lifecycle" "*.test.sh")
    run_layer_files bash "lifecycle" "$tests"
}

api_key_available() {
    [ -n "${CODEX_API_KEY:-}" ] || [ -n "${OPENAI_API_KEY:-}" ]
}

ensure_installed() {
    local manifest="$HOME/.codex/.everything-codex-manifest"
    local install_log="/tmp/everything-codex-install.log"
    local install_exit=0

    if [ -f "$manifest" ]; then
        return 0
    fi

    echo ""
    echo "Manifest missing. Running install.sh..."
    printf "4\n" | bash "$WORKSPACE/scripts/install.sh" >"$install_log" 2>&1
    install_exit=$?
    if [ "$install_exit" -ne 0 ]; then
        echo "install.sh exited with code $install_exit; verifying manifest..." >&2
    fi

    if [ ! -f "$manifest" ]; then
        echo "ERROR: Manifest missing after install: $manifest" >&2
        if [ -f "$install_log" ]; then
            tail -n 40 "$install_log" >&2
        fi
        return 1
    fi
    return 0
}

run_layer3_integration() {
    local mode="$1"
    local tests
    local selected_count
    local skipped_count

    tests=$(collect_layer3_tests "$mode")
    selected_count=$(printf '%s\n' "$tests" | sed '/^$/d' | wc -l | tr -d ' ')

    if ! api_key_available; then
        if [ -n "${GITHUB_ACTIONS:-}" ]; then
            echo "ERROR: Layer 3 requires CODEX_API_KEY or OPENAI_API_KEY in CI." >&2
            TOTAL_FAILED=$((TOTAL_FAILED + 1))
            add_layer_counts "integration" 0 1 0
            return 1
        fi

        skipped_count=$selected_count
        if [ "$skipped_count" -eq 0 ]; then
            skipped_count=1
        fi
        echo ""
        echo "SKIPPING Layer 3 ($mode): no CODEX_API_KEY/OPENAI_API_KEY in local run"
        TOTAL_SKIPPED=$((TOTAL_SKIPPED + skipped_count))
        add_layer_counts "integration" 0 0 "$skipped_count"
        return 0
    fi

    if ! ensure_installed; then
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        add_layer_counts "integration" 0 1 0
        return 1
    fi

    run_layer_files node "integration" "$tests"
    return 0
}

json_escape() {
    node -e 'const s = process.argv[1] ?? ""; process.stdout.write(JSON.stringify(s).slice(1, -1));' "$1"
}

if ! ensure_reports_dir_writable; then
    exit 1
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║        everything-codex Docker Integration Tests         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Layer: $REQUESTED_LAYER"
echo "Model: ${CODEX_TEST_MODEL:-gpt-5.3-codex}"
echo "Timeout: ${CODEX_TEST_TIMEOUT:-180}s"
echo ""

case "$LAYER" in
    static|layer1|layer1/static)
        run_layer1_static
        ;;
    lifecycle|layer2|layer2/lifecycle)
        run_layer1_static
        run_layer2_lifecycle
        ;;
    smoke)
        run_layer1_static
        run_layer2_lifecycle
        run_layer3_integration "smoke"
        ;;
    integration|layer3|integration/layer3|layer3/integration|all)
        run_layer1_static
        run_layer2_lifecycle
        run_layer3_integration "full"
        ;;
    *)
        echo "ERROR: Unsupported layer '$REQUESTED_LAYER'" >&2
        echo "Supported layers: static, lifecycle, smoke, integration, layer3, all" >&2
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        ;;
esac

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED + TOTAL_SKIPPED))
TIMESTAMP_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CODEX_VERSION=$(codex --version 2>/dev/null | head -n 1)
if [ -z "${CODEX_VERSION:-}" ]; then
    CODEX_VERSION="unknown"
fi
CODEX_VERSION_ESCAPED=$(json_escape "$CODEX_VERSION")
TIMESTAMP_ESCAPED=$(json_escape "$TIMESTAMP_UTC")

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                     Final Results                        ║"
echo "╠══════════════════════════════════════════════════════════╣"
printf "║  Total Tests: %4d                                      ║\n" "$TOTAL_TESTS"
printf "║  Passed:      %4d                                      ║\n" "$TOTAL_PASSED"
printf "║  Failed:      %4d                                      ║\n" "$TOTAL_FAILED"
printf "║  Skipped:     %4d                                      ║\n" "$TOTAL_SKIPPED"
printf "║  Duration:    %4ds                                     ║\n" "$DURATION"
echo "╚══════════════════════════════════════════════════════════╝"

cat > "$REPORTS_DIR/metadata.json" <<ENDMETA
{
  "codex_version": "$CODEX_VERSION_ESCAPED",
  "timestamp": "$TIMESTAMP_ESCAPED"
}
ENDMETA

# Always generate summary.json, even when tests fail or are skipped.
cat > "$REPORTS_DIR/summary.json" <<ENDJSON
{
  "total": $TOTAL_TESTS,
  "passed": $TOTAL_PASSED,
  "failed": $TOTAL_FAILED,
  "skipped": $TOTAL_SKIPPED,
  "duration_ms": $((DURATION * 1000)),
  "layers": {
    "static": { "total": $((LAYER1_PASSED + LAYER1_FAILED + LAYER1_SKIPPED)), "passed": $LAYER1_PASSED, "failed": $LAYER1_FAILED, "skipped": $LAYER1_SKIPPED },
    "lifecycle": { "total": $((LAYER2_PASSED + LAYER2_FAILED + LAYER2_SKIPPED)), "passed": $LAYER2_PASSED, "failed": $LAYER2_FAILED, "skipped": $LAYER2_SKIPPED },
    "integration": { "total": $((LAYER3_PASSED + LAYER3_FAILED + LAYER3_SKIPPED)), "passed": $LAYER3_PASSED, "failed": $LAYER3_FAILED, "skipped": $LAYER3_SKIPPED }
  },
  "codex_version": "$CODEX_VERSION_ESCAPED",
  "timestamp": "$TIMESTAMP_ESCAPED"
}
ENDJSON

echo ""
echo "Reports written to $REPORTS_DIR/"

# Generate JUnit XML and TAP report, but do not override test exit logic.
if ! node "$DOCKER_DIR/lib/report.js" "$REPORTS_DIR/summary.json" "$REPORTS_DIR/junit.xml" 2>&1; then
    echo "Warning: Failed to generate JUnit/TAP report" >&2
fi

if [ "$TOTAL_FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
