'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { withRetry } = require('../../lib/codex-helper');
const { assertScenario, extractTraceEvidence } = require('../../lib/assertions');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
}

function runAssertScenarioContract() {
  const tempRoot = makeTempDir('layer3-contract-');
  const outputFile = path.join(tempRoot, 'out.json');
  const schemaPath = path.join(__dirname, '..', 'schemas', 'skill-analysis.schema.json');

  writeJson(outputFile, {
    skills_referenced: ['plan', 'golang-patterns', 'code-review', 'go-review'],
    analysis_type: 'code_review',
    findings: [
      {
        category: 'error-handling',
        description: 'identified error handling gaps in Add()',
        severity: 'medium',
      },
    ],
    actions_taken: ['ran go test', 'reviewed code'],
  });

  const result = {
    exitCode: 0,
    stderr: '',
    outputFile,
    events: [
      { type: 'tool_call', tool_name: 'command_execution', command: 'go test ./...' },
      { type: 'tool_result', tool_name: 'file_read', path: 'main.go' },
      { type: 'item.completed' },
    ],
  };

  const summary = assertScenario({
    scenarioName: 'contract-go',
    result,
    schemaPath,
    hasFixture: true,
    domainKeywords: ['go', '.go', 'go test'],
    anchorSkills: ['plan', 'golang-patterns', 'code-review'],
    optionalSkills: ['go-review', 'go-build-fix'],
    expectedActions: ['ran go test', 'identified error handling', 'reviewed code'],
  });

  assert.ok(summary.traceEvidence.totalActivities >= 2);
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function runTraceExtractionContract() {
  const evidence = extractTraceEvidence([
    { type: 'tool_call', tool_name: 'command_execution', command: 'npm test' },
    { type: 'tool_result', tool_name: 'file_read', path: 'src/app.ts' },
    { type: 'tool_result', tool_name: 'file_write', path: 'src/app.test.ts' },
  ]);

  assert.ok(evidence.totalActivities >= 3);
  assert.ok(evidence.byCategory.command_execution.length >= 1);
  assert.ok(evidence.byCategory.file_read.length >= 1);
  assert.ok(evidence.byCategory.file_write.length >= 1);
}

function runRetryContracts() {
  let smokeAttempts = 0;
  try {
    withRetry(
      () => {
        smokeAttempts += 1;
        throw new Error('429 too many requests');
      },
      {
        mode: 'smoke',
        scenarioTimeoutMs: 100,
        delaysMs: [0],
        getRemainingTimeMs: () => 10_000,
      }
    );
  } catch {
    // expected
  }
  assert.strictEqual(smokeAttempts, 2, 'smoke should perform 1 retry (2 attempts total)');

  let fullAttempts = 0;
  try {
    withRetry(
      () => {
        fullAttempts += 1;
        throw new Error('429 rate limit');
      },
      {
        mode: 'full',
        scenarioTimeoutMs: 100,
        delaysMs: [0, 0, 0],
        getRemainingTimeMs: () => 10_000,
      }
    );
  } catch {
    // expected
  }
  assert.strictEqual(fullAttempts, 4, 'full should perform 3 retries (4 attempts total)');

  let blockedRetryAttempts = 0;
  try {
    withRetry(
      () => {
        blockedRetryAttempts += 1;
        throw new Error('429 too many requests');
      },
      {
        mode: 'smoke',
        scenarioTimeoutMs: 100,
        delaysMs: [0],
        getRemainingTimeMs: () => 150,
      }
    );
  } catch {
    // expected
  }
  assert.strictEqual(blockedRetryAttempts, 1, 'insufficient remaining time should block retries');

  let transientAttempts = 0;
  const recoveredResult = withRetry(
    () => {
      transientAttempts += 1;
      if (transientAttempts === 1) {
        return {
          exitCode: 1,
          output: '',
          stderr: '',
          lines: [],
          events: [],
        };
      }

      return {
        exitCode: 0,
        output: '{"type":"item.completed"}',
        stderr: '',
        lines: [{ type: 'item.completed' }],
        events: [{ type: 'item.completed' }],
      };
    },
    {
      mode: 'smoke',
      scenarioTimeoutMs: 100,
      delaysMs: [0],
      getRemainingTimeMs: () => 10_000,
    }
  );
  assert.strictEqual(
    transientAttempts,
    2,
    'empty-diagnostic non-zero result should be retried once in smoke mode'
  );
  assert.strictEqual(recoveredResult.exitCode, 0, 'retry should return the recovered successful result');

  let deterministicAttempts = 0;
  const deterministicFailureResult = withRetry(
    () => {
      deterministicAttempts += 1;
      return {
        exitCode: 1,
        output: '',
        stderr: 'failed to parse schema',
        lines: [],
        events: [],
      };
    },
    {
      mode: 'smoke',
      scenarioTimeoutMs: 100,
      delaysMs: [0],
      getRemainingTimeMs: () => 10_000,
    }
  );
  assert.strictEqual(
    deterministicAttempts,
    1,
    'non-zero result with diagnostics should not be retried as transient'
  );
  assert.strictEqual(
    deterministicFailureResult.exitCode,
    1,
    'deterministic failure should be returned without retry'
  );

  let insufficientQuotaErrorAttempts = 0;
  try {
    withRetry(
      () => {
        insufficientQuotaErrorAttempts += 1;
        throw new Error('HTTP 429 insufficient_quota: You exceeded your current quota');
      },
      {
        mode: 'full',
        scenarioTimeoutMs: 100,
        delaysMs: [0, 0, 0],
        getRemainingTimeMs: () => 10_000,
      }
    );
  } catch {
    // expected
  }
  assert.strictEqual(
    insufficientQuotaErrorAttempts,
    1,
    'insufficient_quota error should not be retried even when 429 appears'
  );

  let insufficientQuotaResultAttempts = 0;
  const insufficientQuotaResult = withRetry(
    () => {
      insufficientQuotaResultAttempts += 1;
      return {
        exitCode: 1,
        output: '',
        stderr: 'error.code=insufficient_quota (HTTP 429)',
        lines: [],
        events: [],
      };
    },
    {
      mode: 'full',
      scenarioTimeoutMs: 100,
      delaysMs: [0, 0, 0],
      getRemainingTimeMs: () => 10_000,
    }
  );
  assert.strictEqual(
    insufficientQuotaResultAttempts,
    1,
    'insufficient_quota result should not be retried'
  );
  assert.strictEqual(
    insufficientQuotaResult.exitCode,
    1,
    'insufficient_quota result should be returned without retry'
  );
}

runAssertScenarioContract();
runTraceExtractionContract();
runRetryContracts();

console.log('contract-check: PASS');
