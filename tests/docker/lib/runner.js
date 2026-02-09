/**
 * Test runner framework for Docker integration tests.
 * Follows the same pattern as tests/lib/utils.test.js.
 *
 * Usage:
 *   const { createSuite, test, run } = require('./runner');
 *   const suite = createSuite('My Suite');
 *   suite.test('should work', () => { assert.ok(true); });
 *   suite.run();
 */

'use strict';

function createSuite(name) {
  const tests = [];
  let passed = 0;
  let failed = 0;
  const errors = [];

  function addTest(testName, fn) {
    tests.push({ name: testName, fn });
  }

  function run() {
    console.log(`\n=== ${name} ===\n`);

    for (const t of tests) {
      try {
        t.fn();
        console.log(`  \u2713 ${t.name}`);
        passed++;
      } catch (err) {
        console.log(`  \u2717 ${t.name}`);
        console.log(`    Error: ${err.message}`);
        failed++;
        errors.push({ name: t.name, error: err.message });
      }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total:  ${passed + failed}\n`);

    return { passed, failed, errors, total: passed + failed };
  }

  return { test: addTest, run };
}

/**
 * Run a suite and exit with appropriate code.
 */
function runAndExit(suite) {
  const result = suite.run();
  process.exit(result.failed > 0 ? 1 : 0);
}

module.exports = { createSuite, runAndExit };
