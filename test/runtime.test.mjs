import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postgres, mysql, mssql, sort, orderBy, bind, review, SereneError } from '../dist/index.js';
import { compile } from '../dist/scanner.js';

const throwsCode = (fn, code) => assert.throws(fn, error => error instanceof SereneError && error.level === 'violation' && error.code === code);

test('hostile values never become SQL text; indexed repeats share a slot', () => {
  const hostile = "x'); DROP TABLE users; --";
  const q = bind(postgres`SELECT :id::int, :id, :name`, { id: 7, name: hostile });
  assert.equal(q.text, 'SELECT $1::int, $1, $2');
  assert.deepEqual(q.values, [7, hostile]);
  assert.deepEqual(q.names, ['id', 'name']);
  assert.equal(review(q).level, 'ordinary');
});
test('mysql repeats are occurrence-ordered; native prepared execution receives values', () => {
  const q = bind(mysql`SELECT :id, :id, :name`, { name: 'alice', id: 7 });
  assert.equal(q.text, 'SELECT ?, ?, ?');
  assert.deepEqual(q.values, [7, 7, 'alice']);
  assert.deepEqual(q.names, ['id', 'id', 'name']);
});
test('mssql accepts native named form, preserves system variables, deduplicates', () => {
  const q = bind(mssql`SELECT @id, :id, @@ROWCOUNT, :name`, { id: 7, name: 'a' });
  assert.equal(q.text, 'SELECT @id, @id, @@ROWCOUNT, @name');
  assert.deepEqual(q.names, ['id', 'name']);
  assert.deepEqual(q.values, [7, 'a']);
});
test('missing, inherited, unused, undefined and accessor parameters fail', () => {
  const q = postgres`SELECT :id`;
  throwsCode(() => bind(q), 'MISSING_PARAMETER');
  throwsCode(() => bind(q, Object.create({ id: 7 })), 'MISSING_PARAMETER');
  throwsCode(() => bind(q, { id: 7, extra: 8 }), 'UNUSED_PARAMETER');
  throwsCode(() => bind(q, { id: undefined }), 'PARAMETER_VALUE');
  throwsCode(() => bind(q, { get id() { throw Error('must not execute'); } }), 'PARAMETER_VALUE');
  throwsCode(() => bind(q, { id: 7, [Symbol()]: 1 }), 'UNUSED_PARAMETER');
  throwsCode(() => bind(q, null), 'PARAMETERS');
  assert.deepEqual(bind(q, { id: null }).values, [null]);
});
test('prototype-sensitive parameter names are own properties, not prototypes', () => {
  const params = Object.create(null);
  params.__proto__ = 1; params.constructor = 2; params.toString = 3;
  assert.deepEqual(bind(postgres`SELECT :__proto__, :constructor, :toString`, params).values, [1, 2, 3]);
});
test('interpolation and common fake literals fail at runtime', () => {
  throwsCode(() => postgres`SELECT ${'bad'}`, 'LITERAL_ONLY');
  throwsCode(() => sort`${'id'}`, 'LITERAL_ONLY');
  throwsCode(() => postgres('SELECT 1'), 'LITERAL_ONLY');
  throwsCode(() => postgres(Object.assign(['SELECT 1'], { raw: ['SELECT 1'] })), 'LITERAL_ONLY');
});
test('opaque identity cannot be supplied by shape, spreading, proxies or casting', () => {
  for (const fake of [{}, { text: 'SELECT 1' }, { ...postgres`SELECT 1` }, new Proxy(postgres`SELECT 1`, {})]) {
    throwsCode(() => bind(fake), 'UNSCREENED');
    assert.equal(review(fake).level, 'review-required');
  }
  assert.equal(review('SELECT 1').level, 'review-required');
  assert.equal(review(null).level, 'review-required');
});
test('text and names are immutable; values are driver-friendly copies', () => {
  const sql = postgres`SELECT :id`;
  const q = bind(sql, { id: 1 });
  assert.throws(() => { q.text = 'changed'; }, TypeError);
  assert.throws(() => q.names.push('extra'), TypeError);
  q.values[0] = 2;
  assert.deepEqual(bind(sql, { id: 1 }).values, [1]);
  assert.equal(review({ ...q }).level, 'review-required');
});
test('sort selection is finite, snapshots the selected ordering, preserves bindings', () => {
  const base = postgres`SELECT id, name FROM users WHERE id > :min -- tail`;
  const choices = { name: sort`name ASC, id DESC`, id: sort`users.id DESC` };
  const selected = orderBy(base, choices, 'name');
  choices.name = sort`id ASC`;
  assert.equal(bind(selected, { min: 1 }).text, 'SELECT id, name FROM users WHERE id > $1 -- tail\nORDER BY name ASC, id DESC');
  throwsCode(() => orderBy(base, choices, '__proto__'), 'SORT_KEY');
  throwsCode(() => orderBy(base, choices, 'id; DROP TABLE users'), 'SORT_KEY');
  throwsCode(() => orderBy(selected, choices, 'id'), 'SORT_POSITION');
  throwsCode(() => orderBy(postgres`SELECT 1;`, choices, 'id'), 'SORT_POSITION');
  throwsCode(() => orderBy(base, { id: {} }, 'id'), 'SORT_CHOICES');
  throwsCode(() => orderBy(base, { get id() { throw Error('not called'); } }, 'id'), 'SORT_CHOICES');
});
test('sort rejects general SQL fragments', () => {
  throwsCode(() => sort`id; DROP TABLE users`, 'SORT_TERMS');
  throwsCode(() => sort`id -- comment`, 'SORT_TERMS');
  throwsCode(() => sort`random()`, 'SORT_TERMS');
  throwsCode(() => sort`:column`, 'SORT_TERMS');
  throwsCode(() => sort``, 'SORT_TERMS');
});
test('runtime template authenticity is not a security boundary: audit must catch spoofing', () => {
  const text = 'SELECT 1';
  const forged = Object.freeze(Object.assign([text], { raw: Object.freeze([text]) }));
  assert.equal(review(postgres(forged)).level, 'ordinary');
  // Deliberately documents why ordinary runtime provenance alone is insufficient.
});
test('standard JS escapes allow MySQL quoted identifiers', () => {
  assert.equal(bind(mysql`SELECT \`column:id\`, :id`, { id: 1 }).text, 'SELECT `column:id`, ?');
});

