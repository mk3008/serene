import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditSource } from '../tooling/audit.mjs';

const imports = 'import { sql as literalSql, bind, sort, orderBy } from "@mk3008/serene";\n';
const sink = source => auditSource(imports + source).filter(f => f.boundary === 'driver-candidate');
test('literal + binding + local const aliases is ordinary at native driver', () => {
  const rows = sink('const sql = literalSql`SELECT :id`; const q = bind(sql, {id}); db.query(q.text, q.values);');
  assert.equal(rows.length, 1); assert.equal(rows[0].level, 'ordinary');
});
test('finite inline whitelist is ordinary', () => {
  const rows = sink('const sql = orderBy(literalSql`SELECT id FROM users`, { id: sort`id ASC`, name: sort`name DESC` }, input); const q = bind(sql); db.query(q.text, q.values);');
  assert.equal(rows[0].level, 'ordinary');
});
for (const [label, source, expected] of [
  ['raw literal', 'db.query("SELECT 1")', 'review-required'],
  ['unknown', 'db.query(input)', 'review-required'],
  ['concatenation', 'const q = "SELECT " + input; db.query(q)', 'violation'],
  ['template', 'db.query(`SELECT ${input}`)', 'violation'],
  ['join', 'db.query(parts.join(" "))', 'violation'],
  ['replace', 'db.query(text.replace("SORT", input))', 'violation'],
  ['Serene interpolation', 'const q = bind(literalSql`SELECT ${input}`); db.query(q.text)', 'violation'],
  ['forged tag', 'const q = bind(literalSql(frozenFake)); db.query(q.text)', 'violation'],
  ['cast forgery', 'const q = bind(input as Sql); db.query(q.text)', 'review-required'],
  ['bound forgery', 'const q = input as BoundSql; db.query(q.text)', 'review-required'],
  ['mutable alias', 'let sql = literalSql`SELECT 1`; const q = bind(sql); db.query(q.text)', 'review-required'],
  ['mutable choices', 'const choices = {id: sort`id`}; const q = bind(orderBy(literalSql`SELECT 1`, choices, key)); db.query(q.text)', 'review-required'],
  ['spread choices', 'const q = bind(orderBy(literalSql`SELECT 1`, {...input}, key)); db.query(q.text)', 'review-required'],
  ['unknown function', 'const q = loadQuery(); db.query(q.text)', 'review-required'],
  ['shadowed import', 'function f(literalSql) { const q = bind(literalSql`SELECT 1`); db.query(q.text); }', 'review-required'],
  ['shadowed bind', 'function f(bind) { const q = bind(literalSql`SELECT 1`); db.query(q.text); }', 'review-required'],
  ['copied bound', 'const q = {...bind(literalSql`SELECT 1`)}; db.query(q.text)', 'review-required'],
  ['cycle', 'const a = b, b = a; db.query(a)', 'review-required'],
]) {
  test(`audit ${label}`, () => assert.equal(sink(source)[0].level, expected));
}
test('import aliases work but same spelling from another library does not establish trust', () => {
  let rows = auditSource('import {sql as pg, bind as b} from "@mk3008/serene"; const q=b(pg`SELECT 1`); db.query(q.text)');
  assert.equal(rows.find(f => f.boundary === 'driver-candidate').level, 'ordinary');
  rows = auditSource('import {sql as literalSql, bind} from "other"; const q=bind(literalSql`SELECT 1`); db.query(q.text)');
  assert.equal(rows.find(f => f.boundary === 'driver-candidate').level, 'review-required');
});
test('direct tag calls remain violations; SQL syntax is application-owned', () => {
  assert.equal(auditSource(imports + 'literalSql(fake)')[0].code, 'DIRECT_TAG_CALL');
  const rows = auditSource(imports + 'literalSql`SELECT $1`');
  assert.equal(rows[0].level, 'ordinary');
  assert.equal(rows[0].line, 2); assert.equal(rows[0].column, 1);
});
test('cooked template escape semantics match runtime', () => {
  const rows = auditSource(imports + 'literalSql`SELECT \\`id\\`, :id`');
  assert.equal(rows[0].level, 'ordinary');
});
test('parse failures do not disappear as a clean inventory', () => {
  const parseError = auditSource('const = ;').find(f => f.code === 'PARSE_ERROR');
  assert.ok(parseError);
  assert.equal(parseError.function, null);
});

