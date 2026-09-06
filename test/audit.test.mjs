import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditSource } from '../tooling/audit.mjs';

const imports = 'import { postgres, mysql, bind, sort, orderBy } from "@mk3008/serene";\n';
const sink = source => auditSource(imports + source).filter(f => f.boundary === 'driver-candidate');
test('literal + binding + local const aliases is ordinary at native driver', () => {
  const rows = sink('const sql = postgres`SELECT :id`; const q = bind(sql, {id}); db.query(q.text, q.values);');
  assert.equal(rows.length, 1); assert.equal(rows[0].level, 'ordinary');
});
test('finite inline whitelist is ordinary', () => {
  const rows = sink('const sql = orderBy(postgres`SELECT id FROM users`, { id: sort`id ASC`, name: sort`name DESC` }, input); const q = bind(sql); db.query(q.text, q.values);');
  assert.equal(rows[0].level, 'ordinary');
});
for (const [label, source, expected] of [
  ['raw literal', 'db.query("SELECT 1")', 'review-required'],
  ['unknown', 'db.query(input)', 'review-required'],
  ['concatenation', 'const q = "SELECT " + input; db.query(q)', 'violation'],
  ['template', 'db.query(`SELECT ${input}`)', 'violation'],
  ['join', 'db.query(parts.join(" "))', 'violation'],
  ['replace', 'db.query(text.replace("SORT", input))', 'violation'],
  ['Serene interpolation', 'const q = bind(postgres`SELECT ${input}`); db.query(q.text)', 'violation'],
  ['forged tag', 'const q = bind(postgres(frozenFake)); db.query(q.text)', 'violation'],
  ['cast forgery', 'const q = bind(input as Sql); db.query(q.text)', 'review-required'],
  ['bound forgery', 'const q = input as BoundSql; db.query(q.text)', 'review-required'],
  ['mutable alias', 'let sql = postgres`SELECT 1`; const q = bind(sql); db.query(q.text)', 'review-required'],
  ['mutable choices', 'const choices = {id: sort`id`}; const q = bind(orderBy(postgres`SELECT 1`, choices, key)); db.query(q.text)', 'review-required'],
  ['spread choices', 'const q = bind(orderBy(postgres`SELECT 1`, {...input}, key)); db.query(q.text)', 'review-required'],
  ['unknown function', 'const q = loadQuery(); db.query(q.text)', 'review-required'],
  ['shadowed import', 'function f(postgres) { const q = bind(postgres`SELECT 1`); db.query(q.text); }', 'review-required'],
  ['shadowed bind', 'function f(bind) { const q = bind(postgres`SELECT 1`); db.query(q.text); }', 'review-required'],
  ['copied bound', 'const q = {...bind(postgres`SELECT 1`)}; db.query(q.text)', 'review-required'],
  ['cycle', 'const a = b, b = a; db.query(a)', 'review-required'],
]) {
  test(`audit ${label}`, () => assert.equal(sink(source)[0].level, expected));
}
test('import aliases work but same spelling from another library does not establish trust', () => {
  let rows = auditSource('import {postgres as pg, bind as b} from "@mk3008/serene"; const q=b(pg`SELECT 1`); db.query(q.text)');
  assert.equal(rows.find(f => f.boundary === 'driver-candidate').level, 'ordinary');
  rows = auditSource('import {postgres, bind} from "other"; const q=bind(postgres`SELECT 1`); db.query(q.text)');
  assert.equal(rows.find(f => f.boundary === 'driver-candidate').level, 'review-required');
});
test('direct tag calls and lexical errors have stable code and location', () => {
  assert.equal(auditSource(imports + 'postgres(fake)')[0].code, 'DIRECT_TAG_CALL');
  const rows = auditSource(imports + 'postgres`SELECT $1`');
  assert.equal(rows[0].code, 'MIXED_PARAMETERS');
  assert.equal(rows[0].line, 2); assert.equal(rows[0].column, 1);
});
test('cooked template escape semantics match runtime', () => {
  const rows = auditSource(imports + 'mysql`SELECT \\`id\\`, :id`');
  assert.equal(rows[0].level, 'ordinary');
});
test('parse failures do not disappear as a clean inventory', () => {
  assert.ok(auditSource('const = ;').some(f => f.code === 'PARSE_ERROR'));
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
