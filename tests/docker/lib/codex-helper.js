/**
 * Helper for Layer 3 integration tests.
 * Provides codex exec invocation, fixture workspace setup, and retry policies.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_TIMEOUT_SECONDS = 180;
const timeoutSeconds = parseInt(process.env.CODEX_TEST_TIMEOUT || String(DEFAULT_TIMEOUT_SECONDS), 10);

const TIMEOUT = Number.isFinite(timeoutSeconds) && timeoutSeconds > 0
  ? timeoutSeconds * 1000
  : DEFAULT_TIMEOUT_SECONDS * 1000;

const MODEL = process.env.CODEX_TEST_MODEL || 'gpt-5.3-codex';
const REASONING_EFFORT = (process.env.CODEX_TEST_REASONING_EFFORT || '').trim();
const OUTPUT_SCHEMA_PATH = '/workspace/tests/docker/layer3-integration/schemas/skill-analysis.schema.json';
const OUTPUT_SCHEMA_RELATIVE_PATH = path.join(
  'tests',
  'docker',
  'layer3-integration',
  'schemas',
  'skill-analysis.schema.json'
);
const WORKSPACE_MIRROR_ROOT = '/tmp/test-workspace';
const SAFE_WORKSPACE_PREFIX = path.resolve(WORKSPACE_MIRROR_ROOT);
const OUTPUT_DIR = path.join(WORKSPACE_MIRROR_ROOT, '.codex-outputs');
let hasWarnedMissingOutputSchema = false;

const RETRY_DELAYS_MS = Object.freeze({
  smoke: Object.freeze([15_000]),
  full: Object.freeze([15_000, 30_000, 60_000]),
});

const RETRY_COUNTS = Object.freeze({
  smoke: 1,
  full: 3,
});

function parseJsonLines(content) {
  return String(content || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function safeToString(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeKey(value) {
  return safeToString(value).toLowerCase().replace(/^\/+/, '').trim();
}

function asLowerCorpus(resultOrError) {
  if (!resultOrError) {
    return '';
  }

  const parts = [
    resultOrError.message,
    resultOrError.stderr,
    resultOrError.stdout,
    resultOrError.output,
    safeToString(resultOrError.lines),
    safeToString(resultOrError.events),
  ];
  return parts.filter(Boolean).join('\n').toLowerCase();
}

function isDeterministicQuotaSignal(corpus) {
  return /insufficient[_\s-]?quota|billing[_\s-]?hard[_\s-]?limit(?:_reached)?|exceeded your current quota|quota has been exceeded|quota exceeded/.test(corpus);
}

function isRateLimitSignal(resultOrError) {
  const corpus = asLowerCorpus(resultOrError);
  if (!corpus || isDeterministicQuotaSignal(corpus)) {
    return false;
  }

  return /(^|\W)429(\W|$)|rate.limit|rate_limit|rate limit|too many requests/.test(corpus);
}

function isEmptyDiagnosticFailureSignal(result) {
  if (!result || typeof result !== 'object' || result.exitCode === 0) {
    return false;
  }

  const hasOutput = safeToString(result.output).trim().length > 0 || safeToString(result.stdout).trim().length > 0;
  const hasStderr = safeToString(result.stderr).trim().length > 0;
  const hasMessage = safeToString(result.message).trim().length > 0;
  const hasLines = Array.isArray(result.lines) && result.lines.length > 0;
  const hasEvents = Array.isArray(result.events) && result.events.length > 0;

  return !(hasOutput || hasStderr || hasMessage || hasLines || hasEvents);
}

function sleepMs(delayMs) {
  if (!Number.isFinite(delayMs) || delayMs <= 0) {
    return;
  }

  execFileSync('sleep', [String(delayMs / 1000)]);
}

function resolveWorkspaceRoot() {
  if (process.env.CODEX_TEST_WORKSPACE_ROOT) {
    return process.env.CODEX_TEST_WORKSPACE_ROOT;
  }

  if (fs.existsSync('/workspace/tests/docker')) {
    return '/workspace';
  }

  return path.resolve(__dirname, '../../..');
}

function isPathWithinPrefix(prefixPath, targetPath) {
  const relative = path.relative(prefixPath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveSafeWorkspacePath(workspacePath) {
  const rawWorkspacePath = safeToString(workspacePath).trim();

  if (!rawWorkspacePath || rawWorkspacePath === '.' || rawWorkspacePath === path.sep) {
    throw new Error(`Unsafe workspacePath: "${rawWorkspacePath || '<empty>'}"`);
  }

  const resolvedWorkspacePath = path.resolve(rawWorkspacePath);

  if (resolvedWorkspacePath === path.parse(resolvedWorkspacePath).root) {
    throw new Error(`Unsafe workspacePath: "${rawWorkspacePath}"`);
  }

  if (!isPathWithinPrefix(SAFE_WORKSPACE_PREFIX, resolvedWorkspacePath)) {
    throw new Error(`workspacePath must be "${SAFE_WORKSPACE_PREFIX}" or its subdirectory: ${rawWorkspacePath}`);
  }

  return resolvedWorkspacePath;
}

function resolveOutputSchemaPath(schemaPath, cwd) {
  const rawSchemaPath = safeToString(schemaPath).trim();

  if (!rawSchemaPath) {
    return '';
  }

  const schemaPathForFsCheck = path.isAbsolute(rawSchemaPath)
    ? rawSchemaPath
    : path.resolve(cwd, rawSchemaPath);

  const schemaCandidates = [{ argPath: rawSchemaPath, fsPath: schemaPathForFsCheck }];
  const usesWorkspaceSchemaPath = path.normalize(schemaPathForFsCheck) === path.normalize(OUTPUT_SCHEMA_PATH);

  if (usesWorkspaceSchemaPath) {
    const fallbackSchemaPath = path.join(resolveWorkspaceRoot(), OUTPUT_SCHEMA_RELATIVE_PATH);
    if (path.normalize(fallbackSchemaPath) !== path.normalize(schemaPathForFsCheck)) {
      schemaCandidates.push({ argPath: fallbackSchemaPath, fsPath: fallbackSchemaPath });
    }
  }

  for (const candidate of schemaCandidates) {
    if (fs.existsSync(candidate.fsPath)) {
      return candidate.argPath;
    }
  }

  if (!hasWarnedMissingOutputSchema) {
    hasWarnedMissingOutputSchema = true;
    console.warn(
      `[codex-helper] Output schema not found, skipping --output-schema: ${schemaCandidates
        .map(candidate => candidate.fsPath)
        .join(' | ')}`
    );
  }

  return '';
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  entries.forEach(entry => {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      return;
    }

    if (entry.isSymbolicLink()) {
      const realPath = fs.realpathSync(sourcePath);
      const stat = fs.statSync(realPath);
      if (stat.isDirectory()) {
        copyDirectory(realPath, targetPath);
      } else {
        fs.copyFileSync(realPath, targetPath);
      }
      return;
    }

    fs.copyFileSync(sourcePath, targetPath);
  });
}

/**
 * Mirror a readonly fixture into /tmp/test-workspace and return writable path.
 */
