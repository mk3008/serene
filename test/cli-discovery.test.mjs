import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const cli = resolve('tooling/cli.mjs');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'serene-discovery-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (name, text = 'db.query("SELECT 1")') => {
    const path = join(root, name); mkdirSync(resolve(path, '..'), {recursive:true}); writeFileSync(path, text); return path;
  };
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], {cwd:root, encoding:'utf8'});
  return {root, write, run};
}
test('repository scan selects all eight source extensions, recursively and once', t => {
  const {write, run} = fixture(t);
  for (const ext of ['ts','tsx','mts','cts','js','jsx','mjs','cjs']) write(`src/nested/a.${ext}`);
  write('src/ignore.sql'); write('src/ignore.json');
  const result = run('src', './src/nested/a.ts', 'src/nested');
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.files.length, 8); assert.equal(report.findings.length, 8);
  assert.deepEqual(report.files, [...report.files].sort());
  assert.equal(run('--strict', '.').status, 1);
});
test('excluded directories and symlink cycles are visible omissions; explicit files override exclusions', t => {
  const {root,write,run} = fixture(t);
  write('src/ok.ts');
  for (const dir of ['node_modules','dist','build','coverage','.git']) write(`${dir}/bad.ts`, 'db.query("SELECT " + input)');
  try {
    symlinkSync(root, join(root, 'src/loop'), 'dir');
    symlinkSync(join(root, 'src/ok.ts'), join(root, 'src/link.ts'));
  } catch (error) {
    if (error?.code === 'EPERM' || error?.code === 'EACCES') {
      t.skip('symbolic-link creation is not permitted in this environment');
      return;
    }
    throw error;
  }
  const result = run('.'); assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.files.length, 1); assert.equal(report.skipped.length, 7);
  assert.equal(run('dist/bad.ts').status, 1); assert.equal(run('dist').status, 1);
  assert.equal(run('src/link.ts').status, 2);
});
test('empty, missing, and mixed invalid inputs never report successful partial coverage', t => {
  const {write,run} = fixture(t);
  write('empty/data.json'); write('src/ok.ts');
  for (const args of [['empty'], ['missing'], ['src','missing'], ['*.ts']]) {
    const result = run(...args); assert.equal(result.status, 2); assert.equal(result.stdout, '');
  }
  write('custom.source'); assert.equal(run('custom.source').status, 0);
});
test('recursive scan retains parse violations and custom sink detection', t => {
  const {write,run} = fixture(t);
  write('src/ok.ts', 'runSql(input)');
  assert.equal(run('--strict','--sink=runSql','src').status, 1);
  write('src/broken.ts', 'const = ;');
  const result = run('src'); assert.equal(result.status, 1);
  assert.ok(JSON.parse(result.stdout).findings.some(f => f.code === 'PARSE_ERROR'));
});
