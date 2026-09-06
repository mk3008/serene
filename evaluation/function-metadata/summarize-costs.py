"""Deterministic metadata overhead replay; no participant request or AI baseline rerun."""
from pathlib import Path
import json,subprocess
P=Path(__file__).resolve().parent; ROOT=P.parent
fixed=[]; audit=[]
for task in ['ticketing','stockroom']:
 d=ROOT/'end-to-end'/'tasks'/task/'serene'
 for path in sorted(d.glob('*.ts')):
  source=path.read_text(); rows=[{'file':path.name,'line':i+1,'text':x} for i,x in enumerate(source.splitlines())]
  q=json.dumps({'source':source,'file':path.name,'revision':'replay','rows':rows})
  filtered=json.loads(subprocess.check_output(['node',str(P/'filter.mjs')],input=q,text=True))['rows']
  nofunc=json.loads(json.dumps(filtered))
  for row in nofunc:
   if row.get('ordinary'):
    for site in row['sites']: site.pop('function',None)
  wire=(json.dumps({'ok':True,'result':{'rows':filtered}})+'\n').encode()
  legacy=(json.dumps({'ok':True,'result':{'rows':nofunc}})+'\n').encode()
  sites=[s for r in filtered if r.get('ordinary') for s in r.get('sites',[])]
  fixed.append({'task':task,'file':path.name,'ordinary_sites':len(sites),'function_fields':sum('function' in s for s in sites),'with_function_wire_bytes':len(wire),'without_function_wire_bytes':len(legacy),'metadata_bytes':len(wire)-len(legacy),'metadata_percent_of_wire':100*(len(wire)-len(legacy))/len(wire) if wire else 0})
  js="import {readFileSync} from 'node:fs'; import {auditSource} from './tooling/audit.mjs'; const s=readFileSync(process.argv[1],'utf8'); process.stdout.write(JSON.stringify(auditSource(s,process.argv[2])));"
  findings=json.loads(subprocess.check_output(['node','--input-type=module','-e',js,str(path),path.name],text=True))
  stripped=[{k:v for k,v in f.items() if k!='function'} for f in findings]
  a=json.dumps(findings).encode(); b=json.dumps(stripped).encode()
  audit.append({'task':task,'file':path.name,'finding_count':len(findings),'function_fields':sum('function' in f for f in findings),'serializer':'json.dumps default separators', 'with_default_function_bytes':len(a),'without_default_function_bytes':len(b),'metadata_bytes':len(a)-len(b)})
summary={'method':'each TypeScript file once (README excluded); exact controller JSON wire envelopes including newline; current audit/filter; no AI rerun','fixed_all_file_reads':fixed,'audit_findings':audit}
(P/'deterministic-overhead.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2))
