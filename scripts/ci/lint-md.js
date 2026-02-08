#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const TARGETS = [
  'AGENTS.md',
  'README.md',
  'README.zh-CN.md',
  'CONTRIBUTING.md',
  'docs',
  '.codex/skills',
  'workflows',
  'prompts'
];

function collectMarkdown(inputPath, output = []) {
  const absPath = path.join(ROOT, inputPath);
  if (!fs.existsSync(absPath)) return output;

  const stat = fs.statSync(absPath);
  if (stat.isFile() && absPath.endsWith('.md')) {
    output.push(absPath);
    return output;
  }

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
      collectMarkdown(path.join(inputPath, entry.name), output);
    }
  }

  return output;
}

const files = TARGETS.flatMap(target => collectMarkdown(target));
if (files.length === 0) {
  console.log('No Markdown files found for lint');
  process.exit(0);
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\s+$/.test(line)) {
      console.error(`ERROR: Trailing whitespace in ${path.relative(ROOT, file)}:${i + 1}`);
      process.exit(1);
    }
    if (line.length > 220) {
      console.error(`ERROR: Line too long (>220) in ${path.relative(ROOT, file)}:${i + 1}`);
      process.exit(1);
    }
  }
}

console.log(`Linted ${files.length} Markdown files`);
