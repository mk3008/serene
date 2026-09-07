import assert from 'node:assert/strict';
import { listContacts, openContacts } from './app.mjs';
const db = openContacts();
assert.equal(listContacts(db).length, 2);
console.log('contact desk checks passed');
