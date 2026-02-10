/**
 * Layer 1: Validate prompt templates (dynamic discovery + minimum baseline).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createSuite, runAndExit } = require('../lib/runner');
const { fileNonEmpty } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const PROMPTS_DIR = path.join(WORKSPACE, 'prompts');
const MIN_PROMPT_COUNT = 1;
const MIN_PROMPT_BYTES = 50;

const suite = createSuite('Validate Prompts');

function safeReadDirEntries(dirPath) {
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return [];
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

suite.test('prompts/ directory exists', () => {
  assert.ok(fs.existsSync(PROMPTS_DIR) && fs.statSync(PROMPTS_DIR).isDirectory(), 'prompts/ directory not found');
});

const promptFiles = safeReadDirEntries(PROMPTS_DIR)
  .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
  .map(entry => entry.name)
  .sort();

suite.test(`prompts/ has at least ${MIN_PROMPT_COUNT} markdown template`, () => {
  assert.ok(
    promptFiles.length >= MIN_PROMPT_COUNT,
    `Expected >= ${MIN_PROMPT_COUNT} prompt templates, found ${promptFiles.length}`
  );
});

for (const promptFile of promptFiles) {
  const fullPath = path.join(PROMPTS_DIR, promptFile);
  suite.test(`${promptFile}: non-empty and length > ${MIN_PROMPT_BYTES} bytes`, () => {
    fileNonEmpty(fullPath, MIN_PROMPT_BYTES + 1);
  });
}

runAndExit(suite);
