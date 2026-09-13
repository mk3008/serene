import test from 'node:test';
import assert from 'node:assert/strict';
import { sql, sort, orderBy, materializeTemp, bind, review } from '@mk3008/serene';
import { auditSource } from '@mk3008/serene/audit';
import { filterConstructionSource, filterConstructionDiff } from '@mk3008/serene/filter';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const fail = code => error => error.code === code;
const prefix = "import { sql, bind, sort, orderBy, materializeTemp } from '@mk3008/serene';\n";
const codes = row => (row.reviewSignals ?? []).map(s => s.code);
const execution = source => auditSource(source).find(r => r.boundary === 'driver-candidate');

test('TEMP preserves SQL text and binds values only after composition', () => {
  const body = sql`SELECT :id::int AS id, :id::int AS again, ARRAY[:other] AS items -- trailing comment`;
  const stmt = materializeTemp(body, 'Snapshot');
  const expected = 'CREATE TEMPORARY TABLE "Snapshot"\nON COMMIT DROP\nAS\n' + body.sourceText;
  assert.equal(stmt.sourceText, expected);
  assert.equal(review(stmt).level, 'ordinary');
  assert.ok(Object.isFrozen(stmt));
  const payload = "'; DROP TABLE users; --";
  const indexed = bind(stmt, { id: 7, other: payload }, 'indexed');
  assert.equal(indexed.text, expected.replaceAll(':id', '$1').replaceAll(':other', '$2'));
  assert.deepEqual(indexed.values, [7, payload]);
  assert.deepEqual(indexed.names, ['id', 'other']);
  const anonymous = bind(stmt, { id: 7, other: payload }, 'anonymous');
  assert.deepEqual(anonymous.values, [7, 7, payload]);
  assert.equal(anonymous.text, expected.replaceAll(':id', '?').replaceAll(':other', '?'));
  assert.equal(bind(stmt, { id: 7, other: payload }).text, expected);
  assert.equal(body.sourceText.startsWith('SELECT'), true);
  assert.equal(materializeTemp(orderBy(sql`SELECT id FROM users`, { id: sort`id DESC` }, 'id'), 'sorted').sourceText.endsWith('ORDER BY id DESC'), true);
});

test('TEMP rejects forged, already-bound and string bodies', () => {
  const body = sql`SELECT 1`;
  for (const value of [null, undefined, 'SELECT 1', body.sourceText, { sourceText: body.sourceText },
    { ...body }, Object.create(body), bind(body), new String(body.sourceText)]) {
    assert.throws(() => materializeTemp(value, 'snapshot'), fail('UNSCREENED'));
  }
});

test('TEMP checks names at runtime; syntactic validity alone is not source provenance', () => {
  for (const name of ['', 'a.b', 'pg_temp.x', 'a"b', 'a; DROP TABLE users', 'a b', 'a\n', '日本', 'a'.repeat(64),
    undefined, null, {}, new String('ok')]) {
    assert.throws(() => materializeTemp(sql`SELECT 1`, name), fail('TEMP_NAME'));
  }
  assert.ok(materializeTemp(sql`SELECT 1`, 'a'.repeat(63)));
  const dynamic = 'valid_name';
  assert.ok(materializeTemp(sql`SELECT 1`, dynamic)); // runtime cannot authenticate JS literal origin
  assert.equal(execution(prefix + "const s=materializeTemp(sql`SELECT 1`, input); db.query(bind(s));").level, 'review-required');
});

test('TEMP rejects statement escapes, including PostgreSQL non-quotes and cooked JS escapes', () => {
  for (const body of [sql`SELECT 1;`, sql`SELECT 1; DROP TABLE users`, sql`SELECT 1\u003b DELETE FROM users`,
    sql`SELECT [x; DROP TABLE users]`, sql`SELECT \`x; DROP TABLE users\``,
    sql`SELECT 'ok'; -- tail`, sql`SELECT $x$;$x$; DROP TABLE users`]) {
    assert.throws(() => materializeTemp(body, 's'), fail('TEMP_BODY'));
  }
  assert.throws(() => materializeTemp(sql`SELECT $日本$;$日本$`, 's'), fail('UNSUPPORTED_DOLLAR_QUOTE'));
});

