import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('./tasks/', import.meta.url).pathname.replace(/\/$/, '');
const serenePkg = new URL('../../../dist/index.js', import.meta.url).pathname;
const capture = () => {
  const calls = [];
  return { db: { query(text, params) { calls.push({ text, params }); return []; } }, calls };
};
const normalize = value => JSON.stringify(value, (key, v) => key === 'updatedAt' ? '<timestamp>' : v);
async function pair(task, calls) {
  const raw = await import(pathToFileURL(`${root}/${task}/raw/source.mjs`));
  const serene = await import(pathToFileURL(`${root}/${task}/serene/source.mjs`));
  for (const [name, args] of calls) {
    const a = capture(); const b = capture();
    await raw[name](a.db, ...args); await serene[name](b.db, ...args);
    assert.equal(a.calls.length, b.calls.length, `${task}/${name} call count`);
    assert.equal(normalize(a.calls), normalize(b.calls), `${task}/${name} SQL/values`);
  }
}
await import(pathToFileURL(serenePkg));
await pair('birch', [
  ['listInvoices', [{ tenantId: 't1', role: 'tenant-admin' }, { status: 'paid', sort: '__proto__', direction: 'asc' }]],
  ['listInvoices', [{ tenantId: 't1', role: 'tenant-admin' }, { sort: 'total' }]],
  ['findInvoice', [{ tenantId: 't1', userId: 'u1' }, { id: "x' OR 1=1 --" }]],
  ['invoiceSummary', [{ tenantId: 't1', role: 'tenant-admin' }]]
]);
await pair('cedar', [
  ['setSubscriptionState', [{ tenantId: 't1', role: 'tenant-admin' }, { subscriptionId: 's1', state: 'active' }]],
  ['setSubscriptionState', [{ tenantId: 't1', role: 'tenant-admin' }, { subscriptionId: 's1', state: 'suspended' }]],
  ['subscriptionHistory', [{ tenantId: 't1', userId: 'u1' }, { limit: 3 }]],
  ['subscriptionHistory', [{ tenantId: 't1', userId: 'u1' }, { limit: 'toString' }]],
  ['subscriptionCount', [{ tenantId: 't1' }]]
]);
await pair('maple', [
  ['listProjects', [{ tenantId: 't1', userId: 'u1' }, { archived: true, order: '__proto__' }]],
  ['listProjects', [{ tenantId: 't1', userId: 'u1' }, { order: 'name' }]],
  ['projectById', [{ tenantId: 't1', userId: 'u1' }, { id: 'p1' }]],
  ['projectTotals', [{ tenantId: 't1', userId: 'u1' }]],
  ['visibleProjectNames', [{ tenantId: 't1', userId: 'u1' }]]
]);
console.log('pairing-check: all exercised branches matched');
