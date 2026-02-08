#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LEGACY_DIRS = [
  '.claude-plugin',
  '.opencode',
  'agents',
  'commands',
  'hooks',
  'skills',
  'rules',
  'mcp-configs'
];

const repoRoot = path.join(__dirname, '../..');
const found = LEGACY_DIRS.filter(dir => fs.existsSync(path.join(repoRoot, dir)));

if (found.length > 0) {
  console.error(`ERROR: Legacy directories must be removed: ${found.join(', ')}`);
  process.exit(1);
}

console.log('Validated Codex-only directory policy');