test('TEMP preserves semicolons shielded by PostgreSQL quotes/comments without rewriting', () => {
  for (const body of [sql`SELECT ';' AS "semi;colon"`, sql`SELECT $$;$$, $tag$;$tag$`,
    sql`SELECT E'\\\';'`, sql`SELECT 1 /* outer /* ; */ ; */`, sql`SELECT 1 -- ;`,
    sql`WITH x AS (SELECT ARRAY[1,2] AS a) SELECT a[1] FROM x`]) {
    assert.ok(materializeTemp(body, 's').sourceText.endsWith(body.sourceText));
  }
});

test('canonical API, import aliases and immutable local aliases retain provenance and signals', () => {
  for (const api of ["import { materializeTemp as temp, sql, bind } from '@mk3008/serene';",
    "import { materializeTemp, sql, bind } from '@mk3008/serene'; const temp=materializeTemp;"]) {
    const source = api + "const original=sql`SELECT * FROM users`; const body=original; const s=temp(body,'s'); const q=bind(s);";
    for (const sink of ['db.query(q)', 'db.query(q.text,q.values)', 'db.query({text:q.text,values:q.values})']) {
      const row = execution(source + sink);
      assert.equal(row.level, 'ordinary');
      assert.deepEqual(codes(row), ['SQL_SELECT_WITHOUT_WHERE', 'SQL_CREATE_TEMP']);
    }
  }
  const row = execution(prefix + "const s=materializeTemp(orderBy(sql`SELECT id FROM users WHERE true`,{id:sort`id`},'id'),'s'); db.query(bind(s));");
  assert.equal(row.level, 'ordinary');
  assert.deepEqual(codes(row), ['SQL_CREATE_TEMP']);
});

test('unknown name/body/API flows cannot gain ordinary provenance', () => {
  for (const source of [
    prefix + "const name='s'; const s=materializeTemp(sql`SELECT 1`,name);",
    prefix + "const s=materializeTemp(sql`SELECT 1`,getName());",
    prefix + "const s=materializeTemp(sql`SELECT 1`,input as 's');",
    prefix + "let body=sql`SELECT 1`; const s=materializeTemp(body,'s');",
    prefix + "const s=materializeTemp(loadSql(),'s');",
    prefix + "const s=materializeTemp({sourceText:'SELECT 1'} as Sql,'s');",
    prefix + "const s=materializeTemp(bind(sql`SELECT 1`),'s');",
    prefix + "const s=materializeTemp(sql`SELECT 1`.sourceText,'s');",
    prefix + "const s=materializeTemp('SELECT 1','s');",
    prefix + "let temp=materializeTemp; const s=temp(sql`SELECT 1`,'s');",
    "import {sql,bind} from '@mk3008/serene'; import {materializeTemp} from './helper'; const s=materializeTemp(sql`SELECT 1`,'s');",
    prefix + "const s=helper(materializeTemp(sql`SELECT 1`,'s'));",
    prefix + "const s=materializeTemp(sql`SELECT 1`,'s',input);",
  ]) assert.equal(execution(source + 'db.query(bind(s));').level, 'review-required', source);
  const shadow = prefix + "function f(materializeTemp) { const s=materializeTemp(sql`SELECT 1`,'s'); db.query(bind(s)); }";
  assert.equal(execution(shadow).level, 'review-required');
});

