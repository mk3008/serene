#!/usr/bin/env node
/** Package and stage the actual Serene npm artifact for neutral app packets. */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

function fail(message) { throw new Error(message); }
function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
function run(command, args, options) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) fail(`${command} ${args.join(' ')} failed (${result.status}):\n${result.stdout}\n${result.stderr}`);
  return result;
}
function option(argv, name) {
  const index = argv.indexOf(name);
  if (index < 0 || !argv[index + 1]) fail(`missing ${name}`);
  return argv[index + 1];
}
function optional(argv, name, fallback) {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1] || fail(`missing value for ${name}`);
}
function emit(value, argv) {
  const manifest = optional(argv, '--manifest', null);
  if (manifest) {
    const path = resolve(manifest);
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
  }
  process.stdout.write(JSON.stringify(value) + '\n');
}

function pack(argv) {
  const source = resolve(option(argv, '--source'));
  const output = resolve(option(argv, '--output'));
  if (!existsSync(resolve(source, 'package.json'))) fail('--source must be a package root');
  mkdirSync(output, { recursive: true });
  const result = run('npm', ['pack', '--json', '--pack-destination', output], { cwd: source });
  const packageInfo = JSON.parse(result.stdout)[0];
  const tarball = resolve(output, packageInfo.filename);
  if (!existsSync(tarball)) fail(`npm did not create ${tarball}`);
  emit({ tarball, sha256: sha256(tarball), name: packageInfo.name, version: packageInfo.version }, argv);
}

function install(argv) {
  const tarball = resolve(option(argv, '--tarball'));
  const app = resolve(option(argv, '--app'));
  const typescriptVersion = optional(argv, '--typescript-version', '5.9.3');
  if (!existsSync(tarball) || !existsSync(resolve(app, 'package.json'))) fail('--tarball and --app/package.json must exist');
  // serene-audit imports TypeScript. Stage the documented companion package so the
  // bin we expose is executable rather than merely a present symlink.
  const vendor = resolve(app, 'vendor');
  mkdirSync(vendor, { recursive: true });
  const stagedTarball = resolve(vendor, basename(tarball));
  copyFileSync(tarball, stagedTarball);
  run('npm', ['install', '--save-dev', '--ignore-scripts', '--no-audit', '--no-fund', '--offline', `typescript@${typescriptVersion}`], { cwd: app });
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline', stagedTarball], { cwd: app });
  const bin = resolve(app, 'node_modules/.bin/serene-audit');
  if (!existsSync(bin)) fail('actual serene-audit bin missing after local package install');
  emit({
    app,
    staged_tarball: stagedTarball,
    tarball_sha256: sha256(stagedTarball),
    typescript_version: typescriptVersion,
    installed_bin: bin,
    package_json_sha256: sha256(resolve(app, 'package.json')),
    package_lock_sha256: sha256(resolve(app, 'package-lock.json')),
    installed_package_json_sha256: sha256(resolve(app, 'node_modules/@mk3008/serene/package.json')),
    installed_typescript_package_json_sha256: sha256(resolve(app, 'node_modules/typescript/package.json')),
  }, argv);
}

function verify(argv) {
  const app = resolve(option(argv, '--app'));
  const probe = `import { DatabaseSync } from 'node:sqlite'; import { sql, bind } from '@mk3008/serene'; const db = new DatabaseSync(':memory:'); const query = bind(sql\`SELECT :id AS id\`, { id: 7 }); const row = db.prepare(query.text).get(query.params); if (row.id !== 7) throw new Error('unexpected sqlite result'); console.log(JSON.stringify({ id: row.id }));`;
  const runtime = run(process.execPath, ['--input-type=module', '--eval', probe], { cwd: app });
  const cli = run(resolve(app, 'node_modules/.bin/serene-audit'), ['--help'], { cwd: app });
  emit({ app, runtime_stdout: runtime.stdout, cli_stdout: cli.stdout, cli_stderr: cli.stderr, cli_sha256: sha256(resolve(app, 'node_modules/.bin/serene-audit')) }, argv);
}

const [operation, ...argv] = process.argv.slice(2);
if (operation === 'pack') pack(argv);
else if (operation === 'install') install(argv);
else if (operation === 'verify') verify(argv);
else fail('usage: prepare-package.mjs <pack|install|verify> ...');
