'use strict';

const path = require('path');
const { createSuite, runAndExit } = require('../../lib/runner');
const {
  codexExec,
  withRetry,
  prepareFixtureWorkspace,
  TIMEOUT,
  OUTPUT_SCHEMA_PATH,
} = require('../../lib/codex-helper');
const { assertScenario } = require('../../lib/assertions');
const { getScenarioConfig } = require('./scenario-config');

const LOCAL_SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'skill-analysis.schema.json');

function buildScenarioPrompt(scenario) {
  const baseLines = [
    `Layer3 integration scenario ${scenario.id}: ${scenario.title}.`,
    `Use and explicitly reference all required skills: ${scenario.anchorSkills.join(', ')}.`,
    `Optional skills (use when relevant): ${scenario.optionalSkills.join(', ')}.`,
    `The analysis_type must align to: ${scenario.analysisType}.`,
    'Produce concrete findings and practical remediation steps.',
    `In actions_taken, include concrete action phrases and include at least one of: ${scenario.expectedActions.join(' | ')}.`,
  ];

  if (scenario.hasFixture) {
    baseLines.push(
      `This scenario runs on a local fixture (${scenario.fixture}) in the current working directory.`,
      `Inspect project files and execute relevant commands so trace events include domain hints like: ${scenario.domainKeywords.join(', ')}.`
    );
  } else {
    baseLines.push('This scenario does not require a local fixture workspace.');
  }

  return baseLines.join('\n');
}

function resolveRetryBudgetMs(mode, scenarioTimeoutMs) {
  if (mode === 'smoke') {
    return scenarioTimeoutMs * 3;
  }
  return scenarioTimeoutMs * 6;
}

function executeScenario(scenario, options = {}) {
  const mode = options.mode === 'smoke' ? 'smoke' : 'full';
  const scenarioTimeoutMs = options.timeoutMs || TIMEOUT;
  const deadlineMs = Date.now() + resolveRetryBudgetMs(mode, scenarioTimeoutMs);
  const cwd = scenario.hasFixture
    ? prepareFixtureWorkspace(scenario.fixture)
    : (options.cwd || process.cwd());

  const prompt = buildScenarioPrompt(scenario);
  const result = withRetry(
    () => codexExec(prompt, {
      cwd,
      timeout: scenarioTimeoutMs,
      scenarioId: scenario.key,
      outputSchema: OUTPUT_SCHEMA_PATH,
    }),
    {
      mode,
      scenarioTimeoutMs,
      getRemainingTimeMs: () => deadlineMs - Date.now(),
    }
  );

  return assertScenario({
    scenarioName: `${scenario.id}-${scenario.title}`,
    result,
    schemaPath: LOCAL_SCHEMA_PATH,
    expectedAnalysisType: scenario.analysisType,
    anchorSkills: scenario.anchorSkills,
    optionalSkills: scenario.optionalSkills,
    expectedActions: scenario.expectedActions,
    hasFixture: scenario.hasFixture,
    domainKeywords: scenario.domainKeywords,
  });
}

function runScenarioByKey(scenarioKey, mode) {
  const scenario = getScenarioConfig(scenarioKey);
  const suite = createSuite(`Scenario ${scenario.id}: ${scenario.title} (${mode})`);

  suite.test('contract assertions', () => {
    executeScenario(scenario, { mode });
  });

  runAndExit(suite);
}

module.exports = {
  LOCAL_SCHEMA_PATH,
  buildScenarioPrompt,
  executeScenario,
  runScenarioByKey,
};
