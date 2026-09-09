import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Kysely, CompiledQuery, SqliteDialect, PostgresDialect } from 'kysely';
import Database from 'better-sqlite3';
import pg from 'pg';
import { sql, bind } from '../../../dist/index.js';
import { auditSource } from '../../../tooling/audit.mjs';

const payload = "x' OR 1=1 --";
const database = new Database(':memory:');
database.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)');
database.prepare('INSERT INTO items VALUES (?, ?)').run(1, payload);
database.prepare('INSERT INTO items VALUES (?, ?)').run(2, 'other');
let transforms = 0, results = 0;
const db = new Kysely({ dialect: new SqliteDialect({ database }), plugins: [{
  transformQuery({ node }) { transforms++; return node; },
  async transformResult({ result }) { results++; return result; },
}] });
const query = bind(sql`SELECT id FROM items WHERE value = :value OR value = :value`, { value: payload }, 'anonymous');
assert.deepEqual(query.values, [payload, payload]);
const native = database.prepare(query.text).all(query.values);
const compiled = CompiledQuery.raw(query.text, [...query.values]);
assert.equal(compiled.sql, query.text);
assert.deepEqual(compiled.parameters, query.values);
assert.deepEqual((await db.executeQuery(compiled)).rows, native);
assert.deepEqual(native, [{ id: 1 }]);
assert.equal(transforms, 0); assert.equal(results, 1);
const nullable = bind(sql`SELECT :value IS NULL AS missing`, { value: null }, 'anonymous');
assert.equal((await db.executeQuery(CompiledQuery.raw(nullable.text, [...nullable.values]))).rows[0].missing, 1);
await assert.rejects(db.transaction().execute(async trx => {
  const insert = bind(sql`INSERT INTO items VALUES (:id, :value)`, { id: 3, value: 'rollback' }, 'anonymous');
  await trx.executeQuery(CompiledQuery.raw(insert.text, [...insert.values]));
  throw new Error('intentional rollback');
}), /intentional rollback/);
assert.equal(database.prepare('SELECT count(*) AS n FROM items').get().n, 2);

// Actual Kysely PostgresDriver, recording client boundary only; no PostgreSQL server.
const captured = [];
const client = { async query(text, values) { captured.push({ text, values }); return { command: 'SELECT', rows: [], rowCount: 0 }; }, release() {} };
const pdb = new Kysely({ dialect: new PostgresDialect({ pool: { async connect() { return client; }, async end() {} } }) });
const pq = bind(sql`SELECT :value::text AS a, :value::text AS b`, { value: payload }, 'indexed');
await pdb.executeQuery(CompiledQuery.raw(pq.text, [...pq.values]));
assert.deepEqual(captured, [{ text: pq.text, values: [payload] }]);
// Actual pg Query normalization accepts Serene BoundSql and native config objects.
for (const input of [pq, { text: pq.text, values: pq.values }]) {
  const normalized = new pg.Query(input);
  assert.equal(normalized.text, pq.text); assert.deepEqual(normalized.values, pq.values);
}

const prefix = "import {sql, bind} from '@mk3008/serene';\nconst q = bind(sql`SELECT :id`, {id: 1}, 'indexed');\n";
const cases = {
  native_direct: 'client.query(q.text, q.values);',
  native_bound_object: 'client.query(q);',
  native_config: 'client.query({text: q.text, values: q.values});',
  native_config_alias: 'const config = {text: q.text, values: q.values}; client.query(config);',
  native_config_unsafe: 'client.query({text: "SELECT " + input, values: []});',
  native_wrapper: 'function run(q) { return client.query(q.text, q.values); } run(q);',
  kysely_compiled: 'db.executeQuery(CompiledQuery.raw(q.text, q.values));',
  kysely_unsafe: 'db.executeQuery(CompiledQuery.raw("SELECT " + input, []));',
  native_direct_unsafe: 'client.query("SELECT " + input);',
};
const audit = Object.entries(cases).map(([id, code]) => {
  const source = prefix + code;
  const select = options => auditSource(source, id + '.ts', options).filter(r => r.boundary === 'driver-candidate').map(({level,code}) => ({level,code}));
  return { id, source, default: select(), configured: select({sinkNames:['query','execute','unsafe','executeQuery']}), rawConfigured: select({sinkNames:['query','execute','unsafe','executeQuery','raw']}) };
});
const O = {level:'ordinary',code:'SCREENED_SOURCE'};
const U = {level:'review-required',code:'UNRESOLVED'};
const V = {level:'violation',code:'STRING_CONSTRUCTION'};
const expected = {
 native_direct:[[O],[O],[O]],
 native_bound_object:[[U],[U],[U]],
 native_config:[[U],[U],[U]],
 native_config_alias:[[U],[U],[U]],
 native_config_unsafe:[[U],[U],[U]],
 native_wrapper:[[U],[U],[U]],
 kysely_compiled:[[],[U],[U,O]],
 kysely_unsafe:[[],[U],[U,V]],
 native_direct_unsafe:[[V],[V],[V]],
};
assert.deepEqual(Object.keys(cases), Object.keys(expected));
for (const row of audit) {
 assert.deepEqual([row.default,row.configured,row.rawConfigured],expected[row.id],row.id);
}
await db.destroy(); await pdb.destroy();
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const report = {
  baseline: execFileSync('git', ['rev-parse','v0.2.0^{commit}'], {encoding:'utf8'}).trim(),
  node: process.version,
  versions: Object.fromEntries(['kysely','better-sqlite3','pg'].map(name=>[name, JSON.parse(readFileSync(new URL(`node_modules/${name}/package.json`, import.meta.url))).version])),
  productionHashes: Object.fromEntries(['src/index.ts','tooling/audit.mjs'].map(p=>[p,hash(p)])),
  checks: { sqliteNativeAndKyselyExactRows: 'pass', repeatedBinding:'pass', nullBinding:'pass', sqliteRollback:'pass', compiledQuerySkipsTransformQuery:'pass', transformResultRuns:'pass', postgresDriverBoundary:'pass', pgConfigNormalization:'pass', livePostgres:'not exercised' }, audit,
};
writeFileSync(new URL('results.json', import.meta.url), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:report.checks, audit:audit.map(({id,default:d,configured})=>({id,default:d,configured}))},null,2));
