"""Archive logs and verify packet/source integrity without scoring semantic findings."""
from pathlib import Path
import json,hashlib,shutil,sys
ROOT=Path(__file__).resolve().parent
freeze=json.loads((ROOT/'freeze.json').read_text())
for run in freeze['runs']:
 if len(sys.argv)>1 and run['run'] not in sys.argv[1:]:continue
 name=run['run'];dest=ROOT/'results'/name;dest.mkdir(parents=True,exist_ok=True)
 source=Path('/tmp/serene-efficiency-run/logs')/(name+'.jsonl')
 shutil.copyfile(source,dest/'events.jsonl')
 packet=Path('/tmp/serene-efficiency-run/packets')/name
 changes=[f['path'] for f in run['files'] if hashlib.sha256((packet/f['path']).read_bytes()).hexdigest()!=f['sha256']]
 events=[json.loads(line) for line in source.read_text().splitlines()]
 summary={'run':name,'protected_changes':changes,'requests':len(events),'bytes':events[-1]['returned_bytes'],'expanded_sites':events[-1]['deep_site_count'],'elapsed_seconds':events[-1]['elapsed_seconds'],'failed_requests':[e['sequence'] for e in events if not e['response']['ok']],'finding_events':[{'sequence':e['sequence'],'request':e['request']} for e in events if e['request']['op']=='finding' and e['response']['ok']],'finish':any(e['request']['op']=='finish' and e['response']['ok'] for e in events),'model_token_usage':None}
 (dest/'collection.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
