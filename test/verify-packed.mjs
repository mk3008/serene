import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root=resolve('.'),dir=mkdtempSync(join(tmpdir(),'serene-packed-'));
const run=(command,args,cwd=dir)=>execFileSync(command,args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
try {
  const [pack]=JSON.parse(run('npm',['pack','--json','--pack-destination',dir],root));
  assert.ok(pack.files.some(f=>f.path==='dist/index.d.ts'));
  assert.ok(!pack.files.some(f=>f.path.startsWith('test/') || f.path.startsWith('src/')));
  writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module'}));
  run('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',join(dir,pack.filename),join(root,'node_modules/typescript')]);
  const probe=`import { sql, materializeTemp, bind, type Sql } from '@mk3008/serene';
import { auditSource } from '@mk3008/serene/audit';
import { filterConstructionSource } from '@mk3008/serene/filter';
const stmt: Sql=materializeTemp(sql\`SELECT :id AS id\`,'snapshot');
const query=bind(stmt,{id:7},'indexed');
if (!query.text.startsWith('CREATE TEMPORARY TABLE "snapshot"') || query.values[0]!==7) throw Error('runtime');
const rows=auditSource("import {sql,bind,materializeTemp} from '@mk3008/serene'; db.query(bind(materializeTemp(sql\`SELECT 1 WHERE true\`,'s')));");
if (!rows.some(r=>r.boundary==='driver-candidate' && r.level==='ordinary' && r.reviewSignals?.some(s=>s.code==='SQL_CREATE_TEMP'))) throw Error('audit');
if (typeof filterConstructionSource!=='function') throw Error('filter export');
// @ts-expect-error strings cannot replace identity-backed SQL
const invalid: Sql='SELECT 1';
void invalid;
`;
  writeFileSync(join(dir,'probe.ts'),probe);
  run(process.execPath,[join(root,'node_modules/typescript/bin/tsc'),'--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','probe.ts']);
  run(process.execPath,['probe.js']);
  const metadata=JSON.parse(readFileSync(join(dir,'node_modules/@mk3008/serene/package.json'),'utf8'));
  assert.equal(Object.keys(metadata.dependencies??{}).length,0);
  console.log('Packed runtime, audit, filter and TypeScript declarations verified.');
} finally { rmSync(dir,{recursive:true,force:true}); }
