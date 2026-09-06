import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sql, bind, orderBy, sort } from '../dist/index.js';
const code = (fn, code) => assert.throws(fn, e => e.code === code);

test('PostgreSQL arrays, subscripts and JSON operators preserve all other text', () => {
  const stmt = sql`SELECT ARRAY[:a, :b], arr[:i], matrix[:i][:j],
    payload #> :path, payload #>> :path, payload ? :key,
    payload ?| ARRAY[:key], payload ?& ARRAY[:key],
    payload @> :json, payload <@ :json, payload @? :jp, payload @@ :jp`;
  const q = bind(stmt, { jp: '$.a', json: '{}', key: 'a', path: ['a'], j: 2, i: 1, b: 20, a: 10 }, 'indexed');
  assert.equal(q.text, `SELECT ARRAY[$1, $2], arr[$3], matrix[$3][$4],
    payload #> $5, payload #>> $5, payload ? $6,
    payload ?| ARRAY[$6], payload ?& ARRAY[$6],
    payload @> $7, payload <@ $7, payload @? $8, payload @@ $8`);
  assert.deepEqual(q.values, [10, 20, 1, 2, ['a'], 'a', '{}', '$.a']);
});

test('only requested whole ASCII names bind; casts and other colon uses survive', () => {
  const q = bind(sql`SELECT :id, :id2, :other, :id::int, foo:id, :id日本, arr[1:upper]`, { id: 9 }, 'indexed');
  assert.equal(q.text, 'SELECT $1, :id2, :other, $1::int, foo:id, :id日本, arr[1:upper]');
  assert.deepEqual(q.values, [9]);
  code(() => bind(sql`SELECT :id`, { 'id); DROP TABLE t;--': 1 }), 'PARAMETER_NAME');
  code(() => bind(sql`SELECT :id2`, { id: 1 }), 'UNUSED_PARAMETER');
});

test('quoted and commented occurrences never allocate slots, even for requested names', () => {
  const stmt = sql`SELECT ':id', "x:id", \`x:id\`, $$ :id $1 ? @id $$,
    $body$ :id /* */ ' $body$, E'a\\\' :id', 'a\\', :other,
    /* outer :id /* inner :other */ :id */ :id --:other
    , :other`;
  const q = bind(stmt, { id: 7, other: 8 }, 'indexed');
  assert.equal(q.text, stmt.sourceText.replace("'a\\', :other", "'a\\', $1").replace('*/ :id --', '*/ $2 --').replace(', :other', ', $1'));
  assert.deepEqual(q.values, [8, 7]);
  const anonymous = bind(sql`SELECT :b /* :a */, :a, :b --:a`, { a: 1, b: 2 }, 'anonymous');
  assert.deepEqual(anonymous.values, [2, 1, 2]);
  assert.equal(anonymous.text, 'SELECT ? /* :a */, ?, ? --:a');
});

test('SQL authoring accepts uninterpreted forms and incomplete SQL', () => {
  for (const stmt of [sql`SELECT 'unclosed`, sql`SELECT /* unclosed`, sql`SELECT ARRAY[:id]`,
    sql`SELECT @@ROWCOUNT`, sql`SELECT [Column Name]`, sql`SELECT :1, :日本`,
    sql`SELECT /*! fixed */ 1`, sql`SELECT /*+ fixed */ 1`, sql`SELECT 1--2`, sql`SELECT '\0'`]) {
    assert.equal(bind(stmt).text, stmt.sourceText);
  }
});

