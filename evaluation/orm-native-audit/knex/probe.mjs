import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import knex from 'knex';
import Database from 'better-sqlite3';
import {sql,bind} from '../../../dist/index.js';
import {auditSource} from '../../../tooling/audit.mjs';
const db=knex({client:'better-sqlite3',connection:{filename:':memory:'},useNullAsDefault:true,pool:{min:1,max:1}});
const native=new Database(':memory:');
const pg=knex({client:'pg'});
try {
 await db.raw('CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)');
 const payload="x' OR 1=1 --";
 for(const [id,value] of [[1,payload],[2,'other']]) {const q=bind(sql`INSERT INTO items VALUES (:id,:value)`,{id,value},'anonymous');await db.raw(q.text,q.values);}
 const q=bind(sql`SELECT value FROM items WHERE value=:value OR value=:value`,{value:payload},'anonymous');
 assert.deepEqual(await db.raw(q.text,q.values),[{value:payload}]);
 const n=bind(sql`SELECT :value AS missing`,{value:null},'anonymous');assert.deepEqual(await db.raw(n.text,n.values),[{missing:null}]);
 await assert.rejects(db.transaction(async trx=>{const q=bind(sql`INSERT INTO items VALUES (:id,:value)`,{id:3,value:'rollback'},'anonymous');await trx.raw(q.text,q.values);throw new Error('intentional rollback');}),/intentional rollback/);
 assert.equal((await db.raw('SELECT value FROM items')).length,2);
 const p=pg.raw(q.text,q.values).toSQL().toNative();
 assert.equal(p.sql,'SELECT value FROM items WHERE value=$1 OR value=$2');assert.deepEqual(p.bindings,[payload,payload]);
 const literal=bind(sql`SELECT '?' AS literal, :value AS value`,{value:payload},'anonymous');
 assert.deepEqual(native.prepare(literal.text).all(literal.values),[{literal:'?',value:payload}]);
 let error;try {db.raw(literal.text,literal.values).toSQL();}catch(e){error=e.message;}
 assert.equal(error,'Expected 1 bindings, saw 2');
 const prefix="import {sql,bind} from '@mk3008/serene';const q=bind(sql`SELECT :id`,{id:1},'anonymous');\n";
 const cases=[['direct','await db.raw(q.text,q.values)','ordinary'],['transaction','await trx.raw(q.text,q.values)','ordinary'],['deferred','const pending=db.raw(q.text,q.values); await pending','ordinary'],['unknown','await db.raw(input,[])','review-required'],['concat','await db.raw("SELECT "+input,[])','violation'],['alias','const run=db.raw;await run(q.text,q.values)','review-required']];
 const audit=cases.map(([id,code,expected])=>{const source=prefix+code;const run=options=>auditSource(source,id+'.ts',options).filter(r=>r.boundary==='driver-candidate').map(({level,code})=>({level,code}));const defaults=run(),configured=run({sinkNames:['query','execute','unsafe','raw']});assert.equal(defaults.length,0,id);assert.equal(configured.length,1,id);assert.equal(configured[0].level,expected,id);return{id,source,defaults,configured,expected};});
 const versions=Object.fromEntries(['knex','better-sqlite3'].map(n=>[n,JSON.parse(readFileSync(new URL(`node_modules/${n}/package.json`,import.meta.url))).version]));
 writeFileSync(new URL('results.json',import.meta.url),JSON.stringify({versions,checks:{realSqlite:'pass',hostileValue:'pass',repeated:'pass',null:'pass',rollback:'pass',pgCompilationOnly:'pass',livePostgres:'not exercised'},incompatibility:{sql:literal.text,native:'executes with unchanged literal',knexError:error},audit},null,2)+'\n');console.log('Knex: runtime checks and 12 audit cells pass; native literal incompatibility reproduced');
} finally {native.close();await db.destroy();await pg.destroy();}
