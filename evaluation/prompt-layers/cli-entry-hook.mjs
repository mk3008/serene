// Evaluation-only hook: inserted verbatim immediately after the CLI shebang.
// It has no environment switch and deliberately never changes CLI output or failure.
import { closeSync, fsyncSync, mkdirSync, openSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const cliPath = fileURLToPath(import.meta.url);
  const packageRoot = dirname(dirname(cliPath));
  const nodeModules = dirname(dirname(packageRoot));
  const appRoot = dirname(nodeModules);
  const runId = appRoot.split('/').pop();
  const evidence = join(dirname(appRoot), 'evidence', runId);
  mkdirSync(evidence, { recursive: true });
  const fd = openSync(join(evidence, 'cli-events.jsonl'), 'a');
  try {
    writeSync(fd, `${JSON.stringify({ event: 'cli_entry', recorded_at_ms: Date.now(), pid: process.pid, argv: process.argv, cwd: process.cwd() })}\n`);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
} catch {
  // Observation is best-effort and must never affect the actual CLI.
}
