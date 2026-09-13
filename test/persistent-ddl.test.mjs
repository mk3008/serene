import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSource } from '@mk3008/serene/audit';
import { filterConstructionSource, filterConstructionDiff } from '@mk3008/serene/filter';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const prefix = "import { sql, bind } from '@mk3008/serene';\n";
const source = text => prefix + 'const stmt = sql`' + text + '`;\nfunction run(db) { const q = bind(stmt); return db.query(q.text, q.values); }';
const ddl = row => row.reviewSignals?.find(s => s.code === 'SQL_PERSISTENT_DDL');
const context = (source, revision) => ({ source, revision, file: 'queries.ts' });
const range = (source, start = 0, end = source.length) => ({ start, end, text: source.slice(start, end) });

for (const text of [
  'CREATE TABLE users(id int)',
  'create /* header */ table users(id int)',
  'CREATE VIEW users_view AS SELECT * FROM users WHERE true',
  'CREATE OR REPLACE VIEW users_view AS SELECT * FROM users WHERE true',
  'CREATE UNLOGGED TABLE work(id int)',
  'CREATE MATERIALIZED VIEW snapshot AS SELECT 1 WHERE true',
  'ALTER MATERIALIZED VIEW snapshot RENAME TO archived',
  'CREATE FUNCTION f() RETURNS int AS $$ BEGIN RETURN 1; END $$ LANGUAGE plpgsql',
  'CREATE OR REPLACE FUNCTION f() RETURNS int AS $$ SELECT 1 $$ LANGUAGE sql',
  'CREATE PROCEDURE p() LANGUAGE SQL AS $$ SELECT 1 $$',
  'CREATE OR ALTER PROC p AS BEGIN SELECT 1; END',
  'CREATE TRIGGER tr BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION f()',
  'ALTER TABLE users ADD COLUMN active boolean',
  'ALTER VIEW users_view AS SELECT * FROM users WHERE true',
  'ALTER FUNCTION f() RENAME TO g',
  'ALTER PROCEDURE p AS SELECT 1',
  'ALTER TRIGGER tr ON users DISABLE',
  'SELECT 1 WHERE true; CREATE TABLE users(id int); ALTER TABLE users ADD x int',
  'CREATE TEMP TABLE work(id int); CREATE TABLE users(id int)',
]) test(`persistent DDL remains ordinary with elevated content priority: ${text}`, () => {
  const rows = auditSource(source(text));
  assert.ok(rows.some(row => row.boundary === 'driver-candidate'));
  for (const row of rows) {
    assert.equal(row.level, 'ordinary');
    assert.equal(ddl(row)?.priority, 'elevated');
    assert.equal(row.reviewSignals.filter(s => s.code === 'SQL_PERSISTENT_DDL').length, 1);
    assert.match(ddl(row).detail, /runtime SQL path/);
  }
});

for (const text of [
  'CREATE TEMP TABLE work(id int)',
  'CREATE TEMPORARY TABLE work(id int) ON COMMIT DROP',
  'CREATE LOCAL TEMP TABLE work(id int)',
  'CREATE GLOBAL TEMPORARY TABLE work(id int)',
]) test(`TEMP stays advisory: ${text}`, () => {
  for (const row of auditSource(source(text))) {
    assert.equal(ddl(row), undefined);
    assert.ok(row.reviewSignals.some(s => s.code === 'SQL_CREATE_TEMP'));
    assert.ok(row.reviewSignals.every(s => s.priority !== 'elevated'));
  }
});

test('invocations, masked text and unrelated source do not become persistent DDL', () => {
  for (const text of [
    'CALL some_procedure(:id)', 'SELECT some_function(:id)', 'EXEC some_procedure @id',
    "SELECT 'CREATE TABLE users(id int)' WHERE true",
    'SELECT "CREATE VIEW" FROM users WHERE true',
    'SELECT 1 WHERE true -- ALTER TABLE users ADD x int',
    '/* CREATE PROCEDURE p() */ SELECT 1 WHERE true',
    'CREATE TABLESPACE storage', 'ALTER TABLESPACE storage RENAME TO other',
  ]) assert.ok(auditSource(source(text)).every(row => !ddl(row)), text);
  for (const text of [
    'db.query("CREATE TABLE users(id int)")',
    'const stmt = other`CREATE TABLE users(id int)`;',
    prefix + 'sql`CREATE TABLE ${name}(id int)`;',
  ]) assert.ok(auditSource(text).every(row => !ddl(row)), text);
  assert.deepEqual(auditSource('CREATE TABLE users(id int)', 'migration.sql').flatMap(row => row.reviewSignals ?? []), []);
});

test('elevated signal follows const aliases and native QueryConfig', () => {
  const s = prefix + 'const stmt = sql`CREATE TABLE users(id int)`; const alias = stmt; const q = bind(alias);';
  for (const call of ['db.query(q)', 'db.query({text:q.text,values:q.values})']) {
    const row = auditSource(s + call).find(row => row.boundary === 'driver-candidate');
    assert.equal(row.level, 'ordinary');
    assert.equal(ddl(row)?.priority, 'elevated');
  }
});

test('elevated DDL retains outside-range execution source and every diff edit', () => {
  const b = source('SELECT 1 WHERE true'), h = source('CREATE TABLE users(id int)');
  const head = context(h, 'h');
  const ranges = [range(h, h.indexOf('function run'))];
  const filtered = filterConstructionSource(head, { ...head, ranges });
  assert.equal(filtered.filtered, false);
  assert.deepEqual(filtered.ranges, ranges);
  for (const [before, after] of [[b, h], [h, b], [h, source('CREATE TABLE archived(id int)')]]) {
    const snapshot = { base: context(before, 'b'), head: context(after, 'h') };
    const changes = [{ base: range(before, 0, before.indexOf('\nfunction')), head: range(after, 0, after.indexOf('\nfunction')) }];
    const diff = filterConstructionDiff(snapshot, { ...snapshot, changes });
    assert.equal(diff.filtered, false);
    assert.deepEqual(diff.changes, changes.map((change, index) => ({ index, kind: 'source', ...change })));
    if (before === b || after === b) {
      assert.equal(diff.reason, 'ordinary-set-changed');
      assert.ok([...diff.transitions.base, ...diff.transitions.head].some(row => row.function === 'run'));
    }
  }
});

test('all CLI modes retain elevated DDL without failing the construction gate', () => {
  const dir = mkdtempSync(join(tmpdir(), 'serene-ddl-'));
  try {
    const file = join(dir, 'query.ts');
    writeFileSync(file, source('CREATE TABLE users(id int)'));
    for (const args of [[], ['--strict'], ['--actionable-only'], ['--strict', '--actionable-only']]) {
      const cli = spawnSync(process.execPath, [new URL('../tooling/cli.mjs', import.meta.url).pathname, ...args, file], { encoding: 'utf8' });
      assert.equal(cli.status, 0, cli.stderr);
      const report = JSON.parse(cli.stdout);
      if (args.includes('--actionable-only')) {
        assert.equal(report.executionSiteCounts.ordinary, 1);
        assert.equal(report.contentReviewExecutionSiteCount, 1);
      }
      assert.equal(ddl(report.findings.find(row => row.boundary === 'driver-candidate'))?.priority, 'elevated');
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
