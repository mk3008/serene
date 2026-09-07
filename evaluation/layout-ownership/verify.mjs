import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, relative, dirname } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import { auditSource } from '../../tooling/audit.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const here = fileURLToPath(new URL('.', import.meta.url));
const freeze = JSON.parse(readFileSync(resolve(here, 'freeze.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
for (const [path, expected] of Object.entries(freeze.sha256)) {
  assert.equal(hash(readFileSync(resolve(root, path))), expected, path);
  assert.equal(hash(execFileSync('git', ['show', `${freeze.serene}:${path}`], { cwd: root })), expected, path);
}
const schema = readFileSync(resolve(root, 'evaluation/adoption/preflight/schema.sql'), 'utf8');
const seed = readFileSync(resolve(root, 'evaluation/adoption/preflight/seed.sql'), 'utf8');
const read = path => readFileSync(path, 'utf8');
const walk = (node, predicate) => {
  const out = [];
  const visit = n => { if (predicate(n)) out.push(n); ts.forEachChild(n, visit); };
  visit(node); return out;
};
const at = (sf, node) => {
  const p = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return { file: relative(root, sf.fileName), line: p.line + 1, column: p.character + 1 };
};
function traceSource(operation, files) {
  // Deliberately a fixture verifier, not a module resolver or production recognizer.
  const reads = [], cache = new Map();
  const load = path => {
    if (!cache.has(path)) {
      const source = read(path);
      reads.push(relative(root, path));
      cache.set(path, ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS));
    }
    return cache.get(path);
  };
  const sf = load(operation);
  const imports = sf.statements.filter(ts.isImportDeclaration).filter(n => n.moduleSpecifier.text.startsWith('.'));
  assert.ok(imports.length <= 1);
  const definitionPath = imports.length ? resolve(dirname(operation), imports[0].moduleSpecifier.text) : operation;
  const definitionFile = load(definitionPath);
  // The route is complete for these specimens; enumeration is only a coverage check.
  assert.deepEqual([...cache.keys()].sort(), [...files].sort());
  const tags = files.flatMap(path => walk(load(path), ts.isTaggedTemplateExpression));
  assert.equal(tags.length, 1, 'one authoritative literal, no duplicate canonical SQL');
  const definition = walk(definitionFile, n => ts.isVariableDeclaration(n) && n.name.getText(definitionFile) === 'findAccount')[0];
  assert.ok(definition && ts.isTaggedTemplateExpression(definition.initializer));
  assert.ok(ts.isNoSubstitutionTemplateLiteral(definition.initializer.template));
  assert.equal(definition.initializer.tag.getText(definitionFile), 'sql');
  const sqlImport = definitionFile.statements.find(n => ts.isImportDeclaration(n) && n.moduleSpecifier.text === '@mk3008/serene');
  assert.ok(sqlImport.importClause.namedBindings.elements.some(n => n.name.text === 'sql'));
  if (imports.length) {
    assert.ok(imports[0].importClause.namedBindings.elements.some(n => n.name.text === 'findAccount' && !n.propertyName));
    assert.ok(definition.parent.parent.modifiers.some(n => n.kind === ts.SyntaxKind.ExportKeyword));
  }
  const functions = sf.statements.filter(ts.isFunctionDeclaration);
  const paths = functions.map(fn => {
    const calls = walk(fn, ts.isCallExpression);
    const binding = calls.find(n => n.expression.getText(sf) === 'bind');
    assert.ok(ts.isVariableDeclaration(binding.parent));
    assert.equal(binding.parent.name.getText(sf), 'q');
    assert.equal(binding.arguments[0].getText(sf), 'findAccount');
    assert.equal(binding.arguments[1].getText(sf), '{ tenantId, accountId }');
    const preparation = calls.find(n => n.expression.getText(sf) === 'db.prepare');
    assert.equal(preparation.arguments[0].getText(sf), 'q.text');
    const execution = calls.find(n => ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'get');
    assert.equal(execution.arguments[0].getText(sf), 'q.params');
    return { function: fn.name.text, definition: at(definitionFile, definition),
      binding: { ...at(sf, binding), values: binding.arguments[1].getText(sf) },
      preparation: at(sf, preparation), execution: at(sf, execution),
      bodySha256: hash(fn.body.getText(sf)) };
  });
  return { reads, fullFileReads: reads.length, importEdges: imports.length,
    authoritativeDefinitions: tags.length, sql: definition.initializer.template.text, paths };
}
let sqlite;
function exercise(task, api) {
  const cases = task === 'lookup' ? [
    ['owned', 'lookup', { tenantId: 1, accountId: 10 }, { name: 'Alice', balance: 100 }],
    ['other-tenant', 'lookup', { tenantId: 2, accountId: 10 }, { name: 'Other Alice', balance: 900 }],
    ['missing', 'lookup', { tenantId: 1, accountId: 30 }, null],
    ['hostile', 'lookup', { tenantId: 1, accountId: "10 OR 1=1 --" }, null],
  ] : [
    ['name', 'accountName', { tenantId: 1, accountId: 10 }, 'Alice'],
    ['other-tenant-name', 'accountName', { tenantId: 2, accountId: 10 }, 'Other Alice'],
    ['can-spend', 'canSpend', { tenantId: 1, accountId: 10, amount: 50 }, true],
    ['insufficient', 'canSpend', { tenantId: 1, accountId: 10, amount: 101 }, false],
    ['invalid', 'canSpend', { tenantId: 1, accountId: 10, amount: -1 }, false],
    ['hostile', 'canSpend', { tenantId: 1, accountId: "10 OR 1=1 --", amount: 1 }, false],
  ];
  return cases.map(([name, operation, args, expected]) => {
    const native = new DatabaseSync(':memory:');
    try {
      native.exec(schema); native.exec(seed);
      sqlite = native.prepare('SELECT sqlite_version() AS v').get().v;
      const trace = [];
      const db = { prepare(text) { const stmt = native.prepare(text); return {
        get(values) { trace.push({ text, values: plain(values), method: 'get' }); return stmt.get(values); },
      }; } };
      const before = plain(native.prepare('SELECT * FROM accounts ORDER BY tenant_id, id').all());
      const result = plain(api[operation](db, args));
      assert.deepEqual(result, expected, `${task}/${name}`);
      assert.deepEqual(plain(native.prepare('SELECT * FROM accounts ORDER BY tenant_id, id').all()), before);
      assert.equal(trace.length, name === 'invalid' ? 0 : 1);
      for (const call of trace) assert.deepEqual(call.values, { tenantId: args.tenantId, accountId: args.accountId });
      return { name, operation, args, result, trace, unchangedAccounts: true };
    } finally { native.close(); }
  });
}
const observations = [];
for (const task of ['lookup', 'shared']) {
  const pair = [];
  for (const layout of ['dedicated', 'colocated']) {
    const directory = `evaluation/adoption/preflight/fixtures/${task}/${layout}/src`;
    const files = readdirSync(resolve(root, directory)).sort().map(f => resolve(root, directory, f));
    const operation = resolve(root, directory, 'operation.mjs');
    const source = traceSource(operation, files);
    const api = await import(pathToFileURL(operation).href);
    const cases = exercise(task, api);
    for (const c of cases) for (const call of c.trace) assert.equal(call.text, source.sql);
    const audit = [];
    for (const strict of [false, true]) {
      const args = ['tooling/cli.mjs', '--sink=prepare', ...(strict ? ['--strict'] : []), directory];
      const run = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
      assert.equal(run.status, strict && layout === 'dedicated' ? 1 : 0, run.stderr);
      const report = JSON.parse(run.stdout);
      const candidates = report.findings.filter(f => f.boundary === 'driver-candidate');
      assert.equal(candidates.length, source.paths.length);
      assert.ok(candidates.every(f => f.level === (layout === 'dedicated' ? 'review-required' : 'ordinary')));
      assert.equal(report.findings.some(f => f.level === 'violation'), false);
      for (const path of source.paths) assert.ok(candidates.some(f => f.line === path.preparation.line && f.column === path.preparation.column));
      audit.push({ command: ['node', ...args], exit: run.status, stdout: run.stdout, stderr: run.stderr,
        candidateLevels: candidates.map(f => f.level) });
    }
    const observation = { task, layout, source, cases, audit };
    pair.push(observation); observations.push(observation);
  }
  assert.equal(pair[0].source.sql, pair[1].source.sql);
  assert.deepEqual(pair[0].source.paths.map(p => [p.function, p.bodySha256]), pair[1].source.paths.map(p => [p.function, p.bodySha256]));
  assert.deepEqual(pair[0].cases, pair[1].cases);
}
const original = read(resolve(root, 'evaluation/adoption/preflight/fixtures/lookup/dedicated/src/operation.mjs'));
const negativeControls = [
  ['wrong-module', original.replace('./findAccount.mjs', './missing.mjs')],
  ['wrong-export', original.replace("import { findAccount }", "import { absent as findAccount }")],
  ['aliased-import', original.replace('import { findAccount }', 'import { findAccount as chosen }').replace('bind(findAccount', 'bind(chosen')],
].map(([name, source]) => {
  const findings = auditSource(source, 'operation.mjs', { sinkNames: ['prepare'] });
  const candidates = findings.filter(f => f.boundary === 'driver-candidate');
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].level, 'review-required');
  return { name, source, findings };
});
const result = { serene: freeze.serene, rulesReference: freeze.rules, node: process.version, sqlite,
  method: 'mechanical route from known operation file; not AI/human effort',
  behaviorCases: observations.reduce((n, o) => n + o.cases.length, 0),
  observations, negativeControls };
writeFileSync(resolve(here, 'results.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ behaviorCases: result.behaviorCases, sqlite,
  layouts: observations.map(o => ({ task: o.task, layout: o.layout, reads: o.source.fullFileReads,
    edges: o.source.importEdges, executions: o.source.paths.length, exits: o.audit.map(a => a.exit) })),
  negativeControls: negativeControls.length }));
