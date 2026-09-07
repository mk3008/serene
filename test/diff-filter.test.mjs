import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { filterConstructionDiff, filterConstructionSource } from '@mk3008/serene/filter';

const prefix = "import { sql, bind } from '@mk3008/serene';\n";
const fn = (name = 'run', body = 'SELECT :id') => `export async function ${name}(db, id) {\n  const q = bind(sql\`${body}\`, { id });\n  await db.query(q.text, q.params);\n}\n`;
const raw = 'export async function raw(db, input) { await db.query("SELECT " + input); }\n';
const context = (source, revision) => ({ source, revision, file: 'queries.ts' });
const range = (source, start, end) => ({ start, end, text: source.slice(start, end) });
function packet(base, edits) {
  let head = '', cursor = 0;
  const changes = edits.map(([start, end, text]) => {
    head += base.slice(cursor, start);
    const headStart = head.length;
    head += text;
    cursor = end;
    return { base: range(base, start, end), head: range(head, headStart, head.length) };
  });
  head += base.slice(cursor);
  const snapshot = { base: context(base, 'base-sha'), head: context(head, 'head-sha') };
  return { snapshot, response: { ...snapshot, changes } };
}
function replace(base, from, to) {
  const start = base.indexOf(from);
  assert.notEqual(start, -1);
  return packet(base, [[start, start + from.length, to]]);
}
const run = p => filterConstructionDiff(p.snapshot, p.response);
function visible(p, reason) {
  const result = run(p);
  assert.equal(result.filtered, false);
  if (reason) assert.equal(result.reason, reason);
  assert.deepEqual(result.changes, p.response.changes.map((c, index) => ({ index, kind: 'source', ...c })));
  return result;
}

test('ordinary modification preserves both revisions, offsets, function and unchanged execution navigation', () => {
  const p = replace(prefix + fn(), 'SELECT :id', 'SELECT :id + 1');
  const before = structuredClone(p);
  const result = run(p), c = result.changes[0];
  assert.equal(result.filtered, true);
  assert.equal(c.change, 'modification');
  assert.equal(c.base.function.revision, 'base-sha');
  assert.equal(c.head.function.revision, 'head-sha');
  assert.equal(c.head.function.function, 'run');
  assert.deepEqual(c.head.function.sites, [{ line: 4, column: 9 }]);
  assert.equal(c.base.start, p.response.changes[0].base.start);
  assert.equal(c.head.end, p.response.changes[0].head.end);
  assert.equal(JSON.stringify(result).includes('SELECT'), false);
  assert.deepEqual(run(p), result);
  assert.deepEqual(p, before);
  const follow = filterConstructionSource(p.snapshot.head, { ...p.snapshot.head,
    ranges: [range(p.snapshot.head.source, 0, p.snapshot.head.source.length)] });
  assert.equal(follow.filtered, true);
});

test('multiple edits retain input order and exact nonordinary source alongside ordinary markers', () => {
  const base = prefix + fn() + raw;
  const a = base.indexOf(':id'), b = base.lastIndexOf('SELECT');
  const p = packet(base, [[a, a + 3, ':id + 1'], [b, b + 6, 'DELETE']]);
  const result = run(p);
  assert.equal(result.filtered, true);
  assert.equal(result.changes.length, 2);
  assert.equal(result.changes[0].kind, 'ordinary');
  assert.deepEqual(result.changes[1], { index: 1, kind: 'source', ...p.response.changes[1] });
});

for (const [label, from, to] of [['addition', ':id', ':id + 1'], ['deletion', ':id + 1', ':id']]) {
  test(`zero-width side of an ordinary ${label} remains explicit`, () => {
    const base = prefix + fn('run', `SELECT ${from}`), at = base.indexOf(':id') + 3;
    const p = packet(base, [[at, at + (label === 'deletion' ? 4 : 0), label === 'addition' ? ' + 1' : '']]);
    const c = run(p).changes[0];
    assert.equal(c.kind, 'ordinary');
    assert.equal(c.change, label);
    assert.equal(label === 'addition' ? c.base.start === c.base.end : c.head.start === c.head.end, true);
  });
}

