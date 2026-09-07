// Small evaluation host, not another public Serene API. Discovery belongs here.
import { readFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { filterConstructionSource } from '@mk3008/serene/filter';

const root = fileURLToPath(new URL('../../', import.meta.url));
const freeze = JSON.parse(readFileSync(new URL('./freeze.json', import.meta.url), 'utf8'));
const run = process.argv[2];
if (!['r01', 'r02'].includes(run)) throw new Error('Unknown session');
const logRoot = process.env.SERENE_SMOKE_LOG_ROOT ?? '/tmp/serene-filter-smoke-11';
const logDir = join(logRoot, run);
mkdirSync(logDir, { recursive: true });
const log = join(logDir, 'trace.jsonl');
const previous = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).length : 0;
const sha = text => createHash('sha256').update(text).digest('hex');

function context(file) {
  const entry = freeze.files[file];
  if (!entry) throw new Error('Unknown file; use list');
  const pinned = execFileSync('git', ['show', `${freeze.base}:${entry.path}`], { cwd: root, encoding: 'utf8' });
  if (sha(pinned) !== entry.sha256) throw new Error('Frozen source hash mismatch');
  const current = readFileSync(join(root, entry.path), 'utf8');
  return { snapshot: { file, revision: sha(pinned), source: pinned },
    current: { file, revision: sha(current), source: current } };
}

function lines(source) {
  let offset = 0;
  return source.split('\n').map((text, i) => {
    const row = { line: i + 1, start: offset, end: offset + text.length, text };
    offset += text.length + 1;
    return row;
  });
}

function deliver(file, ctx, ranges, lineNumbers) {
  const result = run === 'r02'
    ? filterConstructionSource(ctx.snapshot, { ...ctx.current, ranges })
    : { filtered: false, reason: 'raw', ranges };
  return { file, ...result,
    ranges: result.ranges.map((range, i) => ({ line: lineNumbers[i], ...range })) };
}

let request, response;
try {
  request = JSON.parse(process.argv[3]);
  if (previous >= 30) throw new Error('Session operation limit reached; finish with available evidence');
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('Expected operation object');
  if (request.op === 'list') {
    response = { files: Object.keys(freeze.files).map(file => ({ file, lines: lines(context(file).current.source).length })) };
  } else if (request.op === 'search') {
    if (typeof request.pattern !== 'string' || request.pattern.length > 200) throw new Error('Supply a regex pattern string (up to 200 characters)');
    const regex = new RegExp(request.pattern);
    response = { files: [] };
    for (const file of Object.keys(freeze.files)) {
      const ctx = context(file);
      const matches = lines(ctx.current.source).filter(row => regex.test(row.text));
      if (matches.length) response.files.push(deliver(file, ctx,
        matches.map(({ start, end, text }) => ({ start, end, text })), matches.map(row => row.line)));
    }
  } else if (request.op === 'read') {
    const ctx = context(request.file);
    const rows = lines(ctx.current.source);
    const startLine = request.startLine ?? 1, endLine = request.endLine ?? rows.length;
    if (!Number.isInteger(startLine) || !Number.isInteger(endLine) || startLine < 1 || endLine < startLine || endLine > rows.length) {
      throw new Error('Invalid inclusive line range');
    }
    const start = rows[startLine - 1].start, end = rows[endLine - 1].end;
    response = deliver(request.file, ctx,
      [{ start, end, text: ctx.current.source.slice(start, end) }], [startLine]);
  } else throw new Error('Unknown operation; use list, search or read');
} catch (error) {
  response = { error: error.message };
}
const wire = JSON.stringify(response) + '\n';
appendFileSync(log, JSON.stringify({ sequence: previous + 1,
  request: request ?? { invalidJson: process.argv[3] ?? null }, response, wire }) + '\n');
process.stdout.write(wire);
