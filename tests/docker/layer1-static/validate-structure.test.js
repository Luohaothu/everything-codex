/**
 * Layer 1: Validate overall project structure
 *
 * Checks:
 * - Required files (AGENTS.md, config.toml, README.md)
 * - Required directories (skills, rules, workflows, prompts, golang, python, typescript, scripts/ci)
 * - Forbidden paths do not exist
 */

'use strict';

const path = require('path');
const { createSuite, runAndExit } = require('../lib/runner');
const { fileExists, fileNotExists, dirExists } = require('../lib/assertions');

const WORKSPACE = process.env.WORKSPACE || '/workspace';

const suite = createSuite('Validate Structure');

// Required files
const requiredFiles = ['AGENTS.md', 'config.toml', 'README.md'];

for (const f of requiredFiles) {
  suite.test(`required file: ${f}`, () => {
    fileExists(path.join(WORKSPACE, f));
  });
}

// Required directories
const requiredDirs = [
  'skills',
  'rules',
  'workflows',
  'prompts',
  'golang',
  'python',
  'typescript',
  'scripts/ci',
];

for (const d of requiredDirs) {
  suite.test(`required directory: ${d}/`, () => {
    dirExists(path.join(WORKSPACE, d));
  });
}

// Forbidden paths
const forbiddenPaths = [
  '.claude-plugin',
  '.opencode',
  'hooks/hooks.json',
  'contexts',
  'agents',
  'commands',
];

for (const f of forbiddenPaths) {
  suite.test(`forbidden path absent: ${f}`, () => {
    fileNotExists(path.join(WORKSPACE, f));
  });
}

runAndExit(suite);
