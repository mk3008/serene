#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { collectFiles } from './files.mjs';
import { auditSource } from './audit.mjs';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('Usage: serene-audit [--strict] [--sink=name] file-or-directory ...\nJSON inventory; exit 1 on violations (also review-required with --strict), 2 on input errors.\nRecursively selects .ts/.tsx/.mts/.cts/.js/.jsx/.mjs/.cjs. Skips node_modules, dist, build, coverage, .git and symbolic links. Explicit files remain supported. Not whole-program coverage.');
  process.exit(args.includes('--help') ? 0 : 2);
}
const strict = args.includes('--strict');
const sinkNames = ['query', 'execute', 'unsafe', ...args.filter(a => a.startsWith('--sink=')).map(a => a.slice(7))];
const files = args.filter(a => !a.startsWith('--'));
if (!files.length || args.some(a => a.startsWith('--') && a !== '--strict' && !a.startsWith('--sink='))) {
  console.error('Invalid arguments; use --help.'); process.exit(2);
}
try {
  const selection = collectFiles(files);
  const findings = selection.files.flatMap(file => auditSource(readFileSync(file, 'utf8'), file, { sinkNames }));
  console.log(JSON.stringify({ files: selection.files, skipped: selection.skipped, findings, scope: 'file-local candidate inventory; not exhaustive driver discovery' }, null, 2));
  process.exitCode = findings.some(f => f.level === 'violation' || strict && f.level === 'review-required') ? 1 : 0;
} catch (error) { console.error(error.message); process.exitCode = 2; }
