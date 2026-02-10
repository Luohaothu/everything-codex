/**
 * Layer 1: Validate workflows (dynamic discovery + minimum baseline).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createSuite, runAndExit } = require('../lib/runner');
const { fileNonEmpty } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const WORKFLOWS_DIR = path.join(WORKSPACE, 'workflows');
const MIN_WORKFLOW_COUNT = 5;
const SECTION_HEADING_PATTERN = /^##\s+\S+/m;

const suite = createSuite('Validate Workflows');

function safeReadDirEntries(dirPath) {
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return [];
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

const workflowFiles = safeReadDirEntries(WORKFLOWS_DIR)
  .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
  .map(entry => entry.name)
  .sort();

suite.test(`workflows/ directory has at least ${MIN_WORKFLOW_COUNT} markdown files`, () => {
  assert.ok(
    workflowFiles.length >= MIN_WORKFLOW_COUNT,
    `Expected >= ${MIN_WORKFLOW_COUNT} workflow files, found ${workflowFiles.length}: ${workflowFiles.join(', ')}`
  );
});

for (const workflowFile of workflowFiles) {
  const fullPath = path.join(WORKFLOWS_DIR, workflowFile);

  suite.test(`${workflowFile}: non-empty`, () => {
    fileNonEmpty(fullPath, 1);
  });

  suite.test(`${workflowFile}: contains at least one level-2 heading`, () => {
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert.ok(
      SECTION_HEADING_PATTERN.test(content),
      `${workflowFile} must contain at least one "##" heading`
    );
  });
}

runAndExit(suite);