test('native marker conflicts fail only for the selected output contract', () => {
  for (const [stmt, style] of [[sql`SELECT $1, :id`, 'indexed'],
    [sql`SELECT ?, :id`, 'anonymous'], [sql`SELECT @id, :id`, 'at-named'],
    [sql`SELECT payload ? :id`, 'anonymous'], [sql`SELECT payload @? :id`, 'anonymous']]) {
    code(() => bind(stmt, { id: 7 }, style), 'MIXED_PARAMETERS');
  }
  assert.equal(bind(sql`SELECT payload ? :id`, { id: 'x' }, 'indexed').text, 'SELECT payload ? $1');
  assert.equal(bind(sql`SELECT @@ROWCOUNT, :id`, { id: 7 }, 'at-named').text, 'SELECT @@ROWCOUNT, @id');
  assert.equal(bind(sql`SELECT foo$1, :id`, { id: 7 }, 'indexed').text, 'SELECT foo$1, $1');
  assert.equal(bind(sql`SELECT $1, :id`, { id: 7 }).text, 'SELECT $1, :id');
});

test('quote and comment shielding does not hide genuine suffix terminators', () => {
  const choices = { id: sort`id` };
  for (const stmt of [sql`SELECT $$;$$, :id`, sql`SELECT 1 /* ; /* ; */ ; */`]) {
    assert.ok(orderBy(stmt, choices, 'id').sourceText.endsWith('\nORDER BY id'));
  }
  code(() => orderBy(sql`SELECT $$;$$;`, choices, 'id'), 'SORT_POSITION');
});

test('hostile values cannot affect complex SQL text or requested slot ordering', () => {
  const stmt = sql`SELECT ARRAY[:value], :value::text, '{}'::jsonb ? :key /* :value */`;
  for (const value of ["'); DROP TABLE t;--", '$1', ':key', '?', '\0', {}, ['x']]) {
    const q = bind(stmt, { key: 'x', value }, 'indexed');
    assert.equal(q.text, "SELECT ARRAY[$1], $1::text, '{}'::jsonb ? $2 /* :value */");
    assert.equal(q.values[0], value);
    assert.equal(q.values[1], 'x');
  }
});

test('adjacent double dash uses line-comment semantics; use explicit subtraction', () => {
  for (const style of ['named', 'indexed', 'anonymous', 'at-named']) {
    code(() => bind(sql`SELECT 5--1, :id`, { id: 7 }, style), 'UNUSED_PARAMETER');
    code(() => bind(sql`SELECT 5--1, :id
      , :other`, { id: 7, other: 8 }, style), 'UNUSED_PARAMETER');
  }
  const q = bind(sql`SELECT 5 - (-1), :id`, { id: 7 }, 'indexed');
  assert.equal(q.text, 'SELECT 5 - (-1), $1');
  assert.deepEqual(q.values, [7]);
});

test('non-ASCII dollar delimiters fail before requested names can be rewritten', () => {
  for (const stmt of [sql`SELECT $日本$ :id $日本$, :id`,
    sql`SELECT $body日本$ :id $body日本$`, sql`SELECT $é_1$ :id $é_1$`,
    sql`SELECT :id, $日本$ literal $日本$`, sql`SELECT $日本$ :id`]) {
    for (const style of ['named', 'indexed', 'anonymous', 'at-named']) {
      assert.throws(() => bind(stmt, { id: 7 }, style), error =>
        error.code === 'UNSUPPORTED_DOLLAR_QUOTE' && error.level === 'violation' &&
        error.offset === stmt.sourceText.indexOf('$'));
    }
  }
  code(() => bind(sql`SELECT $日本$ literal $日本$`), 'UNSUPPORTED_DOLLAR_QUOTE');
});

test('ASCII dollar quoting is canonical; lookalikes in shielded text remain unchanged', () => {
  const stmt = sql`SELECT $$ :id $$, $body_1$ :id $body_1$, :id,
    '$日本$ :id $日本$', $body$ $日本$ :id $日本$ $body$,
    x$日本$ /* $日本$ :id */ -- $日本$ :id
    , :id`;
  const q = bind(stmt, { id: 7 }, 'indexed');
  assert.equal(q.text, `SELECT $$ :id $$, $body_1$ :id $body_1$, $1,
    '$日本$ :id $日本$', $body$ $日本$ :id $日本$ $body$,
    x$日本$ /* $日本$ :id */ -- $日本$ :id
    , $1`);
  assert.deepEqual(q.values, [7]);
});
