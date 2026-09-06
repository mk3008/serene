import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const appRoot = resolve(process.argv[2] ?? process.env.APP_ROOT ?? 'evaluation/automatic-adoption/fixtures/product-sku-lookup');
const app = await import(pathToFileURL(resolve(appRoot, 'app.mjs')).href);
const results = [];
function check(name, operation) {
  try { results.push({ name, ...operation() }); }
  catch (error) { results.push({ name, passed: false, error: String(error?.message ?? error) }); }
}
const present = typeof app.findProductBySku === 'function';
results.push({ name: 'export', passed: present });
const db = app.openStockroom();
check('SQL behavior: selected record', () => !present ? { passed: false, skipped: 'missing export' } : { passed: app.findProductBySku(db, 'PEN-0042')?.name === 'Blue pen' });
check('SQL behavior: absent record', () => !present ? { passed: false, skipped: 'missing export' } : { passed: app.findProductBySku(db, 'PEN-9999') === null });
check('non-SQL validation: rejects before database access', () => {
  if (!present) return { passed: false, skipped: 'missing export' };
  let accessed = false;
  const blockedDb = new Proxy({}, { get() { accessed = true; throw new Error('database access'); } });
  try { app.findProductBySku(blockedDb, 'pen-42'); return { passed: false, accessed }; }
  catch (error) { return { passed: !accessed, accessed, error: String(error?.message ?? error) }; }
});
process.stdout.write(JSON.stringify({ appRoot, results }) + '\n');
if (!results.every((result) => result.passed)) process.exitCode = 1;
