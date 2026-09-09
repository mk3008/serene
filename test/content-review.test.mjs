import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSource } from '@mk3008/serene/audit';
import { filterConstructionSource, filterConstructionDiff } from '@mk3008/serene/filter';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const prefix = "import { sql, bind, sort, orderBy } from '@mk3008/serene';\n";
const tagged = text => prefix + 'const stmt = sql`' + text + '`;';
const codes = row => (row.reviewSignals ?? []).map(s => s.code);
const cases = [
  ['DROP TABLE users', 'SQL_DROP'],
  ['ALTER TABLE events DROP PARTITION p0', 'SQL_DROP'],
  ['truncate table users', 'SQL_TRUNCATE'],
  ['RENAME TABLE a TO b', 'SQL_RENAME'],
  ['CREATE TEMP TABLE work AS SELECT 1', 'SQL_CREATE_TEMP'],
  ['CREATE /* note */ TEMPORARY TABLE work(id int)', 'SQL_CREATE_TEMP'],
  ['SELECT * FROM users', 'SQL_SELECT_WITHOUT_WHERE'],
  ['UPDATE users SET active = false', 'SQL_UPDATE_WITHOUT_WHERE'],
  ['DELETE FROM users', 'SQL_DELETE_WITHOUT_WHERE'],
  ['WITH moved AS (DELETE FROM users WHERE id = :id RETURNING *) SELECT * FROM moved WHERE id = :id', 'SQL_DATA_MODIFYING_CTE'],
  ['WITH x AS (INSERT INTO users VALUES (:id) RETURNING *) SELECT * FROM x WHERE true', 'SQL_DATA_MODIFYING_CTE'],
  ['WITH x AS (UPDATE users SET active = false WHERE id = :id RETURNING *) SELECT * FROM x WHERE true', 'SQL_DATA_MODIFYING_CTE'],
  ["DELETE FROM users /* WHERE id = :id */", 'SQL_DELETE_WITHOUT_WHERE'],
  ["UPDATE users SET note = 'WHERE'", 'SQL_UPDATE_WITHOUT_WHERE'],
  ['SELECT * FROM users; SELECT * FROM users WHERE id = :id', 'SQL_SELECT_WITHOUT_WHERE'],
  ['SELECT (SELECT id FROM users WHERE id = :id) FROM users', 'SQL_SELECT_WITHOUT_WHERE'],
  ["SELECT 'DROP TABLE users' WHERE true", 'SQL_DROP'],
  ['SELECT 1 WHERE true -- TRUNCATE', 'SQL_TRUNCATE'],
  ['CREATE LOCAL TEMP TABLE work(id int)', 'SQL_CREATE_TEMP'],
  ['DELETE FROM users -- WHERE id = 1', 'SQL_DELETE_WITHOUT_WHERE'],
];
for (const [sql, code] of cases) test(`content review suggestion: ${sql}`, () => {
  const [row] = auditSource(tagged(sql));
  assert.equal(row.level, 'ordinary');
  assert.equal(row.code, 'SCREENED_SOURCE');
  assert.ok(codes(row).includes(code));
  assert.ok(row.reviewSignals.every(s => s.detail.startsWith('Review suggested:')));
});
test('no signal is not a correctness certificate; scope stays at recognized sql tags', () => {
  for (const sql of ['SELECT * FROM users WHERE id = :id', 'UPDATE users SET active = false WHERE id = :id', 'DELETE FROM users WHERE id = :id', 'INSERT INTO users VALUES (:id)']) {
    assert.deepEqual(codes(auditSource(tagged(sql))[0]), []);
  }
  for (const source of ["db.query('DROP TABLE users')", 'const x = "DROP TABLE users"', 'const x = other`DROP TABLE users`', "import {sql} from 'other'; sql`DROP TABLE users`", prefix + 'sort`drop ASC`', prefix + 'sql`DROP TABLE ${input}`', prefix + 'sql(["DROP TABLE users"])']) {
    assert.ok(auditSource(source).every(row => !row.reviewSignals?.length));
  }
  assert.deepEqual(auditSource('DROP TABLE users;', 'migration.sql').flatMap(codes), []);
});
test('signals follow existing recognized provenance, including query config and finite sorting', () => {
  const source = tagged('SELECT * FROM users') + '\nconst alias = stmt; const q = bind(alias);';
  for (const call of ['db.query(q.text,q.values)', 'db.query(q)', 'db.query({text:q.text,values:q.values})', 'db.query(bind(orderBy(stmt,{id:sort`id ASC`},"id")).text)']) {
    const row = auditSource(source + call).find(r => r.boundary === 'driver-candidate');
    assert.equal(row.level, 'ordinary');
    assert.ok(codes(row).includes('SQL_SELECT_WITHOUT_WHERE'));
  }
});
const source = text => prefix + 'const stmt = sql`' + text + '`;\nfunction run(db,id) { const q = bind(stmt,{id}); return db.query(q.text,q.values); }';
const context = (source, revision) => ({source, revision, file:'queries.ts'});
const range = (source, start=0, end=source.length) => ({start,end,text:source.slice(start,end)});
test('source filtering retains execution body even when signaled SQL definition is outside the requested range', () => {
  const s = source('DELETE FROM users'), snapshot = context(s,'r');
  const ranges = [range(s, s.indexOf('function run'))];
  const result = filterConstructionSource(snapshot,{...snapshot,ranges});
  assert.equal(result.filtered,false);
  assert.deepEqual(result.ranges,ranges);
});
test('source filtering still compresses unflagged construction; content signal keeps exact SQL visible', () => {
  for (const [text,expected] of [['DELETE FROM users',false],['SELECT * FROM users WHERE id = :id',true]]) {
    const s = prefix + 'function run(db,id) { const q = bind(sql`'+text+'`,{id}); return db.query(q.text,q.values); }';
    const snapshot = context(s,'r');
    const r = filterConstructionSource(snapshot,{...snapshot,ranges:[range(s)]});
    assert.equal(r.filtered,expected);
    if (!expected) assert.equal(r.ranges[0].text,s);
  }
});
test('diff retains outside-hunk execution navigation when a SQL content signal is gained or lost', () => {
  const before = source('DELETE FROM users WHERE id = :id'), after = source('DELETE FROM users');
  for (const [b,h] of [[before,after],[after,before]]) {
    const base=context(b,'b'),head=context(h,'h'),snapshot={base,head};
    const endB=b.indexOf('\nfunction'),endH=h.indexOf('\nfunction');
    const changes=[{base:range(b,0,endB),head:range(h,0,endH)}];
    const r=filterConstructionDiff(snapshot,{...snapshot,changes});
    assert.equal(r.filtered,false);
    assert.equal(r.reason,'ordinary-set-changed');
    assert.deepEqual(r.changes,changes.map((c,index)=>({index,kind:'source',...c})));
    assert.equal([...r.transitions.base,...r.transitions.head][0].function,'run');
  }
});
test('diff never compresses changed signaled SQL even when both sides are ordinary construction', () => {
  const inline = table => prefix + 'function run(db) { const q = bind(sql`DROP TABLE '+table+'`); return db.query(q.text,q.values); }';
  const b=inline('a'),h=inline('b'),snapshot={base:context(b,'b'),head:context(h,'h')};
  const at=b.indexOf('TABLE ')+6;
  const changes=[{base:range(b,at,at+1),head:range(h,at,at+1)}];
  const r=filterConstructionDiff(snapshot,{...snapshot,changes});
  assert.equal(r.filtered,false);
  assert.deepEqual(r.changes,changes.map((c,index)=>({index,kind:'source',...c})));
});
test('CLI retains content suggestions without turning them into strict failures', () => {
  const dir=mkdtempSync(join(tmpdir(),'serene-content-'));
  try {
    const file=join(dir,'query.ts');writeFileSync(file,source('DELETE FROM users'));
    const run = args => spawnSync(process.execPath,[new URL('../tooling/cli.mjs',import.meta.url).pathname,...args,file],{encoding:'utf8'});
    const normal=run(['--actionable-only']);assert.equal(normal.status,0,normal.stderr);
    const report=JSON.parse(normal.stdout);
    assert.equal(report.executionSiteCounts.ordinary,1);
    assert.equal(report.contentReviewExecutionSiteCount,1);
    assert.ok(report.findings.some(r=>r.boundary==='driver-candidate' && codes(r).includes('SQL_DELETE_WITHOUT_WHERE')));
    for (const args of [[], ['--strict'], ['--actionable-only'], ['--strict','--actionable-only']]) {
      const r=run(args); assert.equal(r.status,0,r.stderr);
      assert.ok(JSON.parse(r.stdout).findings.some(row => codes(row).includes('SQL_DELETE_WITHOUT_WHERE')));
    }
    for (const [body, normalStatus, strictStatus] of [
      ['db.query(input)',0,1], ['db.query("SELECT " + input)',1,1],
    ]) {
      writeFileSync(file,body);
      assert.equal(run([]).status,normalStatus);
      assert.equal(run(['--strict']).status,strictStatus);
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('every initial rule prevents source suppression independently', () => {
  for (const text of ['DROP TABLE users', 'TRUNCATE users', 'RENAME TABLE a TO b', 'CREATE TEMP TABLE work(id int)', 'SELECT * FROM users', 'UPDATE users SET active=false', 'DELETE FROM users', 'WITH x AS (DELETE FROM users WHERE id=1 RETURNING *) SELECT * FROM x WHERE true']) {
    const s=prefix+'function run(db) { const q=bind(sql`'+text+'`); return db.query(q.text,q.values); }';
    const snapshot=context(s,'r'),ranges=[range(s)];
    const result=filterConstructionSource(snapshot,{...snapshot,ranges});
    assert.equal(result.filtered,false,text);
    assert.deepEqual(result.ranges,ranges);
  }
});

for (const dml of ['INSERT INTO archive SELECT * FROM selected WHERE true',
  'UPDATE users SET active=false WHERE id IN (SELECT id FROM selected WHERE true)',
  'DELETE FROM users WHERE id IN (SELECT id FROM selected WHERE true)']) {
  for (const definitions of ['selected AS (SELECT id FROM users WHERE active=true)',
    'first AS (SELECT id FROM users WHERE active=true), selected AS (SELECT id FROM first WHERE true)']) {
    test(`SELECT CTE with outer DML does not signal modifying CTE: ${definitions} ${dml}`, () => {
      assert.ok(!codes(auditSource(tagged(`WITH ${definitions} ${dml}`))[0]).includes('SQL_DATA_MODIFYING_CTE'));
    });
  }
}
for (const dml of ['INSERT INTO archive VALUES (:id) RETURNING *',
  'UPDATE users SET active=false WHERE id=:id RETURNING *',
  'DELETE FROM users WHERE id=:id RETURNING *']) {
  for (const before of ['', 'selected AS (SELECT id FROM users WHERE true), ']) {
    test(`modifying CTE body is signaled: ${before} ${dml}`, () => {
      const row=auditSource(tagged(`WITH ${before}changed AS (/* body */ ${dml}), last AS (SELECT * FROM changed WHERE true) SELECT * FROM last WHERE true`))[0];
      assert.equal(row.level,'ordinary');
      assert.equal(codes(row).filter(c=>c==='SQL_DATA_MODIFYING_CTE').length,1);
    });
  }
}
test('CTE candidate tolerates parentheses/materialization but does not borrow WITH across statements', () => {
  for (const body of ['AS ((DELETE FROM users WHERE id=:id RETURNING *))',
    'AS MATERIALIZED (DELETE FROM users WHERE id=:id RETURNING *)',
    'AS NOT MATERIALIZED (DELETE FROM users WHERE id=:id RETURNING *)']) {
    assert.ok(codes(auditSource(tagged(`WITH changed ${body} SELECT * FROM changed WHERE true`))[0]).includes('SQL_DATA_MODIFYING_CTE'));
  }
  for (const text of ["WITH selected AS (SELECT 'AS (DELETE' WHERE true) SELECT * FROM selected WHERE true",
    'WITH selected AS (SELECT 1 WHERE true) SELECT * FROM selected WHERE true; SELECT x AS (DELETE) WHERE true']) {
    assert.ok(!codes(auditSource(tagged(text))[0]).includes('SQL_DATA_MODIFYING_CTE'));
  }
});
