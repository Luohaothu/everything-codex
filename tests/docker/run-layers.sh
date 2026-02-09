#!/usr/bin/env bash
set -euo pipefail

# Convenience wrapper to run Docker integration tests locally.
# Usage:
#   ./run-layers.sh              # Run all layers
#   ./run-layers.sh static       # Layer 1 only
#   ./run-layers.sh lifecycle    # Layer 1 + 2
#   ./run-layers.sh integration  # All layers (needs API key)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAYER="${1:-all}"

cd "$SCRIPT_DIR"

requires_env_file() {
    case "$LAYER" in
        smoke|integration|layer3|integration/layer3|layer3/integration)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

if requires_env_file && [ ! -f .env ] && [ -f .env.example ]; then
    echo "No .env found. Copy .env.example to .env and configure:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your API keys"
    exit 1
fi

echo "Building Docker image..."
# Default to host UID/GID so bind-mounted reports are writable on local runs.
# Allow explicit overrides for custom setups.
TESTUSER_UID="${TESTUSER_UID:-$(id -u)}"
TESTUSER_GID="${TESTUSER_GID:-$(id -g)}"
docker compose build \
    --build-arg TESTUSER_UID="$TESTUSER_UID" \
    --build-arg TESTUSER_GID="$TESTUSER_GID"

echo "Running tests (layer: $LAYER)..."
docker compose run --rm test-runner "$LAYER"

echo ""
echo "Reports available at: $SCRIPT_DIR/reports/"
