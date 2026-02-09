#!/usr/bin/env bash
set -euo pipefail

CODEX_DIR="$HOME/.codex"
AGENTS_SKILLS_DIR="$HOME/.agents/skills"
INSTALL_MANIFEST="$CODEX_DIR/.everything-codex-manifest"
ALLOWED_CODEX_TARGETS="~/.codex/rules/**, ~/.codex/workflows/**, ~/.codex/prompts/**, ~/.codex/config.toml.example"

resolve_existing_dir() {
    local dir_path="$1"
    if [ -d "$dir_path" ]; then
        (cd "$dir_path" && pwd -P)
    fi
}

is_under_root() {
    local path="$1"
    local root="$2"
    if [ -z "$root" ]; then
        return 1
    fi
    case "$path" in
        "$root"|"$root"/*) return 0 ;;
        *) return 1 ;;
    esac
}

is_safe_manifest_path() {
    local path="$1"
    is_under_root "$path" "$CODEX_DIR" \
        || is_under_root "$path" "$AGENTS_SKILLS_DIR" \
        || is_under_root "$path" "${CODEX_DIR_REAL:-}" \
        || is_under_root "$path" "${AGENTS_SKILLS_DIR_REAL:-}"
}

is_under_codex_root() {
    local path="$1"
    is_under_root "$path" "$CODEX_DIR" || is_under_root "$path" "${CODEX_DIR_REAL:-}"
}

is_allowed_codex_target() {
    local path="$1"
    case "$path" in
        "$CODEX_DIR"/rules/*|"$CODEX_DIR"/workflows/*|"$CODEX_DIR"/prompts/*|"$CODEX_DIR"/config.toml.example)
            return 0
            ;;
    esac

    case "$path" in
        "${CODEX_DIR_REAL:-__disabled__}"/rules/*|\
        "${CODEX_DIR_REAL:-__disabled__}"/workflows/*|\
        "${CODEX_DIR_REAL:-__disabled__}"/prompts/*|\
        "${CODEX_DIR_REAL:-__disabled__}"/config.toml.example)
            return 0
            ;;
    esac

    return 1
}

is_allowed_manifest_path() {
    local path="$1"
    case "$path" in
        "$AGENTS_SKILLS_DIR"/*|"${AGENTS_SKILLS_DIR_REAL:-__disabled__}"/*)
            return 0
            ;;
    esac

    is_allowed_codex_target "$path"
}

resolve_manifest_path() {
    local raw_path="$1"
    local dir_path base_name resolved_dir

    if [ "${raw_path#/}" = "$raw_path" ]; then
        return 1
    fi

    dir_path=$(dirname -- "$raw_path")
    base_name=$(basename -- "$raw_path")
    if resolved_dir=$(cd "$dir_path" 2>/dev/null && pwd -P); then
        printf '%s/%s\n' "$resolved_dir" "$base_name"
    else
        printf '%s\n' "$raw_path"
    fi
}

warn_unsafe_manifest_path() {
    local raw_path="$1"
    local resolved_path="${2:-$1}"
    if [ "$raw_path" = "$resolved_path" ]; then
        echo "Warning: skipping unsafe manifest path: $raw_path" >&2
    else
        echo "Warning: skipping unsafe manifest path: $raw_path -> $resolved_path" >&2
    fi
}

warn_disallowed_in_root_manifest_path() {
    local raw_path="$1"
    local resolved_path="${2:-$1}"
    if [ "$raw_path" = "$resolved_path" ]; then
        echo "Warning: skipping disallowed in-root manifest path: $raw_path (allowed uninstall targets: $ALLOWED_CODEX_TARGETS)" >&2
    else
        echo "Warning: skipping disallowed in-root manifest path: $raw_path -> $resolved_path (allowed uninstall targets: $ALLOWED_CODEX_TARGETS)" >&2
    fi
}

warn_disallowed_manifest_path() {
    local raw_path="$1"
    local resolved_path="${2:-$1}"
    if [ "$raw_path" = "$resolved_path" ]; then
        echo "Warning: skipping disallowed manifest path: $raw_path" >&2
    else
        echo "Warning: skipping disallowed manifest path: $raw_path -> $resolved_path" >&2
    fi
}

CODEX_DIR_REAL="$(resolve_existing_dir "$CODEX_DIR" || true)"
AGENTS_SKILLS_DIR_REAL="$(resolve_existing_dir "$AGENTS_SKILLS_DIR" || true)"

if [ "${1:-}" = "--rollback" ]; then
    LATEST_BACKUP=$(ls -dt "$CODEX_DIR"/.backup-* 2>/dev/null | head -1 || true)
    if [ -z "$LATEST_BACKUP" ]; then
        echo "No backup found. Cannot rollback."
        exit 1
    fi
    echo "Rolling back from $LATEST_BACKUP..."
    if ! cp -a "$LATEST_BACKUP"/. "$CODEX_DIR"/; then
        echo "Rollback failed: unable to copy backup files." >&2
        exit 1
    fi
    echo "Rollback complete."
    exit 0
fi

if [ ! -f "$INSTALL_MANIFEST" ]; then
    echo "No install manifest found. Was everything-codex installed?"
    exit 1
fi

echo "Uninstalling everything-codex..."
while IFS= read -r file || [ -n "${file:-}" ]; do
    local_resolved_file=""
    [ -n "$file" ] || continue

    if ! local_resolved_file=$(resolve_manifest_path "$file"); then
        warn_unsafe_manifest_path "$file"
        continue
    fi

    if ! is_safe_manifest_path "$local_resolved_file"; then
        warn_unsafe_manifest_path "$file" "$local_resolved_file"
        continue
    fi

    if ! is_allowed_manifest_path "$local_resolved_file"; then
        if is_under_codex_root "$local_resolved_file"; then
            warn_disallowed_in_root_manifest_path "$file" "$local_resolved_file"
        else
            warn_disallowed_manifest_path "$file" "$local_resolved_file"
        fi
        continue
    fi

    if [ -f "$local_resolved_file" ] || [ -L "$local_resolved_file" ]; then
        rm -f "$local_resolved_file"
    fi
done < "$INSTALL_MANIFEST"

# Clean up empty directories
find "$AGENTS_SKILLS_DIR" -type d -empty -delete 2>/dev/null || true

rm -f "$INSTALL_MANIFEST"
echo "Uninstall complete."
echo "Note: AGENTS.md files were not removed. Delete manually if desired."
