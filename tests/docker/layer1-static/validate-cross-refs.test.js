/**
 * Layer 1: Validate cross references to /skill-name commands.
 *
 * Scans:
 * - All SKILL.md files under skills/<skill-name>/
 * - All markdown files under workflows/
 *
 * Asserts:
 * - Any referenced /skill-name maps to an existing skills/<name>/ directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createSuite, runAndExit } = require('../lib/runner');
const { dirExists, fileExists } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const SKILLS_DIR = path.join(WORKSPACE, 'skills');
const WORKFLOWS_DIR = path.join(WORKSPACE, 'workflows');

// Command-like references such as `/plan`, `/code-review`, `/tdd`.
// Excludes path-like tokens such as `/api/...` and template paths like `/api${id}`.
const SKILL_REF_PATTERN = /(^|[\s`(>])\/([a-z0-9][a-z0-9-]{0,63})(?![a-z0-9-]|\/|\$)/gm;

const suite = createSuite('Validate Cross References');

function safeReadDirEntries(dirPath) {
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return [];
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

function discoverSkillDirectories() {
  return safeReadDirEntries(SKILLS_DIR)
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function discoverWorkflowMarkdownFiles() {
  return safeReadDirEntries(WORKFLOWS_DIR)
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(WORKFLOWS_DIR, entry.name))
    .sort();
}

function extractSkillRefs(content) {
  const refs = new Set();
  SKILL_REF_PATTERN.lastIndex = 0;
  let match = SKILL_REF_PATTERN.exec(content);
  while (match) {
    refs.add(match[2]);
    match = SKILL_REF_PATTERN.exec(content);
  }
  return refs;
}

function collectReferencedSkills(files) {
  const refs = new Set();
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const ref of extractSkillRefs(content)) {
      refs.add(ref);
    }
  }
  return refs;
}

function assertReferencedSkillsExist(referencedSkills, existingSkillSet, contextLabel) {
  const missing = [...referencedSkills]
    .filter(skillName => !existingSkillSet.has(skillName))
    .sort();

  assert.strictEqual(
    missing.length,
    0,
    `${contextLabel} contains missing skill references: ${missing.join(', ')}`
  );
}

suite.test('skills/ directory exists', () => {
  dirExists(SKILLS_DIR);
});

suite.test('workflows/ directory exists', () => {
  dirExists(WORKFLOWS_DIR);
});

const skillDirs = discoverSkillDirectories();
const skillSet = new Set(skillDirs);
const skillMarkdownFiles = skillDirs.map(skillName => path.join(SKILLS_DIR, skillName, 'SKILL.md'));
const workflowFiles = discoverWorkflowMarkdownFiles();

suite.test('every discovered skill has SKILL.md', () => {
  for (const skillMdPath of skillMarkdownFiles) {
    fileExists(skillMdPath);
  }
});

suite.test('all /skill-name references inside SKILL.md resolve to existing skills', () => {
  const refs = collectReferencedSkills(skillMarkdownFiles);
  assertReferencedSkillsExist(refs, skillSet, 'skills/*/SKILL.md');
});

suite.test('all /skill-name references inside workflows resolve to existing skills', () => {
  const refs = collectReferencedSkills(workflowFiles);
  assertReferencedSkillsExist(refs, skillSet, 'workflows/*.md');
});

runAndExit(suite);
