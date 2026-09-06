"""Controller-mediated source review. All returned source/search/audit is logged.
No claims of physical isolation or visibility into private model reasoning.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json,re,sys,time,subprocess,threading

class Run:
 def __init__(self, config):
  self.config=config;self.root=Path(config['root']).resolve();self.log=Path(config['log']);self.started=None;self.events=[];self.bytes=0;self.deep=set();self.exposed={};self.closed=False;self.lock=threading.Lock()
  assert not self.log.exists();self.log.parent.mkdir(parents=True,exist_ok=True)
  self.sources={str(p.relative_to(self.root)):p.read_text() for p in self.root.rglob('*') if p.is_file() and p.suffix in ['.mjs','.js','.md','.sql']}
  # Neutral lexical function/import index, independent of gold and audit labels.
  self.sites=[]
  for path,text in self.sources.items():
   lines=text.splitlines();starts=[(i,re.search(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(',line)) for i,line in enumerate(lines)];starts=[(i,m.group(1)) for i,m in starts if m]
   imports=[]
   for spec in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]",text):
    if spec.startswith('.'):
     target=(self.root/path).parent/spec
     try:imports.append(str(target.resolve().relative_to(self.root)))
     except ValueError:pass
   for n,(start,name) in enumerate(starts):
    end=starts[n+1][0] if n+1<len(starts) else len(lines)
    sinks=[i+1 for i in range(start,end) if re.search(r'\b(?:query|execute|prepare)\s*\(',lines[i])]
    for line in sinks:self.sites.append({'id':f'{path}:{line}','path':path,'function':name,'line':line,'start':start+1,'end':end,'dependencies':sorted(set(imports))})
 def handle(self,q):
  with self.lock:return self._handle(q)
 def _handle(self,q):
  if self.started is None:self.started=time.monotonic()
  seq=len(self.events)+1;before=time.monotonic();exposure=[];newdeep=set();op=q.get('op');payload={};budget=self.config['budget']
  try:
   if self.closed:raise ValueError('closed')
   if seq>budget['requests'] or before-self.started>=budget['seconds']:raise ValueError('request/time cap')
   if op=='list':payload={'files':sorted(self.sources)}
   elif op in ['read','investigate']:
    if op=='investigate':
     matches=[s for s in self.sites if s['path']==q.get('path') and s['function']==q.get('function')]
     if not matches:raise ValueError('no indexed execution site in function')
     paths={s['path'] for s in matches}|{p for s in matches for p in s['dependencies'] if p in self.sources};newdeep.update(s['id'] for s in matches)
     ranges=[(p,1,len(self.sources[p].splitlines())) for p in sorted(paths)]
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
    r=subprocess.run(['node',self.config['audit'],'.'],cwd=self.root,capture_output=True,text=True,timeout=30)
    if r.returncode not in [0,1]:raise ValueError(r.stderr)
    payload={'exit':r.returncode,'report':json.loads(r.stdout)}
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
    helper=any(any(i>3 for i in seen.get(p,set())) for p in s['dependencies'])
    if owner and helper:newdeep.add(s['id'])
   if len(self.deep|newdeep)>budget['deep_sites']:raise ValueError('dependency-expanded site cap; content withheld')
   size=len(json.dumps(payload,ensure_ascii=False).encode())
   if self.bytes+size>budget['bytes']:raise ValueError('byte cap; content withheld')
   if time.monotonic()-self.started>=budget['seconds']:raise ValueError('time cap; content withheld')
   self.bytes+=size;self.deep|=newdeep;self.exposed=seen
   if op=='finish':self.closed=True
   response={'ok':True,'result':payload}
  except Exception as e:response={'ok':False,'error':str(e)};exposure=[]
  event={'sequence':seq,'request':q,'response':response,'elapsed_seconds':time.monotonic()-self.started,'tool_seconds':time.monotonic()-before,'returned_bytes':self.bytes,'deep_site_count':len(self.deep),'deep_sites':sorted(self.deep),'source_lines_delivered':exposure}
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
