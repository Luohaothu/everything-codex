#!/usr/bin/env bash
# Check code formatting across modified files
set -euo pipefail

errors=0

# Check Go files
if command -v gofmt &>/dev/null; then
    unformatted=$(gofmt -l . 2>/dev/null || true)
    if [ -n "$unformatted" ]; then
        echo "ERROR: Unformatted Go files:"
        echo "$unformatted"
        errors=1
    fi
fi

# Check JS/TS files with prettier (if available)
if command -v npx &>/dev/null && { [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; }; then
    npx prettier --check "**/*.{ts,tsx,js,jsx}" 2>/dev/null || errors=1
fi

# Check Python files with black (if available)
if command -v black &>/dev/null; then
    black --check . 2>/dev/null || errors=1
fi

exit $errors
