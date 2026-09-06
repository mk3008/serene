import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const appRoot = resolve(process.argv[2] ?? process.env.APP_ROOT ?? 'evaluation/automatic-adoption/fixtures/invoice-authorization-followup');
const app = await import(pathToFileURL(resolve(appRoot, 'app.mjs')).href);
const results = [];
function check(name, operation) {
  try { results.push({ name, passed: Boolean(operation()) }); }
  catch (error) { results.push({ name, passed: false, error: String(error?.message ?? error) }); }
}
check('export', () => typeof app.invoiceById === 'function');
const db = app.openInvoices();
let result;
check('cross-tenant request returns a record', () => { result = app.invoiceById(db, { tenantId: 'cedar' }, { tenantId: 'maple', id: 42 }); return result !== null; });
check('returned record belongs to requested tenant', () => result?.tenant_id === 'maple');
process.stdout.write(JSON.stringify({ appRoot, results }) + '\n');
if (!results.every((result) => result.passed)) process.exitCode = 1;
