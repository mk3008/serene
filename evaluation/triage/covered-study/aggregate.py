from pathlib import Path
import json,collections
HERE=Path(__file__).resolve().parent
CONFIG=json.loads((HERE/'run-config.json').read_text())['runs']
def summarize(name,events,first_correct):
 c=CONFIG[name];sites=c['sites']
 def snapshot(seq):
  es=[e for e in events if e['sequence']<=seq];seen={tuple(x) for e in es for x in e['source_lines_delivered']}
  exp=[s for s in sites if any((s['path'],l) in seen for l in range(s['start'],s['end']+1))]
  # Only descriptive control labels from independent task gold; not audit truth.
  task='task1' if name in ['t01','t02'] else 'task2'
  gold=json.loads((HERE.parent/'efficiency-study/tasks'/task/'evaluator/gold.json').read_text())
  alias={x['caller']:x['direct_execution'] for x in gold['driver_wrapper_follow_through']}
  N={alias.get(x['location'],x['location']).removeprefix('raw/') for x in gold['needs_investigation']}
  ordinary=[s for s in sites if s['id'] not in N]
  bytes_=sum(len((json.dumps(e['response'])+'\n').encode()) for e in es)
  assert bytes_==es[-1]['returned_bytes']
  return {'sequence':seq,'response_bytes':bytes_,'requests':len(es),'elapsed_seconds':es[-1]['elapsed_seconds'],
   'successful_operations':dict(collections.Counter(e['request']['op'] for e in es if e['response']['ok'])),
   'failed_requests':[e['sequence'] for e in es if not e['response']['ok']],
   'site_bodies_exposed':len(exp),'ordinary_bodies_exposed':sum(s in exp for s in ordinary),
   'ordinary_bodies_omitted':sum(s not in exp for s in ordinary),
   'N_bodies_exposed':sum(s['id'] in N for s in exp),'unique_source_lines':len(seen),
   'audit_matched_counts':c['audit_report']['matched_counts'] if c['audit_report'] else None}
 end=next((e['sequence'] for e in events if e['request']['op']=='finish' and e['response']['ok']),events[-1]['sequence'])
 hit=snapshot(first_correct) if first_correct else None
 return {'run':name,'first_correct_finding':hit,'terminal':snapshot(end),'finished':any(e['request']['op']=='finish' and e['response']['ok'] for e in events),'discovery_within_bytes':{str(b):hit is not None and hit['response_bytes']<=b for b in [4096,8192,16384,32768]}}
if __name__=='__main__':
 scores=json.loads((HERE/'adjudication.json').read_text());rows=[]
 for name in ['t01','t02','t03','t04']:
  es=[json.loads(l) for l in (HERE/'results'/f'{name}.jsonl').read_text().splitlines()]
  rows.append(summarize(name,es,scores[name]['first_correct_sequence']))
 (HERE/'results/summary.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows,indent=2))
