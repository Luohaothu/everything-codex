#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const AGENTS_FILE = path.join(__dirname, '../../AGENTS.md');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(AGENTS_FILE)) {
  fail('Missing AGENTS.md at repository root');
}

const content = fs.readFileSync(AGENTS_FILE, 'utf8').trim();
if (!content) {
  fail('AGENTS.md is empty');
}

if (!content.includes('Codex')) {
  fail('AGENTS.md must describe Codex-specific rules');
}

console.log('Validated AGENTS.md');