test('findings carry only authoritative nearest lexical function names', () => {
  const cases = [
    ['named declaration', 'function declared(db) { const q = bind(literalSql`SELECT 1`); db.query(q.text); }', 'declared', 'ordinary'],
    ['identifier-bound arrow', 'const assigned = db => { const q = bind(literalSql`SELECT 1`); db.query(q.text); };', 'assigned', 'ordinary'],
    ['named method', 'class Store { load(db) { const q = bind(literalSql`SELECT 1`); db.query(q.text); } }', 'load', 'ordinary'],
    ['anonymous nested callback', 'function outer(db) { return input.map(() => db.query("SELECT 1")); }', null, 'review-required'],
    ['top level', 'db.query("SELECT 1");', null, 'review-required'],
  ];
  for (const [label, source, name, level] of cases) {
    const row = sink(source)[0];
    assert.equal(row.function, name, label);
    assert.equal(row.level, level, label);
  }
});

test('function metadata adds one scalar output field', () => {
  const row = sink('db.query("SELECT 1");')[0];
  const withoutFunction = { ...row };
  delete withoutFunction.function;
  assert.equal(Buffer.byteLength(JSON.stringify(row)) - Buffer.byteLength(JSON.stringify(withoutFunction)),
    Buffer.byteLength(',"function":null'));
});
test('computed calls are review-required and explicit additional sink names are supported', () => {
  assert.equal(auditSource('db[method](input)')[0].level, 'review-required');
  assert.equal(auditSource('runSql(input)', 'input.ts', {sinkNames:['runSql']})[0].level, 'review-required');
});
test('CLI exit policy, JSON inventory and input errors', () => {
  const dir = mkdtempSync(join(tmpdir(), 'serene-'));
  const file = join(dir, 'input.ts');
  const run = args => spawnSync(process.execPath, ['tooling/cli.mjs', ...args], {encoding:'utf8'});
  try {
    writeFileSync(file, 'db.query("SELECT 1")');
    let result = run([file]);
    assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).findings[0].level, 'review-required');
    assert.equal(run(['--strict', file]).status, 1);
    writeFileSync(file, 'db.query("SELECT " + input)');
    assert.equal(run([file]).status, 1);
    assert.equal(run([join(dir, 'missing.ts')]).status, 2);
    assert.equal(run(['--unknown']).status, 2);
    assert.equal(run([]).status, 2);
  } finally { rmSync(dir, {recursive:true, force:true}); }
});

test('CLI actionable-only counts execution candidates once and omits ordinary details', () => {
  const dir = mkdtempSync(join(tmpdir(), 'serene-actionable-'));
  const file = join(dir, 'input.ts');
  const run = args => spawnSync(process.execPath, ['tooling/cli.mjs', ...args], {encoding:'utf8'});
  try {
    writeFileSync(file, `${imports}
const q = bind(literalSql\`SELECT 1\`);
db.query(q.text);
db.execute(input);
db.query('SELECT ' + input);`);
    const result = run(['--actionable-only', file]);
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.deepEqual(report.executionSiteCounts, { ordinary: 1, 'review-required': 1, violation: 1 });
    assert.equal(report.findings.length, 2);
    assert.ok(report.findings.every(finding => finding.level !== 'ordinary'));
    assert.deepEqual(report.findings.map(finding => finding.boundary), ['driver-candidate', 'driver-candidate']);
    assert.match(report.scope, /candidate driver execution sites only/);
    assert.equal(run(['--strict', '--actionable-only', file]).status, 1);
  } finally { rmSync(dir, {recursive:true, force:true}); }
});