for (const replacement of [
  'await db.query("SELECT " + id)',
  'await db.query("SELECT 1")',
  'await db.sendSql(q.text)',
  'await db.query(q.text, q.params); console.log(id)',
]) {
  test(`ordinary transition stays visible in both directions: ${replacement}`, () => {
    const base = prefix + fn();
    const p = replace(base, 'await db.query(q.text, q.params)', replacement);
    const r = visible(p, 'ordinary-set-changed');
    assert.equal(r.transitions.base[0].function, 'run');
    const reversed = { snapshot: { base: p.snapshot.head, head: p.snapshot.base }, response: {
      base: p.snapshot.head, head: p.snapshot.base,
      changes: p.response.changes.map(c => ({ base: c.head, head: c.base })) } };
    assert.equal(visible(reversed, 'ordinary-set-changed').transitions.head[0].function, 'run');
  });
}

test('changed import directs follow-up to unchanged execution whose ordinary provenance was lost', () => {
  const p = replace(prefix + fn(), '@mk3008/serene', 'untrusted-module');
  const r = visible(p, 'ordinary-set-changed');
  assert.deepEqual(r.transitions.base[0].sites, [{ line: 4, column: 9 }]);
  const follow = filterConstructionSource(p.snapshot.head, { ...p.snapshot.head,
    ranges: [range(p.snapshot.head.source, 0, p.snapshot.head.source.length)] });
  assert.equal(follow.filtered, false);
});

test('whole function/file additions and deletions remain distinguishable and source-visible', () => {
  for (const [base, head] of [['', prefix + fn()], [prefix + fn(), ''], [prefix, prefix + fn()]]) {
    const p = packet(base, [[0, base.length, head]]);
    const r = visible(p, 'ordinary-set-changed');
    assert.equal(r.changes[0].base.text, base);
    assert.equal(r.changes[0].head.text, head);
  }
});

test('hunk crossing ordinary and nonordinary functions is preserved whole', () => {
  const base = prefix + fn() + raw;
  visible(packet(base, [[prefix.length, base.length, (fn() + raw).replace('SELECT :id', 'SELECT :id + 1')]]));
});

test('uncertain raw changes, function renames, duplicate ordinary names and no-op records stay visible', () => {
  visible(replace(raw, 'SELECT', 'DELETE'), 'no-ordinary-change');
  visible(replace(prefix + fn(), 'function run', 'function renamed'), 'ordinary-set-changed');
  visible(replace(prefix + fn() + fn(), 'SELECT :id', 'SELECT :id + 1'), 'ambiguous-functions');
  visible(replace(prefix + fn(), 'SELECT', 'SELECT'), 'no-ordinary-change');
});

test('changed prefix plus ordinary edits keeps header source, adjusting head execution coordinates', () => {
  const base = prefix + fn(), at = base.indexOf(':id');
  const p = packet(base, [[0, 0, '// header\n'], [at, at + 3, ':id + 1']]);
  const r = run(p);
  assert.equal(r.changes[0].kind, 'source');
  assert.equal(r.changes[1].kind, 'ordinary');
  assert.equal(r.changes[1].head.function.sites[0].line, 5);
});

test('stale sources including edits outside ranges and either revision or file mismatch preserve input', () => {
  for (const side of ['base', 'head']) for (const key of ['source', 'revision', 'file']) {
    const p = replace(prefix + fn(), ':id', ':id + 1');
    p.response = { ...p.response, [side]: { ...p.response[side], [key]: p.response[side][key] + 'x' } };
    visible(p, 'snapshot-mismatch');
  }
});

test('bad offsets, altered patch text, missing changes, out-of-order and overlapping edits fail closed', () => {
  for (const mutate of [
    p => { p.response.changes[0].head.text += 'x'; },
    p => { p.response.changes[0].base.start = -1; },
    p => { p.response.changes[0].head.end = 1.5; },
    p => { p.response.changes = []; },
    p => { p.response.changes.push(structuredClone(p.response.changes[0])); },
  ]) {
    const p = replace(prefix + fn(), ':id', ':id + 1'); mutate(p); visible(p);
  }
  const base = prefix + fn() + fn('second'), a = base.indexOf(':id'), b = base.lastIndexOf(':id');
  const p = packet(base, [[a, a + 3, ':id + 1'], [b, b + 3, ':id + 2']]);
  p.response.changes.reverse(); visible(p, 'diff-mismatch');
  const missing = packet(base, [[a, a + 3, ':id + 1'], [b, b + 3, ':id + 2']]);
  missing.response.changes.pop(); visible(missing, 'diff-mismatch');
});

