import test from 'node:test';
import assert from 'node:assert/strict';
import { filterConstructionSource } from '@mk3008/serene/filter';

const imports = "import { sql, bind, sort, orderBy } from '@mk3008/serene';\n";
const fn = `export function load(db: any, id: string) {
  const statement = sql\`SELECT secret_column FROM users WHERE id = :id\`;
  const query = bind(statement, { id }, 'indexed');
  return db.query(query.text, query.values);
}`;
const source = imports + fn;
const snapshot = (text = source, file = 'users.ts') => ({ source: text, file, revision: 'r1' });
const range = (text, start = 0, end = text.length) => ({ start, end, text: text.slice(start, end) });
const filter = (text = source, ranges = [range(text)], file = 'users.ts') =>
  filterConstructionSource(snapshot(text, file), { ...snapshot(text, file), ranges });
const parts = result => result.filtered ? result.ranges.flatMap(r => r.parts) : [];
const visible = result => result.filtered ? parts(result).filter(p => p.kind === 'source').map(p => p.text).join('') : result.ranges.map(r => r.text).join('');
const markers = result => parts(result).filter(p => p.kind === 'ordinary');

test('ordinary construction never reaches the model-facing payload; authoritative navigation remains', () => {
  const result = filter();
  assert.equal(result.filtered, true);
  assert.equal(visible(result), imports);
  assert(!JSON.stringify(result).includes('secret_column'));
  assert(!JSON.stringify(result).includes('query.text'));
  assert.deepEqual(markers(result), [{ kind: 'ordinary', scope: 'sql-construction', file: 'users.ts',
    revision: 'r1', start: imports.length, end: source.length,
    function: 'load', sites: [{ line: 5, column: 10 }] }]);
});

test('actionable and unmatched neighbors, including same-line source, stay exact', () => {
  const danger = ' export function danger(db, input) { return db.query("SELECT " + input); }';
  const unmatched = '\nexport function outside(db, input) { return db.sendSql(input); }';
  const raw = '\nexport function fixed(db) { return db.query("SELECT 1"); }';
  const text = source + danger + unmatched + raw;
  const result = filter(text);
  assert.equal(markers(result).length, 1);
  assert.equal(visible(result), imports + danger + unmatched + raw);
  for (const p of parts(result).filter(p => p.kind === 'source')) assert.equal(p.text, text.slice(p.start, p.end));
});

test('partial search matches, empty, overlapping and repeated ranges retain input correspondence', () => {
  const start = source.indexOf('secret_column');
  const requested = [range(source, start, start + 6), range(source, 0, imports.length),
    range(source, start, start), range(source, start, start + 6), range(source)];
  const result = filter(source, requested);
  assert.equal(result.filtered, true);
  assert.equal(result.ranges.length, requested.length);
  result.ranges.forEach((r, i) => assert.deepEqual([r.start, r.end], [requested[i].start, requested[i].end]));
  assert.equal(result.ranges[0].parts[0].function, 'load');
  assert.deepEqual(result.ranges[0], result.ranges[3]);
  assert.deepEqual(result.ranges[2].parts, []);
  assert(!JSON.stringify(result).includes('secret_column'));
  assert.equal(filter(source, [requested[2]]).filtered, false);
  assert.deepEqual(filter(source, []).ranges, []);
});

test('multiple ordinary functions on one line have separate metadata and exact remaining bytes', () => {
  const second = fn.replace('load(', 'other(');
  const text = imports + fn + ' /* retain */ ' + second;
  const result = filter(text);
  assert.deepEqual(markers(result).map(m => m.function), ['load', 'other']);
  assert.equal(visible(result), imports + ' /* retain */ ');
});

test('UTF-16 offsets, CRLF and non-ASCII source are not normalized', () => {
  const text = '// 🍀\r\n' + source.replaceAll('\n', '\r\n') + '\r\n// 日本語\r\n';
  const result = filter(text);
  assert.equal(markers(result).length, 1);
  assert.equal(markers(result)[0].sites[0].line, 6);
  assert.equal(markers(result)[0].start, text.indexOf('export function'));
  assert.equal(visible(result), '// 🍀\r\n' + imports.replaceAll('\n', '\r\n') + '\r\n// 日本語\r\n');
});

test('revision, filename and full-source mismatches preserve the entire supplied response', () => {
  for (const changed of [{ revision: 'r2' }, { file: 'other.ts' }, { source: source + '\n// changed outside request' }]) {
    const response = { ...snapshot(), ...changed, ranges: [range(source, imports.length, source.length)] };
    const result = filterConstructionSource(snapshot(), response);
    assert.equal(result.filtered, false);
    assert.equal(result.reason, 'snapshot-mismatch');
    assert.deepEqual(result.ranges, response.ranges);
  }
});