test('local execution aliases are inventoried instead of silently disappearing', () => {
  for (const setup of [
    'const run = db.query;',
    'const run = db.query.bind(db);',
    'const {query: run} = db;',
    'const run = db["execute"];',
    'const first = db.query; const run = first;',
  ]) {
    const rows = sink(setup + '\nrun("SELECT " + input);');
    assert.equal(rows.length, 1, setup);
    assert.equal(rows[0].level, 'violation', setup);
  }
});
test('prebound SQL and otherwise screened aliases never gain ordinary provenance', () => {
  for (const setup of [
    'const run = db.query.bind(db, input);',
    'const run = db.query;',
    'const {query: run} = db;',
  ]) {
    const rows = sink(setup + '\nconst q = bind(literalSql`SELECT 1`); run(q.text, q.values);');
    assert.equal(rows.length, 1, setup);
    assert.equal(rows[0].level, 'review-required', setup);
    assert.equal(rows[0].code, 'SINK_ALIAS', setup);
  }
});
test('alias discovery is scope-aware and does not invent provenance for dynamic aliases', () => {
  for (const source of [
    'let run = db.query; run(input);',
    'const a = b; const b = a; a(input);',
    'const run = db.query; function f(run) {run(input);}',
    'const {query: run = fallback} = db; run(input);',
    'const {...run} = db; run(input);',
  ]) assert.equal(sink(source).length, 0, source);
});
test('non-SQL aliases remain candidacy false positives, never claims of driver identity', () => {
  const rows = sink('const run = search.query.bind(search); run(input);');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].level, 'review-required');
});

test('aliases named like sinks do not hide prebound runtime SQL behind ordinary text', () => {
  for (const setup of [
    'const query = db.query.bind(db, input);',
    'const {query} = db;',
    'const query = opaqueWrapper;',
    'let query = db.query.bind(db, input);',
  ]) {
    const rows = sink(setup + '\nconst q = bind(literalSql`SELECT 1`); query(q.text);');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].level, 'review-required');
    assert.equal(rows[0].code, 'SINK_ALIAS');
  }
});

test('all output styles and ordered whitelist selection preserve source provenance', () => {
  for (const style of ['indexed', 'anonymous']) {
    const rows = sink('const stmt = orderBy(literalSql`SELECT id FROM users WHERE id = :id`, { id: sort`id ASC`, name: sort`name DESC` }, input.keys); const q = bind(stmt, {id}, "' + style + '"); db.query(q.text, q.values);');
    assert.equal(rows[0].level, 'ordinary');
  }
});
test('legacy tags and arbitrary sourceText are not silently trusted as new API', () => {
  const rows = auditSource('import {postgres, bind} from "@mk3008/serene"; const q = bind(postgres`SELECT 1`); db.query(q.text);');
  assert.equal(rows.find(f => f.boundary === 'driver-candidate').level, 'review-required');
  assert.equal(sink('db.query(literalSql`SELECT 1`.sourceText)')[0].level, 'review-required');
  assert.equal(sink('const q = bind(literalSql`SELECT 1`); db.query(q.sourceText)')[0].level, 'review-required');
});
test('fixed PostgreSQL array syntax has ordinary construction provenance', () => {
  const rows = sink('const q = bind(literalSql`SELECT ARRAY[:id]`, {id}, "indexed"); db.query(q.text)');
  assert.equal(rows[0].level, 'ordinary');
});

test('native named passthrough preserves ordinary construction provenance', () => {
  const rows = sink('const stmt = literalSql`SELECT [customer:id], $100.00, @@ROWCOUNT, @id`; const q = bind(stmt, {id}); db.query(q.text);');
  assert.equal(rows[0].level, 'ordinary');
});