test('audit keeps boundary violations, validates literal names and scans cooked body', () => {
  for (const [expr, code] of [
    ["materializeTemp(sql`SELECT ${input}`,'s')", 'INTERPOLATION'],
    ["materializeTemp('SELECT '+input,'s')", 'STRING_CONSTRUCTION'],
    ["materializeTemp(sql(['SELECT 1']),'s')", 'DIRECT_TAG_CALL'],
    ["materializeTemp(sql`SELECT 1;`,'s')", 'TEMP_BODY'],
    ["materializeTemp(sql`SELECT 1\\u003b`,'s')", 'TEMP_BODY'],
    ["materializeTemp(sql`SELECT 1`,'a.b')", 'TEMP_NAME'],
  ]) {
    const source=prefix+'const s='+expr+';';
    const row=execution(source+'db.query(bind(s).text);');
    assert.equal(row.level,'violation'); assert.equal(row.code,code);
    // Existing native QueryConfig recognition refers unsuccessful bindings;
    // the actual Serene boundary must still expose the violation.
    const config=auditSource(source+'db.query(bind(s));');
    assert.ok(config.some(r=>r.boundary==='serene' && r.code===code && r.level==='violation'));
    assert.notEqual(config.find(r=>r.boundary==='driver-candidate').level,'ordinary');
  }
});

test('TEMP signals survive source/diff filtering and strict actionable CLI', () => {
  const source = name => prefix + "const s=materializeTemp(sql`SELECT :id AS id WHERE true`,'"+name+"');\nfunction run(db,id) { const q=bind(s,{id},'indexed'); return db.query(q.text,q.values); }";
  const b=source('before'),h=source('after');
  const snap=(source,revision)=>({source,revision,file:'query.ts'});
  const range=(s,start=0,end=s.length)=>({start,end,text:s.slice(start,end)});
  const base=snap(b,'b'),head=snap(h,'h');
  const ranges=[range(h,h.indexOf('function run'))];
  const read=filterConstructionSource(head,{...head,ranges});
  assert.equal(read.filtered,false); assert.deepEqual(read.ranges,ranges);
  const changes=[{base:range(b),head:range(h)}];
  const diff=filterConstructionDiff({base,head},{base,head,changes});
  assert.equal(diff.filtered,false);
  assert.deepEqual(diff.changes,changes.map((c,index)=>({index,kind:'source',...c})));
  const dir=mkdtempSync(join(tmpdir(),'serene-temp-'));
  try {
    const file=join(dir,'query.ts'); writeFileSync(file,h);
    const r=spawnSync(process.execPath,[new URL('../tooling/cli.mjs',import.meta.url).pathname,'--strict','--actionable-only',file],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);
    const report=JSON.parse(r.stdout);
    assert.equal(report.contentReviewExecutionSiteCount,1);
    assert.equal(report.executionSiteCounts.ordinary,1);
    assert.deepEqual(codes(report.findings.find(r=>r.boundary==='driver-candidate')),['SQL_CREATE_TEMP']);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('TEMP retains destructive and CTE body signals without duplicating wrapper signals', () => {
  for (const [body, inherited] of [
    ["SELECT 'DROP TABLE users' WHERE true", 'SQL_DROP'],
    ['WITH changed AS (DELETE FROM users WHERE id=:id RETURNING *) SELECT * FROM changed WHERE true', 'SQL_DATA_MODIFYING_CTE'],
  ]) {
    const row=execution(prefix+"const s=materializeTemp(sql`"+body+"`,'s'); const q=bind(s); db.query({text:q.text,values:q.values});");
    assert.equal(row.level,'ordinary');
    assert.ok(codes(row).includes(inherited));
    assert.equal(codes(row).filter(c=>c==='SQL_CREATE_TEMP').length,1);
  }
  // Composition identity is not a SQL-semantic certificate: nested CTAS is left
  // to SQL review/the database, while TEMP's content signal is deduplicated.
  const row=execution(prefix+"const s=materializeTemp(materializeTemp(sql`SELECT 1 WHERE true`,'a'),'b'); db.query(bind(s));");
  assert.equal(row.level,'ordinary');
  assert.deepEqual(codes(row),['SQL_CREATE_TEMP']);
});
