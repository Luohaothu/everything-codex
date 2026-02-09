/**
 * Layer 1: Execute Layer 3 contract-check in static coverage.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');
const { createSuite, runAndExit } = require('../lib/runner');

const WORKSPACE = process.env.WORKSPACE
  || (fs.existsSync('/workspace/tests/docker')
    ? '/workspace'
    : path.resolve(__dirname, '../../..'));
const CONTRACT_CHECK_PATH = path.join(
  WORKSPACE,
  'tests',
  'docker',
  'layer3-integration',
  'lib',
  'contract-check.test.js'
);

const suite = createSuite('Contract Check Wrapper');

suite.test('layer3 contract-check passes', () => {
  const result = spawnSync('node', [CONTRACT_CHECK_PATH], {
    cwd: WORKSPACE,
    encoding: 'utf-8',
    env: { ...process.env },
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  assert.strictEqual(
    result.status,
    0,
    `contract-check failed (status=${result.status})\nstdout:\n${stdout}\nstderr:\n${stderr}`
  );
  assert.ok(stdout.includes('contract-check: PASS'), 'contract-check did not emit PASS marker');
});

runAndExit(suite);
