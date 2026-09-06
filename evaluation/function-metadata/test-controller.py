"""Deterministic controller boundary checks for the function metadata successor."""
from pathlib import Path
import tempfile,subprocess,os,json,shutil
P=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as temporary:
 state=Path(temporary);root=state/'repo';src=P.parent/'end-to-end'/'tasks'/'ticketing'/'serene';shutil.copytree(src,root)
 shutil.copyfile(P.parent/'end-to-end'/'tasks'/'ticketing'/'README.md',root/'README.md')
 def git(*args):return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
 git('init','-q');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture')
 revision=git('rev-parse','HEAD');config={'runs':{'ts':{'root':str(root),'revision':revision,'task':'ticketing','arm':'serene'}}}
 (state/'config.json').write_text(json.dumps(config));env={**os.environ,'SERENE_FUNCTION_METADATA_STATE':str(state)}
 def request(q):
  out=subprocess.check_output(['python',str(P/'controller.py'),'ts',json.dumps(q)],env=env,text=True);response=json.loads(out);assert response['ok'],response;return response
 response=request({'op':'search','pattern':r'db\.(query|execute|sendSql)\('})
 rows=response['result']['rows'];assert len(rows)==10
 ordinary=[r for r in rows if r.get('ordinary')]
 assert sum(len(r['sites']) for r in ordinary)==7
 assert {site['function'] for r in ordinary for site in r['sites']} == {'listOpenTickets','findTicketById','assignTicket','closeResolvedTickets','loadRequesterHistory','countQueueByPriority','reopenTicket'}
 request({'op':'finding','file':'operations.ts','line':12,'function':None,'mechanism':'fixed','impact':'safe'})
 request({'op':'finding','file':'operations.ts','line':12,'mechanism':'fixed','impact':'safe'})
 assert (P.parent/'pre-exposure'/'results'/'tr.jsonl').is_file() and (P.parent/'pre-exposure'/'results'/'sr.jsonl').is_file()
 for prompt in (P/'prompts').glob('*.txt'):
  text=prompt.read_text();assert 'evaluation/function-metadata/controller.py' in text and 'evaluation/pre-exposure/controller.py' not in text

print('function-metadata controller checks passed')
