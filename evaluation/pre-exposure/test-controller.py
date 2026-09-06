"""Exercise the actual response boundary; raw subprocess logs are never printed to the AI."""
from pathlib import Path
import tempfile,subprocess,os,json,shutil
P=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as temporary:
 state=Path(temporary);config=json.loads((P/'run-config.json').read_text())
 (state/'config.json').write_text(json.dumps(config));env={**os.environ,'SERENE_PREEXPOSURE_STATE':str(state)}
 def request(run,q):
  out=subprocess.check_output(['python',str(P/'controller.py'),run,json.dumps(q)],env=env,text=True)
  response=json.loads(out);assert response['ok'],response
  return response,len(out.encode())
 def events(run):return [json.loads(s) for s in (state/'logs'/f'{run}.jsonl').read_text().splitlines()]
 raw,rb=request('tr',{'op':'search','pattern':r'db\.(query|execute|sendSql)\('})
 filtered,fb=request('ts',{'op':'search','pattern':r'db\.(query|execute|sendSql)\('})
 rr=raw['result']['rows'];fr=filtered['result']['rows']
 assert len(rr)==10
 assert sum(len(r.get('sites',[])) for r in fr)==7
 assert sum('text' in r for r in fr)==3
 def correspondence(e):
  assert sum(f['inputRecords'] for f in e['filter_evidence'])==len(e['primitive_rows'])
  for f in e['filter_evidence']:
   assert [c['input'] for c in f['correspondence']]==list(range(f['inputRecords']))
   assert all(c['outputs'] and all(0<=i<len(f['rows']) for i in c['outputs']) for c in f['correspondence'])
 for e in events('ts'):correspondence(e)
 # Search and full reads remain filtered before wire encoding, even if the agent requests everything.
 raw_total=filtered_total=0
 for file in ['operations.ts','maintenance.ts','reporting.ts','contracts.ts','README.md']:
  raw_response,n=request('tr',{'op':'read','file':file});raw_total+=n
  serene_response,n=request('ts',{'op':'read','file':file});filtered_total+=n
 for e in events('ts'):
  correspondence(e)
  wire=json.dumps(e['response'])+'\n'
  assert len(wire.encode())==e['response_bytes']
  for f in e['filter_evidence']:
   for m in f['masks']:
    assert not any(x['file']==m['file'] and m['startLine']<=x['line']<=m['endLine'] for x in e['source_lines'])
 assert filtered_total<raw_total*.75,(raw_total,filtered_total)
 gold=[g for g in json.loads((P.parent/'end-to-end/gold/ticketing.json').read_text())['records'] if g['variant']=='serene']
 visible={(x['file'],x['line']) for e in events('ts') for x in e['source_lines']}
 for g in gold:
  if g['classification']!='ordinary':
   assert all((g['file'].split('/',1)[1],line) in visible for line in range(g['functionBodyStartLine'],g['functionBodyEndLine']+1))
 summary={'search_primitive_matches':10,'represented_matches':10,'match_row_loss':0,'ordinary_execution_locations':7,'retained_source_match_rows':3,'search_raw_response_bytes':rb,'search_filtered_response_bytes':fb,'all_file_read_raw_response_bytes':raw_total,'all_file_read_filtered_response_bytes':filtered_total,'ordinary_body_exposed':0,'nonordinary_bodies_retained':3,'coverage_source':'independent fixture gold, never ordinary count'}
 (P/'controller-gate.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2))
