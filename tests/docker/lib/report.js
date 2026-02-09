/**
 * Report generator for Docker integration tests.
 * Generates JUnit XML and TAP from summary.json.
 *
 * Usage: node report.js summary.json junit.xml
 */

'use strict';

const fs = require('fs');

function toInt(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeLayerData(data) {
  const passed = toInt(data && data.passed);
  const failed = toInt(data && data.failed);
  const skipped = toInt(data && data.skipped);
  const explicitTotal = toInt(data && data.total);
  const inferredTotal = passed + failed + skipped;
  const total = Math.max(explicitTotal, inferredTotal);
  return { passed, failed, skipped, total };
}

function summaryTotals(summary) {
  const layerEntries = Object.values(summary.layers || {}).map(normalizeLayerData);
  const layerTotal = layerEntries.reduce((sum, layer) => sum + layer.total, 0);
  const layerFailed = layerEntries.reduce((sum, layer) => sum + layer.failed, 0);
  const layerSkipped = layerEntries.reduce((sum, layer) => sum + layer.skipped, 0);

  return {
    total: Math.max(toInt(summary.total), layerTotal),
    failed: Math.max(toInt(summary.failed), layerFailed),
    skipped: Math.max(toInt(summary.skipped), layerSkipped),
  };
}

function generateJunitXml(summary) {
  const layers = summary.layers || {};
  const suites = [];
  const durationSec = (toInt(summary.duration_ms) / 1000).toFixed(1);

  for (const [layerName, rawData] of Object.entries(layers)) {
    const data = normalizeLayerData(rawData);
    if (data.total === 0) continue;

    const cases = [];

    for (let i = 0; i < data.passed; i++) {
      cases.push(`    <testcase name="${escapeXml(layerName)}-passed-${i + 1}" classname="docker.${escapeXml(layerName)}"/>`);
    }
    for (let i = 0; i < data.failed; i++) {
      cases.push(`    <testcase name="${escapeXml(layerName)}-failed-${i + 1}" classname="docker.${escapeXml(layerName)}"><failure message="${escapeXml(layerName)} failure ${i + 1}"/></testcase>`);
    }
    for (let i = 0; i < data.skipped; i++) {
      cases.push(`    <testcase name="${escapeXml(layerName)}-skipped-${i + 1}" classname="docker.${escapeXml(layerName)}"><skipped message="skipped"/></testcase>`);
    }

    suites.push(`  <testsuite name="${escapeXml(layerName)}" tests="${data.total}" failures="${data.failed}" skipped="${data.skipped}" time="${durationSec}">
${cases.join('\n')}
  </testsuite>`);
  }

  const totals = summaryTotals(summary);

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="everything-codex-docker" tests="${totals.total}" failures="${totals.failed}" skipped="${totals.skipped}" time="${durationSec}">
${suites.join('\n')}
</testsuites>
`;
}

function generateTap(summary) {
  const lines = [];
  lines.push('TAP version 13');

  let idx = 1;
  for (const [layerName, rawData] of Object.entries(summary.layers || {})) {
    const data = normalizeLayerData(rawData);

    for (let i = 0; i < data.passed; i++) {
      lines.push(`ok ${idx++} - ${layerName} passed ${i + 1}`);
    }
    for (let i = 0; i < data.failed; i++) {
      lines.push(`not ok ${idx++} - ${layerName} failed ${i + 1}`);
    }
    for (let i = 0; i < data.skipped; i++) {
      lines.push(`ok ${idx++} - ${layerName} skipped ${i + 1} # SKIP layer skipped`);
    }
  }

  const plannedTotal = Math.max(toInt(summary.total), idx - 1);
  lines.splice(1, 0, `1..${plannedTotal}`);

  while (idx <= plannedTotal) {
    lines.push(`ok ${idx++} - synthetic skipped # SKIP no explicit test record`);
  }

  lines.push(`# tests ${plannedTotal}`);
  lines.push(`# pass ${toInt(summary.passed)}`);
  lines.push(`# fail ${toInt(summary.failed)}`);
  lines.push(`# skip ${toInt(summary.skipped)}`);
  if (summary.codex_version) {
    lines.push(`# codex_version ${summary.codex_version}`);
  }
  if (summary.timestamp) {
    lines.push(`# timestamp ${summary.timestamp}`);
  }
  lines.push('');

  return lines.join('\n');
}

// CLI usage
if (require.main === module) {
  const [,, summaryPath, outputPath] = process.argv;
  if (!summaryPath || !outputPath) {
    console.error('Usage: node report.js <summary.json> <output.xml>');
    process.exit(1);
  }

  let rawSummary = '';
  try {
    rawSummary = fs.readFileSync(summaryPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read summary file "${summaryPath}": ${error.message}`);
    process.exit(1);
  }

  let summary;
  try {
    summary = JSON.parse(rawSummary);
  } catch (error) {
    console.error(`Failed to parse JSON from "${summaryPath}": ${error.message}`);
    process.exit(1);
  }

  const xml = generateJunitXml(summary);
  fs.writeFileSync(outputPath, xml);
  console.log(`JUnit XML written to ${outputPath}`);

  // Also generate TAP
  const tapPath = outputPath.replace(/\.xml$/, '.tap').replace(/junit/, 'summary');
  const tap = generateTap(summary);
  fs.writeFileSync(tapPath, tap);
  console.log(`TAP report written to ${tapPath}`);
}

module.exports = { generateJunitXml, generateTap, normalizeLayerData, summaryTotals };
