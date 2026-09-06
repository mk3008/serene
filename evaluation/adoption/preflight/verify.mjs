import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const repo = resolve(root, '../../..');
const catalog = JSON.parse(readFileSync(resolve(root, 'catalog.json')));
const schema = readFileSync(resolve(root, 'schema.sql'), 'utf8');
const seed = readFileSync(resolve(root, 'seed.sql'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const sha = value => createHash('sha256').update(value).digest('hex');
const sourceFiles = path => readdirSync(path, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e =>
  e.isDirectory() ? sourceFiles(resolve(path,e.name)) : [resolve(path,e.name)]);
const observations = [];
const sensitivity = [];
let engine;
function database() {
  const native = new DatabaseSync(':memory:');
  native.exec(schema); native.exec(seed);
  engine = native.prepare('SELECT sqlite_version() AS version').get().version;
  const trace = [];
  // Observation wrapper forwards the exact SQL and named values to native SQLite.
  // It is evaluation instrumentation, not a Serene driver implementation.
  const db = {
    exec(text) { trace.push({control:text}); return native.exec(text); },
    prepare(text) {
      const statement = native.prepare(text);
      return Object.fromEntries(['get','all','run'].map(method => [method, (...args) => {
        trace.push({text,method,args:plain(args)});
        return statement[method](...args);
      }]));
    },
  };
  const snapshot = () => plain({
    accounts: native.prepare('SELECT * FROM accounts ORDER BY tenant_id, id').all(),
    inventory: native.prepare('SELECT * FROM inventory ORDER BY tenant_id, sku').all(),
    orders: native.prepare('SELECT * FROM orders ORDER BY tenant_id, id').all(),
    shipments: native.prepare('SELECT * FROM shipments ORDER BY id').all(),
  });
  return {native,db,trace,snapshot};
}
function checkCase(name, run, verify) {
  const d = database();
  try {
    const before = d.snapshot();
    let result, error = null;
    try { result = run(d.db); } catch(e) { error = e.message; }
    const after = d.snapshot();
    verify({result,error,before,after,trace:d.trace});
    return {name,result:result ?? null,error,before,after,trace:d.trace};
  } finally {d.native.close();}
}
function scenarios(task, api) {
  const out=[];
  const success = ({error}) => assert.equal(error,null);
  const rollback = ({error,before,after,trace}) => {
    assert.ok(error); assert.deepEqual(after,before);
    assert.equal(trace.at(-1).control,'ROLLBACK');
  };
  if(task==='lookup') {
    out.push(checkCase('owned', db=>api.lookup(db,{tenantId:1,accountId:10}), x=>{success(x);assert.deepEqual(plain(x.result),{name:'Alice',balance:100});}));
    for(const accountId of [30, "10 OR 1=1 --", "'; DROP TABLE accounts; --"]) {
      out.push(checkCase('unmatched-or-hostile-'+String(accountId), db=>api.lookup(db,{tenantId:1,accountId}), x=>{success(x);assert.equal(x.result,null);assert.deepEqual(x.after,x.before);assert.equal(x.trace[0].args[0].accountId,accountId);assert.ok(!x.trace[0].text.includes(String(accountId)));}));
    }
  } else if(task==='transfer') {
    out.push(checkCase('transfer',db=>api.transfer(db,{tenantId:1,fromId:10,toId:20,amount:25}),x=>{
      success(x);assert.deepEqual(x.result,{fromBalance:75,toBalance:65});
      assert.deepEqual(x.after.accounts.map(a=>a.balance),[75,65,900,500]);
      assert.deepEqual(x.trace.filter(t=>t.text).map(t=>t.args[0]),[{tenantId:1,fromId:10,amount:25},{tenantId:1,toId:20,amount:25}]);
      assert.equal(x.trace.at(-1).control,'COMMIT');
    }));
    for(const [name,toId,amount] of [['other-tenant-target',30,25],['insufficient',20,101]]) {
      out.push(checkCase(name,db=>api.transfer(db,{tenantId:1,fromId:10,toId,amount}),rollback));
    }
    out.push(checkCase('negative-amount',db=>api.transfer(db,{tenantId:1,fromId:10,toId:20,amount:-5}),x=>{assert.ok(x.error);assert.deepEqual(x.after,x.before);assert.equal(x.trace.length,0);}));
  } else if(task==='fulfill') {
    out.push(checkCase('batch-success',db=>api.fulfill(db,{tenantId:1,orderIds:[102,101]}),x=>{
      success(x);assert.deepEqual(x.result,[{orderId:102,shipmentId:1,quantity:3},{orderId:101,shipmentId:2,quantity:2}]);
      assert.equal(x.after.inventory[0].stock,5);assert.equal(x.after.inventory[2].stock,50);
      assert.deepEqual(x.after.orders.map(o=>o.status),['shipped','shipped','pending','pending']);
      assert.deepEqual(x.trace.filter(t=>t.text).map(t=>t.text.split(' ')[0]),['SELECT','UPDATE','INSERT','UPDATE','SELECT','UPDATE','INSERT','UPDATE']);
      assert.equal(x.trace.at(-1).control,'COMMIT');
    }));
    for(const [name,orderIds] of [['late-stock-failure',[101,103]],['other-tenant-order',[101,201]],['duplicate-order',[101,101]]]) {
      out.push(checkCase(name,db=>api.fulfill(db,{tenantId:1,orderIds}),rollback));
    }
  } else if(task==='shared') {
    out.push(checkCase('two-callers',db=>({name:api.accountName(db,{tenantId:1,accountId:10}),can:api.canSpend(db,{tenantId:1,accountId:10,amount:100})}),x=>{success(x);assert.deepEqual(x.result,{name:'Alice',can:true});assert.equal(x.trace[0].text,x.trace[1].text);}));
    out.push(checkCase('tenant-and-balance',db=>({name:api.accountName(db,{tenantId:1,accountId:30}),can:api.canSpend(db,{tenantId:1,accountId:30,amount:1}),over:api.canSpend(db,{tenantId:1,accountId:10,amount:101})}),x=>{success(x);assert.deepEqual(x.result,{name:null,can:false,over:false});assert.deepEqual(x.after,x.before);}));
  }
  return out;
}
for(const [task, contract] of Object.entries(catalog.tasks)) {
  const pair=[];
  for(const layout of ['dedicated','colocated']) {
    const src=resolve(root,'fixtures',task,layout,'src');
    const files=sourceFiles(src);
    const api=await import(new URL(`fixtures/${task}/${layout}/src/operation.mjs`,import.meta.url));
    const cases=scenarios(task,api);
    // Check the oracle rejects representative wrong behavior rather than merely
    // observing equality between two implementations with the same defect.
    if (layout === 'colocated') {
      const mutants = task === 'lookup' ? [
        ['wrong-tenant-binding', {...api, lookup:(db,p)=>api.lookup(db,{...p,tenantId:2})}],
      ] : task === 'transfer' ? [
        ['wrong-amount-binding', {...api, transfer:(db,p)=>api.transfer(db,{...p,amount:p.amount+1})}],
        ['missing-transaction', {...api, transfer:(db,p)=>api.transfer({...db,exec(){}},p)}],
      ] : task === 'fulfill' ? [
        ['reversed-execution-order', {...api, fulfill:(db,p)=>api.fulfill(db,{...p,orderIds:[...p.orderIds].reverse()})}],
        ['missing-batch-rollback', {...api, fulfill:(db,p)=>api.fulfill({...db,exec(text){if(text==='ROLLBACK') return db.exec('COMMIT');return db.exec(text);}},p)}],
      ] : [
        ['wrong-second-caller-binding', {...api, canSpend:(db,p)=>api.canSpend(db,{...p,tenantId:2})}],
      ];
      for (const [name, mutant] of mutants) {
        assert.throws(()=>scenarios(task,mutant), {name:'AssertionError'});
        sensitivity.push({task,mutation:name,rejected:true});
      }
    }
    const audits={};
    for(const strict of [false,true]) {
      const args=['tooling/cli.mjs','--sink=prepare', ...(strict?['--strict']:[]), relative(repo,src)];
      const run=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8'});
      assert.equal(run.error,undefined);
      assert.equal(run.status,strict && layout==='dedicated'?1:0,run.stderr);
      const report=JSON.parse(run.stdout);
      const sinks=report.findings.filter(f=>f.boundary==='driver-candidate');
      assert.equal(sinks.length,contract.applicationExecutionSites);
      assert.ok(sinks.every(f=>f.level===(layout==='dedicated'?'review-required':'ordinary')));
      assert.ok(!report.findings.some(f=>f.level==='violation'));
      audits[strict?'strict':'ordinary']={command:[process.execPath,...args],exit:run.status,stdout:run.stdout,stderr:run.stderr};
    }
    const definitions=files.flatMap(f=>[...readFileSync(f,'utf8').matchAll(/sql`([^`]*)`/g)].map(m=>m[1])).sort();
    assert.equal(definitions.length,contract.definitions.length);
    const observation={task,layout,sourceFiles:files.map(f=>({path:relative(repo,f),sha256:sha(readFileSync(f))})),definitions,cases,audits};
    pair.push(observation);observations.push(observation);
  }
  assert.deepEqual(pair[0].definitions,pair[1].definitions);
  assert.deepEqual(pair[0].cases,pair[1].cases);
}
const report={
  kind:'deterministic author-fixture preflight; not AI adoption/layout-effect results',
  recordedAt:new Date().toISOString(),
  node:process.version,sqlite:engine,driver:'node:sqlite DatabaseSync, native in-memory SQLite',
  modelRuns:0,agentOutputDeliveryVerified:false,
  sourceRevision:spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).stdout.trim(),
  inputs:sourceFiles(root).filter(p=>!p.endsWith('results.json')&&!p.endsWith('REPORT.md')).map(p=>({path:relative(repo,p),sha256:sha(readFileSync(p))})),
  oracleSensitivity:sensitivity,
  observations,
};
if(process.argv[2]) writeFileSync(resolve(process.argv[2]),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({layouts:observations.length,cases:observations.reduce((n,o)=>n+o.cases.length,0),pairedTasks:Object.keys(catalog.tasks).length,node:report.node,sqlite:engine,modelRuns:0,agentOutputDeliveryVerified:false,oracleMutationsRejected:sensitivity.length}));
