// Evaluation-only JSONL handoff; not a package API or execution-site discovery tool.
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { auditSource } from '../../tooling/audit.mjs';

export function createHandoff(root, revision) {
  root = realpathSync(root);
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (!/^[a-f0-9]{40}$/.test(revision) || git('rev-parse', `${revision}^{commit}`).trim() !== revision)
    throw new Error('A full existing commit SHA is required');
  return (candidate, ordinal) => {
    const out = { ordinal, candidate, classification: 'unmatched', skip: false };
    const reject = reason => ({ ...out, reason });
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return reject('invalid-candidate');
    if (candidate.revision !== revision) return reject('revision-mismatch');
    if (candidate.kind !== 'execution') return reject('execution-kind-unconfirmed');
    // Never guess a call from its function name or nearby line. Require exact call start.
    if (!Number.isSafeInteger(candidate.line) || candidate.line < 1 ||
        !Number.isSafeInteger(candidate.column) || candidate.column < 1) return reject('insufficient-coordinate');
    const file = candidate.file;
    if (typeof file !== 'string' || !file || file.includes('\\') || file.includes('\0') ||
        path.isAbsolute(file) || file.split('/').some(p => !p || p === '.' || p === '..')) return reject('invalid-path');
    if (!/\.(?:[cm]?[jt]s|[jt]sx)$/.test(file)) return reject('unsupported-source');
    try {
      if (git('rev-parse', 'HEAD').trim() !== revision) return reject('repository-revision-mismatch');
      const resolved = realpathSync(path.join(root, file));
      if (resolved !== path.join(root, file)) return reject('symlink-path');
      const source = git('show', `${revision}:${file}`);
      if (readFileSync(resolved, 'utf8') !== source) return reject('working-source-mismatch');
      const findings = auditSource(source, file);
      if (findings.some(f => f.boundary === 'source')) return reject('source-parse-error');
      const matches = findings.filter(f => f.boundary === 'driver-candidate' &&
        f.line === candidate.line && f.column === candidate.column);
      if (matches.length !== 1) return reject(matches.length ? 'ambiguous-match' : 'no-execution-match');
      const finding = matches[0];
      return { ...out, classification: finding.level, skip: finding.level === 'ordinary',
        reason: finding.code, matched: { file, line: finding.line, column: finding.column, revision } };
    } catch { return reject('source-unavailable-or-analysis-failed'); }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , root, revision] = process.argv;
  const classify = createHandoff(root, revision);
  let ordinal = 0;
  for await (const raw of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    ordinal++;
    let output;
    try { output = classify(JSON.parse(raw), ordinal); }
    catch { output = { ordinal, raw, classification: 'unmatched', skip: false, reason: 'invalid-json' }; }
    process.stdout.write(JSON.stringify(output) + '\n');
  }
}
