import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { sql, bind } from '../../../dist/index.js';
import { auditSource } from '../../../tooling/audit.mjs';
const ds = new DataSource({type:'better-sqlite3',database:':memory:',entities:[],synchronize:false});
await ds.initialize();
try {
 await ds.query('CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)');
 const insert=sql`INSERT INTO items VALUES (:id,:value)`;
 const payload="x' OR 1=1 --";
 for(const [id,value] of [[1,payload],[2,'other']]) {const q=bind(insert,{id,value},'anonymous'); await ds.query(q.text,q.values);}
 const q=bind(sql`SELECT id FROM items WHERE value=:value OR value=:value`,{value:payload},'anonymous');
 assert.deepEqual(q.values,[payload,payload]);
 for(const executor of [ds,ds.manager]) assert.deepEqual(await executor.query(q.text,q.values),[{id:1}]);
 const runner=ds.createQueryRunner();
 try {await runner.connect();assert.deepEqual(await runner.query(q.text,q.values),[{id:1}]);} finally {await runner.release();}
 const nullable=bind(sql`SELECT :value IS NULL AS missing`,{value:null},'anonymous');
 assert.equal((await ds.query(nullable.text,nullable.values))[0].missing,1);
 await assert.rejects(ds.transaction(async manager=>{const q=bind(insert,{id:3,value:'rollback'},'anonymous');await manager.query(q.text,q.values);throw new Error('intentional rollback');}),/intentional rollback/);
 assert.equal((await ds.query('SELECT count(*) AS n FROM items'))[0].n,2);
 const prefix="import {sql,bind} from '@mk3008/serene';const q=bind(sql`SELECT :id`,{id:1},'indexed');\n";
 const cases=[['dataSource','ds.query(q.text,q.values)','ordinary'],['manager','manager.query(q.text,q.values)','ordinary'],['queryRunner','runner.query(q.text,q.values)','ordinary'],['unknown','ds.query(input,[])','review-required'],['concat','ds.query("SELECT "+input,[])','violation'],['alias','const run=ds.query; run(q.text,q.values)','review-required']];
 const audit=cases.map(([id,code,expected])=>{const source=prefix+code;const findings=auditSource(source,id+'.ts').filter(r=>r.boundary==='driver-candidate').map(({level,code})=>({level,code}));assert.equal(findings.length,1);assert.equal(findings[0].level,expected,id);return{id,source,findings,expected};});
 const versions=Object.fromEntries(['typeorm','better-sqlite3','reflect-metadata'].map(n=>[n,JSON.parse(readFileSync(new URL(`node_modules/${n}/package.json`,import.meta.url))).version]));
 writeFileSync(new URL('results.json',import.meta.url),JSON.stringify({versions,checks:{realSqlite:'pass',hostileValue:'pass',repeatedBinding:'pass',null:'pass',dataSourceManagerQueryRunner:'pass',rollback:'pass',livePostgres:'not exercised'},audit},null,2)+'\n');
 console.log('TypeORM: runtime checks and 6 audit cases passed');
} finally {await ds.destroy();}
