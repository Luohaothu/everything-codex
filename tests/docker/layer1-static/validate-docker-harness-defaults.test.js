/**
 * Layer 1: Validate Docker harness defaults stay aligned with CI defaults.
 *
 * This prevents "works in CI but not locally" (or vice-versa) drift in the
 * integration harness configuration.
 */

'use strict';

const path = require('path');
const { createSuite, runAndExit } = require('../lib/runner');
const { fileContains } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';

const ENV_EXAMPLE_PATH = path.join(WORKSPACE, 'tests/docker/.env.example');
const COMPOSE_PATH = path.join(WORKSPACE, 'tests/docker/docker-compose.yml');
const CODEX_HELPER_PATH = path.join(WORKSPACE, 'tests/docker/lib/codex-helper.js');
const CODEX_CONFIG_PATH = path.join(WORKSPACE, 'tests/docker/config/codex-config.toml');
const ENTRYPOINT_PATH = path.join(WORKSPACE, 'tests/docker/entrypoint.sh');

const suite = createSuite('Validate Docker Harness Defaults');

suite.test('env example defaults to gpt-5.3-codex + medium', () => {
  fileContains(ENV_EXAMPLE_PATH, /CODEX_TEST_MODEL=gpt-5\.3-codex/);
  fileContains(ENV_EXAMPLE_PATH, /CODEX_TEST_REASONING_EFFORT=medium/);
  fileContains(ENV_EXAMPLE_PATH, /CODEX_TEST_TIMEOUT=180/);
});

suite.test('docker compose defaults to gpt-5.3-codex + medium', () => {
  fileContains(COMPOSE_PATH, /CODEX_TEST_MODEL=\$\{CODEX_TEST_MODEL:-gpt-5\.3-codex\}/);
  fileContains(COMPOSE_PATH, /CODEX_TEST_REASONING_EFFORT=\$\{CODEX_TEST_REASONING_EFFORT:-medium\}/);
  fileContains(COMPOSE_PATH, /CODEX_TEST_TIMEOUT=\$\{CODEX_TEST_TIMEOUT:-180\}/);
});

suite.test('docker compose does not warn when secrets are unset', () => {
  fileContains(COMPOSE_PATH, /CODEX_API_KEY=\$\{CODEX_API_KEY:-\}/);
  fileContains(COMPOSE_PATH, /OPENAI_API_KEY=\$\{OPENAI_API_KEY:-\}/);
  fileContains(COMPOSE_PATH, /OPENAI_BASE_URL=\$\{OPENAI_BASE_URL:-\}/);
});

suite.test('codex helper defaults to gpt-5.3-codex when env is unset', () => {
  fileContains(CODEX_HELPER_PATH, /process\.env\.CODEX_TEST_MODEL \|\| 'gpt-5\.3-codex'/);
});

suite.test('codex config defaults to gpt-5.3-codex', () => {
  fileContains(CODEX_CONFIG_PATH, /model\s*=\s*"gpt-5\.3-codex"/);
});

suite.test('entrypoint prints consistent defaults', () => {
  fileContains(ENTRYPOINT_PATH, /Model: \$\{CODEX_TEST_MODEL:-gpt-5\.3-codex\}/);
  fileContains(ENTRYPOINT_PATH, /Timeout: \$\{CODEX_TEST_TIMEOUT:-180\}s/);
});

runAndExit(suite);
