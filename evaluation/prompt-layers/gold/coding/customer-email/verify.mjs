import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] ?? process.env.APP_ROOT ?? '.');
const app = await import(pathToFileURL(resolve(root, 'app.mjs')).href);
assert.equal(typeof app.findCustomerByEmail, 'function', 'feature export is missing');
const db = app.openCustomers();
assert.deepEqual(app.findCustomerByEmail(db, 'maya@example.test'), { id: 1, email: 'maya@example.test', name: 'Maya Patel' });
assert.deepEqual(app.findCustomerByEmail(db, "o'connor@example.test"), { id: 2, email: "o'connor@example.test", name: "Nora O'Connor" });
db.query('INSERT INTO customers (id, email, name) VALUES (:id, :email, :name)', { id: 77, email: 'new.person@example.test', name: 'New Person' });
assert.deepEqual(app.findCustomerByEmail(db, 'new.person@example.test'), { id: 77, email: 'new.person@example.test', name: 'New Person' });
assert.equal(app.findCustomerByEmail(db, 'nobody@example.test'), null);
let accessed = false;
assert.throws(() => app.findCustomerByEmail({ query() { accessed = true; } }, ''), TypeError);
assert.equal(accessed, false);
console.log(JSON.stringify({ root, passed: true }));
