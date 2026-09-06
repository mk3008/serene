"""Source-only exploration and review recorder; no evaluator index or gold."""
import argparse,fcntl,json,subprocess,time,os
from pathlib import Path
BASE=Path(os.environ.get('SERENE_FUNCTION_METADATA_STATE','/tmp/serene-function-metadata'))
p=argparse.ArgumentParser();p.add_argument('run');p.add_argument('request');a=p.parse_args()
c=json.loads((BASE/'config.json').read_text())['runs'][a.run];root=Path(c['root']).resolve()
log=BASE/'logs'/f'{a.run}.jsonl';log.parent.mkdir(exist_ok=True)
with log.with_suffix('.lock').open('a') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 es=[json.loads(l) for l in log.read_text().splitlines()] if log.exists() else []
 seq=len(es)+1;before=time.time();q=json.loads(a.request);op=q.get('op');phase='review' if any(e['op']=='discover' and e['response'].get('ok') for e in es) else 'discovery'
 exposure=[];primitive=[];filter_evidence=[];raw=None;input_bytes=0;output_bytes=0
 def keys(*allowed):
  if set(q)-{'op',*allowed}:raise ValueError('unknown request fields')
 def source_path(file):
  if not isinstance(file,str) or not file or file.startswith('/') or any(p in ['..','.git',''] for p in file.split('/')):raise ValueError('invalid path')
  target=(root/file).resolve()
  if not target.is_relative_to(root) or not target.is_file():raise ValueError('source unavailable')
  return target
 def files():return sorted(p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and '.git' not in p.parts)
 try:
  if any(e['op']=='finish' and e['response'].get('ok') for e in es):raise ValueError('run finished')
  if op!='finish' and (len(es)>=100 or (es and before-es[0]['started']>900) or sum(e['response_bytes'] for e in es)>=65536):raise ValueError('operational cap; finish remains available')
  if op=='info':
   keys();payload={'revision':c['revision'],'files':files()}
  elif op=='read':
   keys('file','start','end');file=q['file'];lines=source_path(file).read_text().splitlines();start=q.get('start',1);end=q.get('end',len(lines))
   if type(start)!=int or type(end)!=int or not 1<=start<=end or start>len(lines):raise ValueError('invalid range')
   end=min(end,len(lines))
   exposure=[{'file':file,'line':i,'text':lines[i-1]} for i in range(start,end+1)];payload={'lines':exposure}
  elif op=='search':
   keys('pattern','file');paths=[q['file']] if 'file' in q else files()
   for file in paths:source_path(file)
   proc=subprocess.run(['rg','--json','-n','--',q['pattern'],*paths],cwd=root,capture_output=True,text=True,timeout=15)
   raw={'argv':['rg','--json','-n','--',q['pattern'],*paths],'stdout':proc.stdout,'stderr':proc.stderr,'exit_code':proc.returncode}
   if proc.returncode not in [0,1]:raise ValueError(proc.stderr)
   for line in proc.stdout.splitlines():
    row=json.loads(line)
    if row['type']=='match':
     d=row['data'];exposure.append({'file':d['path']['text'],'line':d['line_number'],'text':d['lines']['text'].rstrip('\n')})
   payload={'matches':exposure}
  elif op=='discover':
   keys('candidates')
   if phase!='discovery':raise ValueError('discovery already submitted')
   if not isinstance(q['candidates'],list):raise ValueError('candidate array required')
   payload={'candidate_count':len(q['candidates']),'recorded':True}
  elif op=='finding':
   keys('file','line','function','mechanism','impact')
   if not all(isinstance(q.get(k),str) and q[k] for k in ['file','mechanism','impact']) or ('function' in q and q['function'] is not None and not isinstance(q['function'], str)) or type(q.get('line'))!=int:raise ValueError('finding requires file,line,mechanism,impact; function may be omitted or null')
   payload={'recorded':True}
  elif op=='finish':
   keys('dispositions','limits')
   if not isinstance(q.get('dispositions'),list):raise ValueError('dispositions required')
   payload={'finished':True}
  else:raise ValueError('unknown operation')
  if op in ['read','search']:
   primitive=exposure.copy()
   if c['arm']=='serene':
    visible=[]
    for file in dict.fromkeys(row['file'] for row in primitive):
     source=source_path(file).read_text()
     current=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
     committed=subprocess.check_output(['git','-C',str(root),'show',c['revision']+':'+file],text=True)
     incoming=[r for r in primitive if r['file']==file]
     data=json.dumps({'source':source,'file':file,'revision':c['revision'],'rows':incoming,
       'snapshotValid':current==c['revision'] and source==committed})
     proc=subprocess.run(['node',str(Path(__file__).with_name('filter.mjs'))],input=data,capture_output=True,text=True,timeout=45)
     if proc.returncode:raise ValueError('pre-exposure filtering failed')
     filtered=json.loads(proc.stdout);input_bytes+=len(data.encode());output_bytes+=len(proc.stdout.encode())
     filter_evidence.append(filtered);visible.extend(filtered['rows'])
    payload={'rows':visible}
    exposure=[]
    for row in visible:
     if 'text' in row:exposure.append(row)
     for part in row.get('parts',[]):exposure.append({'file':row['file'],'line':row['line'],**part})
   else:payload={'rows':primitive}
  response={'ok':True,'result':payload}
 except Exception as error:
  response={'ok':False,'error':str(error)};exposure=[]
 wire=json.dumps(response)+'\n'
 event={'sequence':seq,'op':op,'phase':phase,'request':q,'response':response,'started':before,'ended':time.time(),'request_bytes':len(a.request.encode()),'response_bytes':len(wire.encode()),'source_lines':exposure,'source_text_bytes':sum(len(x['text'].encode()) for x in exposure),'subprocess':raw,'primitive_rows':primitive,'filter_evidence':filter_evidence,'filter_internal_input_bytes':input_bytes,'filter_internal_output_bytes':output_bytes}
 with log.open('a') as f:f.write(json.dumps(event)+'\n')
 print(wire,end='')
