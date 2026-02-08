#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../.codex/config.toml');

if (!fs.existsSync(configPath)) {
  console.error('ERROR: Missing .codex/config.toml');
  process.exit(1);
}

const content = fs.readFileSync(configPath, 'utf8');

const requiredKeys = [
  'model',
  'approval_policy',
  'sandbox_mode'
];

for (const key of requiredKeys) {
  const pattern = new RegExp(`^${key}\\s*=`, 'm');
  if (!pattern.test(content)) {
    console.error(`ERROR: .codex/config.toml missing required key: ${key}`);
    process.exit(1);
  }
}

console.log('Validated .codex/config.toml');
