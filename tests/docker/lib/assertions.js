/**
 * Assertion helpers for Docker integration tests.
 * Wraps Node's assert with domain-specific helpers.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

/**
 * Assert that a file exists.
 */
function fileExists(filePath, msg) {
  assert.ok(
    fs.existsSync(filePath),
    msg || `Expected file to exist: ${filePath}`
  );
}

/**
 * Assert that a file does NOT exist.
 */
function fileNotExists(filePath, msg) {
  assert.ok(
    !fs.existsSync(filePath),
    msg || `Expected file NOT to exist: ${filePath}`
  );
}

/**
 * Assert that a directory exists.
 */
function dirExists(dirPath, msg) {
  assert.ok(
    fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
    msg || `Expected directory to exist: ${dirPath}`
  );
}

/**
 * Assert file content contains a string/regex.
 */
function fileContains(filePath, pattern, msg) {
  fileExists(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  if (typeof pattern === 'string') {
    assert.ok(
      content.includes(pattern),
      msg || `Expected ${filePath} to contain "${pattern}"`
    );
  } else {
    assert.ok(
      pattern.test(content),
      msg || `Expected ${filePath} to match ${pattern}`
    );
  }
}

/**
 * Assert file content does NOT contain a string/regex.
 */
function fileNotContains(filePath, pattern, msg) {
  fileExists(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  if (typeof pattern === 'string') {
    assert.ok(
      !content.includes(pattern),
      msg || `Expected ${filePath} NOT to contain "${pattern}"`
    );
  } else {
    assert.ok(
      !pattern.test(content),
      msg || `Expected ${filePath} NOT to match ${pattern}`
    );
  }
}

/**
 * Assert file is non-empty (> minBytes).
 */
function fileNonEmpty(filePath, minBytes) {
  fileExists(filePath);
  const stat = fs.statSync(filePath);
  const min = minBytes || 1;
  assert.ok(
    stat.size >= min,
    `Expected ${filePath} to be >= ${min} bytes, got ${stat.size}`
  );
}

/**
 * Assert directory has at least N entries.
 */
function dirHasEntries(dirPath, minCount, msg) {
  dirExists(dirPath);
  const entries = fs.readdirSync(dirPath);
  assert.ok(
    entries.length >= minCount,
    msg || `Expected ${dirPath} to have >= ${minCount} entries, got ${entries.length}`
  );
}

/**
 * Assert directory has exactly N subdirectories.
 */
function dirHasSubdirs(dirPath, count, msg) {
  dirExists(dirPath);
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());
  assert.strictEqual(
    dirs.length,
    count,
    msg || `Expected ${dirPath} to have ${count} subdirectories, got ${dirs.length}`
  );
}

/**
 * Count files matching a pattern in a directory.
 */
function countFiles(dirPath, extension) {
  if (!fs.existsSync(dirPath)) return 0;
  const entries = fs.readdirSync(dirPath);
  return entries.filter(e => e.endsWith(extension)).length;
}

/**
 * Parse YAML frontmatter from markdown content.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      fm[key.trim()] = rest.join(':').trim();
    }
  });
  return fm;
}

function safeStringify(value) {
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

function normalizeToken(value) {
  return safeStringify(value).toLowerCase().replace(/^\/+/, '').trim();
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function inferJsonType(value) {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function matchesJsonType(value, expectedType) {
  switch (expectedType) {
    case 'array':
      return Array.isArray(value);
    case 'object':
      return isObject(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'null':
      return value === null;
    case 'string':
    case 'boolean':
      return typeof value === expectedType;
    default:
      return true;
  }
}

function validateAgainstSchema(value, schema, pointer = '$') {
  if (!isObject(schema)) {
    return [];
  }

  const errors = [];
  const schemaType = schema.type;
  if (schemaType !== undefined && !matchesJsonType(value, schemaType)) {
    errors.push(`${pointer}: expected type "${schemaType}", got "${inferJsonType(value)}"`);
    return errors;
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    const allowed = new Set(schema.enum);
    if (!allowed.has(value)) {
      errors.push(`${pointer}: expected one of [${schema.enum.join(', ')}], got "${safeStringify(value)}"`);
    }
  }

  if (typeof schema.minItems === 'number' && Array.isArray(value) && value.length < schema.minItems) {
    errors.push(`${pointer}: expected at least ${schema.minItems} items, got ${value.length}`);
  }

  if (typeof schema.maxItems === 'number' && Array.isArray(value) && value.length > schema.maxItems) {
    errors.push(`${pointer}: expected at most ${schema.maxItems} items, got ${value.length}`);
  }

  if (typeof schema.minLength === 'number' && typeof value === 'string' && value.length < schema.minLength) {
    errors.push(`${pointer}: expected min length ${schema.minLength}, got ${value.length}`);
  }

  if (typeof schema.maxLength === 'number' && typeof value === 'string' && value.length > schema.maxLength) {
    errors.push(`${pointer}: expected max length ${schema.maxLength}, got ${value.length}`);
  }

  if (Array.isArray(schema.required) && isObject(value)) {
    schema.required.forEach(requiredKey => {
      if (!hasOwn(value, requiredKey)) {
        errors.push(`${pointer}: missing required property "${requiredKey}"`);
      }
    });
  }

  if (schema.additionalProperties === false && isObject(value) && isObject(schema.properties)) {
    const allowedKeys = new Set(Object.keys(schema.properties));
    Object.keys(value).forEach(actualKey => {
      if (!allowedKeys.has(actualKey)) {
        errors.push(`${pointer}: unexpected property "${actualKey}"`);
      }
    });
  }

  if (isObject(schema.properties) && isObject(value)) {
    Object.keys(schema.properties).forEach(propertyKey => {
      if (!hasOwn(value, propertyKey)) {
        return;
      }
      const nestedPointer = `${pointer}.${propertyKey}`;
      const nestedErrors = validateAgainstSchema(value[propertyKey], schema.properties[propertyKey], nestedPointer);
      errors.push(...nestedErrors);
    });
  }

  if (schema.items !== undefined && Array.isArray(value)) {
    value.forEach((item, index) => {
      const nestedPointer = `${pointer}[${index}]`;
      const nestedErrors = validateAgainstSchema(item, schema.items, nestedPointer);
      errors.push(...nestedErrors);
    });
  }

  return errors;
}

function readJson(filePath) {
  fileExists(filePath, `Expected JSON file to exist: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON file ${filePath}: ${error.message}`);
  }
}

function detectTraceCategory(typeToken, serializedEvent) {
  const categorySignals = [
    { category: 'command_execution', re: /command_execution|command\.execution|shell|bash|zsh|exec|run_command|tool\.shell/ },
    { category: 'file_read', re: /file_read|file\.read|read_file|cat\b|rg\b|grep\b|ls\b|find\b/ },
    { category: 'file_write', re: /file_write|file\.write|write_file|apply_patch|tee\b|cp\b|mv\b|mkdir\b|touch\b/ },
    { category: 'trace_event', re: /trace|tool_call|tool_result|function_call|command/ },
  ];
  const corpus = `${typeToken} ${serializedEvent}`;

  for (const signal of categorySignals) {
    if (signal.re.test(corpus)) {
      return signal.category;
    }
  }

  return null;
}

function extractTraceEvidence(events) {
  const eventList = Array.isArray(events) ? events : [];
  const entries = [];
  const byCategory = {
    command_execution: [],
    file_read: [],
    file_write: [],
    trace_event: [],
  };

  eventList.forEach((event, index) => {
    const typeToken = normalizeToken(event && (event.type || event.event || event.name || ''));
    const serialized = normalizeToken(event);
    const category = detectTraceCategory(typeToken, serialized);
    if (!category) {
      return;
    }

    const summary = serialized.slice(0, 400);
    const entry = Object.freeze({
      index,
      category,
      summary,
    });
    entries.push(entry);
    byCategory[category].push(entry);
  });

  const corpus = entries.map(entry => entry.summary).join('\n');
  return Object.freeze({
    totalActivities: entries.length,
    byCategory: Object.freeze({
      command_execution: Object.freeze([...byCategory.command_execution]),
      file_read: Object.freeze([...byCategory.file_read]),
      file_write: Object.freeze([...byCategory.file_write]),
      trace_event: Object.freeze([...byCategory.trace_event]),
    }),
    entries: Object.freeze([...entries]),
    corpus,
  });
}

function eventIsCompletion(event) {
  if (!isObject(event)) {
    return false;
  }

  const typeToken = normalizeToken(event.type || event.event || event.name || '');
  if (['item.completed', 'turn.completed', 'agent_message'].includes(typeToken)) {
    return true;
  }

  if (typeToken === 'agent_message') {
    return true;
  }

  if (isObject(event.item) && normalizeToken(event.item.type) === 'completed') {
    return true;
  }

  if (isObject(event.turn) && normalizeToken(event.turn.status) === 'completed') {
    return true;
  }

  return false;
}

function skillMatches(skill, referencedSkill) {
  const target = normalizeToken(skill);
  const current = normalizeToken(referencedSkill);
  if (!target || !current) {
    return false;
  }

  if (target === current) {
    return true;
  }

  return current.includes(target) || target.includes(current);
}

function expectedActionHits(expectedActions, outputData) {
  const actionsTaken = Array.isArray(outputData.actions_taken) ? outputData.actions_taken : [];
  const findingDescriptions = Array.isArray(outputData.findings)
    ? outputData.findings.map(finding => finding && finding.description).filter(Boolean)
    : [];
  const corpus = [
    ...actionsTaken,
    ...findingDescriptions,
    safeStringify(outputData),
  ]
    .join('\n')
    .toLowerCase();

  return expectedActions.filter(action => corpus.includes(normalizeToken(action)));
}

/**
 * Layered assertion chain for Layer3 scenarios.
 */
function assertScenario(options) {
  const {
    scenarioName,
    result,
    outputFile,
    schemaPath,
    expectedAnalysisType,
    hasFixture = false,
    domainKeywords = [],
    anchorSkills = [],
    optionalSkills = [],
    expectedActions = [],
  } = options || {};

  assert.ok(result && typeof result === 'object', 'assertScenario requires a result object');
  const label = scenarioName || 'scenario';

  // L0: process status
  assert.strictEqual(
    result.exitCode,
    0,
    `[${label}] L0 failed: exitCode=${result.exitCode}. stderr=${result.stderr || '(empty)'}`
  );

  const events = Array.isArray(result.events)
    ? result.events
    : Array.isArray(result.lines)
      ? result.lines
      : [];

  // L1: completion event
  const hasCompletionEvent = events.some(eventIsCompletion);
  assert.ok(
    hasCompletionEvent,
    `[${label}] L1 failed: missing completion event (item.completed / turn.completed / agent_message)`
  );

  // L1.5: trace evidence + optional domain cross-check
  const traceEvidence = extractTraceEvidence(events);
  if (hasFixture) {
    assert.ok(
      traceEvidence.totalActivities > 0,
      `[${label}] L1.5 failed: fixture scenario requires trace activity evidence`
    );
  } else if (traceEvidence.totalActivities === 0) {
    // Non-fixture scenarios only warn by design.
    console.warn(`    [${label}] warning: no trace activity evidence detected`);
  }

  const domainHits = domainKeywords.filter(keyword =>
    traceEvidence.corpus.includes(normalizeToken(keyword))
  );
  if (hasFixture && domainKeywords.length > 0) {
    assert.ok(
      domainHits.length > 0,
      `[${label}] L1.5 failed: trace evidence missing domain keywords (${domainKeywords.join(', ')})`
    );
  }

  // L2: output file parse + schema compliance
  const resolvedOutputFile = outputFile || result.outputFile;
  assert.ok(resolvedOutputFile, `[${label}] L2 failed: missing output file path`);
  fileExists(resolvedOutputFile, `[${label}] L2 failed: output file not found at ${resolvedOutputFile}`);
  fileNonEmpty(resolvedOutputFile, 2);

  const outputData = readJson(resolvedOutputFile);
  const resolvedSchemaPath = schemaPath || path.join(__dirname, '../layer3-integration/schemas/skill-analysis.schema.json');
  const schemaData = readJson(resolvedSchemaPath);
  const schemaErrors = validateAgainstSchema(outputData, schemaData);
  assert.strictEqual(
    schemaErrors.length,
    0,
    `[${label}] L2 failed: schema violations\n${schemaErrors.join('\n')}`
  );

  if (expectedAnalysisType) {
    assert.strictEqual(
      outputData.analysis_type,
      expectedAnalysisType,
      `[${label}] L2 failed: analysis_type expected "${expectedAnalysisType}", got "${outputData.analysis_type}"`
    );
  }

  // Contract: actions_taken is required and must be string[]
  assert.ok(
    hasOwn(outputData, 'actions_taken'),
    `[${label}] L2 failed: missing required actions_taken`
  );
  assert.ok(
    Array.isArray(outputData.actions_taken),
    `[${label}] L2 failed: actions_taken must be an array`
  );
  outputData.actions_taken.forEach((action, index) => {
    assert.strictEqual(
      typeof action,
      'string',
      `[${label}] L2 failed: actions_taken[${index}] must be string`
    );
  });

  // L3: behavioral evidence
  const skillsReferenced = Array.isArray(outputData.skills_referenced)
    ? outputData.skills_referenced
    : [];

  const missingAnchors = anchorSkills.filter(anchorSkill =>
    !skillsReferenced.some(ref => skillMatches(anchorSkill, ref))
  );
  assert.strictEqual(
    missingAnchors.length,
    0,
    `[${label}] L3 failed: missing anchor skills: ${missingAnchors.join(', ')}`
  );

  const optionalHits = optionalSkills.filter(optionalSkill =>
    skillsReferenced.some(ref => skillMatches(optionalSkill, ref))
  );
  if (optionalSkills.length > 0) {
    console.log(
      `    [${label}] optional skill hit rate: ${optionalHits.length}/${optionalSkills.length}`
    );
  }

  const matchedActions = expectedActionHits(expectedActions, outputData);
  if (expectedActions.length > 0) {
    assert.ok(
      matchedActions.length > 0,
      `[${label}] L3 failed: expectedActions matchAny failed (${expectedActions.join(' | ')})`
    );
  }

  return Object.freeze({
    label,
    outputData,
    traceEvidence,
    domainHits: Object.freeze([...domainHits]),
    optionalSkillStats: Object.freeze({
      total: optionalSkills.length,
      hits: optionalHits.length,
      hitRate: optionalSkills.length === 0 ? 1 : optionalHits.length / optionalSkills.length,
    }),
    matchedActions: Object.freeze([...matchedActions]),
  });
}

module.exports = {
  fileExists,
  fileNotExists,
  dirExists,
  fileContains,
  fileNotContains,
  fileNonEmpty,
  dirHasEntries,
  dirHasSubdirs,
  countFiles,
  parseFrontmatter,
  extractTraceEvidence,
  validateAgainstSchema,
  assertScenario,
};
