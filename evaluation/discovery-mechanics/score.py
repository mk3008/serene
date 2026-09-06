"""Exact-coordinate scoring of preserved discovery observations; no repairs."""
import json
from pathlib import Path
P=Path(__file__).resolve().parent
config=json.loads((P/'run-config.json').read_text())['runs']
rows=[]
for run in ['d1','d2','d3']:
 events=[json.loads(s) for s in (P/'results'/f'{run}.jsonl').read_text().splitlines()]
 gold=json.loads((P/'gold'/config[run]['task']/'gold.json').read_text())['execution']
 final=next((e['final_candidates'] for e in reversed(events) if e['op']=='finish' and e['result'].get('ok')),[])
 key=lambda c:(c['file'],c['line'])
 expected={key(c):c for c in gold};actual={key(c):c for c in final}
 hit=set(actual)&set(expected)
 commands=[e for e in events if e['op']=='exec']
 rows.append({'run':run,'task':config[run]['task'],'gold_sites':len(expected),'final_sites':len(actual),'true_positive':len(hit),'false_positive':[actual[k] for k in sorted(set(actual)-set(expected))],'false_negative':[expected[k] for k in sorted(set(expected)-set(actual))],'recall':len(hit)/len(expected),'precision':len(hit)/len(actual) if actual else None,'function_mismatches':[{'actual':actual[k],'expected':expected[k]} for k in sorted(hit) if actual[k]['function']!=expected[k]['function']],'commands':len(commands),'command_response_bytes':sum(e['delivered_bytes'] for e in commands),'recording_response_bytes':sum(e['delivered_bytes'] for e in events if e['op']!='exec'),'command_seconds':sum(e['elapsed_seconds'] for e in commands),'wall_seconds':events[-1]['completed_unix']-events[0]['started_unix'],'errors':[e['sequence'] for e in events if not e['result'].get('ok') or e['result'].get('exit_code',0)!=0],'truncated':[e['sequence'] for e in events if e['result'].get('truncated')],'snapshots':[{'event':e['sequence'],'size':len(e['candidates']),'added':len(e['added']),'removed':len(e['removed']),'updated':len(e['updated'])} for e in events if 'candidates' in e]})
(P/'scores.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(rows,indent=2))
