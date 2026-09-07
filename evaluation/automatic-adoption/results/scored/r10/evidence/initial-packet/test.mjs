import assert from 'node:assert/strict';
import { forAccount, invoice, openBilling, paid } from './app.mjs';
const db = openBilling();
assert.equal(invoice(db, 1).account, 'acme');
assert.equal(forAccount(db, 'orbit').length, 1);
assert.equal(paid(db).length, 1);
console.log('billing checks passed');
