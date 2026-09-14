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
const signal = (row, code) => row.reviewSignals?.find(s => s.code === code);
const temp = 'ALTER TABLE pg_temp.work ADD PRIMARY KEY (id)';

for (const text of [temp, 'alter table PG_TEMP.work add primary key (id)',
  ' \nALTER\nTABLE pg_temp . "work rows" ADD PRIMARY KEY (id)',
  'ALTER TABLE pg_temp."a""b;name" ADD PRIMARY KEY (id)',
  'CREATE TEMP TABLE work(id int); ' + temp,
  temp + '; ' + temp,
  "SELECT ';' WHERE true; " + temp,
]) test(`explicit temporary ALTER remains ordinary and advisory: ${text}`, () => {
  const rows = auditSource(source(text));
  assert.ok(rows.some(row => row.boundary === 'driver-candidate'));
  for (const row of rows) {
    assert.equal(row.level, 'ordinary');
    assert.equal(signal(row, 'SQL_PERSISTENT_DDL'), undefined);
    assert.equal(signal(row, 'SQL_TEMP_DDL')?.priority, undefined);
    assert.equal(row.reviewSignals.filter(s => s.code === 'SQL_TEMP_DDL').length, 1);
  }
});

for (const target of ['work', 'public.work', 'pg_temp_3.work', 'pg_temp_extra.work',
  '"pg_temp".work', '"PG_TEMP".work', 'ONLY pg_temp.work', 'IF EXISTS pg_temp.work',
  'pg_temp.work.other', 'pg_temp.""', 'pg_temp.日本',
]) test(`unrecognized ALTER target remains elevated: ${target}`, () => {
  for (const row of auditSource(source(`ALTER TABLE ${target} ADD PRIMARY KEY (id)`))) {
    assert.equal(row.level, 'ordinary');
    assert.equal(signal(row, 'SQL_PERSISTENT_DDL')?.priority, 'elevated');
    assert.equal(signal(row, 'SQL_TEMP_DDL'), undefined);
  }
});

for (const other of ['ALTER TABLE work ADD x int', 'ALTER TABLE public.work ADD x int',
  'CREATE TABLE work(id int)', 'ALTER VIEW pg_temp.work RENAME TO x',
  'ALTER FUNCTION pg_temp.f() IMMUTABLE',
]) test(`temporary occurrence does not hide other DDL: ${other}`, () => {
  for (const text of [temp + '; ' + other, other + '; ' + temp]) {
    for (const row of auditSource(source(text))) {
      assert.ok(signal(row, 'SQL_TEMP_DDL'));
      assert.equal(signal(row, 'SQL_PERSISTENT_DDL')?.priority, 'elevated');
    }
  }
});

test('quoted/commented statement starts never establish temporary evidence', () => {
  for (const text of [
    `SELECT '; ${temp}' WHERE true`, `SELECT "; ${temp}" WHERE true`,
    `SELECT $$; ${temp}$$ WHERE true`, `SELECT $body$; ${temp}$body$ WHERE true`,
    `SELECT $日本$; ${temp}$日本$ WHERE true`,
    `-- ; ${temp}`, `/* ; ${temp} */ SELECT 1 WHERE true`,
    `/* outer /* inner */ ; ${temp} */ SELECT 1 WHERE true`,
    `/* header */ ${temp}`, `ALTER /* comment */ TABLE pg_temp.work ADD x int`,
    `SELECT 1 WHERE true\n${temp}`, String.raw`SELECT E'\\'; ` + temp,
  ]) assert.ok(auditSource(source(text)).every(row => !signal(row, 'SQL_TEMP_DDL')), text);
  for (const text of [`CREATE TEMP TABLE work(id int); ALTER TABLE work ADD x int`,
    'CREATE TABLE pg_temp.work(id int)', 'ALTER TABLE pg_temp.', `/* header */ ${temp}`]) {
    assert.ok(auditSource(source(text)).every(row => signal(row, 'SQL_PERSISTENT_DDL')?.priority === 'elevated'));
  }
});

test('construction violations and unresolved SQL are not downgraded', () => {
  const cases = [
    [prefix + 'sql`ALTER TABLE pg_temp.${name} ADD x int`;', 'violation'],
    ['db.query("' + temp + '")', 'review-required'],
    ['db.query("ALTER TABLE pg_temp." + name + " ADD x int")', 'violation'],
  ];
  for (const [s, level] of cases) {
    const rows = auditSource(s);
    assert.ok(rows.some(row => row.level === level));
    assert.ok(rows.every(row => !signal(row, 'SQL_TEMP_DDL')));
  }
});

test('advisory signals retain execution source and all diff edits', () => {
  const before = source('ALTER TABLE public.work ADD PRIMARY KEY (id)'), after = source(temp);
  const context = (source, revision) => ({ source, revision, file: 'queries.ts' });
  const range = (source, start = 0, end = source.length) => ({ start, end, text: source.slice(start, end) });
  const head = context(after, 'h');
  const ranges = [range(after, after.indexOf('function run'))];
  const filtered = filterConstructionSource(head, { ...head, ranges });
  assert.equal(filtered.filtered, false);
  assert.deepEqual(filtered.ranges, ranges);
  const snapshot = { base: context(before, 'b'), head };
  const changes = [{ base: range(before), head: range(after) }];
  const diff = filterConstructionDiff(snapshot, { ...snapshot, changes });
  assert.equal(diff.filtered, false);
  assert.deepEqual(diff.changes, changes.map((change, index) => ({ index, kind: 'source', ...change })));
});

test('all CLI modes retain advisory TEMP DDL without failing construction gates', () => {
  const dir = mkdtempSync(join(tmpdir(), 'serene-temp-ddl-'));
  try {
    const file = join(dir, 'query.ts');
    writeFileSync(file, source(temp));
    for (const args of [[], ['--strict'], ['--actionable-only'], ['--strict', '--actionable-only']]) {
      const cli = spawnSync(process.execPath, [new URL('../tooling/cli.mjs', import.meta.url).pathname, ...args, file], { encoding: 'utf8' });
      assert.equal(cli.status, 0, cli.stderr);
      const report = JSON.parse(cli.stdout);
      const row = report.findings.find(row => row.boundary === 'driver-candidate');
      assert.ok(signal(row, 'SQL_TEMP_DDL'));
      assert.equal(signal(row, 'SQL_PERSISTENT_DDL'), undefined);
      if (args.includes('--actionable-only')) {
        assert.equal(report.executionSiteCounts.ordinary, 1);
        assert.equal(report.contentReviewExecutionSiteCount, 1);
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
