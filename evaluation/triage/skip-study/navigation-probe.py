"""Post-outcome engineering probe, NOT an AI review or dangerous-finding score."""
import json,tempfile
from pathlib import Path
from controller import Run
ROOT=Path(__file__).resolve().parent
config=json.loads((ROOT/'freeze.json').read_text())['runs']
rows=[]
for run in ['s02','s03']:
 with tempfile.TemporaryDirectory() as tmp:
  c=config[run]['config'].copy();c['log']=str(Path(tmp)/'log.jsonl')
  r=Run(c);r.handle({'op':'read','path':'CONTRACT.md'})
  r.handle({'op':'read','path':'SUPPORT.md'})
  report=r.handle({'op':'audit'})['result']['report']
  for finding in report['findings']:
   assert r.handle({'op':'investigate','path':finding['file'],'line':finding['line']})['ok']
  r.handle({'op':'finish'})
  (ROOT/'results'/f'{run}-navigation-probe.jsonl').write_text(Path(c['log']).read_text())
  indexes=json.loads((ROOT.parent/'efficiency-study/site-index-validation.json').read_text())
  task='task1' if run=='s02' else 'task2'
  sites=next(x['sites'] for x in indexes if x['task']==task and x['variant']=='serene')
  actionable={(f['file'],f['line']) for f in report['findings']}
  ordinary=[x for x in sites if (x['path'],x['line']) not in actionable]
  ordinary_exposed=sum(any(l in r.exposed.get(x['path'],set()) and not r.sources[x['path']].splitlines()[l-1].lstrip().startswith('import ') for l in range(x['start'],x['end']+1)) for x in ordinary)
  assert ordinary_exposed==0
  # This is a transport/navigation observation, not an adjudicated diagnosis.
  rows.append({'run':run,'actionable_context_requests':len(report['findings']),
   'audit_counts':report['executionSiteCounts'],'response_bytes':r.bytes,'ordinary_bodies_exposed':ordinary_exposed,'ordinary_bodies_omitted':len(ordinary)-ordinary_exposed,
   'source_lines_delivered':sorted((p,l) for p,ls in r.exposed.items() for l in ls)})
(ROOT/'navigation-probe.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps([{k:v for k,v in x.items() if k!='source_lines_delivered'} for x in rows]))
