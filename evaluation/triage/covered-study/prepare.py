"""Build source-only indexes and reconcile AI discoveries before gold scoring."""
from pathlib import Path
import json,subprocess,shutil
REPO=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
OLD=HERE.parent/'efficiency-study';BASE=Path('/tmp/serene-covered-run');BASE.mkdir(exist_ok=True)
prior=json.loads((OLD/'site-index-validation.json').read_text())
records={};configs={};reconciliation={}
for task,label in [('task1','billing'),('task2','warehouse')]:
 supplied=json.loads(Path(f'/tmp/serene-discovery-{label}.json').read_text())
 (HERE/f'{task}-discovery-original.json').write_text(json.dumps(supplied,indent=2)+'\n')
 variants={}
 for variant in ['raw','serene']:
  root=OLD/'tasks'/task/variant
  obj=json.loads(subprocess.check_output(['node',str(HERE/'build-index.mjs'),str(root)],text=True))
  oldsites=next(x['sites'] for x in prior if x['task']==task and x['variant']==variant)
  for site in obj['sites']:
   old=next(x for x in oldsites if x['path']==site['path'] and x['function']==site['function'])
   for dep in old['dependency_spans']:
    match=next(f for f in obj['functions'][dep['path']].values() if f['start']==dep['start'])
    site['dependency_spans'].append({k:match[k] for k in ['path','start','end']})
  obj['functions']['CONTRACT.md']={}
  variants[variant]=obj
 normalized=[];notes=[]
 for reported in supplied:
  candidates=[s for s in variants['raw']['sites'] if s['path']==reported['file'] and s['line']==reported['line'] and s['function']==reported['function']]
  if not candidates:
   candidates=[s for s in variants['raw']['sites'] if s['function']==reported['function']]
   if len(candidates)==1:notes.append({'reported':reported,'resolved':{k:candidates[0][k] for k in ['path','line','function']},'method':'unique exact function name in source AST; no gold'})
  if len(candidates)!=1:raise ValueError('ambiguous discovery must remain unmatched; task needs explicit handling')
  normalized.append(candidates[0]['id'])
 records[task]={'reported':supplied,'normalized_ids':normalized,'normalizations':notes}
 for variant in ['raw','serene']:
  obj=variants[variant];selected=[next(s for s in obj['sites'] if s['id']==sid) for sid in normalized]
  root=OLD/'tasks'/task/variant
  # Only Serene gets the report. Full diagnostic rows are used internally to
  # reconcile positions, never returned to the participant or selected using gold.
  report=None
  if variant=='serene':
   full=json.loads(subprocess.run(['node',str(REPO/'tooling/cli.mjs'),'.'],cwd=root,capture_output=True,text=True).stdout)
   compact=json.loads(subprocess.run(['node',str(REPO/'tooling/cli.mjs'),'--actionable-only','.'],cwd=root,capture_output=True,text=True).stdout)
   matches=[];unmatched=[]
   for s in selected:
    rows=[f for f in full['findings'] if f['boundary']=='driver-candidate' and f['file']==s['path'] and f['line']==s['line'] and f['column']==s['column']]
    if len(rows)==1:matches.append({'id':s['id'],'level':rows[0]['level']})
    else:unmatched.append({'id':s['id'],'path':s['path'],'function':s['function'],'line':s['line']})
   report={'input_site_ids':normalized,'matched_counts':{l:sum(m['level']==l for m in matches) for l in ['ordinary','review-required','violation']},'unmatched':unmatched,'compact_audit':compact,'contract':'All input sites except actionable or unmatched entries are matched ordinary. Skip their individual construction screening. Discovery coverage is evaluated separately.'}
   reconciliation[task]={'matches':matches,'unmatched':unmatched,'full_report':full,'compact_report':compact}
  name={('task1','raw'):'t01',('task1','serene'):'t02',('task2','raw'):'t04',('task2','serene'):'t03'}[(task,variant)]
  configs[name]={'root':str(root),'log':str(BASE/'logs'/f'{name}.jsonl'),'budget':{'bytes':32768,'requests':80,'seconds':600,'deep_sites':23},'sites':selected,'functions':obj['functions'],'audit_report':report}
(HERE/'discovery-reconciliation.json').write_text(json.dumps(records,indent=2)+'\n')
(HERE/'audit-reconciliation.json').write_text(json.dumps(reconciliation,indent=2)+'\n')
(BASE/'controller.json').write_text(json.dumps({'runs':configs},indent=2)+'\n')
(HERE/'run-config.json').write_text(json.dumps({'runs':configs},indent=2)+'\n')
