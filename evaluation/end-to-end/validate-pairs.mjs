#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const evaluationDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(evaluationDir));
const tasksDir = join(evaluationDir, 'tasks');
const outputPath = join(evaluationDir, 'fixture-parity.json');
const temporaryDir = mkdtempSync(join(tmpdir(), 'serene-e2e-pair-check-'));
const groups = [
  ['ticketing/raw/operations', 'ticketing/serene/operations'],
  ['ticketing/raw/reporting', 'ticketing/serene/reporting'],
  ['ticketing/raw/maintenance', 'ticketing/serene/maintenance'],
  ['stockroom/raw/operations', 'stockroom/serene/operations'],
  ['stockroom/raw/reporting', 'stockroom/serene/reporting'],
  ['stockroom/raw/maintenance', 'stockroom/serene/maintenance'],
  ['calibration/raw/operations', 'calibration/serene/operations']
];

try {
  const sourceFiles = groups.flatMap(([raw, serene]) => [
    join(tasksDir, `${raw}.ts`),
    join(tasksDir, `${serene}.ts`)
  ]);
  for (const variant of ['raw', 'serene']) {
    for (const task of ['ticketing', 'stockroom', 'calibration']) {
      sourceFiles.push(join(tasksDir, task, variant, 'contracts.ts'));
    }
  }
  execFileSync(process.execPath, [
    join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
    '--skipLibCheck', '--outDir', temporaryDir, '--rootDir', tasksDir, ...sourceFiles
  ], { cwd: repoRoot, stdio: 'inherit' });
  mkdirSync(join(temporaryDir, 'node_modules', '@mk3008'), { recursive: true });
  symlinkSync(repoRoot, join(temporaryDir, 'node_modules', '@mk3008', 'serene'));

  const evidence = [];
  for (const [rawModulePath, sereneModulePath] of groups) {
    const rawModule = await import(pathToFileURL(join(temporaryDir, `${rawModulePath}.js`)).href);
    const sereneModule = await import(pathToFileURL(join(temporaryDir, `${sereneModulePath}.js`)).href);
    for (const [functionName, rawFunction] of Object.entries(rawModule)) {
      const sereneFunction = sereneModule[functionName];
      if (typeof sereneFunction !== 'function') throw new Error(`Missing paired Serene export: ${functionName}`);
      const capture = () => {
        const calls = [];
        return [{
          query: async (...args) => calls.push(['query', ...args]),
          execute: async (...args) => calls.push(['execute', ...args]),
          sendSql: async (...args) => calls.push(['sendSql', ...args])
        }, calls];
      };
      const [rawDb, rawCalls] = capture();
      const [sereneDb, sereneCalls] = capture();
      const argumentsForFunction = Array(Math.max(0, rawFunction.length - 1)).fill('sample');
      await rawFunction(rawDb, ...argumentsForFunction);
      await sereneFunction(sereneDb, ...argumentsForFunction);
      if (JSON.stringify(rawCalls) !== JSON.stringify(sereneCalls)) {
        throw new Error(`Different driver execution for ${rawModulePath}:${functionName}`);
      }
      const [[method, text, params]] = rawCalls;
      if ((method === 'query' || method === 'execute') && params !== undefined &&
          (Array.isArray(params) || typeof params !== 'object')) {
        throw new Error(`Non-object parameters for ${rawModulePath}:${functionName}`);
      }
      evidence.push({
        task: rawModulePath.split('/')[0],
        module: rawModulePath.replace(/\/raw\//, '/'),
        function: functionName,
        method,
        text,
        params: params ?? null
      });
    }
  }
  const result = {
    purpose: 'Exact raw/Serene driver SQL text and parameter equality check.',
    status: 'passed',
    pairsChecked: evidence.length,
    pairs: evidence
  };
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Verified ${evidence.length} paired driver executions and wrote ${relative(repoRoot, outputPath)}.`);
} finally {
  rmSync(temporaryDir, { recursive: true, force: true });
}
