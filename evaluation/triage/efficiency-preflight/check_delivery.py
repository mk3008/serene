from pathlib import Path
import json,tempfile
from logger import Session
ROOT=Path(__file__).resolve().parent
budget=json.loads((ROOT/'budget.json').read_text())
audit=ROOT.parents[2]/'tooling/cli.mjs'
results=[]
with tempfile.TemporaryDirectory() as tmp:
 for task in ['harbor','meadow']:
  for variant in ['raw','serene']:
   log=Path(tmp)/f'{task}-{variant}.jsonl'
   s=Session(ROOT/'fixtures'/task/variant,budget,log,audit=audit if variant=='serene' else None)
   responses=[]
   if variant=='serene':responses.append(s.handle({'op':'audit'}))
   responses.append(s.handle({'op':'search','text':'db.query'}))
   responses.append(s.handle({'op':'read','path':'op00.mjs'}))
   assert all(r['ok'] for r in responses),responses
   results.append({'task':task,'variant':variant,'payload_bytes':s.bytes,'events':[json.loads(x) for x in log.read_text().splitlines()]})
(ROOT/'delivery-results.json').write_text(json.dumps({'kind':'deterministic logger delivery preflight, not agent evidence','budget':budget,'results':results},indent=2)+'\n')
print([(r['task'],r['variant'],r['payload_bytes']) for r in results])
