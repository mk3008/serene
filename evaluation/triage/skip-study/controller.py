"""Controller-mediated source review. All returned source/search/audit is logged.
No claims of physical isolation or visibility into private model reasoning.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json,re,sys,time,subprocess,threading

class Run:
 def __init__(self, config, resume=False):
  self.config=config;self.root=Path(config['root']).resolve();self.log=Path(config['log']);self.started=None;self.events=[];self.bytes=0;self.deep=set();self.exposed={};self.closed=False;self.lock=threading.Lock()
  assert resume or not self.log.exists();self.log.parent.mkdir(parents=True,exist_ok=True)
  self.sources={str(p.relative_to(self.root)):p.read_text() for p in self.root.rglob('*') if p.is_file() and p.suffix in ['.mjs','.js','.md','.sql']}
  # Source-derived function/import index; never reads evaluator gold.
  functions={}; imports={}
  for path,text in self.sources.items():
   lines=text.splitlines();starts=[]
   for i,line in enumerate(lines):
    m=re.search(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(',line)
    if m:starts.append((i,m.group(1)))
   functions[path]={}
   for n,(start,name) in enumerate(starts):
    end=starts[n+1][0] if n+1<len(starts) else len(lines)
    body='\n'.join(l for l in lines[start:end] if not l.startswith('import '))
    functions[path][name]={'path':path,'function':name,'start':start+1,'end':end,'body':body}
   imports[path]={}
   for names,spec in re.findall(r"import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"]",text):
    if not spec.startswith('.'):continue
    try:target=str(((self.root/path).parent/spec).resolve().relative_to(self.root))
    except ValueError:continue
    for item in names.split(','):
     namesplit=item.strip().split(' as ');imports[path][namesplit[-1]]=(target,namesplit[0])
  self.functions=functions
  self.sites=[]
  for path,fs in functions.items():
   for name,f in fs.items():
    spans=[]
    for local,(target,remote) in imports[path].items():
     if re.search(r'\b'+re.escape(local)+r'\b',f['body']) and remote in functions.get(target,{}):
      d=functions[target][remote];spans.append({k:d[k] for k in ['path','start','end']})
    forwarded=re.search(r'\b(?:query|execute|prepare)\s*\(\s*(\w+)\s*[,)]',f['body'])
    params=f['body'].split(')',1)[0].split('(',1)[-1]
    reverse_needed=bool(forwarded and re.search(r'\b'+forwarded.group(1)+r'\b',params))
    for target,otherfs in (functions.items() if reverse_needed else []):
     for caller in otherfs.values():
      for local,(dep,remote) in imports[target].items():
       if dep==path and remote==name and re.search(r'\b'+re.escape(local)+r'\b',caller['body']):spans.append({k:caller[k] for k in ['path','start','end']})
    lines=self.sources[path].splitlines()
    for i in range(f['start']-1,f['end']):
     if re.search(r'\b(?:query|execute|prepare)\s*\(',lines[i]):
      self.sites.append({'id':f'{path}:{i+1}','path':path,'function':name,'line':i+1,'start':f['start'],'end':f['end'],'dependencies':sorted({d['path'] for d in spans}),'dependency_spans':spans})
 def handle(self,q):
  with self.lock:return self._handle(q)
 def _handle(self,q):
  if self.started is None:self.started=time.time()
  seq=len(self.events)+1;before=time.time();exposure=[];newdeep=set();op=q.get('op');payload={};budget=self.config['budget']
  try:
   if self.closed:raise ValueError('closed')
   if seq>budget['requests'] or before-self.started>=budget['seconds']:raise ValueError('request/time cap')
   if op=='list':payload={'files':sorted(self.sources)}
   elif op in ['read','investigate','function']:
    if op in ['investigate','function']:
     p=q['path']; fs=self.functions.get(p,{})
     f=fs.get(q.get('function'))
     if f is None and isinstance(q.get('line'),int):
      f=next((x for x in fs.values() if x['start']<=q['line']<=x['end']),None)
     if f is None:raise ValueError('unknown function or source line')
     ranges=[(p,f['start'],f['end'])]
     # Preserve imports as navigation context without returning unrelated bodies.
     ranges += [(p,i,i) for i,l in enumerate(self.sources[p].splitlines(),1) if l.startswith('import ')]
     if op=='investigate':
      matches=[s for s in self.sites if s['path']==p and s['function']==f['function']]
      newdeep.update(s['id'] for s in matches)
      ranges += [(d['path'],d['start'],d['end']) for s in matches for d in s['dependency_spans']]
     ranges=sorted(set(ranges))
    else:
     p=q['path']
     if p not in self.sources:raise ValueError('unknown path')
     a=q.get('start',1);b=q.get('end',len(self.sources[p].splitlines()))
     if type(a)!=int or type(b)!=int or a<1 or b<a:raise ValueError('invalid range')
     ranges=[(p,a,b)]
    texts=[]
    for p,a,b in ranges:
     lines=self.sources[p].splitlines();indexes=list(range(a,min(b,len(lines))+1));exposure.extend((p,i) for i in indexes)
     texts.append({'path':p,'text':'\n'.join(f'{i}: {lines[i-1]}' for i in indexes)})
    payload={'sources':texts}
   elif op=='search':
    pattern=q['pattern'];flags=0 if q.get('case_sensitive',True) else re.I
    if not isinstance(pattern,str) or len(pattern)>256:raise ValueError('invalid pattern')
    # Use rg engine and its timeout rather than Python backtracking over source.
    args=['rg','--json','--glob','*.mjs','--glob','*.js','--glob','*.md','--glob','*.sql']
    if not q.get('regex',False):args+=['--fixed-strings']
    if not q.get('case_sensitive',True):args+=['--ignore-case']
    args+=['--',pattern,'.'];r=subprocess.run(args,cwd=self.root,capture_output=True,text=True,timeout=10)
    if r.returncode not in [0,1]:raise ValueError(r.stderr)
    matches=[]
    for raw in r.stdout.splitlines():
     event=json.loads(raw)
     if event['type']=='match':
      d=event['data'];p=d['path']['text'].removeprefix('./');line=d['line_number'];matches.append({'path':p,'line':line,'text':d['lines']['text'].rstrip()});exposure.append((p,line))
    payload={'matches':matches}
   elif op=='audit':
    if not self.config.get('audit'):raise ValueError('audit unavailable')
    r=subprocess.run(['node',self.config['audit'],'--actionable-only','.'],cwd=self.root,capture_output=True,text=True,timeout=30)
    if r.returncode not in [0,1]:raise ValueError(r.stderr)
    report=json.loads(r.stdout);payload={'exit':r.returncode,'finding_count':len(report['findings']),'report':report}
   elif op=='finding':
    if not all(isinstance(q.get(k),str) and q[k] for k in ['path','function','mechanism','impact']):raise ValueError('source mechanism and impact required')
    if q['path'] not in self.sources:raise ValueError('unknown finding file')
    payload={'recorded':True,'correctness':'adjudicated later'}
   elif op=='finish':payload={'finished':True}
   elif op=='status':payload={'requests':len(self.events),'bytes':self.bytes,'deep_sites':len(self.deep),'seconds':before-self.started}
   else:raise ValueError('unknown op')
   seen={p:set(lines) for p,lines in self.exposed.items()}
   for p,line in exposure:seen.setdefault(p,set()).add(line)
   # Automatically corroborate dependency expansion even through ordinary reads/search.
   # Conservative exposure proxy: caller body and local import implementation seen.
   for s in self.sites:
    owner=any(s['start']<=i<=s['end'] for i in seen.get(s['path'],set()))
    helper=any(any(d['start']<=i<=d['end'] for i in seen.get(d['path'],set())) for d in s['dependency_spans'])
    if owner and helper:newdeep.add(s['id'])
   if len(self.deep|newdeep)>budget['deep_sites']:raise ValueError('dependency-expanded site cap; content withheld')
   size=len((json.dumps({'ok':True,'result':payload})+'\n').encode())
   if self.bytes+size>budget['bytes']:raise ValueError('byte cap; content withheld')
   if time.time()-self.started>=budget['seconds']:raise ValueError('time cap; content withheld')
   self.bytes+=size;self.deep|=newdeep;self.exposed=seen
   if op=='finish':self.closed=True
   response={'ok':True,'result':payload}
  except Exception as e:
   response={'ok':False,'error':str(e)};exposure=[]
   self.bytes+=len((json.dumps(response)+'\n').encode())
  event={'sequence':seq,'request':q,'response':response,'elapsed_seconds':time.time()-self.started,'tool_seconds':time.time()-before,'returned_bytes':self.bytes,'deep_site_count':len(self.deep),'deep_sites':sorted(self.deep),'source_lines_delivered':exposure}
  self.events.append(event)
  with self.log.open('a') as f:f.write(json.dumps(event)+'\n')
  return response

class Handler(BaseHTTPRequestHandler):
 def do_POST(self):
  try:
   name=self.path.strip('/');q=json.loads(self.rfile.read(int(self.headers['Content-Length'])));r=runs[name].handle(q);body=json.dumps(r).encode();self.send_response(200)
  except Exception as e:body=json.dumps({'ok':False,'error':str(e)}).encode();self.send_response(400)
  self.end_headers();self.wfile.write(body)
 def log_message(self,*args):pass
if __name__=='__main__':
 config=json.loads(Path(sys.argv[1]).read_text());runs={name:Run(c) for name,c in config['runs'].items()};server=ThreadingHTTPServer(('127.0.0.1',config['port']),Handler);print('ready',flush=True);server.serve_forever()
