#!/usr/bin/env bash
# Detect debug statements in staged/modified files
set -euo pipefail

errors=0

# Get modified files
files=$(git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || true)

for file in $files; do
    if [ ! -f "$file" ]; then continue; fi
    case "$file" in
        *.ts|*.tsx|*.js|*.jsx)
            if grep -n "console\.log\|console\.debug" "$file" 2>/dev/null; then
                echo "WARNING: Debug statement in $file"
                errors=1
            fi
            ;;
        *.py)
            if grep -n "^[^#]*\bprint(" "$file" 2>/dev/null; then
                echo "WARNING: Print statement in $file"
                errors=1
            fi
            ;;
    esac
done

exit $errors
