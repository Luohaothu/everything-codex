#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '../../workflows');
const REQUIRED = ['plan.md', 'tdd.md', 'code-review.md', 'verify.md'];

if (!fs.existsSync(WORKFLOWS_DIR)) {
  console.error('ERROR: Missing workflows directory');
  process.exit(1);
}

for (const file of REQUIRED) {
  const fullPath = path.join(WORKFLOWS_DIR, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: Missing workflow file: workflows/${file}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf8').trim();
  if (!content) {
    console.error(`ERROR: Empty workflow file: workflows/${file}`);
    process.exit(1);
  }
}

console.log(`Validated ${REQUIRED.length} required workflows`);
