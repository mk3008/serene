"""Report available successor, previous Serene, and preserved Raw evidence."""
from pathlib import Path
import json
P=Path(__file__).resolve().parent

def totals(path):
 es=[json.loads(x) for x in path.read_text().splitlines() if x.strip()]
 return {'calls':len(es),'response_bytes':sum(e.get('response_bytes',0) for e in es),'request_bytes':sum(e.get('request_bytes',0) for e in es),'source_text_bytes':sum(e.get('source_text_bytes',0) for e in es),'errors':sum(not e.get('response',{}).get('ok',False) for e in es)}
rows=[]
for run,rawrun in [('ts','tr'),('ss','sr')]:
 current=P/'results'/f'{run}.jsonl'; previous=P.parent/'pre-exposure'/'results'/f'{run}.jsonl'; raw=P.parent/'pre-exposure'/'results'/f'{rawrun}.jsonl'
 if not current.exists(): continue
 item={'successor_serene_run':run,'prompt_bytes':len((P/'prompts'/f'{run}.txt').read_bytes()),'successor':totals(current),'references':{}}
 for label,path in [('previous_serene',previous),('raw',raw)]:
  if path.exists(): item['references'][label]={'path':str(path.relative_to(P.parent.parent)),'prompt_bytes':len((P.parent/'pre-exposure'/'prompts'/f'{run}.txt').read_bytes()) if label!='raw' else len((P.parent/'pre-exposure'/'prompts'/f'{rawrun}.txt').read_bytes()),'metrics':totals(path)}
 rows.append(item)
(P/'report-cost.json').write_text(json.dumps({'status':'observed logs only; missing runs omitted','comparisons':rows},indent=2)+'\n');print(json.dumps(rows,indent=2))
