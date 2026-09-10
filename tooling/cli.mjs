#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { collectFiles } from './files.mjs';
import { auditSource } from './audit.mjs';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('Usage: serene-audit [--strict] [--actionable-only] [--sink=name] file-or-directory ...\nJSON inventory; --actionable-only reports counts by candidate execution site and non-ordinary findings and content review suggestions. Exit 1 on violations (also review-required with --strict; content suggestions do not affect exit status), 2 on input errors.\nRecursively selects .ts/.tsx/.mts/.cts/.js/.jsx/.mjs/.cjs. Skips node_modules, dist, build, coverage, .git and symbolic links. Explicit files remain supported. File-local candidate inventory, not whole-program coverage.');
  process.exit(args.includes('--help') ? 0 : 2);
}
const strict = args.includes('--strict');
const actionableOnly = args.includes('--actionable-only');
const sinkNames = ['query', 'execute', 'unsafe', ...args.filter(a => a.startsWith('--sink=')).map(a => a.slice(7))];
const files = args.filter(a => !a.startsWith('--'));
if (!files.length || args.some(a => a.startsWith('--') && a !== '--strict' && a !== '--actionable-only' && !a.startsWith('--sink='))) {
  console.error('Invalid arguments; use --help.'); process.exit(2);
}
try {
  const selection = collectFiles(files);
  const findings = selection.files.flatMap(file => auditSource(readFileSync(file, 'utf8'), file, { sinkNames }));
  const report = actionableOnly ? {
    files: selection.files,
    skipped: selection.skipped,
    executionSiteCounts: Object.fromEntries(['ordinary', 'review-required', 'violation'].map(level =>
      [level, findings.filter(finding => finding.boundary === 'driver-candidate' && finding.level === level).length])),
    contentReviewExecutionSiteCount: findings.filter(finding =>
      finding.boundary === 'driver-candidate' && finding.reviewSignals?.length).length,
    findings: findings.filter(finding => finding.level !== 'ordinary' || finding.reviewSignals?.length),
    scope: 'Counts cover recognized candidate driver execution sites only; Construction counts are independent of contentReviewExecutionSiteCount; findings retain all review-required, violation and content-review rows. File-local inventory is not exhaustive driver discovery.',
  } : { files: selection.files, skipped: selection.skipped, findings, scope: 'file-local candidate inventory; not exhaustive driver discovery' };
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = findings.some(f => f.level === 'violation' || strict && f.level === 'review-required') ? 1 : 0;
} catch (error) { console.error(error.message); process.exitCode = 2; }
