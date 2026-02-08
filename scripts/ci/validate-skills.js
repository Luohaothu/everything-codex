#!/usr/bin/env node
/**
 * Validate skill directories have SKILL.md with required frontmatter (name + description)
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../../skills');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      fm[key.trim()] = rest.join(':').trim();
    }
  });
  return fm;
}

function validateSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log('No skills directory found, skipping validation');
    process.exit(0);
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  let hasErrors = false;
  let validCount = 0;

  for (const dir of dirs) {
    const skillMd = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      console.error(`ERROR: ${dir}/ - Missing SKILL.md`);
      hasErrors = true;
      continue;
    }

    const content = fs.readFileSync(skillMd, 'utf-8');
    if (content.trim().length === 0) {
      console.error(`ERROR: ${dir}/SKILL.md - Empty file`);
      hasErrors = true;
      continue;
    }

    let skillHasError = false;

    const fm = parseFrontmatter(content);
    if (!fm) {
      console.error(`ERROR: ${dir}/SKILL.md - Missing YAML frontmatter`);
      hasErrors = true;
      continue;
    }
    if (!fm.name) {
      console.error(`ERROR: ${dir}/SKILL.md - Missing 'name' in frontmatter`);
      skillHasError = true;
    }
    if (!fm.description) {
      console.error(`ERROR: ${dir}/SKILL.md - Missing 'description' in frontmatter`);
      skillHasError = true;
    }

    // Check for Claude Code-specific references
    const claudeRefs = content.match(/Claude Code|Task tool|Read tool|Write tool|Edit tool|Glob tool|Grep tool|Bash tool/gi);
    if (claudeRefs) {
      console.error(`ERROR: ${dir}/SKILL.md - Contains Claude Code references: ${[...new Set(claudeRefs)].join(', ')}`);
      skillHasError = true;
    }

    // Check for tools/model frontmatter (Claude Code-specific)
    if (fm.tools || fm.model) {
      console.error(`ERROR: ${dir}/SKILL.md - Contains Claude Code frontmatter fields (tools/model). Use name/description only.`);
      skillHasError = true;
    }

    if (skillHasError) {
      hasErrors = true;
    } else {
      validCount++;
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log(`Validated ${validCount} skill directories`);
}

validateSkills();
