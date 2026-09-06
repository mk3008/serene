"""Replay recorded primitive rows to separate actual marker-field and filter costs."""
from pathlib import Path
import json
P=Path(__file__).resolve().parent
out=[]
for run in ['ts','ss']:
 path=P/'results'/f'{run}.jsonl'
 if not path.exists(): continue
 events=[json.loads(x) for x in path.read_text().splitlines() if x.strip()]
 total=sum(e.get('response_bytes',0) for e in events); filtered=nofunction=unfiltered=0
 for e in events:
  if e.get('op') not in ('read','search') or not e.get('response',{}).get('ok'): continue
  wire=json.dumps(e['response'])+'\n';filtered+=len(wire.encode())
  stripped=json.loads(json.dumps(e['response']))
  for row in stripped.get('result',{}).get('rows',[]):
   for site in row.get('sites',[]): site.pop('function',None)
  nofunction+=len((json.dumps(stripped)+'\n').encode())
  raw={'ok':True,'result':{'rows':e.get('primitive_rows',[])}}
  unfiltered+=len((json.dumps(raw)+'\n').encode())
 out.append({'run':run,'actual_filtered_wire_bytes':total,'without_site_function_bytes':total-filtered+nofunction,'function_metadata_bytes':filtered-nofunction,'same_primitive_unfiltered_bytes':total-filtered+unfiltered,'filter_savings_vs_same_primitive_percent':100*((total-filtered+unfiltered)-total)/(total-filtered+unfiltered) if unfiltered else None})
(P/'actual-wire-details.json').write_text(json.dumps({'method':'recorded formal read/search events; unfiltered is same-primitive replay, not Raw AI baseline','runs':out},indent=2)+'\n');print(json.dumps(out,indent=2))
