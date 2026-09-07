import assert from 'node:assert/strict';
import { inventoryTotal, openStockroom } from './app.mjs';
assert.equal(inventoryTotal(openStockroom()), 22);
console.log('stockroom checks passed');
