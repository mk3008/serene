import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSource } from '@mk3008/serene/audit';
import { filterConstructionSource, filterConstructionDiff } from '@mk3008/serene/filter';

const prefix = "import { sql, bind } from '@mk3008/serene';\n";
const binding = "const q = bind(sql`SELECT :id WHERE :id IS NOT NULL`, {id: 1}, 'indexed');";
const candidates = (body, options) => auditSource(prefix + binding + body, 'query.ts', options)
  .filter(row => row.boundary === 'driver-candidate');
const positive = [
  'db.query(q)',
  'pool.query(bind(sql`SELECT :id`, {id: 1}, "indexed"))',
  'db.query({text: q.text, values: q.values})',
  'db.query({values: (q.values), text: (q.text)})',
  'db.query((q))',
  'const alias = q; db.query(alias)',
];
const negative = [
  'const c = {text:q.text, values:q.values}; db.query(c)',
  'const c = {text:q.text, values:q.values}; c.text = input; db.query(c)',
  'let c = q; db.query(c)',
  'db.query({get text(){return q.text}, values:q.values})',
  'db.query({text:q.text, get values(){return q.values}})',
  'db.query({["text"]:q.text, values:q.values})',
  'db.query({"text":q.text, values:q.values})',
  'db.query({...q})',
  'db.query({text:q.text, values:q.values, ...input})',
  'db.query({...input, text:q.text, values:q.values})',
  'db.query({text:q.text, values:q.values, text:input})',
  'db.query(q as any)',
  'db.query(<any>q)',
  'db.query(q satisfies BoundSql)',
  'db.query({text:q.text as string, values:q.values})',
  'db.query({text:q.text, values:q.values as any})',
  'db.query({text:input, values:q.values})',
  'db.query({text:q.text + input, values:q.values})',
  'db.query({text:q.text, values:input})',
  'db.query({text:q.text, values:[]})',
  'const {text, values} = q; db.query({text, values})',
  'db.query({text:q.text, values:q.values, rowMode:"array"})',
  'db.query({text:q.text})',
  'db.query(make(q))',
  'db.query(CompiledQuery.raw(q.text, q.values))',
  'const run = db.query; run(q)',
  'const run = db.query.bind(db); run(q)',
  'const {query:run} = db; run(q)',
  'db.query(q, callback)',
  'db.query({text:q.text, values:q.values}, callback)',
  'db.execute(q)',
  'db.unsafe(q)',
  'db.query({text:other.text, values:q.values})',
];
for (const code of positive) test(`QueryConfig ordinary: ${code}`, () => {
  assert.deepEqual(candidates(code).map(r => r.level), ['ordinary']);
});
for (const code of negative) test(`QueryConfig retains review: ${code}`, () => {
  assert.deepEqual(candidates(code).map(r => r.level), ['review-required']);
});
test('QueryConfig keeps provenance and configured sink boundaries', () => {
  assert.equal(auditSource((prefix + binding + 'db.query(q)').replace('@mk3008/serene', 'other'), 'q.ts')
    .find(r => r.boundary === 'driver-candidate').level, 'review-required');
  assert.equal(candidates('db.run(q)', {sinkNames:['run']})[0].level, 'review-required');
  assert.deepEqual(candidates('db.query(q)', {sinkNames:['run']}), []);
  assert.equal(candidates('db.query(q.text, q.values)')[0].level, 'ordinary');
  assert.equal(candidates('db.query("SELECT " + input)')[0].level, 'violation');
  const rows = candidates('db.query(bind(sql`SELECT ${input}`))');
  assert.equal(rows[0].level, 'review-required');
  assert.ok(auditSource(prefix + 'db.query(bind(sql`SELECT ${input}`))').some(r => r.code === 'INTERPOLATION'));
});
test('ordinary does not attest pairing, mutable values or driver identity', () => {
  assert.equal(candidates('const other = bind(sql`SELECT :x`, {x:2}, "indexed"); db.query({text:q.text, values:other.values})')[0].level, 'ordinary');
  assert.equal(candidates('q.values[0] = input; db.query(q)')[0].level, 'ordinary');
  assert.equal(candidates('notADriver.query(q)')[0].level, 'ordinary');
});

const context = (source, revision) => ({source, revision, file:'query.ts'});
const range = source => ({start:0, end:source.length, text:source});
const source = call => prefix + `function run(db) { ${binding} return ${call}; }`;
for (const call of ['db.query(q)', 'db.query({text:q.text, values:q.values})', 'db.query(bind(sql`SELECT 1`))']) {
  test(`source/diff filters keep stricter syntax for ${call}`, () => {
    const base = context(source(call), 'base');
    assert.equal(auditSource(base.source).find(r => r.boundary === 'driver-candidate').level, 'ordinary');
    const response = {...base, ranges:[range(base.source)]};
    assert.deepEqual(filterConstructionSource(base, response), {filtered:false, reason:'no-ordinary-range', ranges:response.ranges});
    const head = context(base.source.replace('SELECT', 'SELECT DISTINCT'), 'head');
    const snapshot = {base, head}, changes = [{base:range(base.source), head:range(head.source)}];
    const result = filterConstructionDiff(snapshot, {...snapshot, changes});
    assert.equal(result.filtered, false);
    assert.deepEqual(result.changes, changes.map((c,index) => ({index, kind:'source', ...c})));
  });
}
test('diff between existing suppressible call and QueryConfig retains edits and transition navigation', () => {
  for (const config of ['db.query(q)', 'db.query({text:q.text, values:q.values})', 'db.query({text:input, values:q.values})']) {
    const base = context(source('db.query(q.text, q.values)'), 'base');
    const head = context(source(config), 'head');
    for (const snapshot of [{base, head}, {base:head, head:base}]) {
      const changes = [{base:range(snapshot.base.source), head:range(snapshot.head.source)}];
      const result = filterConstructionDiff(snapshot, {...snapshot, changes});
      assert.equal(result.filtered, false);
      assert.equal(result.reason, 'ordinary-set-changed');
      assert.deepEqual(result.changes, changes.map((c,index) => ({index, kind:'source', ...c})));
      const transition = [...result.transitions.base, ...result.transitions.head];
      assert.equal(transition.length, 1);
      assert.equal(transition[0].function, 'run');
      assert.equal(transition[0].sites.length, 1);
    }
  }
});
