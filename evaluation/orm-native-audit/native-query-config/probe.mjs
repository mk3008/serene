import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { auditSource as baseline } from '../../../tooling/audit.mjs';
import { auditSource as prototype } from './prototype.mjs';
const prefix = "import {sql, bind} from '@mk3008/serene'; const q = bind(sql`SELECT :id`, {id:1}, 'indexed');\n";
const cases = [
 ['bound', 'client.query(q)', 'ordinary'],
 ['inlineBind', 'client.query(bind(sql`SELECT :id`, {id:1}, "indexed"))', 'ordinary'],
 ['poolBound', 'pool.query(q)', 'ordinary'],
 ['inlineConfig', 'client.query({text:q.text, values:q.values})', 'ordinary'],
 ['reversed', 'client.query({values:q.values, text:q.text})', 'ordinary'],
 ['configAlias', 'const c={text:q.text,values:q.values}; client.query(c)', 'review-required'],
 ['mutatedAlias', 'const c={text:q.text,values:q.values}; c.text=input; client.query(c)', 'review-required'],
 ['letAlias', 'let c=q; client.query(c)', 'review-required'],
 ['getter', 'client.query({get text(){return q.text},values:q.values})', 'review-required'],
 ['computed', 'client.query({["text"]:q.text,values:q.values})', 'review-required'],
 ['spread', 'client.query({...q})', 'review-required'],
 ['overwrite', 'client.query({text:q.text,values:q.values,...input})', 'review-required'],
 ['duplicate', 'client.query({text:q.text,values:q.values,text:input})', 'review-required'],
 ['cast', 'client.query(q as any)', 'review-required'],
 ['castText', 'client.query({text:q.text as string,values:q.values})', 'review-required'],
 ['unknown', 'client.query({text:input,values:q.values})', 'review-required'],
 ['concat', 'client.query({text:q.text+input,values:q.values})', 'review-required'],
 ['wrapper', 'client.query(make(q))', 'review-required'],
 ['factory', 'client.query(CompiledQuery.raw(q.text,q.values))', 'review-required'],
 ['sinkAlias', 'const run=client.query; run(q)', 'review-required'],
 ['extraOption', 'client.query({text:q.text,values:q.values,rowMode:"array"})', 'review-required'],
 ['unknownValues', 'client.query({text:q.text,values:input})', 'review-required'],
 ['otherSink', 'client.execute(q)', 'review-required'],
 ['directText', 'client.query(q.text,q.values)', 'ordinary'],
 ['directConcat', 'client.query("SELECT "+input)', 'violation'],
];
const rows = cases.map(([id,code,expected]) => {
 const source=prefix+code;
 const run=fn=>fn(source,id+'.ts').filter(r=>r.boundary==='driver-candidate').map(({level,code})=>({level,code}));
 const before=run(baseline),after=run(prototype);
 assert.equal(after.length,1,id); assert.equal(after[0].level,expected,id);
 assert.equal(before[0].level,id==='directText'?'ordinary':id==='directConcat'?'violation':'review-required',id+' baseline');
 return {id,source,before,after,expected};
});
writeFileSync(new URL('results.json',import.meta.url),JSON.stringify({scope:'evaluation-only; query-name candidacy, not authenticated driver identity',cases:rows},null,2)+'\n');
console.log(`${rows.length} cases passed; ${rows.filter(r=>r.before[0].level!==r.after[0].level).length} newly ordinary; production unchanged`);
