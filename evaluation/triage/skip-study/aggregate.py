"""Objective exposure/cost inventory; independent adjudication supplies correct hits."""
from pathlib import Path
import collections,json
ROOT=Path(__file__).resolve().parent
OLD=ROOT.parent/'efficiency-study'
MAPPING={'s01':('task1','raw'),'s02':('task1','serene'),'s03':('task2','serene'),'s04':('task2','raw')}
index=json.loads((OLD/'site-index-validation.json').read_text())
def summarize(run,events,correct_sequence):
 task,variant=MAPPING[run]
 sites=next(x['sites'] for x in index if x['task']==task and x['variant']==variant)
 gold=json.loads((OLD/'tasks'/task/'evaluator/gold.json').read_text())
 aliases={x['caller']:x['direct_execution'] for x in gold['driver_wrapper_follow_through']}
 needed={aliases.get(x['location'],x['location']).removeprefix('raw/') for x in gold['needs_investigation']}
 ordinary=[s for s in sites if s['path']+':'+s['function'] not in needed]
 def snapshot(end):
  es=[e for e in events if e['sequence']<=end]
  delivered={(p,line) for e in es for p,line in e['source_lines_delivered']}
  exposed=[s for s in sites if any((s['path'],line) in delivered for line in range(s['start'],s['end']+1))]
  ordinary_exposed=[s for s in ordinary if s in exposed]
  wire=sum(len((json.dumps(e['response'])+'\n').encode()) for e in es)
  assert wire==es[-1]['returned_bytes']
  audits=[e['response']['result']['report'] for e in es if e['request']['op']=='audit' and e['response']['ok']]
  return {'sequence':end,'response_bytes':wire,'requests':len(es),'elapsed_seconds':es[-1]['elapsed_seconds'],
   'successful_operations':dict(collections.Counter(e['request']['op'] for e in es if e['response']['ok'])),
   'failed_requests':[e['sequence'] for e in es if not e['response']['ok']],
   'unique_source_lines':len(delivered),'site_bodies_exposed':len(exposed),
   'ordinary_control_bodies_exposed':len(ordinary_exposed),'ordinary_control_bodies_omitted':len(ordinary)-len(ordinary_exposed),
   'N_bodies_exposed':sum(s['path']+':'+s['function'] in needed for s in exposed),
   'context_expanded_sites':es[-1]['deep_site_count'],
   'audit_counts':audits[-1]['executionSiteCounts'] if audits else None,
   'ordinary_control_functions_exposed':[s['function'] for s in ordinary_exposed]}
 finish=next((e['sequence'] for e in events if e['request']['op']=='finish' and e['response']['ok']),events[-1]['sequence'])
 hit=snapshot(correct_sequence) if correct_sequence else None
 return {'run':run,'task':task,'variant':variant,'first_correct_finding':hit,'finish':snapshot(finish),
  'discovery_at_byte_checkpoints':{str(b):hit is not None and hit['response_bytes']<=b for b in [4096,8192,16384,32768]}}
if __name__=='__main__':
 scores=json.loads((ROOT/'adjudication.json').read_text())
 rows=[]
 for run in MAPPING:
  events=[json.loads(l) for l in (ROOT/'results'/f'{run}.jsonl').read_text().splitlines()]
  rows.append(summarize(run,events,scores[run]['first_correct_sequence']))
 (ROOT/'results/summary.json').write_text(json.dumps(rows,indent=2)+'\n')
 print(json.dumps(rows,indent=2))
