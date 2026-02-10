/**
 * Layer 1: Validate config.toml
 *
 * Checks:
 * - config.toml exists and is parseable
 * - Required keys: model, sandbox_mode
 * - Profile structure
 * - MCP server entries
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createSuite, runAndExit } = require('../lib/runner');
const { fileExists, fileNonEmpty } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const CONFIG_PATH = path.join(WORKSPACE, 'config.toml');

const suite = createSuite('Validate Config');

function parseTomlStructure(content) {
  const topLevelKeys = new Set();
  const profiles = new Set();
  const mcpServers = new Set();
  let currentSection = null;

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (currentSection.startsWith('profiles.')) {
        profiles.add(currentSection.slice('profiles.'.length));
      } else if (currentSection.startsWith('mcp_servers.')) {
        mcpServers.add(currentSection.slice('mcp_servers.'.length));
      }
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(.+)$/);
    if (kvMatch && currentSection === null) {
      topLevelKeys.add(kvMatch[1]);
    }
  }

  return { topLevelKeys, profiles, mcpServers };
}

suite.test('config.toml exists', () => {
  fileExists(CONFIG_PATH);
});

suite.test('config.toml is non-empty', () => {
  fileNonEmpty(CONFIG_PATH, 100);
});

suite.test('config.toml is parseable for required structure', () => {
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const parsed = parseTomlStructure(content);

  assert.ok(
    parsed.topLevelKeys.has('model'),
    'config.toml missing required top-level key: model'
  );
  assert.ok(
    parsed.topLevelKeys.has('sandbox_mode'),
    'config.toml missing required top-level key: sandbox_mode'
  );
  assert.ok(
    parsed.profiles.has('dev'),
    'config.toml must define [profiles.dev]'
  );
  assert.ok(
    parsed.mcpServers.size >= 1,
    `config.toml must define at least 1 MCP server, found ${parsed.mcpServers.size}`
  );
});

runAndExit(suite);
