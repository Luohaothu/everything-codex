#!/usr/bin/env node
/**
 * Validate overall Codex project structure
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

const requiredFiles = [
  'AGENTS.md',
  'config.toml',
  'README.md',
];

const requiredDirs = [
  'skills',
  'rules',
  'golang',
  'python',
  'typescript',
  'scripts/ci',
];

const forbiddenPaths = [
  '.claude-plugin',
  '.opencode',
  'hooks/hooks.json',
  'contexts',
];

let hasErrors = false;

// Check required files
for (const f of requiredFiles) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) {
    console.error(`ERROR: Missing required file: ${f}`);
    hasErrors = true;
  }
}

// Check required directories
for (const d of requiredDirs) {
  const p = path.join(ROOT, d);
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
    console.error(`ERROR: Missing required directory: ${d}/`);
    hasErrors = true;
  }
}

// Check forbidden paths
for (const f of forbiddenPaths) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    console.error(`ERROR: Forbidden path still exists: ${f}`);
    hasErrors = true;
  }
}

// Check .rules files exist
const rulesDir = path.join(ROOT, 'rules');
if (fs.existsSync(rulesDir)) {
  const rulesFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.rules'));
  if (rulesFiles.length === 0) {
    console.error('ERROR: No .rules files found in rules/');
    hasErrors = true;
  } else {
    console.log(`Found ${rulesFiles.length} execution policy files`);
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log('Structure validation passed');
