const assert = require('assert');
const fs = require('fs');
const path = require('path');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function run() {
  console.log('\n=== Codex Structure Tests ===\n');

  const root = path.join(__dirname, '../..');
  let passed = 0;
  let failed = 0;

  if (test('AGENTS.md exists', () => {
    assert.ok(fs.existsSync(path.join(root, 'AGENTS.md')));
  })) passed++; else failed++;

  if (test('.codex/config.toml exists', () => {
    assert.ok(fs.existsSync(path.join(root, '.codex/config.toml')));
  })) passed++; else failed++;

  if (test('.codex/skills contains SKILL.md files', () => {
    const skillsDir = path.join(root, '.codex/skills');
    const dirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(entry => entry.isDirectory());
    assert.ok(dirs.length > 0);
    for (const dir of dirs) {
      assert.ok(fs.existsSync(path.join(skillsDir, dir.name, 'SKILL.md')));
    }
  })) passed++; else failed++;

  if (test('required workflows exist', () => {
    for (const file of ['plan.md', 'tdd.md', 'code-review.md', 'verify.md']) {
      assert.ok(fs.existsSync(path.join(root, 'workflows', file)), `missing workflows/${file}`);
    }
  })) passed++; else failed++;

  if (test('legacy directories were removed', () => {
    for (const legacy of ['.claude-plugin', '.opencode', 'agents', 'commands', 'hooks']) {
      assert.ok(!fs.existsSync(path.join(root, legacy)), `${legacy} still exists`);
    }
  })) passed++; else failed++;

  console.log('\nSummary:');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
