/**
 * Layer 1: Validate all skills (dynamic discovery + minimum baseline).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createSuite, runAndExit } = require('../lib/runner');
const { fileExists } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const SKILLS_DIR = path.join(WORKSPACE, 'skills');

const suite = createSuite('Validate All Skills');

const CLAUDE_CODE_REFS = /Claude Code|Task tool|Read tool|Write tool|Edit tool|Glob tool|Grep tool|Bash tool/gi;
const FORBIDDEN_FM_FIELDS = ['tools', 'model'];
const MIN_CONTENT_LENGTH = 100;
const MIN_SKILL_COUNT = 50;

function safeReadDirEntries(dirPath) {
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return [];
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return [];
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  if (!match) return null;

  const fm = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const kv = trimmed.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    fm[kv[1]] = kv[2];
  }
  return fm;
}

function normalizeScalar(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  const quoted = trimmed.match(/^"(.*)"$/) || trimmed.match(/^'(.*)'$/);
  return quoted ? quoted[1].trim() : trimmed;
}

// Discover all skill directories
const skillDirs = safeReadDirEntries(SKILLS_DIR)
  .filter(e => e.isDirectory())
  .map(e => e.name)
  .sort();

suite.test(`skills/ directory contains at least ${MIN_SKILL_COUNT} skills`, () => {
  assert.ok(
    skillDirs.length >= MIN_SKILL_COUNT,
    `Expected >= ${MIN_SKILL_COUNT} skills, found ${skillDirs.length}`
  );
});

for (const skillName of skillDirs) {
  const skillMdPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');

  suite.test(`${skillName}: SKILL.md exists`, () => {
    fileExists(skillMdPath);
  });

  suite.test(`${skillName}: frontmatter has required name`, () => {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const fm = parseFrontmatter(content);
    assert.ok(fm, `${skillName}/SKILL.md missing YAML frontmatter`);
    assert.ok(
      Object.prototype.hasOwnProperty.call(fm, 'name'),
      `${skillName}/SKILL.md missing 'name' in frontmatter`
    );
    const nameValue = normalizeScalar(fm.name);
    assert.ok(nameValue.length > 0, `${skillName}/SKILL.md frontmatter name must be a non-empty string`);
  });

  suite.test(`${skillName}: frontmatter name matches directory name`, () => {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const fm = parseFrontmatter(content);
    assert.ok(fm, `${skillName}/SKILL.md missing YAML frontmatter`);
    const nameValue = normalizeScalar(fm.name);
    assert.strictEqual(
      nameValue,
      skillName,
      `${skillName}/SKILL.md frontmatter name "${nameValue}" must match directory "${skillName}"`
    );
  });

  suite.test(`${skillName}: frontmatter has valid description`, () => {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const fm = parseFrontmatter(content);
    assert.ok(fm, `${skillName}/SKILL.md missing YAML frontmatter`);
    assert.ok(
      Object.prototype.hasOwnProperty.call(fm, 'description'),
      `${skillName}/SKILL.md missing 'description' in frontmatter`
    );
    const descValue = normalizeScalar(fm.description);
    assert.ok(
      descValue.length >= 10,
      `${skillName}/SKILL.md description must be at least 10 chars (got ${descValue.length})`
    );
  });

  suite.test(`${skillName}: no Claude Code references`, () => {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const matches = content.match(CLAUDE_CODE_REFS);
    assert.ok(
      !matches,
      `${skillName}/SKILL.md contains Claude Code references: ${matches ? [...new Set(matches)].join(', ') : ''}`
    );
  });

  suite.test(`${skillName}: no forbidden frontmatter fields`, () => {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) return;
    for (const field of FORBIDDEN_FM_FIELDS) {
      assert.ok(
        !Object.prototype.hasOwnProperty.call(fm, field),
        `${skillName}/SKILL.md has forbidden field '${field}' in frontmatter`
      );
    }
  });

  suite.test(`${skillName}: content length > ${MIN_CONTENT_LENGTH} chars`, () => {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    assert.ok(
      content.length > MIN_CONTENT_LENGTH,
      `${skillName}/SKILL.md is too short (${content.length} chars, need > ${MIN_CONTENT_LENGTH})`
    );
  });
}

runAndExit(suite);
