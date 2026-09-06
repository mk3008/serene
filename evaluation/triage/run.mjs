import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { auditSource } from '../../tooling/audit.mjs';

const base = '6ebce0d064dbee21caf53ce1f1f3441259cfffa2';
const output = process.argv[2];
if (!output) throw new Error('Usage: node evaluation/triage/run.mjs output.json (from repository root)');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const corpusBytes = readFileSync('evaluation/triage/corpus.json');
const corpus = JSON.parse(corpusBytes);
const baselineSource = execFileSync('git', ['show', `${base}:tooling/audit.mjs`], {encoding:'utf8'});
// Baseline tooling depends on runtime lexical checks. Refuse comparisons after runtime changes.
execFileSync('git', ['diff', '--exit-code', base, '--', 'src']);
const temporary = resolve(`tooling/.evaluation-baseline-${process.pid}.mjs`);
writeFileSync(temporary, baselineSource, {flag:'wx'});
let baselineAudit;
try { baselineAudit = (await import(pathToFileURL(temporary).href)).auditSource; }
finally { unlinkSync(temporary); }
const callPattern = /\b(?:query|execute|unsafe)\s*\(|\[\s*["'](?:query|execute|unsafe)["']\s*\]\s*\(/;
const keywordPattern = /\b(?:SELECT|INSERT|UPDATE|DELETE|WITH|EXEC)\b/i;
function grep(source, pattern) {
  return source.split(/\r?\n/).flatMap((line, i) => pattern.test(line) ? [{line:i+1, boundary:'grep',level:'review-required',code:'TEXT_MATCH'}] : []);
}
const strategies = {
  'grep-call': c => grep(c.source, callPattern),
  'grep-sql': c => grep(c.source, keywordPattern),
  'audit-baseline': c => baselineAudit(c.source, `${c.id}.ts`, c.sinkNames ? {sinkNames:c.sinkNames} : {}),
  'audit-current': c => auditSource(c.source, `${c.id}.ts`, c.sinkNames ? {sinkNames:c.sinkNames} : {}),
};
const results = {};
for (const [name, strategy] of Object.entries(strategies)) {
  const rows = corpus.map(c => {
    const findings = strategy(c);
    if (findings.some(f => f.code === 'PARSE_ERROR')) throw new Error(`Invalid fixture: ${c.id}`);
    const atSink = findings.filter(f => f.line === c.sinkLine && ['grep','driver-candidate','computed-call'].includes(f.boundary));
    const level = atSink.some(f => f.level === 'violation') ? 'violation' :
      atSink.some(f => f.level === 'review-required') ? 'review-required' : atSink.length ? 'ordinary' : 'unseen';
    return {id:c.id, sqlSink:c.sqlSink, constructionConcern:c.constructionConcern, defect:c.defect,
      sinkLine:c.sinkLine, level, anyFileHit:findings.length>0, findings};
  });
  const sql = rows.filter(r => r.sqlSink);
  const concerns = sql.filter(r => r.constructionConcern);
  const controls = rows.filter(r => !r.sqlSink);
  results[name] = {
    counts: {
      sqlSinks:sql.length, discovered:sql.filter(r=>r.level!=='unseen').length,
      unseen:sql.filter(r=>r.level==='unseen').length,
      constructionConcerns:concerns.length,
      referredConcerns:concerns.filter(r=>['violation','review-required'].includes(r.level)).length,
      ordinaryConcerns:concerns.filter(r=>r.level==='ordinary').length,
      unseenConcerns:concerns.filter(r=>r.level==='unseen').length,
      ordinaryConstruction:sql.filter(r=>r.level==='ordinary').length,
      nonordinaryConstruction:sql.filter(r=>['violation','review-required'].includes(r.level)).length,
      nonSqlControls:controls.length, nonSqlCandidates:controls.filter(r=>r.level!=='unseen').length,
      anyFileHits:rows.filter(r=>r.anyFileHit).length,
      defectSitesOrdinary:sql.filter(r=>r.defect && r.level==='ordinary').length,
    }, rows,
  };
}
writeFileSync(output, JSON.stringify({
  study:'synthetic deterministic challenge corpus; not AI review results',
  baseline:base, corpusSha256:sha256(corpusBytes), baselineAuditSha256:sha256(baselineSource),
  currentAuditSha256:sha256(readFileSync('tooling/audit.mjs')), node:process.version,
  typescript:JSON.parse(readFileSync('node_modules/typescript/package.json')).version,
  grep:{call:callPattern.source,sql:keywordPattern.source,unit:'line; matching the oracle sink line is separate from any file hit'},
  results,
},null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,v])=>[k,v.counts])),null,2));
