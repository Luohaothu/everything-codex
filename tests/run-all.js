#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const tests = [
  'structure/codex-structure.test.js',
  'structure/validators.test.js'
];

let passed = 0;
let failed = 0;

console.log('Everything Codex - Test Suite\n');

for (const testFile of tests) {
  process.stdout.write(`Running ${testFile} ... `);
  try {
    execSync(`node ${path.join(__dirname, testFile)}`, { stdio: 'pipe' });
    console.log('PASS');
    passed++;
  } catch (err) {
    console.log('FAIL');
    process.stdout.write((err.stdout || '').toString());
    process.stdout.write((err.stderr || '').toString());
    failed++;
  }
}

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