function prepareFixtureWorkspace(fixtureName, opts = {}) {
  const workspaceRoot = resolveWorkspaceRoot();
  const fixturePath = path.join(workspaceRoot, 'tests', 'docker', 'fixtures', fixtureName);
  const workspacePath = resolveSafeWorkspacePath(opts.workspacePath || WORKSPACE_MIRROR_ROOT);

  if (!fixtureName) {
    throw new Error('fixtureName is required when preparing fixture workspace');
  }

  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture does not exist: ${fixturePath}`);
  }

  fs.rmSync(workspacePath, { recursive: true, force: true });
  fs.mkdirSync(workspacePath, { recursive: true });
  copyDirectory(fixturePath, workspacePath);

  return workspacePath;
}

function createOutputFilePath(scenarioId) {
  const id = (scenarioId || 'layer3').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const timestamp = Date.now();
  const filename = `${id}-${timestamp}-${process.pid}.json`;
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return path.join(OUTPUT_DIR, filename);
}

/**
 * Invoke codex with explicit Layer3 contract flags.
 * @param {string} prompt - Prompt for codex
 * @param {object} opts - Execution options
 * @returns {{
 *   exitCode: number,
 *   output: string,
 *   stderr: string,
 *   lines: object[],
 *   events: object[],
 *   outputFile: string
 * }}
 */
function codexExec(prompt, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const timeout = opts.timeout || TIMEOUT;
  const outputFile = opts.outputFile || createOutputFilePath(opts.scenarioId);
  const outputSchema = resolveOutputSchemaPath(
    Object.prototype.hasOwnProperty.call(opts, 'outputSchema') ? opts.outputSchema : OUTPUT_SCHEMA_PATH,
    cwd
  );
  const outputSchemaArgs = outputSchema ? ['--output-schema', outputSchema] : [];
  const reasoningEffortArgs = REASONING_EFFORT
    ? ['-c', `model_reasoning_effort="${REASONING_EFFORT}"`]
    : [];

  const args = [
    'exec',
    '-s', 'workspace-write',
    '-c', 'approval_policy="never"',
    ...reasoningEffortArgs,
    '-m', MODEL,
    '--skip-git-repo-check',
    '--json',
    '-o', outputFile,
    ...outputSchemaArgs,
    prompt,
  ];

  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    stdout = execFileSync('codex', args, {
      cwd,
      timeout,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });
  } catch (error) {
    exitCode = error.status || 1;
    stdout = safeToString(error.stdout);
    stderr = safeToString(error.stderr);
  }

  const events = parseJsonLines(stdout);

  return {
    exitCode,
    output: stdout,
    stderr,
    lines: events,
    events,
    outputFile,
    cwd,
  };
}

/**
 * Check if a codex exec result contains an error event.
 */
function hasError(result) {
  return (result.lines || []).some(line => line.type === 'error' || line.error);
}

/**
 * Check if output contains any of the given keywords (case-insensitive).
 */
function outputContainsAny(result, keywords) {
  if (!Array.isArray(keywords)) {
    return false;
  }

  const text = [result.output, result.stderr].filter(Boolean).join('\n').toLowerCase();
  return keywords.some(keyword => text.includes(String(keyword).toLowerCase()));
}

/**
 * Check if output contains all of the given keywords (case-insensitive).
 */
function outputContainsAll(result, keywords) {
  if (!Array.isArray(keywords)) {
    return false;
  }

  const text = [result.output, result.stderr].filter(Boolean).join('\n').toLowerCase();
  return keywords.every(keyword => text.includes(String(keyword).toLowerCase()));
}

function resolveMode(options) {
  if (options.mode === 'smoke' || options.mode === 'full') {
    return options.mode;
  }

  return 'full';
}

function remainingTimeMs(options, startTimeMs) {
  if (typeof options.getRemainingTimeMs === 'function') {
    return options.getRemainingTimeMs();
  }

  if (Number.isFinite(options.totalTimeoutMs)) {
    return options.totalTimeoutMs - (Date.now() - startTimeMs);
  }

  return Number.POSITIVE_INFINITY;
}

/**
 * Retry helper for transient responses.
 * smoke: max 1 retry (15s)
 * full: max 3 retries (15s/30s/60s)
 * Retry only when remaining time >= 2 * scenario timeout.
 * Result retries are limited to clear transient signals:
 * - rate-limit signals (excluding deterministic quota errors)
 * - empty-diagnostic non-zero failures
 */
function withRetry(fn, options = {}) {
  if (typeof options === 'number') {
    const retries = options;
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return fn(attempt);
      } catch (error) {
        lastError = error;
        if (attempt < retries && isRateLimitSignal(error)) {
          const delayMs = RETRY_DELAYS_MS.full[attempt] || RETRY_DELAYS_MS.full[RETRY_DELAYS_MS.full.length - 1];
          console.log(`    Rate limited, retrying in ${delayMs / 1000}s...`);
          sleepMs(delayMs);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  const mode = resolveMode(options);
  const maxRetries = Number.isInteger(options.maxRetries) ? options.maxRetries : RETRY_COUNTS[mode];
  const delays = Array.isArray(options.delaysMs) && options.delaysMs.length > 0
    ? options.delaysMs
    : RETRY_DELAYS_MS[mode];
  const scenarioTimeoutMs = options.scenarioTimeoutMs || TIMEOUT;
  const startedAt = Date.now();

  let attempt = 0;
  let lastError = null;
  while (attempt <= maxRetries) {
    try {
      const result = fn(attempt);

      const shouldRetryRateLimit = result && result.exitCode !== 0 && isRateLimitSignal(result);
      const shouldRetryEmptyDiagnostic = result && isEmptyDiagnosticFailureSignal(result);
      if ((shouldRetryRateLimit || shouldRetryEmptyDiagnostic) && attempt < maxRetries) {
        const timeLeft = remainingTimeMs(options, startedAt);
        if (timeLeft < (scenarioTimeoutMs * 2)) {
          return result;
        }

        const delayMs = delays[attempt] || delays[delays.length - 1];
        if (shouldRetryRateLimit) {
          console.log(`    Rate limited (exit=${result.exitCode}), retrying in ${delayMs / 1000}s...`);
        } else {
          console.log(`    Transient empty failure (exit=${result.exitCode}), retrying in ${delayMs / 1000}s...`);
        }
        sleepMs(delayMs);
        attempt += 1;
        continue;
      }

      return result;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < maxRetries && isRateLimitSignal(error);
      if (!canRetry) {
        throw error;
      }

      const timeLeft = remainingTimeMs(options, startedAt);
      if (timeLeft < (scenarioTimeoutMs * 2)) {
        throw error;
      }

      const delayMs = delays[attempt] || delays[delays.length - 1];
      console.log(`    Rate limited, retrying in ${delayMs / 1000}s...`);
      sleepMs(delayMs);
      attempt += 1;
    }
  }

  throw lastError || new Error('withRetry exhausted without result');
}

module.exports = {
  codexExec,
  hasError,
  outputContainsAny,
  outputContainsAll,
  withRetry,
  parseJsonLines,
  prepareFixtureWorkspace,
  createOutputFilePath,
  resolveWorkspaceRoot,
  normalizeKey,
  TIMEOUT,
  MODEL,
  OUTPUT_SCHEMA_PATH,
  WORKSPACE_MIRROR_ROOT,
};
