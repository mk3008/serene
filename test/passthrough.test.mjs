import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sql, bind, review } from '../dist/index.js';

test('native named SQL is unchanged; params order does not depend on SQL occurrences', () => {
  const stmt = sql`SELECT [customer:id], [a]]:name], $100.00, @@ROWCOUNT, @id, @id, :name`;
  const params = { unused: 8, name: 'x', id: 7 };
  const q = bind(stmt, params);
  assert.equal(q.text, stmt.sourceText);
  assert.equal(q.sourceText, stmt.sourceText);
  assert.deepEqual(q.names, ['unused', 'name', 'id']);
  assert.deepEqual(q.values, [8, 'x', 7]);
  assert.deepEqual(q.params, params);
  params.id = 9;
  assert.equal(q.params.id, 7);
  assert.equal(review(q).level, 'ordinary');
  assert.throws(() => { q.params.id = 10; }, TypeError);
});

test('passthrough bypasses all replacement, lexical guards and marker collisions', () => {
  const stmt = sql`SELECT $日本$ :id $日本$, $1, ?, @id, :id, ':id' --1, :id`;
  for (const q of [bind(stmt, { id: 7, extra: 8 }), bind(stmt, { id: 7 }, undefined), bind(stmt)]) {
    assert.equal(q.text, stmt.sourceText);
  }
  assert.equal(bind(sql`SELECT 'unclosed`, { id: 1 }).text, "SELECT 'unclosed");
});

test('removed styles fail at runtime rather than becoming passthrough', () => {
  for (const style of ['named', 'at-named', 'passthrough', null, 'postgres']) {
    assert.throws(() => bind(sql`SELECT @id`, { id: 7 }, style), {code: 'PARAMETER_STYLE'});
  }
});

test('passthrough validates supplied data without reading accessors or rendering values', () => {
  const stmt = sql`SELECT @id`;
  const hostile = "'); DROP TABLE t;--";
  assert.equal(bind(stmt, { id: hostile }).text, stmt.sourceText);
  assert.throws(() => bind(stmt, { get id() { throw Error('must not read'); } }), {code: 'PARAMETER_VALUE'});
  assert.throws(() => bind(stmt, { id: undefined }), {code: 'PARAMETER_VALUE'});
  assert.throws(() => bind(stmt, { 'id;--': 1 }), {code: 'PARAMETER_NAME'});
  assert.deepEqual(bind(stmt, Object.create({ id: 7 })).params, {});
});
