import assert from 'node:assert/strict';
import { caseById, openCases } from './app.mjs';
assert.equal(caseById(openCases(), { tenantId: 'north' }, { tenantId: 'north', id: 1 }).subject, 'North renewal');
console.log('case record checks passed');
