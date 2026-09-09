import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { PrismaClient } from './generated/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { sql, bind } from '../../../dist/index.js';
import { auditSource } from '../../../tooling/audit.mjs';
const db=new PrismaClient({adapter:new PrismaBetterSqlite3({url:':memory:'})});
try {
 await db.$executeRawUnsafe('CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)');
 const insert=sql`INSERT INTO items VALUES (:id,:value)`;const payload="x' OR 1=1 --";
 for(const [id,value] of [[1,payload],[2,'other']]) {const q=bind(insert,{id,value},'anonymous');await db.$executeRawUnsafe(q.text,...q.values);}
 const q=bind(sql`SELECT value FROM items WHERE value=:value OR value=:value`,{value:payload},'anonymous');
 assert.deepEqual(q.values,[payload,payload]);assert.deepEqual(await db.$queryRawUnsafe(q.text,...q.values),[{value:payload}]);
 const n=bind(sql`SELECT :value AS missing`,{value:null},'anonymous');assert.deepEqual(await db.$queryRawUnsafe(n.text,...n.values),[{missing:null}]);
 await assert.rejects(db.$transaction(async tx=>{const q=bind(insert,{id:3,value:'rollback'},'anonymous');await tx.$executeRawUnsafe(q.text,...q.values);throw new Error('intentional rollback');}),/intentional rollback/);
 assert.equal((await db.$queryRawUnsafe('SELECT value FROM items')).length,2);
 const prefix="import {sql,bind} from '@mk3008/serene';const q=bind(sql`SELECT :id`,{id:1},'indexed');\n";
 const cases=[['select','db.$queryRawUnsafe(q.text,...q.values)','ordinary'],['write','db.$executeRawUnsafe(q.text,...q.values)','ordinary'],['transaction','tx.$queryRawUnsafe(q.text,...q.values)','ordinary'],['unknown','db.$queryRawUnsafe(input)','review-required'],['concat','db.$queryRawUnsafe("SELECT "+input)','violation'],['alias','const run=db.$queryRawUnsafe;run(q.text,...q.values)','review-required']];
 const audit=cases.map(([id,code,expected])=>{const source=prefix+code;const run=options=>auditSource(source,id+'.ts',options).filter(r=>r.boundary==='driver-candidate').map(({level,code})=>({level,code}));const defaults=run(),configured=run({sinkNames:['query','execute','unsafe','$queryRawUnsafe','$executeRawUnsafe']});assert.equal(defaults.length,0,id);assert.equal(configured.length,1,id);assert.equal(configured[0].level,expected,id);return{id,source,defaults,configured,expected};});
 const versions=Object.fromEntries(['@prisma/client','prisma','@prisma/adapter-better-sqlite3'].map(n=>[n,JSON.parse(readFileSync(new URL(`node_modules/${n}/package.json`,import.meta.url))).version]));
 writeFileSync(new URL('results.json',import.meta.url),JSON.stringify({versions,checks:{realSqlite:'pass',hostileValue:'pass',repeated:'pass',null:'pass',rollback:'pass',livePostgres:'not exercised'},audit},null,2)+'\n');console.log('Prisma 7: runtime and 6-by-2 audit matrix passed');
} finally {await db.$disconnect();}
