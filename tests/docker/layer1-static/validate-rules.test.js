/**
 * Layer 1: Validate rules (dynamic discovery + minimum baseline).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createSuite, runAndExit } = require('../lib/runner');
const { fileNonEmpty, dirExists } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const RULES_DIR = path.join(WORKSPACE, 'rules');
const RULE_SUBDIRS = ['common', 'golang', 'python', 'typescript'];
const MIN_RULES_FILES = 3;
const PREFIX_RULE_PATTERN = /\bprefix_rule\s*\(/;

const suite = createSuite('Validate Rules');

function safeReadDirEntries(dirPath) {
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return [];
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

// .rules files
const rulesFiles = safeReadDirEntries(RULES_DIR)
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(f => f.endsWith('.rules'));

suite.test(`at least ${MIN_RULES_FILES} .rules files exist`, () => {
  assert.ok(
    rulesFiles.length >= MIN_RULES_FILES,
    `Expected >= ${MIN_RULES_FILES} .rules files, found ${rulesFiles.length}`
  );
});

for (const rulesFile of rulesFiles) {
  const fullPath = path.join(RULES_DIR, rulesFile);

  suite.test(`${rulesFile}: is non-empty`, () => {
    fileNonEmpty(fullPath);
  });

  suite.test(`${rulesFile}: contains valid prefix_rule(...) pattern`, () => {
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert.ok(
      PREFIX_RULE_PATTERN.test(content),
      `${rulesFile} missing valid prefix_rule( pattern`
    );
  });
}

// Markdown rule subdirectories
for (const subdir of RULE_SUBDIRS) {
  const subdirPath = path.join(RULES_DIR, subdir);

  suite.test(`rules/${subdir}/ directory exists`, () => {
    dirExists(subdirPath);
  });

  suite.test(`rules/${subdir}/ has markdown files`, () => {
    const mdFiles = fs.readdirSync(subdirPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name);
    assert.ok(
      mdFiles.length > 0,
      `Expected markdown files in rules/${subdir}/, found none`
    );
  });

  // Validate each markdown file is non-empty
  if (fs.existsSync(subdirPath)) {
    const mdFiles = fs.readdirSync(subdirPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name);
    for (const mdFile of mdFiles) {
      suite.test(`rules/${subdir}/${mdFile}: non-empty`, () => {
        fileNonEmpty(path.join(subdirPath, mdFile), 1);
      });
    }
  }
}

runAndExit(suite);
