import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Fixed public fixture and expected decisions. No AI or historical study data.
const source = [
  'import { sql, bind } from "@mk3008/serene";',
  'const q = bind(sql`select 1`, {});',
  'db.query(q.text, q.values);',
  'db.query(raw);',
  'db.query("select " + input);',
  'wrapper(q);',
  'db.runSql(q.text, q.values);',
  'db.query(q.text); db.query(raw);',
].join('\n') + '\n';

test('JSONL preserves every record and only exact positive ordinary matches skip', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'serene-handoff-'));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  try {
    git('init', '-q');
    writeFileSync(path.join(root, 'app.ts'), source);
    writeFileSync(path.join(root, 'other.sql'), 'select 1');
    writeFileSync(path.join(root, 'broken.ts'), source + '\nconst = ;');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Fixed handoff fixture');
    const revision = git('rev-parse', 'HEAD');
    const base = { revision, file: 'app.ts', line: 3, column: 1, kind: 'execution' };
    const cases = [
      ['ordinary', {}, 'ordinary', true],
      ['review', { line: 4 }, 'review-required', false],
      ['violation', { line: 5 }, 'violation', false],
      ['line-shift', { line: 2 }, 'unmatched', false],
      ['column-shift', { column: 2 }, 'unmatched', false],
      ['line-only', { column: undefined }, 'unmatched', false],
      ['stale', { revision: '0'.repeat(40) }, 'unmatched', false],
      ['function-only', { line: undefined, column: undefined, function: 'main' }, 'unmatched', false],
      ['caller', { kind: 'caller' }, 'unmatched', false],
      ['wrapper-location', { line: 6 }, 'unmatched', false],
      ['wrapper-kind', { kind: 'wrapper' }, 'unmatched', false],
      ['missing-file', { file: 'missing.ts' }, 'unmatched', false],
      ['unsupported-source', { file: 'other.sql' }, 'unmatched', false],
      ['unsupported-sink', { line: 7 }, 'unmatched', false],
      ['nearby-ambiguous', { line: 8, column: undefined }, 'unmatched', false],
      ['nearby-ordinary', { line: 8 }, 'ordinary', true],
      ['nearby-review', { line: 8, column: 19 }, 'review-required', false],
      ['parse-error', { file: 'broken.ts' }, 'unmatched', false],
      ['traversal', { file: '../app.ts' }, 'unmatched', false],
      ['unknown-kind', { kind: undefined }, 'unmatched', false],
      ['duplicate-id', { id: 'ordinary' }, 'ordinary', true],
    ];
    const candidates = cases.map(([id, overrides]) => ({ ...base, id, ...overrides }));
    const input = candidates.map(JSON.stringify).concat(['null', '{broken', '']).join('\n') + '\n';
    const cli = fileURLToPath(new URL('./handoff.mjs', import.meta.url));
    const invoke = data => execFileSync(process.execPath, [cli, root, revision], { input: data, encoding: 'utf8' }).trimEnd().split('\n').map(JSON.parse);
    const output = invoke(input);
    assert.equal(output.length, candidates.length + 3);
    cases.forEach(([id, , classification, skip], i) => {
      assert.equal(output[i].ordinal, i + 1);
      assert.deepEqual(output[i].candidate, JSON.parse(JSON.stringify(candidates[i])));
      assert.equal(output[i].classification, classification, id);
      assert.equal(output[i].skip, skip, id);
    });
    for (const row of output.slice(candidates.length)) assert.equal(row.skip, false);
    writeFileSync(path.join(root, 'app.ts'), source + '// dirty\n');
    const dirty = invoke(JSON.stringify(base) + '\n')[0];
    assert.equal(dirty.skip, false);
    assert.equal(dirty.reason, 'working-source-mismatch');
    writeFileSync(path.join(root, 'app.ts'), source);
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'Advance revision without source change');
    const advanced = invoke(JSON.stringify(base) + '\n')[0];
    assert.equal(advanced.skip, false);
    assert.equal(advanced.reason, 'repository-revision-mismatch');
    const result = { advanced_revision: advanced, fixed_cases: cases.length, input_records: output.length, output_records: output.length,
      candidate_loss: 0, skip_records: output.filter(x => x.skip).length, dirty_source: dirty,
      decisions: output };
    if (process.env.HANDOFF_RESULTS) writeFileSync(process.env.HANDOFF_RESULTS, JSON.stringify(result, null, 2) + '\n');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
