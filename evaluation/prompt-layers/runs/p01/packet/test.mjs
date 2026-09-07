import assert from 'node:assert/strict';
import test from 'node:test';
import { listCustomers, openCustomers } from './app.mjs';

test('lists the seeded customers', () => {
  assert.deepEqual(listCustomers(openCustomers()).map(({ id, email, name }) => ({ id, email, name })), [
    { id: 1, email: 'maya@example.test', name: 'Maya Patel' },
    { id: 2, email: "o'connor@example.test", name: "Nora O'Connor" },
    { id: 3, email: 'lee@example.test', name: 'Lee Tran' },
  ]);
});
