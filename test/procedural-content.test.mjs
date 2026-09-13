import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSource } from '@mk3008/serene/audit';
import { filterConstructionSource, filterConstructionDiff } from '@mk3008/serene/filter';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const prefix = "import { sql, bind, orderBy, sort } from '@mk3008/serene';\n";
const tag = text => 'sql`' + text.replaceAll('\\', '\\\\').replaceAll('`', '\\`') + '`';
const source = text => prefix + 'const stmt = ' + tag(text) + ';\nfunction run(db) { const q = bind(stmt); return db.query(q.text, q.values); }';
const procedural = row => (row.reviewSignals ?? []).filter(s => ['SQL_PROCEDURAL_BODY', 'SQL_ROUTINE_CALL'].includes(s.code));
const codes = row => procedural(row).map(s => s.code);
const context = (source, revision) => ({ source, revision, file: 'queries.ts' });
const range = (source, start = 0, end = source.length) => ({ start, end, text: source.slice(start, end) });
const bodyCases = [
  'DO $$ BEGIN FOR r IN SELECT 1 LOOP UPDATE users SET active = true; END LOOP; END $$;',
  'do /* note */ $body$ BEGIN PERFORM work(); END $body$ LANGUAGE plpgsql',
  "DO LANGUAGE plpgsql 'BEGIN PERFORM work(); END'",
  'DO LANGUAGE "plpgsql" $$ BEGIN NULL; END $$',
  "DO E'BEGIN RAISE NOTICE \\'hello\\'; END'",
  'SELECT 1 WHERE true; DO $$ BEGIN NULL; END $$',
  'CREATE FUNCTION f() RETURNS int AS $$ BEGIN RETURN 1; END $$ LANGUAGE plpgsql',
  'CREATE OR REPLACE FUNCTION f() RETURNS int AS $$ SELECT 1 $$ LANGUAGE sql',
  'CREATE PROCEDURE p() LANGUAGE plpgsql AS $$ BEGIN NULL; END $$',
  'CREATE TRIGGER tr BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION f()',
  'CREATE OR ALTER PROC dbo.p AS BEGIN SELECT 1; END',
  'ALTER PROCEDURE dbo.p AS BEGIN SELECT 1; END',
  'ALTER FUNCTION dbo.f() RETURNS int AS BEGIN RETURN 1; END',
  'ALTER TRIGGER tr ON users AFTER INSERT AS BEGIN SELECT 1; END',
  'CREATE PROCEDURE p() BEGIN DECLARE n INT; SET n = 1; END',
  'CREATE FUNCTION f() RETURNS INT DETERMINISTIC BEGIN RETURN 1; END',
  'CREATE TRIGGER tr BEFORE INSERT ON users FOR EACH ROW SET NEW.active = 1',
  'CREATE OR REPLACE PROCEDURE p() BEGIN SELECT 1; END',
];
for (const text of bodyCases) test(`procedural container: ${text}`, () => {
  for (const row of auditSource(source(text))) {
    assert.equal(row.level, 'ordinary');
    assert.deepEqual(codes(row), ['SQL_PROCEDURAL_BODY']);
    assert.equal(procedural(row)[0].priority, 'elevated');
    const persistent = row.reviewSignals.some(s => s.code === 'SQL_PERSISTENT_DDL');
    assert.equal(persistent, /^(?:CREATE|ALTER)/.test(text));
  }
});
const callCases = [
  'CALL some_procedure(:id)', 'call schema_name.p()', 'CALL `p`()',
  'EXEC some_procedure @id', 'EXECUTE dbo.some_procedure @id',
  'EXEC @result = dbo.p @id', 'EXEC @procedure_name @id',
  "EXEC(N'SELECT 1')", "EXECUTE ('SELECT 1')", 'EXEC sp_executesql @stmt, @params, @id',
  'EXEC [dbo].[p] @id', 'EXECUTE prepared_statement',
  'SELECT 1 WHERE true; /* note */ EXECUTE dbo.p @id',
];
for (const text of callCases) test(`explicit execution: ${text}`, () => {
  for (const row of auditSource(source(text))) {
    assert.equal(row.level, 'ordinary');
    assert.deepEqual(codes(row), ['SQL_ROUTINE_CALL']);
    assert.equal(procedural(row)[0].priority, 'elevated');
    assert.ok(!row.reviewSignals.some(s => s.code === 'SQL_PERSISTENT_DDL'));
    assert.match(procedural(row)[0].detail, /routine or database-side execution/);
  }
});

