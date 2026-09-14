import test from 'node:test';
import assert from 'node:assert/strict';
import { sql, bind, externalSql, bindExternal, review, materializeTemp, orderBy } from '@mk3008/serene';
import { auditSource } from '@mk3008/serene/audit';
import { filterConstructionSource, filterConstructionDiff } from '@mk3008/serene/filter';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const external = { level: 'review-required', code: 'EXTERNAL_SQL' };
const fail = code => e => e.code === code;
const prefix = "import { externalSql, bindExternal, sql, bind, materializeTemp, orderBy } from '@mk3008/serene';\n";

test('external binding shares all modes and shielding without gaining source identity', () => {
  const source = sql`SELECT :id, :id, ARRAY[:other], ':id', ":id", $$:id$$, $body$:id$body$, E'\\\':id' /* :id /* :other */ */ -- :id`;
  const stmt = externalSql(source.sourceText);
  assert.ok(Object.isFrozen(stmt));
  assert.deepEqual(review(stmt), external);
  for (const style of [undefined, 'indexed', 'anonymous']) {
    const params = { id: 7, other: "'; DROP TABLE users; --" };
    const q = bindExternal(stmt, params, style);
    assert.deepEqual(q, bind(source, params, style));
    assert.deepEqual(review(q), external);
    assert.equal(review(bind(source, params, style)).level, 'ordinary');
    params.id = 9;
    assert.equal(q.params.id, 7);
    assert.equal(q.values[0], 7);
    assert.ok(Object.isFrozen(q));
    assert.ok(Object.isFrozen(q.params));
    assert.ok(Object.isFrozen(q.names));
    assert.throws(() => { q.text = 'SELECT 0'; }, TypeError);
  }
});

test('external path matches existing validation errors and passthrough contract', () => {
  for (const [source, params, style] of [
    [sql`SELECT :id`, { id: undefined }, 'indexed'],
    [sql`SELECT :id`, { 'bad-name': 1 }, 'indexed'],
    [sql`SELECT :id`, { get id() { throw Error('must not invoke'); } }, 'indexed'],
    [sql`SELECT 1`, { id: 1 }, 'anonymous'],
    [sql`SELECT :id, $1`, { id: 1 }, 'indexed'],
    [sql`SELECT :id, ?`, { id: 1 }, 'anonymous'],
    [sql`SELECT $日本$:id$日本$`, { id: 1 }, 'indexed'],
    [sql`SELECT :id`, null, 'indexed'],
    [sql`SELECT :id`, {}, 'invalid'],
  ]) {
    let expected;
    assert.throws(() => bind(source, params, style), e => { expected = e.code; return true; });
    assert.throws(() => bindExternal(externalSql(source.sourceText), params, style), fail(expected));
  }
  assert.equal(bindExternal(externalSql('SELECT @id, [customer:id]'), { unused: 1 }).text, 'SELECT @id, [customer:id]');
  assert.equal(bindExternal(externalSql('SELECT :missing'), {}, 'indexed').text, 'SELECT :missing');
});

test('casts, copied shapes, bound objects and caller assertions cannot promote external SQL', () => {
  const stmt = externalSql('SELECT 1');
  const q = bindExternal(stmt);
  for (const value of [stmt, q, { ...stmt }, { ...q }, Object.create(stmt), { sourceText: 'SELECT 1', trusted: true }]) {
    assert.throws(() => bind(value), fail('UNSCREENED'));
    assert.throws(() => materializeTemp(value, 's'), fail('UNSCREENED'));
    assert.throws(() => orderBy(value, {}, []), fail('UNSCREENED'));
    assert.notEqual(review(value).level, 'ordinary');
  }
  for (const value of ['SELECT 1', null, {}, { ...stmt }, Object.create(stmt), sql`SELECT 1`, q]) {
    assert.throws(() => bindExternal(value), fail('UNSCREENED'));
  }
  for (const value of [null, undefined, {}, new String('SELECT 1'), 1]) {
    assert.throws(() => externalSql(value), fail('EXTERNAL_SQL_TEXT'));
  }
  assert.deepEqual(review(externalSql('SELECT 1', { trusted: true })), external);
});

test('external source, binds, driver shapes and literal content remain review-visible', () => {
  for (const declaration of [
    "const s=externalSql('CREATE TABLE users(id int); CALL p()'); const q=bindExternal(s);",
    "const make=externalSql; const lower=bindExternal; const text='CREATE TABLE users(id int); CALL p()'; const s=make(text); const q=lower(s);",
  ]) {
    for (const sink of ['db.query(q)', 'db.query(q.text,q.values)', 'db.query({text:q.text,values:q.values})']) {
      const rows = auditSource(prefix + declaration + sink);
      assert.ok(rows.length >= 3);
      for (const row of rows) {
        assert.equal(row.level, 'review-required');
        assert.equal(row.code, 'EXTERNAL_SQL');
        for (const code of ['SQL_PERSISTENT_DDL', 'SQL_ROUTINE_CALL']) assert.ok(row.reviewSignals.some(s => s.code === code));
      }
    }
  }
  for (const expr of ['externalSql(loadSql())', 'externalSql("SELECT " + input)', 'externalSql(`SELECT ${input}`)',
    'bindExternal(sql`SELECT 1`)', 'bindExternal(externalSql(input))', 'bind(externalSql(input) as Sql)',
    'materializeTemp(externalSql(input), "s")', 'orderBy(externalSql(input), {}, [])',
    'externalSql(input) as Sql']) {
    const row = auditSource(prefix + 'const q=' + expr + '; db.query(q.text,q.values);').find(r => r.boundary === 'driver-candidate');
    assert.notEqual(row.level, 'ordinary', expr);
  }
  const aliased = auditSource("import {externalSql as ext, bindExternal as lower} from '@mk3008/serene'; db.query(lower(ext(input))); ");
  assert.ok(aliased.every(r => r.level === 'review-required' && r.code === 'EXTERNAL_SQL'));
});

test('external SQL stays in source/diff delivery and fails strict CLI', () => {
  const source = prefix + 'function run(db, input) { const q=bindExternal(externalSql(input)); return db.query(q.text,q.values); }';
  const snap = revision => ({ source, file: 'query.ts', revision });
  const range = { start: 0, end: source.length, text: source };
  const base = snap('b'), head = snap('h');
  assert.equal(filterConstructionSource(head, { ...head, ranges: [range] }).filtered, false);
  assert.equal(filterConstructionDiff({ base, head }, { base, head, changes: [{ base: range, head: range }] }).filtered, false);
  const dir = mkdtempSync(join(tmpdir(), 'serene-external-'));
  try {
    const file = join(dir, 'query.ts'); writeFileSync(file, source);
    const r = spawnSync(process.execPath, [new URL('../tooling/cli.mjs', import.meta.url).pathname, '--strict', '--actionable-only', file], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stderr);
    assert.ok(JSON.parse(r.stdout).findings.every(r => r.level === 'review-required' && r.code === 'EXTERNAL_SQL'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
