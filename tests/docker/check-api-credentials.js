'use strict';

const {
  codexExec,
  isAuthenticationFailureSignal,
  resolveWorkspaceRoot,
} = require('./lib/codex-helper');

const EXIT_CODES = Object.freeze({
  ok: 0,
  missingCredentials: 10,
  invalidCredentials: 20,
  unexpectedFailure: 1,
});

function hasApiCredentials() {
  return Boolean(
    (process.env.CODEX_API_KEY || '').trim() ||
    (process.env.OPENAI_API_KEY || '').trim()
  );
}

function printDiagnostics(result) {
  if (result.stderr) {
    console.error(result.stderr.trim());
  }

  if (result.output) {
    console.error(result.output.trim());
  }
}

function main() {
  if (!hasApiCredentials()) {
    console.error('[preflight] Missing CODEX_API_KEY or OPENAI_API_KEY.');
    process.exit(EXIT_CODES.missingCredentials);
  }

  const result = codexExec('Reply exactly with OK.', {
    cwd: resolveWorkspaceRoot(),
    timeout: 30_000,
    outputSchema: '',
    scenarioId: 'api-auth-preflight',
  });

  if (result.exitCode === 0) {
    console.log('[preflight] API credentials accepted.');
    process.exit(EXIT_CODES.ok);
  }

  if (isAuthenticationFailureSignal(result)) {
    console.error('[preflight] API credentials were rejected as invalid or expired.');
    printDiagnostics(result);
    process.exit(EXIT_CODES.invalidCredentials);
  }

  console.error(`[preflight] Codex preflight failed unexpectedly with exit code ${result.exitCode}.`);
  printDiagnostics(result);
  process.exit(EXIT_CODES.unexpectedFailure);
}

main();