test('unverified content or offsets disable all compression, even with an ordinary neighbor range', () => {
  for (const bad of [{ start: 0, end: source.length, text: 'altered' },
    { start: -1, end: 0, text: '' }, { start: 1.5, end: 2, text: '' },
    { start: 5, end: 4, text: '' }, { start: 0, end: source.length + 1, text: source },
    { start: NaN, end: 0, text: '' }]) {
    const requested = [range(source), bad];
    const result = filter(source, requested);
    assert.equal(result.reason, 'range-mismatch');
    assert.deepEqual(result.ranges, requested);
  }
});

test('unsupported files, parse failures anywhere and unmatched source remain visible', () => {
  const unsupported = filter(source, [range(source)], 'users.sql');
  assert.equal(unsupported.reason, 'unsupported-file');
  assert.equal(visible(unsupported), source);
  const broken = source + '\nconst broken = ;';
  assert.equal(filter(broken).reason, 'parse-failed');
  assert.equal(visible(filter(broken)), broken);
  assert.equal(filter('const unrelated = 1;').reason, 'no-ordinary-range');
});

const conservative = [
  ['mixed construction', fn.replace('  return', '  db.query("SELECT " + id);\n  return')],
  ['unsupported execution', fn.replace('  return', '  db.sendSql(id);\n  return')],
  ['helper invocation', fn.replace('{ id }', '{ id: transform(id) }')],
  ['default parameter', fn.replace('id: string)', 'id: string = db.query("SELECT " + input))')],
  ['destructured parameter', fn.replace('id: string)', '{ id }: any)')],
  ['assignment in driver argument', fn.replace('query.values', '(globalThis.other = "SELECT " + id)')],
  ['independent SQL in driver argument', fn.replace('query.values', '"SELECT " + id')],
  ['unmatched values property', fn.replace('query.values', 'other.values')],
  ['computed call', fn.replace('db.query(', 'db[method](')],
  ['nested function', fn.replace('  return', '  function nested() { db.query(input); }\n  return')],
  ['control flow', fn.replace('  return', '  if (!id) throw new Error();\n  return')],
  ['mutation', fn.replace('  return', '  query.text = id;\n  return')],
  ['spread values', fn.replace('{ id }', '{ ...input }')],
  ['getter', fn.replace('{ id }', '{ get id() { return input; } }')],
  ['computed parameter name', fn.replace('{ id }', '{ [input]: id }')],
  ['effectful constructor', fn.replace('{ id }', '{ id: new Value() }')],
  ['interpolated Serene tag', fn.replace('WHERE id = :id', 'WHERE id = ${id}')],
  ['shadowed import', fn.replace('db: any, id: string', 'sql: any, db: any, id: string')],
  ['imported provenance', fn.replace('sql`SELECT secret_column FROM users WHERE id = :id`', 'importedStatement')],
  ['function expression', 'const load = ' + fn.replace('export function load', 'function')],
];
for (const [label, body] of conservative) test(`uncertain/mixed ${label} is fully source-visible`, () => {
  const text = imports + body;
  const result = filter(text);
  assert.equal(result.filtered, false);
  assert.equal(visible(result), text);
});

test('finite ORDER BY and native named binding remain eligible', () => {
  const text = source.replace('const query = bind(statement, { id }, \'indexed\');',
    'const ordered = orderBy(statement, { id: sort`id ASC` }, id);\n  const query = bind(ordered, { id });').replace('query.values', 'query.params');
  assert.equal(markers(filter(text)).length, 1);
});

test('repeated calls are deterministic, inputs are unchanged, and result edits confer no authority', () => {
  const s = Object.freeze(snapshot());
  const response = Object.freeze({ ...s, ranges: Object.freeze([Object.freeze(range(source))]) });
  const first = filterConstructionSource(s, response);
  const second = filterConstructionSource(s, response);
  assert.deepEqual(first, second);
  first.ranges[0].parts.length = 0;
  assert.deepEqual(filterConstructionSource(s, response), second);
  assert.deepEqual(response.ranges, [range(source)]);
});

test('malformed API envelopes throw instead of producing a trusted marker', () => {
  assert.throws(() => filterConstructionSource({}, {}), TypeError);
  assert.throws(() => filterConstructionSource(snapshot(), { ...snapshot(), ranges: [{ text: null }] }), TypeError);
  assert.throws(() => filterConstructionSource(snapshot(), { ...snapshot(), ranges: null }), TypeError);
});
