#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const TARGET_DIRS = [
  path.join(ROOT, 'scripts'),
  path.join(ROOT, 'tests')
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = TARGET_DIRS.flatMap(dir => walk(dir));
if (files.length === 0) {
  console.log('No JavaScript files found for lint');
  process.exit(0);
}

for (const file of files) {
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (check.status !== 0) {
    console.error(`ERROR: Syntax check failed for ${path.relative(ROOT, file)}`);
    console.error(check.stderr || check.stdout);
    process.exit(1);
  }
}

console.log(`Linted ${files.length} JavaScript files (syntax check)`);