test('ordinary quotes, identifiers, transactions and CRUD do not imply procedural content', () => {
  for (const text of [
    'SELECT $$text$$', 'SELECT $body$; CALL p(); DO $$x$$; CREATE PROCEDURE p()$body$ WHERE true',
    "SELECT '; EXEC p; CREATE FUNCTION f()' WHERE true",
    'SELECT "x; CALL p()" FROM users WHERE true', 'SELECT `x; EXEC p` FROM users WHERE true',
    'SELECT [x; EXEC p] FROM users WHERE true',
    '-- CALL p()\nSELECT 1 WHERE true', '/* DO $$x$$; EXEC p */ SELECT 1 WHERE true',
    'SELECT 1; /* CREATE PROCEDURE p() */ SELECT 2 WHERE true',
    'BEGIN; SELECT 1 WHERE true; COMMIT', 'BEGIN TRANSACTION; UPDATE users SET active=1 WHERE id=1; END',
    'BEGIN SELECT 1 WHERE true; END', 'SELECT lower(name), some_function(id) FROM users WHERE true',
    'INSERT INTO users VALUES (1) ON CONFLICT DO NOTHING', 'DO some_function(1)',
    'CREATE TABLE users(id int)', 'CREATE VIEW v AS SELECT 1 WHERE true',
    'CREATE TEMP TABLE work(id int)', 'EXECUTE AS USER = \'someone\'',
    'SELECT execute, call, do_work FROM users WHERE true',
  ]) assert.deepEqual(auditSource(source(text)).flatMap(codes), [], text);
});

test('scope remains recognized Serene tags, not raw or migration SQL', () => {
  for (const text of ['db.query("CALL p()")', 'other`DO $$ BEGIN NULL; END $$`', prefix + 'sql`CALL ${name}()`']) {
    assert.deepEqual(auditSource(text).flatMap(codes), []);
  }
  assert.deepEqual(auditSource('CALL p()', 'migration.sql').flatMap(codes), []);
});

test('signals deduplicate independently and do not inspect a dollar-quoted body', () => {
  const rows = auditSource(source('DO $$ BEGIN EXECUTE text; END $$; CALL p(); CALL q(); DO $$ BEGIN NULL; END $$'));
  for (const row of rows) assert.deepEqual(codes(row), ['SQL_PROCEDURAL_BODY', 'SQL_ROUTINE_CALL']);
});

test('both signals propagate through aliases, finite ordering and native QueryConfig', () => {
  for (const text of ['DO $$ BEGIN NULL; END $$', 'CALL p()']) {
    const s = prefix + 'const stmt = ' + tag(text) + '; const alias = stmt; const q = bind(alias);';
    for (const call of ['db.query(q.text,q.values)', 'db.query(q)', 'db.query({text:q.text,values:q.values})', 'db.query(bind(orderBy(alias,{id:sort`id ASC`},"id")).text)']) {
      const row = auditSource(s + call).find(r => r.boundary === 'driver-candidate');
      assert.equal(row.level, 'ordinary');
      assert.equal(procedural(row).length, 1);
      assert.equal(procedural(row)[0].priority, 'elevated');
    }
  }
});

test('both signals keep execution outside a requested source range visible', () => {
  for (const text of ['DO $$ BEGIN NULL; END $$', 'CALL p()']) {
    const s = source(text), snapshot = context(s, 'r'), ranges = [range(s, s.indexOf('function run'))];
    const result = filterConstructionSource(snapshot, { ...snapshot, ranges });
    assert.equal(result.filtered, false);
    assert.deepEqual(result.ranges, ranges);
  }
});

test('gained, lost and changed procedural signals retain diff edits and navigation', () => {
  const ordinary = source('SELECT 1 WHERE true');
  for (const text of ['DO $$ BEGIN NULL; END $$', 'CALL p()']) {
    const flagged = source(text);
    for (const [b, h] of [[ordinary, flagged], [flagged, ordinary], [flagged, source(text + ' ') ]]) {
      const snapshot = { base: context(b, 'b'), head: context(h, 'h') };
      const changes = [{ base: range(b, 0, b.indexOf('\nfunction')), head: range(h, 0, h.indexOf('\nfunction')) }];
      const result = filterConstructionDiff(snapshot, { ...snapshot, changes });
      assert.equal(result.filtered, false);
      assert.deepEqual(result.changes, changes.map((change, index) => ({ index, kind: 'source', ...change })));
      if (b === ordinary || h === ordinary) {
        assert.equal(result.reason, 'ordinary-set-changed');
        assert.ok([...result.transitions.base, ...result.transitions.head].some(row => row.function === 'run'));
      }
    }
  }
});

test('every CLI mode retains both signals without changing construction gates', () => {
  const dir = mkdtempSync(join(tmpdir(), 'serene-procedural-'));
  try {
    const file = join(dir, 'query.ts');
    writeFileSync(file, source('DO $$ BEGIN NULL; END $$; CALL p()'));
    for (const args of [[], ['--strict'], ['--actionable-only'], ['--strict', '--actionable-only']]) {
      const cli = spawnSync(process.execPath, [new URL('../tooling/cli.mjs', import.meta.url).pathname, ...args, file], { encoding: 'utf8' });
      assert.equal(cli.status, 0, cli.stderr);
      const report = JSON.parse(cli.stdout), row = report.findings.find(r => r.boundary === 'driver-candidate');
      assert.equal(row.level, 'ordinary');
      assert.deepEqual(codes(row), ['SQL_PROCEDURAL_BODY', 'SQL_ROUTINE_CALL']);
      if (args.includes('--actionable-only')) {
        assert.equal(report.executionSiteCounts.ordinary, 1);
        assert.equal(report.contentReviewExecutionSiteCount, 1);
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
