const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

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

function runValidator(script) {
  const root = path.join(__dirname, '../..');
  const result = spawnSync('node', [path.join(root, 'scripts/ci', script)], {
    cwd: root,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(`${script} failed:\n${result.stderr || result.stdout}`);
  }
}

function run() {
  console.log('\n=== Validator Tests ===\n');

  let passed = 0;
  let failed = 0;

  if (test('validate-agents.js passes', () => runValidator('validate-agents.js'))) passed++; else failed++;
  if (test('validate-hooks.js passes', () => runValidator('validate-hooks.js'))) passed++; else failed++;
  if (test('validate-commands.js passes', () => runValidator('validate-commands.js'))) passed++; else failed++;
  if (test('validate-skills.js passes', () => runValidator('validate-skills.js'))) passed++; else failed++;
  if (test('validate-rules.js passes', () => runValidator('validate-rules.js'))) passed++; else failed++;

  assert.ok(passed >= 5);
  process.exit(failed > 0 ? 1 : 0);
}

run();
