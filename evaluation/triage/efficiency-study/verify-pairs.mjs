import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const here=path.dirname(fileURLToPath(import.meta.url));const temp=mkdtempSync(path.join(tmpdir(),'serene-pair-check-'));const records=[];
try{
 for(const task of ['task1','task2'])for(const kind of ['smoke','witness']){
  const taskroot=path.join(here,'tasks',task);const traces=[];
  for(const variant of ['raw','serene']){
   let s=readFileSync(path.join(taskroot,'evaluator',kind+'.mjs'),'utf8');
   s=s.replaceAll("'../raw/store.js'",JSON.stringify(pathToFileURL(path.join(taskroot,variant,'store.js')).href));
   s=s.replace("new URL('./schema.sql',import.meta.url)",JSON.stringify(path.join(taskroot,'evaluator/schema.sql'))).replace("new URL('./schema.sql', import.meta.url)",JSON.stringify(path.join(taskroot,'evaluator/schema.sql')));
   s=s.replace(/const db\s*=\s*\{[\s\S]*?\};/,`const trace=[]; const db={query(text,values={}){const stmt=native.prepare(text);const result=/^\\s*select/i.test(text)?stmt.all(values):stmt.run(values);trace.push({text,values,result});return result;}};`);
   assert(s.includes('const trace=[];'));
   s=s.replace(/console\.log\([^\n]*\);/g,'console.log(JSON.stringify(trace));');
   const file=path.join(temp,task+'-'+kind+'-'+variant+'.mjs');writeFileSync(file,s);const trace=JSON.parse(execFileSync('node',[file],{encoding:'utf8'}));traces.push(trace);
  }
  assert.deepEqual(traces[0],traces[1]);records.push({task,kind,execution_count:traces[0].length,raw_and_serene_trace:traces[0],equivalent:true});
 }
 writeFileSync(path.join(here,'pair-validation.json'),JSON.stringify({node:process.version,driver:'node:sqlite',records},null,2)+'\n');console.log(records.map(r=>({task:r.task,kind:r.kind,executions:r.execution_count})));
}finally{rmSync(temp,{recursive:true,force:true});}