const lexicalCases = [
  ['postgres', "SELECT ':no', 'it''s :no', \"x:no\", :id::int -- :no\rSELECT :id", "SELECT ':no', 'it''s :no', \"x:no\", $1::int -- :no\rSELECT $1", ['id']],
  ['postgres', 'SELECT $$ :no $$, $body$ :no $body$, $日本$ :no $日本$, :id', 'SELECT $$ :no $$, $body$ :no $body$, $日本$ :no $日本$, $1', ['id']],
  ['postgres', 'SELECT /* a /* :no */ :no */ :id', 'SELECT /* a /* :no */ :no */ $1', ['id']],
  ['postgres', 'SELECT x$tag$, :id', 'SELECT x$tag$, $1', ['id']],
  ['postgres', 'SELECT a @> :id, a ? :key', 'SELECT a @> $1, a ? $2', ['id', 'key']],
  ['mysql', "SELECT ':no', \"x:no\", `a``:no`, :id # :no\r, :id", "SELECT ':no', \"x:no\", `a``:no`, ? # :no\r, ?", ['id', 'id']],
  ['mysql', 'SELECT 1--2, :id -- :no\n', 'SELECT 1--2, ? -- :no\n', ['id']],
  ['mssql', "SELECT [a]]:no], N':no', /* a /* :no */ b */ :id", "SELECT [a]]:no], N':no', /* a /* :no */ b */ @id", ['id']],
];
for (const [dialect, sql, expected, names] of lexicalCases) {
  test(`lexical ${dialect}: ${sql.slice(0, 45)}`, () => {
    const q = compile(sql, dialect);
    assert.equal(q.text, expected); assert.deepEqual(q.names, names);
  });
}
for (const [dialect, sql, code] of [
  ['postgres', "SELECT 'unclosed", 'UNCLOSED'],
  ['postgres', 'SELECT $tag$unclosed', 'UNCLOSED'],
  ['postgres', 'SELECT /* unclosed', 'UNCLOSED'],
  ['mssql', 'SELECT [unclosed', 'UNCLOSED'],
  ['mysql', 'SELECT `unclosed', 'UNCLOSED'],
  ['postgres', "SELECT E'\\x'", 'BACKSLASH_QUOTE'],
  ['mysql', "SELECT 'a\\b'", 'BACKSLASH_QUOTE'],
  ['mysql', 'SELECT /*! :id */', 'EXECUTABLE_COMMENT'],
  ['mysql', 'SELECT /*+ :id */', 'EXECUTABLE_COMMENT'],
  ['mysql', 'SELECT /* outer /* inner */ outer */', 'NESTED_COMMENT'],
  ['postgres', 'SELECT $1, :id', 'MIXED_PARAMETERS'],
  ['mysql', 'SELECT ?, :id', 'MIXED_PARAMETERS'],
  ['postgres', 'SELECT foo:id', 'PARAMETER_BOUNDARY'],
  ['postgres', 'SELECT :id日本', 'PARAMETER_NAME'],
  ['postgres', "SELECT '\0'", 'NUL'],
]) {
  test(`reject ${dialect} ${code}: ${sql}`, () => throwsCode(() => compile(sql, dialect), code));
}
test('deterministic hostile corpus: changing values cannot change any generated SQL', () => {
  const payloads = ["'", '\\', '\0', '--', '/*', ':id', '$1', '?', '@id', '日本', '😀', 'x; DELETE FROM users'];
  for (const tag of [postgres, mysql, mssql]) {
    const sql = tag`SELECT :value, :value`;
    const expected = bind(sql, { value: null }).text;
    for (const value of payloads) assert.equal(bind(sql, { value }).text, expected);
  }
});
