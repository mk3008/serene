import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { revenueSummary } from '../raw/store.js';
const native = new DatabaseSync(':memory:');
native.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const db = { query(text, values={}) { const s=native.prepare(text); return /^\s*select/i.test(text) ? s.all(values) : s.run(values); } };
const safe = await revenueSummary(db,{from:'2026-01-01',to:'2026-02-01',region:'west'});
const injected = await revenueSummary(db,{from:'2026-01-01',to:'2026-02-01',region:"west' OR 1=1 --"});
console.log(JSON.stringify({safe,injected}));
