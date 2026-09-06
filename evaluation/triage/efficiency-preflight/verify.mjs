import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const root=new URL('./',import.meta.url);
const results=[];
for(const task of ['harbor','meadow']) {
  const gold=JSON.parse(readFileSync(new URL(`${task}-gold.json`,root)));
  for(const site of gold.sites) {
    const raw=await import(new URL(`fixtures/${task}/raw/${site.file}`,root));
    const serene=await import(new URL(`fixtures/${task}/serene/${site.file}`,root));
    for(const order of ['label','created_at','__proto__',"(SELECT 'injected')"]) {
      const calls=[];
      const db=new DatabaseSync(':memory:');
      db.exec("CREATE TABLE items(id TEXT, tenant_id TEXT, label TEXT, created_at TEXT); INSERT INTO items VALUES ('r1','t1','A','2026-01-01'),('r2','t1','B','2026-02-01'),('r3','t2','C','2026-03-01')");
      const driver={query(text,params){calls.push({text,params});return db.prepare(text).all(params);}};
      const input={recordId:'r1',order,direction:'asc',limit:10};
      const outcomes=[];
      for(const impl of [raw,serene]) {
        try{outcomes.push({rows:await impl[site.function](driver,{tenantId:'t1'},input)});}
        catch(e){outcomes.push({error:e.message});}
      }
      assert.deepEqual(calls[0],calls[1]);assert.deepEqual(outcomes[0],outcomes[1]);
      if(order==="(SELECT 'injected')") {
        assert.equal(calls[0].text.includes(order),site.D);
        assert(!outcomes[0].error,'native SQLite must accept the arbitrary-expression witness');
      }
      if(!site.D)assert(!outcomes[0].error);
      results.push({task,site:site.site,order,equivalent:true,error:outcomes[0].error??null});db.close();
    }
  }
}
writeFileSync(new URL('pairing-results.json',root),JSON.stringify({node:process.version,native_driver:'node:sqlite',cases:results.length,results},null,2)+'\n');
console.log(`${results.length} paired native SQLite cases passed; arbitrary-expression witness preserved only at D.`);
