import {execFileSync} from 'node:child_process';
import {writeFileSync, unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {auditSource} from '../../tooling/audit.mjs';
const file=resolve(`tooling/.alias-regression-${process.pid}.mjs`);
writeFileSync(file,execFileSync('git',['show','6ebce0d064dbee21caf53ce1f1f3441259cfffa2:tooling/audit.mjs']),{flag:'wx'});
let baseline;
try {baseline=(await import(pathToFileURL(file).href)).auditSource;}
finally {unlinkSync(file);}
const source='import {postgres,bind} from "@mk3008/serene";\nconst query=db.query.bind(db, runtimeSql);\nconst q=bind(postgres`SELECT 1`);\nquery(q.text);';
const before=baseline(source).filter(f=>f.boundary==='driver-candidate');
const after=auditSource(source).filter(f=>f.boundary==='driver-candidate');
assert.equal(before[0].level,'ordinary');
assert.equal(after[0].level,'review-required');
writeFileSync('evaluation/triage/alias-regression.json',JSON.stringify({
  status:'post-corpus implementation regression; excluded from frozen 40-case counts',
  source,before,after,
  interpretation:'The audit must not assume invocation argument zero is SQL after Function.bind. This is a provenance classification counterexample, not a live-driver exploit demonstration.'
},null,2)+'\n');
console.log('Baseline ordinary -> current review-required; post-corpus regression reproduced.');
