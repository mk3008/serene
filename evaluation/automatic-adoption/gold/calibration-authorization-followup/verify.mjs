import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const appRoot = resolve(process.argv[2] ?? process.env.APP_ROOT ?? 'evaluation/automatic-adoption/fixtures/calibration-authorization-followup');
const app = await import(pathToFileURL(resolve(appRoot, 'app.mjs')).href);
const results = [];
function check(name, operation) {
  try { results.push({ name, passed: Boolean(operation()) }); }
  catch (error) { results.push({ name, passed: false, error: String(error?.message ?? error) }); }
}
check('export', () => typeof app.caseById === 'function');
const db = app.openCases();
let result;
check('cross-tenant request returns a record', () => { result = app.caseById(db, { tenantId: 'north' }, { tenantId: 'south', id: 2 }); return result !== null; });
check('returned record belongs to requested tenant', () => result?.tenant_id === 'south');
process.stdout.write(JSON.stringify({ appRoot, results }) + '\n');
if (!results.every((result) => result.passed)) process.exitCode = 1;
