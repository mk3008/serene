import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { categorySnapshot } from '../raw/store.js';
const native = new DatabaseSync(':memory:');
native.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const db = { query(text, values={}) { const s=native.prepare(text); return /^\s*select/i.test(text) ? s.all(values) : s.run(values); } };
const safe = await categorySnapshot(db,{category:'tools'});
const injected = await categorySnapshot(db,{category:"tools' OR 1=1 --"});
console.log(JSON.stringify({safe,injected}));