test('unsupported, renamed and parse-failed files remain source-visible', () => {
  const p = replace(prefix + fn(), ':id', ':id + 1');
  p.snapshot.base.file = p.snapshot.head.file = 'queries.sql'; visible(p, 'unsupported-file');
  p.snapshot.base.file = 'queries.ts'; visible(p, 'file-identity-change');
  visible(replace(prefix + fn(), 'const q =', 'const q = ('), 'parse-failed');
});

test('Unicode, CRLF, partial-line edits and no terminal newline retain exact UTF-16 ranges', () => {
  const base = (prefix + fn('run', "SELECT '😀', :id")).replaceAll('\n', '\r\n').trimEnd();
  const p = replace(base, ':id', ':id + 1');
  assert.equal(run(p).filtered, true);
  visible(packet(base, []), 'no-ordinary-change');
});

test('malformed envelopes throw without producing an ordinary result', () => {
  assert.throws(() => filterConstructionDiff({}, {}), TypeError);
  const p = replace(prefix + fn(), ':id', ':id + 1');
  assert.throws(() => filterConstructionDiff(p.snapshot, { ...p.response, changes: [{}] }), TypeError);
});

test('same file/revision cannot coherently identify two different full sources', () => {
  const p = replace(prefix + fn(), ':id', ':id + 1');
  p.snapshot.head.revision = p.snapshot.base.revision;
  visible(p, 'diff-mismatch');
});

test('interpolation transition prevents even an unrelated ordinary change being compressed', () => {
  const base = prefix + fn() + fn('second');
  const a = base.indexOf(':id'), b = base.lastIndexOf(':id');
  visible(packet(base, [[a, a + 3, ':id + 1'], [b, b + 3, '${id}']]), 'ordinary-set-changed');
});

test('several edits inside one function all survive, while function moves are conservative', () => {
  const base = prefix + fn(), a = base.indexOf(':id'), b = base.indexOf('q.params');
  const r = run(packet(base, [[a, a + 3, ':id + 1'], [b, b + 8, 'q.values']]));
  assert.equal(r.changes.length, 2);
  assert.ok(r.changes.every(c => c.kind === 'ordinary'));
  const two = prefix + fn() + fn('second');
  visible(packet(two, [[prefix.length, two.length, fn('second') + fn()]]), 'no-ordinary-change');
});

test('real Git zero-context hunks preserve changed regions and signs through the structured boundary', () => {
  const dir = mkdtempSync(join(tmpdir(), 'serene-diff-'));
  try {
    const base = prefix + fn() + raw;
    const head = base.replace('SELECT :id', 'SELECT :id + 1').replace('"SELECT " + input', '"DELETE " + input');
    writeFileSync(join(dir, 'base.ts'), base); writeFileSync(join(dir, 'head.ts'), head);
    const git = spawnSync('git', ['diff', '--no-index', '--no-ext-diff', '--no-color', '--unified=0',
      join(dir, 'base.ts'), join(dir, 'head.ts')], { encoding: 'utf8' });
    assert.equal(git.status, 1, git.stderr);
    // Test host only: these fixed LF fixtures have no context or no-newline records.
    // Production Serene deliberately does not own a unified-patch decoder.
    const offsets = source => { let n = 0; return [0, ...source.split(/(?<=\n)/).map(line => n += line.length)]; };
    const bo = offsets(base), ho = offsets(head), changes = [];
    const hunks = git.stdout.split(/(?=^@@ )/m).slice(1);
    for (const hunk of hunks) {
      const lines = hunk.trimEnd().split('\n');
      const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines.shift());
      assert.ok(m);
      const bn = Number(m[2] ?? 1), hn = Number(m[4] ?? 1);
      const bs = bo[Number(m[1]) - (bn ? 1 : 0)], hs = ho[Number(m[3]) - (hn ? 1 : 0)];
      const bt = lines.filter(l => l.startsWith('-')).map(l => l.slice(1) + '\n').join('');
      const ht = lines.filter(l => l.startsWith('+')).map(l => l.slice(1) + '\n').join('');
      changes.push({ base: { start: bs, end: bs + bt.length, text: bt }, head: { start: hs, end: hs + ht.length, text: ht } });
    }
    const snapshot = { base: context(base, 'b'), head: context(head, 'h') };
    const r = filterConstructionDiff(snapshot, { ...snapshot, changes });
    assert.equal(hunks.length, 2);
    assert.equal(r.changes.length, hunks.length);
    assert.equal(r.changes[0].kind, 'ordinary');
    assert.equal(r.changes[0].change, 'modification');
    assert.deepEqual(r.changes[1], { index: 1, kind: 'source', ...changes[1] });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
