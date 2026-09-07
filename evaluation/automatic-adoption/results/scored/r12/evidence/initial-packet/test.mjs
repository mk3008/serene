import assert from 'node:assert/strict';
import { invoiceById, openInvoices } from './app.mjs';
assert.equal(invoiceById(openInvoices(), { tenantId: 'cedar' }, { tenantId: 'cedar', id: 41 }).amount, 300);
console.log('invoice portal checks passed');
