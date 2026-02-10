/**
 * Baseline discovery helpers for Docker tests.
 * Computes dynamic file-count baselines from a workspace root.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function validateWorkspaceRoot(workspaceRoot) {
  if (typeof workspaceRoot !== 'string' || workspaceRoot.trim() === '') {
    throw new TypeError('workspaceRoot must be a non-empty string');
  }

  const resolved = path.resolve(workspaceRoot);
  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch (error) {
    throw new Error(`Workspace path is not accessible: ${resolved} (${error.message})`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`workspaceRoot must be a directory: ${resolved}`);
  }

  return resolved;
}

function countTopLevelFiles(workspaceRoot, relativeDir, extension) {
  if (typeof relativeDir !== 'string' || relativeDir.trim() === '') {
    throw new TypeError('relativeDir must be a non-empty string');
  }
  if (typeof extension !== 'string' || extension.trim() === '') {
    throw new TypeError('extension must be a non-empty string');
  }

  const dirPath = path.join(workspaceRoot, relativeDir);
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Failed to read directory ${dirPath}: ${error.message}`);
  }

  return entries.reduce((count, entry) => {
    if (!entry.isFile()) {
      return count;
    }
    return entry.name.endsWith(extension) ? count + 1 : count;
  }, 0);
}

function countTopLevelDirectories(workspaceRoot, relativeDir) {
  if (typeof relativeDir !== 'string' || relativeDir.trim() === '') {
    throw new TypeError('relativeDir must be a non-empty string');
  }

  const dirPath = path.join(workspaceRoot, relativeDir);
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Failed to read directory ${dirPath}: ${error.message}`);
  }

  return entries.filter(entry => entry.isDirectory()).length;
}

function discoverBaseline(workspaceRoot) {
  const resolvedRoot = validateWorkspaceRoot(workspaceRoot);

  try {
    const counts = {
      skills: countTopLevelDirectories(resolvedRoot, 'skills'),
      workflows: countTopLevelFiles(resolvedRoot, 'workflows', '.md'),
      prompts: countTopLevelFiles(resolvedRoot, 'prompts', '.md'),
      rules: countTopLevelFiles(resolvedRoot, 'rules', '.rules'),
    };

    return Object.freeze({
      workspace: resolvedRoot,
      generated_at: new Date().toISOString(),
      counts: Object.freeze({ ...counts }),
    });
  } catch (error) {
    throw new Error(`Failed to discover baseline for ${resolvedRoot}: ${error.message}`);
  }
}

module.exports = {
  validateWorkspaceRoot,
  countTopLevelFiles,
  countTopLevelDirectories,
  discoverBaseline,
};
