#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../../.codex/skills');

function extractFrontmatter(content) {
  const clean = content.replace(/^\uFEFF/, '');
  const match = clean.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    fields[key] = value;
  }
  return fields;
}

if (!fs.existsSync(SKILLS_DIR)) {
  console.error('ERROR: Missing .codex/skills directory');
  process.exit(1);
}

const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true }).filter(entry => entry.isDirectory());
if (entries.length === 0) {
  console.error('ERROR: .codex/skills must contain at least one skill directory');
  process.exit(1);
}

for (const entry of entries) {
  const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    console.error(`ERROR: Missing SKILL.md for ${entry.name}`);
    process.exit(1);
  }

  const content = fs.readFileSync(skillPath, 'utf8');
  if (!content.trim()) {
    console.error(`ERROR: Empty SKILL.md for ${entry.name}`);
    process.exit(1);
  }

  const frontmatter = extractFrontmatter(content);
  if (!frontmatter || !frontmatter.name || !frontmatter.description) {
    console.error(`ERROR: Invalid frontmatter in .codex/skills/${entry.name}/SKILL.md`);
    process.exit(1);
  }
}

console.log(`Validated ${entries.length} Codex skills`);
