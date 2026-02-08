#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="$HOME/.codex"
INSTALL_MANIFEST="$CODEX_DIR/.everything-codex-manifest"

if [ "${1:-}" = "--rollback" ]; then
    LATEST_BACKUP=$(ls -dt "$CODEX_DIR"/.backup-* 2>/dev/null | head -1)
    if [ -z "$LATEST_BACKUP" ]; then
        echo "No backup found. Cannot rollback."
        exit 1
    fi
    echo "Rolling back from $LATEST_BACKUP..."
    cp -r "$LATEST_BACKUP"/* "$CODEX_DIR/" 2>/dev/null || true
    echo "Rollback complete."
    exit 0
fi

if [ ! -f "$INSTALL_MANIFEST" ]; then
    echo "No install manifest found. Was everything-codex installed?"
    exit 1
fi

echo "Uninstalling everything-codex..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        rm -f "$file"
    fi
done < "$INSTALL_MANIFEST"

# Clean up empty directories
find "$HOME/.agents/skills" -type d -empty -delete 2>/dev/null || true

rm -f "$INSTALL_MANIFEST"
echo "Uninstall complete."
echo "Note: AGENTS.md files were not removed. Delete manually if desired."
