'use strict';

function freezeList(values) {
  return Object.freeze([...(values || [])]);
}

function createScenario(definition) {
  return Object.freeze({
    ...definition,
    anchorSkills: freezeList(definition.anchorSkills),
    optionalSkills: freezeList(definition.optionalSkills),
    expectedActions: freezeList(definition.expectedActions),
    domainKeywords: freezeList(definition.domainKeywords),
  });
}

const SCENARIOS = Object.freeze({
  'scenario-01-go': createScenario({
    id: '01',
    key: 'scenario-01-go',
    title: 'Go',
    analysisType: 'code_review',
    hasFixture: true,
    fixture: 'go-project',
    anchorSkills: ['plan', 'golang-patterns', 'code-review'],
    optionalSkills: ['golang-testing', 'golang-rules', 'go-test', 'go-review', 'go-build-fix', 'tdd', 'build-fix', 'verify'],
    expectedActions: ['ran go test', 'identified error handling', 'reviewed code'],
    domainKeywords: ['go', '.go', 'go test', 'go build'],
    smoke: true,
  }),
  'scenario-02-python': createScenario({
    id: '02',
    key: 'scenario-02-python',
    title: 'Python',
    analysisType: 'security',
    hasFixture: true,
    fixture: 'python-project',
    anchorSkills: ['python-patterns', 'django-security'],
    optionalSkills: ['python-testing', 'python-rules', 'python-review', 'django-patterns', 'django-tdd', 'django-verification'],
    expectedActions: ['identified sql injection', 'password security', 'reviewed python'],
    domainKeywords: ['python', '.py', 'django', 'sql'],
    smoke: false,
  }),
  'scenario-03-typescript': createScenario({
    id: '03',
    key: 'scenario-03-typescript',
    title: 'TypeScript',
    analysisType: 'code_review',
    hasFixture: true,
    fixture: 'ts-project',
    anchorSkills: ['coding-standards', 'frontend-patterns'],
    optionalSkills: ['typescript-rules', 'backend-patterns', 'e2e', 'test-coverage'],
    expectedActions: ['typescript analysis', 'test coverage', 'frontend patterns'],
    domainKeywords: ['typescript', '.ts', '.tsx', 'npm', 'jest'],
    smoke: false,
  }),
  'scenario-04-springboot': createScenario({
    id: '04',
    key: 'scenario-04-springboot',
    title: 'SpringBoot',
    analysisType: 'security',
    hasFixture: true,
    fixture: 'java-project',
    anchorSkills: ['springboot-patterns', 'springboot-security'],
    optionalSkills: ['springboot-tdd', 'springboot-verification', 'java-coding-standards', 'jpa-patterns'],
    expectedActions: ['spring security', 'jpa entity', 'java review'],
    domainKeywords: ['java', '.java', 'spring', 'maven', 'gradle'],
    smoke: false,
  }),
  'scenario-05-database': createScenario({
    id: '05',
    key: 'scenario-05-database',
    title: 'Database',
    analysisType: 'architecture',
    hasFixture: false,
    fixture: null,
    anchorSkills: ['postgres-patterns', 'architect'],
    optionalSkills: ['clickhouse-io', 'database-review', 'iterative-retrieval'],
    expectedActions: ['schema analysis', 'index recommendation', 'architecture review'],
    domainKeywords: [],
    smoke: true,
  }),
  'scenario-06-security': createScenario({
    id: '06',
    key: 'scenario-06-security',
    title: 'Security',
    analysisType: 'security',
    hasFixture: false,
    fixture: null,
    anchorSkills: ['security-review'],
    optionalSkills: ['refactor-clean', 'eval', 'pm2'],
    expectedActions: ['hardcoded secret', 'dead code', 'security'],
    domainKeywords: [],
    smoke: false,
  }),
  'scenario-07-multi': createScenario({
    id: '07',
    key: 'scenario-07-multi',
    title: 'Multi',
    analysisType: 'orchestration',
    hasFixture: false,
    fixture: null,
    anchorSkills: ['orchestrate', 'multi-plan'],
    optionalSkills: ['multi-execute', 'multi-workflow', 'multi-backend', 'multi-frontend'],
    expectedActions: ['orchestration', 'backend plan', 'frontend plan'],
    domainKeywords: [],
    smoke: false,
  }),
  'scenario-08-learning': createScenario({
    id: '08',
    key: 'scenario-08-learning',
    title: 'Learning',
    analysisType: 'learning',
    hasFixture: false,
    fixture: null,
    anchorSkills: ['continuous-learning', 'skill-create'],
    optionalSkills: ['learn', 'instinct-status', 'instinct-import', 'instinct-export', 'evolve', 'continuous-learning-v2'],
    expectedActions: ['pattern extraction', 'instinct lifecycle', 'skill generation'],
    domainKeywords: [],
    smoke: false,
  }),
  'scenario-09-session': createScenario({
    id: '09',
    key: 'scenario-09-session',
    title: 'Session',
    analysisType: 'configuration',
    hasFixture: false,
    fixture: null,
    anchorSkills: ['configure-codex', 'sessions'],
    optionalSkills: ['setup-pm', 'strategic-compact', 'checkpoint', 'doc-updater', 'project-guidelines-example'],
    expectedActions: ['configuration steps', 'session management', 'documentation'],
    domainKeywords: [],
    smoke: true,
  }),
  'scenario-10-document-processing': createScenario({
    id: '10',
    key: 'scenario-10-document-processing',
    title: 'DocumentProcessing',
    analysisType: 'planning',
    hasFixture: false,
    fixture: null,
    anchorSkills: ['plan', 'document-processing'],
    optionalSkills: ['iterative-retrieval', 'security-review', 'architect'],
    // Keep action tokens short so substring matching is robust to filler words.
    expectedActions: ['extraction schema', 'processing pipeline', 'edge cases'],
    domainKeywords: [],
    smoke: true,
  }),
});

function getScenarioConfig(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) {
    const supported = Object.keys(SCENARIOS).sort().join(', ');
    throw new Error(`Unknown scenario key: ${scenarioKey}. Supported: ${supported}`);
  }
  return scenario;
}

function getScenariosByMode(mode) {
  const all = Object.values(SCENARIOS);
  if (mode === 'smoke') {
    return all.filter(scenario => scenario.smoke);
  }
  return all;
}

module.exports = {
  SCENARIOS,
  getScenarioConfig,
  getScenariosByMode,
};
