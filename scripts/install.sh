#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="$HOME/.codex"
AGENTS_SKILLS_DIR="$HOME/.agents/skills"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$CODEX_DIR/.backup-$(date +%Y%m%d%H%M%S)"
INSTALL_MANIFEST="$CODEX_DIR/.everything-codex-manifest"

echo "everything-codex installer"
echo "========================="
echo ""

# 0. Backup
if [ -d "$CODEX_DIR" ] || [ -d "$AGENTS_SKILLS_DIR" ]; then
    echo "Backing up existing configuration..."
    mkdir -p "$BACKUP_DIR"
    [ -f "$CODEX_DIR/AGENTS.md" ] && cp "$CODEX_DIR/AGENTS.md" "$BACKUP_DIR/"
    [ -d "$CODEX_DIR/rules" ] && cp -r "$CODEX_DIR/rules" "$BACKUP_DIR/"
    [ -d "$AGENTS_SKILLS_DIR" ] && cp -r "$AGENTS_SKILLS_DIR" "$BACKUP_DIR/skills"
    for lang in golang python typescript; do
        if [ -d "$CODEX_DIR/$lang" ]; then
            mkdir -p "$BACKUP_DIR/$lang"
            cp -r "$CODEX_DIR/$lang" "$BACKUP_DIR/"
        fi
    done
    echo "Backup saved to: $BACKUP_DIR"
fi

# 1. AGENTS.md — merge, not overwrite
mkdir -p "$CODEX_DIR"
if [ -f "$CODEX_DIR/AGENTS.md" ]; then
    echo ""
    echo "Existing AGENTS.md detected. Choose merge strategy:"
    echo "  1) append  - Add everything-codex rules to end of existing file"
    echo "  2) include - Add reference comment to existing file"
    echo "  3) replace - Replace with everything-codex version (original backed up)"
    echo "  4) skip    - Do not modify (default)"
    echo "  5) dry-run - Show diff only"
    read -rp "Choice [1-5, default=4]: " choice
    case "${choice:-4}" in
        1) printf '\n# --- everything-codex rules ---\n\n' >> "$CODEX_DIR/AGENTS.md"
           cat "$PROJECT_DIR/AGENTS.md" >> "$CODEX_DIR/AGENTS.md"
           echo "Appended to AGENTS.md" ;;
        2) printf '\n# everything-codex rules: see ~/.codex/.everything-codex/AGENTS.md\n' >> "$CODEX_DIR/AGENTS.md"
           echo "Added reference to AGENTS.md" ;;
        3) cp "$PROJECT_DIR/AGENTS.md" "$CODEX_DIR/AGENTS.md"
           echo "Replaced AGENTS.md" ;;
        4) echo "Skipped AGENTS.md" ;;
        5) diff "$CODEX_DIR/AGENTS.md" "$PROJECT_DIR/AGENTS.md" || true ;;
    esac
else
    cp "$PROJECT_DIR/AGENTS.md" "$CODEX_DIR/AGENTS.md"
    echo "Installed AGENTS.md"
fi

# 2. Language AGENTS.md templates
for lang in golang python typescript; do
    mkdir -p "$CODEX_DIR/$lang"
    if [ -f "$CODEX_DIR/$lang/AGENTS.md" ]; then
        echo "Existing $lang/AGENTS.md, skipping"
    else
        cp "$PROJECT_DIR/$lang/AGENTS.md" "$CODEX_DIR/$lang/AGENTS.md"
        echo "Installed $lang/AGENTS.md"
    fi
done

# 3. Skills → ~/.agents/skills/
# Track only files we install (not pre-existing user files)
mkdir -p "$AGENTS_SKILLS_DIR"
: > "$INSTALL_MANIFEST"
echo "Installing skills..."
for skill_dir in "$PROJECT_DIR"/skills/*/; do
    skill_name=$(basename "$skill_dir")
    target="$AGENTS_SKILLS_DIR/$skill_name"
    mkdir -p "$target"
    for src_file in $(find "$skill_dir" -type f); do
        rel="${src_file#"$skill_dir"}"
        dest="$target/$rel"
        mkdir -p "$(dirname "$dest")"
        cp "$src_file" "$dest"
        echo "$dest" >> "$INSTALL_MANIFEST"
    done
done
echo "Installed $(ls -d "$PROJECT_DIR"/skills/*/ | wc -l | tr -d ' ') skills"

# 4. Rules → ~/.codex/rules/
mkdir -p "$CODEX_DIR/rules"
for rules_file in "$PROJECT_DIR"/rules/*.rules; do
    dest="$CODEX_DIR/rules/$(basename "$rules_file")"
    cp "$rules_file" "$dest"
    echo "$dest" >> "$INSTALL_MANIFEST"
done
echo "Installed execution policy rules"

# 5. Workflows → ~/.codex/workflows/
mkdir -p "$CODEX_DIR/workflows"
for wf in "$PROJECT_DIR"/workflows/*.md; do
    dest="$CODEX_DIR/workflows/$(basename "$wf")"
    cp "$wf" "$dest"
    echo "$dest" >> "$INSTALL_MANIFEST"
done
echo "Installed workflow playbooks"

# 6. Prompts → ~/.codex/prompts/
mkdir -p "$CODEX_DIR/prompts"
for pt in "$PROJECT_DIR"/prompts/*.md; do
    dest="$CODEX_DIR/prompts/$(basename "$pt")"
    cp "$pt" "$dest"
    echo "$dest" >> "$INSTALL_MANIFEST"
done
echo "Installed prompt templates"

# 7. Config examples
cp "$PROJECT_DIR/config.toml" "$CODEX_DIR/config.toml.example"
echo "$CODEX_DIR/config.toml.example" >> "$INSTALL_MANIFEST"
echo "Installed config.toml.example"

# 8. Finalize manifest
echo "Manifest written to $INSTALL_MANIFEST ($(wc -l < "$INSTALL_MANIFEST" | tr -d ' ') files)"

# 9. Post-install verification
echo ""
echo "Running verification..."
if command -v codex &>/dev/null; then
    codex --check-config 2>/dev/null && echo "Config: OK" || echo "Config: check failed (may need manual review)"
else
    echo "codex CLI not found, skipping config check"
fi

echo ""
echo "Installation complete!"
if [ -d "$BACKUP_DIR" ]; then
    echo "Backup at: $BACKUP_DIR"
    echo "To rollback: $(dirname "$0")/uninstall.sh --rollback"
fi
echo "To uninstall: $(dirname "$0")/uninstall.sh"
